import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { broadcast, broadcastTokenCreated } from './socketService.js';

dotenv.config();

const prisma = new PrismaClient();

const TOKEN_ABI = [
  "event TokensPurchased(address indexed buyer, uint256 monIn, uint256 tokensOut, uint256 newPrice)",
  "event TokensSold(address indexed seller, uint256 tokensIn, uint256 monOut, uint256 newPrice)",
  "event Graduated(address indexed tokenAddress, address uniswapPool)"
];

const FACTORY_ABI = [
  "event TokenCreated(address indexed tokenAddress, string name, string symbol, string description, string imageUrl, address creator)"
];

const activeListeners = new Set<string>();

// Virtual price at t=0 for 69k MON target (29,571 / 1,000,000,000)
const INITIAL_VIRTUAL_PRICE = 0.000029571;

// Helper to process a buy event
const processBuyEvent = async (tokenAddress: string, symbol: string, buyer: string, monIn: bigint, tokensOut: bigint, newPrice: bigint, txHash: string) => {
    const monAmountStr = ethers.formatEther(monIn);
    const tokenAmountStr = ethers.formatUnits(tokensOut, 18);
    const priceStr = ethers.formatEther(newPrice);
    const currentPriceNum = Number(priceStr);
    
    // Calculate % change relative to initial virtual price
    const priceChange = ((currentPriceNum - INITIAL_VIRTUAL_PRICE) / INITIAL_VIRTUAL_PRICE) * 100;

    const lowerTxHash = txHash.toLowerCase();
    const lowerBuyer = buyer.toLowerCase();
    const lowerTokenAddress = tokenAddress.toLowerCase();

    try {
      const existingTrade = await prisma.trade.findUnique({ where: { txHash: lowerTxHash } });
      if (existingTrade) return;

      const token = await prisma.token.findUnique({ where: { contractAddress: lowerTokenAddress } });
      const currentReserve = Number(token?.reserveMon || 0);
      const newReserve = currentReserve + Number(monAmountStr);
      const newMC = (newReserve * 10 / 7).toString();

      await prisma.$transaction([
        prisma.trade.create({
          data: {
            tokenAddress: lowerTokenAddress,
            traderAddress: lowerBuyer,
            type: 'buy',
            ethAmount: monAmountStr,
            tokenAmount: tokenAmountStr,
            priceAtTrade: priceStr,
            txHash: lowerTxHash,
            timestamp: new Date()
          }
        }),
        prisma.token.update({
          where: { contractAddress: lowerTokenAddress },
          data: {
            price: priceStr,
            priceChange24h: priceChange,
            circulatingSupply: { increment: Number(tokenAmountStr) },
            reserveMon: newReserve,
            marketCap: newMC
          } as any
        }),
        prisma.user.upsert({
          where: { walletAddress: lowerBuyer },
          update: { totalTraded: { increment: 1 } },
          create: { walletAddress: lowerBuyer, totalTraded: 1, username: `user_${lowerBuyer.slice(2, 6)}` }
        })
      ]);

      broadcast(lowerTokenAddress, 'trade_update', {
        tokenAddress: lowerTokenAddress,
        type: 'buy',
        price: priceStr,
        priceChange: priceChange,
        marketCap: newMC,
        monAmount: monAmountStr,
        tokenAmount: tokenAmountStr,
        traderAddress: buyer,
        txHash: txHash
      });
      console.log(`✅ Indexed Buy for ${symbol}: ${priceChange.toFixed(2)}%`);
    } catch (error) {
      console.error(`❌ Error indexing Buy for ${symbol}:`, error);
    }
};

const processSellEvent = async (tokenAddress: string, symbol: string, seller: string, tokensIn: bigint, monOut: bigint, newPrice: bigint, txHash: string) => {
    const monAmountStr = ethers.formatEther(monOut);
    const tokenAmountStr = ethers.formatUnits(tokensIn, 18);
    const priceStr = ethers.formatEther(newPrice);
    const currentPriceNum = Number(priceStr);
    
    // Calculate % change relative to initial virtual price
    const priceChange = ((currentPriceNum - INITIAL_VIRTUAL_PRICE) / INITIAL_VIRTUAL_PRICE) * 100;
    
    const lowerTxHash = txHash.toLowerCase();
    const lowerSeller = seller.toLowerCase();
    const lowerTokenAddress = tokenAddress.toLowerCase();

    try {
      const existingTrade = await prisma.trade.findUnique({ where: { txHash: lowerTxHash } });
      if (existingTrade) return;

      const token = await prisma.token.findUnique({ where: { contractAddress: lowerTokenAddress } });
      const currentReserve = Number(token?.reserveMon || 0);
      const newReserve = Math.max(0, currentReserve - Number(monAmountStr));
      const newMC = (newReserve * 10 / 7).toString();

      await prisma.$transaction([
        prisma.trade.create({
          data: {
            tokenAddress: lowerTokenAddress,
            traderAddress: lowerSeller,
            type: 'sell',
            ethAmount: monAmountStr,
            tokenAmount: tokenAmountStr,
            priceAtTrade: priceStr,
            txHash: lowerTxHash,
            timestamp: new Date()
          }
        }),
        prisma.token.update({
          where: { contractAddress: lowerTokenAddress },
          data: {
            price: priceStr,
            priceChange24h: priceChange,
            circulatingSupply: { decrement: Number(tokenAmountStr) },
            reserveMon: newReserve,
            marketCap: newMC
          } as any
        }),
        prisma.user.upsert({
          where: { walletAddress: lowerSeller },
          update: { totalTraded: { increment: 1 } },
          create: { walletAddress: lowerSeller, totalTraded: 1, username: `user_${lowerSeller.slice(2, 6)}` }
        })
      ]);

      broadcast(lowerTokenAddress, 'trade_update', {
        tokenAddress: lowerTokenAddress,
        type: 'sell',
        price: priceStr,
        priceChange: priceChange,
        marketCap: newMC,
        monAmount: monAmountStr,
        tokenAmount: tokenAmountStr,
        traderAddress: seller,
        txHash: txHash
      });
      console.log(`✅ Indexed Sell for ${symbol}: ${priceChange.toFixed(2)}%`);
    } catch (error) {
      console.error(`❌ Error indexing Sell for ${symbol}:`, error);
    }
};

const indexedTokens = new Set<string>();
const tokenSymbols = new Map<string, string>();

const registerToken = (tokenAddress: string, symbol: string) => {
  const addr = tokenAddress.toLowerCase();
  indexedTokens.add(addr);
  tokenSymbols.set(addr, symbol);
};

export const startIndexer = async () => {
  console.log('🚀 Starting Blockchain Indexer...');
  const providerUrl = process.env.MONAD_WS_URL || process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';
  
  const provider = providerUrl.startsWith('wss') 
    ? new ethers.WebSocketProvider(providerUrl)
    : new ethers.JsonRpcProvider(providerUrl);

  try {
    const tokens = await prisma.token.findMany();
    console.log(`ℹ️ Loaded ${tokens.length} tokens from database.`);
    for (const token of tokens) {
      registerToken(token.contractAddress, token.symbol);
    }

    // Set up single global event filter for all indexed tokens
    const tokenInterface = new ethers.Interface(TOKEN_ABI);
    const purchaseTopic = ethers.id("TokensPurchased(address,uint256,uint256,uint256)");
    const soldTopic = ethers.id("TokensSold(address,uint256,uint256,uint256)");

    const filter = {
      topics: [
        [purchaseTopic, soldTopic]
      ]
    };

    console.log('📡 Starting global token event listener...');
    provider.on(filter, async (log) => {
      const tokenAddress = log.address.toLowerCase();
      if (!indexedTokens.has(tokenAddress)) return;

      const symbol = tokenSymbols.get(tokenAddress) || 'TOKEN';

      try {
        const parsed = tokenInterface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });

        if (!parsed) return;

        if (parsed.name === 'TokensPurchased') {
          const [buyer, monIn, tokensOut, newPrice] = parsed.args;
          await processBuyEvent(tokenAddress, symbol, buyer, monIn, tokensOut, newPrice, log.transactionHash);
        } else if (parsed.name === 'TokensSold') {
          const [seller, tokensIn, monOut, newPrice] = parsed.args;
          await processSellEvent(tokenAddress, symbol, seller, tokensIn, monOut, newPrice, log.transactionHash);
        }
      } catch (error) {
        console.error(`❌ Error parsing log for ${symbol} at ${log.transactionHash}:`, error);
      }
    });

    const factoryAddress = process.env.FACTORY_ADDRESS;
    if (factoryAddress) {
      const factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
      factoryContract.on("TokenCreated", async (tokenAddress, name, symbol, description, imageUrl, creator, event) => {
        const lowerTokenAddress = tokenAddress.toLowerCase();
        const blockNumber = event.log.blockNumber;

        try {
          const newToken = await prisma.token.create({
            data: {
              contractAddress: lowerTokenAddress,
              name,
              symbol,
              description,
              imageUrl,
              creatorAddress: creator.toLowerCase(),
              totalSupply: 1000000000,
              circulatingSupply: 0,
              price: INITIAL_VIRTUAL_PRICE.toString(), 
              marketCap: "0", 
              reserveMon: 0,
              priceChange24h: 0
            } as any
          });

          broadcastTokenCreated(newToken);
          
          await prisma.user.upsert({
            where: { walletAddress: creator.toLowerCase() },
            update: { totalCreated: { increment: 1 } },
            create: { walletAddress: creator.toLowerCase(), totalCreated: 1, username: `user_${creator.toLowerCase().slice(2, 6)}` }
          });

          registerToken(lowerTokenAddress, symbol);
          console.log(`🆕 Registered new token: ${symbol} (${lowerTokenAddress})`);

          // Check for initial buy in the same block
          const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
          if (tokenContract.filters && tokenContract.filters.TokensPurchased) {
            const filter = tokenContract.filters.TokensPurchased();
            const logs = await tokenContract.queryFilter(filter, blockNumber, blockNumber);
            
            for (const log of logs) {
              const parsed = tokenContract.interface.parseLog(log as any);
              if (parsed) {
                // Use the creator address instead of parsed.args.buyer (which is the Factory)
                await processBuyEvent(tokenAddress, symbol, creator, parsed.args.monIn, parsed.args.tokensOut, parsed.args.newPrice, log.transactionHash);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error indexing TokenCreated:', error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to start indexer:', error);
  }
};
