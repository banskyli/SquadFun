import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL, GRADUATION_TARGET } from '@/config/constants';
import { parseEther } from 'viem';
import type { Token } from '@/mocks/data';
import PriceChart from '@/components/token/PriceChart';
import TradeWidget from '@/components/token/TradeWidget';
import { formatAddress, formatTokenAmount, timeAgo } from '@/utils/format';
import { useAccount, useSignMessage } from 'wagmi';
import { socket } from '@/socket';
import { showToast } from '@/components/shared/Toast';
import NetworkGuard from '@/components/shared/NetworkGuard';

const TokenDetailPage: React.FC = () => {
  const { address: userAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { address } = useParams<{ address: string }>();
  const [activeInsightTab, setActiveInsightTab] = useState<'trades' | 'holders'>('trades');
  const [tradesPage, setTradesPage] = useState(1);
  const [holdersPage, setHoldersPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [token, setToken] = useState<Token | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!address) return;
    try {
      const [tokenRes, tradesRes, commentsRes, holdersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tokens/${address}`),
        fetch(`${API_BASE_URL}/tokens/${address}/trades`),
        fetch(`${API_BASE_URL}/tokens/${address}/comments`),
        fetch(`${API_BASE_URL}/tokens/${address}/holders`)
      ]);

      const tokenData = await tokenRes.json();
      const tradesData = await tradesRes.json();
      const commentsData = await commentsRes.json();
      const holdersData = await holdersRes.json();

      setToken(tokenData);
      setTrades(tradesData);
      setComments(commentsData);
      setHolders(holdersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newMessage.trim() || !userAddress || !address) return;
    setIsSendingComment(true);
    try {
      const content = newMessage.trim();
      const message = `I am commenting on ${address.toLowerCase()}: ${content}`;
      const signature = await signMessageAsync({
        message,
        account: userAddress as `0x${string}`
      });

      const response = await fetch(`${API_BASE_URL}/tokens/${address}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          signature,
          walletAddress: userAddress
        })
      });

      if (response.ok) {
        setNewMessage('');
        showToast('Comment posted successfully!', 'success');
      } else {
        const err = await response.json();
        showToast(`Failed to post comment: ${err.error}`, 'error');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setIsSendingComment(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (address) {
      const lowerAddress = address.toLowerCase();

      const handleConnect = () => {
        console.log('Socket connected/reconnected, subscribing to:', lowerAddress);
        socket.emit('subscribe', lowerAddress);
      };

      if (socket.connected) handleConnect();

      socket.on('connect', handleConnect);

      const tradeUpdateHandler = (data: any) => {
        if (data.tokenAddress.toLowerCase() === lowerAddress) {
          console.log('✅ Real-time trade update received:', data);

          const newTrade = {
            id: `temp-${Date.now()}`,
            type: data.type,
            ethAmount: data.monAmount,
            tokenAmount: data.tokenAmount,
            priceAtTrade: data.price,
            traderAddress: data.traderAddress || 'Just now',
            timestamp: new Date().toISOString(),
            txHash: data.txHash
          };

          setTrades(prev => [newTrade as any, ...prev]);

          setToken(prev => {
            if (!prev) return prev;
            const newPrice = Number(data.price);
            return {
              ...prev,
              price: newPrice,
              priceChange24h: Number(data.priceChange || 0),
              circulatingSupply: data.type === 'buy'
                ? Number(prev.circulatingSupply || 0) + Number(data.tokenAmount)
                : Number(prev.circulatingSupply || 0) - Number(data.tokenAmount),
              reserveMon: data.type === 'buy'
                ? Number(prev.reserveMon || 0) + Number(data.monAmount)
                : Number(prev.reserveMon || 0) - Number(data.monAmount),
              marketCap: Number(data.marketCap)
            };
          });

          setTimeout(() => {
            fetchData();
          }, 1000);
        }
      };

      const commentUpdateHandler = (data: any) => {
        if (data.tokenAddress.toLowerCase() === lowerAddress) {
          setComments(prev => [data, ...prev]);
        }
      };

      socket.on('trade_update', tradeUpdateHandler);
      socket.on('comment_new', commentUpdateHandler);

      return () => {
        socket.off('connect', handleConnect);
        socket.emit('unsubscribe', lowerAddress);
        socket.off('trade_update', tradeUpdateHandler);
        socket.off('comment_new', commentUpdateHandler);
      };
    }
  }, [address]);

  if (loading) {
    return (
      <div className="pt-32 text-center h-[70vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-white/40 font-body">Summoning token lore...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="pt-32 text-center h-[70vh] flex flex-col items-center justify-center">
        <div className="text-6xl mb-6">👻</div>
        <h2 className="text-3xl font-body font-black tracking-normal mb-4">Spell Not Found</h2>
        <p className="text-white/40 mb-8 font-body">The token you are looking for has vanished into the ether.</p>
        <Link to="/market" className="text-primary hover:text-primary-bright font-body font-semibold uppercase tracking-[0.08em] text-sm">
          Return to Market
        </Link>
      </div>
    );
  }

  const topHolders = holders.map(h => ({
    wallet: h.wallet,
    formattedWallet: `${h.wallet.slice(0, 12)}...${h.wallet.slice(-8)}`,
    share: h.share,
    amount: formatTokenAmount(h.amount)
  }));
  const recentTrades = trades.map(t => ({
    wallet: t.traderAddress ? `${t.traderAddress.slice(0, 12)}...${t.traderAddress.slice(-8)}` : 'Unknown',
    fullWallet: t.traderAddress,
    type: t.type,
    tokenAmount: t.tokenAmount,
    ethAmount: t.ethAmount,
    timestamp: t.timestamp,
    side: t.type === 'buy' ? 'Buy' : 'Sell',
    amount: formatTokenAmount(t.tokenAmount),
    value: `◈ ${Number(t.ethAmount || 0).toFixed(4)}`,
    time: timeAgo(t.timestamp),
    txHash: t.txHash
  }));
  const tradesPerPage = 7;
  const holdersPerPage = 5;
  const graduationProgress = Math.min(100, Number((parseEther(token.reserveMon?.toString() || '0') * 100n) / (GRADUATION_TARGET * 10n ** 18n)));

  const totalTradesPages = Math.max(1, Math.ceil(trades.length / tradesPerPage));
  const totalHoldersPages = Math.max(1, Math.ceil(topHolders.length / holdersPerPage));
  const visibleTrades = recentTrades.slice((tradesPage - 1) * tradesPerPage, tradesPage * tradesPerPage);
  const visibleHolders = topHolders.slice((holdersPage - 1) * holdersPerPage, holdersPage * holdersPerPage);

  const commentsPerPage = 5;
  const totalCommentsPages = Math.max(1, Math.ceil(comments.length / commentsPerPage));
  const visibleComments = comments.slice((commentsPage - 1) * commentsPerPage, commentsPage * commentsPerPage);

  return (
    <NetworkGuard requiredChainId={10143} networkName="Monad Testnet">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link to="/market" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
          <span className="text-sm font-body font-semibold uppercase tracking-[0.08em]">Back to Market</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <img
                  src={token.imageUrl}
                  alt={token.name}
                  className="w-24 h-24 rounded-2xl ring-4 ring-primary/20 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-body font-black tracking-normal leading-tight text-white">{token.name}</h1>
                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-sm font-bold text-white/40">
                      {token.symbol}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white/20">Creator:</span>
                      <span className="text-primary-highlight">{formatAddress(token.creatorAddress)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/20">Born:</span>
                      <span className="text-white/60">{timeAgo(token.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="px-6 py-3 rounded-2xl bg-surface border border-white/5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold mb-1">Market Cap</div>
                  <div className="font-mono text-xl font-bold text-white/90">◈ {formatTokenAmount(token.marketCap)}</div>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-surface border border-white/5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold mb-1">Reserve</div>
                  <div className="font-mono text-xl font-bold text-primary-highlight">◈ {Number(token.reserveMon || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>



            <PriceChart tokenAddress={token.contractAddress} currentPrice={Number(token.price || 0)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-6 flex flex-col">
                <h3 className="text-lg font-body font-extrabold tracking-normal mb-6">
                  Token Lore
                </h3>

                <div className="flex-1">
                  <p className="text-base text-white/90 font-body leading-relaxed">
                    {token.description || 'No lore has been written for this spell yet...'}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between group/addr">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Contract Address</span>
                      <span className="text-xs font-mono text-white/70 group-hover/addr:text-primary-highlight transition-colors cursor-default">
                        {token.contractAddress}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(token.contractAddress);
                        showToast('Address copied!', 'success');
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-white/40 tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500/80" />
                      Finality: Instant
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary/80" />
                      Chain: Monad
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-body font-extrabold tracking-normal mb-6 flex items-center gap-2">
                  Distribution
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2">
                      <span>Circulating / Sold</span>
                      <span>{formatTokenAmount(Number(token.circulatingSupply || 0))} / {formatTokenAmount(Number(token.totalSupply || 1) * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono font-bold text-primary-highlight mb-2">
                      <span>{((Number(token.circulatingSupply || 0) / Number(token.totalSupply || 1)) * 100).toFixed(4)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-highlight shadow-[0_0_10px_rgba(236,72,153,0.4)] transition-all duration-1000"
                        style={{ width: `${Math.max(1, (Number(token.circulatingSupply || 0) / (Number(token.totalSupply || 1) * 0.8)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-2">
                      <span>Bonding Curve Reserve</span>
                      <span>{formatTokenAmount((Number(token.totalSupply || 1) * 0.8) - Number(token.circulatingSupply || 0))}</span>
                    </div>
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/10"
                        style={{ width: `${100 - (Number(token.circulatingSupply || 0) / (Number(token.totalSupply || 1) * 0.8)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-white/20 mb-2">
                      <span>Reserved for Liquidity</span>
                      <span>200.0M</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-monad/20"
                        style={{ width: `100%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 h-[550px] flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-body font-extrabold tracking-normal flex items-center gap-2">
                  {activeInsightTab === 'trades' ? 'Recent Trades' : 'Top Holders'}
                </h3>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInsightTab('trades');
                      setTradesPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em] font-semibold transition-colors ${activeInsightTab === 'trades'
                      ? 'bg-primary/25 border border-primary/40 text-primary-highlight'
                      : 'text-white/45 hover:text-white/75'
                      }`}
                  >
                    Recent Trades
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInsightTab('holders');
                      setHoldersPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.1em] font-semibold transition-colors ${activeInsightTab === 'holders'
                      ? 'bg-primary/25 border border-primary/40 text-primary-highlight'
                      : 'text-white/45 hover:text-white/75'
                      }`}
                  >
                    Top Holders
                  </button>
                </div>
              </div>
              {activeInsightTab === 'trades' ? (
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full border-collapse table-fixed">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-[0.12em] text-white/35 border-b border-white/10">
                          <th className="text-left py-3 w-auto">Wallet</th>
                          <th className="text-center py-3 w-20">Side</th>
                          <th className="text-center py-3 w-24">Amount</th>
                          <th className="text-center py-3 w-24">Value</th>
                          <th className="text-center py-3 w-28">Time</th>
                          <th className="text-center py-3 w-24">Explorer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTrades.map((trade, index) => (
                          <tr key={`${trade.fullWallet}-${index}`} className="border-b border-white/5 text-sm">
                            <td className="py-3 text-white/80 font-mono text-left">
                              <Link to={`/profile/${trade.fullWallet}`} className="hover:text-primary transition-colors">
                                {trade.wallet}
                              </Link>
                            </td>
                            <td className={`py-3 font-semibold ${trade.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'} w-20 text-center`}>{trade.type === 'buy' ? 'Buy' : 'Sell'}</td>
                            <td className="py-3 text-white/70 w-24 text-center">{formatTokenAmount(trade.tokenAmount)}</td>
                            <td className="py-4 font-mono text-xs text-white/90 text-center">◈ {Number(trade.ethAmount || 0).toFixed(4)}</td>
                            <td className="py-4 font-mono text-[10px] text-white/30 text-center">{timeAgo(trade.timestamp)}</td>
                            <td className="py-3 w-24">
                              <div className="flex justify-center">
                                {trade.txHash ? (
                                  <a
                                    href={`https://testnet.monadexplorer.com/tx/${trade.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary-bright transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                                  </a>
                                ) : (
                                  <span className="text-white/10 italic text-[10px]">Pending</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-white/45">Page {tradesPage}/{totalTradesPages}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTradesPage((prev) => Math.max(1, prev - 1))}
                        disabled={tradesPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setTradesPage((prev) => Math.min(totalTradesPages, prev + 1))}
                        disabled={tradesPage === totalTradesPages}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                    {visibleHolders.map((holder, index) => (
                      <div key={`${holder.wallet}-${index}`} className="rounded-xl border border-white/10 bg-background/35 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <Link to={`/profile/${holder.wallet}`} className="text-xs text-white/70 font-mono hover:text-primary transition-colors">
                            {holder.formattedWallet}
                          </Link>
                          <span className="text-xs text-primary-highlight font-semibold">{holder.share}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/70" style={{ width: holder.share }} />
                        </div>
                        <div className="mt-2 text-[11px] text-white/45">Holding: {holder.amount} {token.symbol}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-white/45">Page {holdersPage}/{totalHoldersPages}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHoldersPage((prev) => Math.max(1, prev - 1))}
                        disabled={holdersPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setHoldersPage((prev) => Math.min(totalHoldersPages, prev + 1))}
                        disabled={holdersPage === totalHoldersPages}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <TradeWidget token={token} onTradeSuccess={fetchData} />

            <div className="glass-card p-6 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-body font-black uppercase tracking-widest text-white/80">Bonding Curve Progress</h3>
                <span className="font-mono text-lg font-black text-primary">{graduationProgress}%</span>
              </div>
              <div className="h-4 w-full bg-background rounded-full overflow-hidden p-1 border border-white/5 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-primary to-monad rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                  style={{ width: `${graduationProgress}%` }}
                />
              </div>
              <div className="space-y-3 text-[10px] font-body leading-relaxed text-white/40">
                <p className="flex justify-between">
                  <span>Graduation Goal:</span>
                  <span className="text-white/80 font-mono font-bold">{formatTokenAmount(Number(GRADUATION_TARGET))} ◈</span>
                </p>
                <p>When the reserve reaches {formatTokenAmount(Number(GRADUATION_TARGET))} MON (or 70% supply sold), all liquidity is migrated to <span className="text-primary font-bold">Uniswap</span> and locked. The token is then "graduated" and enters the hall of fame.</p>
              </div>
            </div>

            <div className="glass-card p-6 border-monad/20 h-[550px] flex flex-col">
              <h3 className="text-lg font-body font-extrabold tracking-normal mb-5 flex items-center gap-2">
                <span className="text-2xl">💬</span> Alchemist Chat
              </h3>

              <div className="flex-1 min-h-0 flex flex-col justify-between">
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {visibleComments.length > 0 ? (
                    visibleComments.map((comment, index) => (
                      <div key={comment.id || index} className="group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-primary-highlight">
                            {formatAddress(comment.authorAddress)}
                          </span>
                          <span className="text-[10px] text-white/20">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/80 font-body leading-relaxed group-hover:border-white/10 transition-colors">
                          {comment.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-white/20">
                      <div className="text-3xl mb-2">🧊</div>
                      <p className="text-sm">Crystal ball is quiet... <br /> Be the first to speak!</p>
                    </div>
                  )}
                </div>

                {/* Comments Pagination */}
                {comments.length > 0 && (
                  <div className="py-2 mb-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Page {commentsPage}/{totalCommentsPages}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCommentsPage(p => Math.max(1, p - 1))}
                        disabled={commentsPage === 1}
                        className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/60 disabled:opacity-20 transition-all"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCommentsPage(p => Math.min(totalCommentsPages, p + 1))}
                        disabled={commentsPage === totalCommentsPages}
                        className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/60 disabled:opacity-20 transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative mt-auto pt-2">
                <textarea
                  placeholder={userAddress ? "Cast your message..." : "Connect wallet to chat..."}
                  disabled={!userAddress || isSendingComment}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 pr-12 text-sm font-body focus:outline-none focus:border-primary/50 h-[80px] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendComment}
                  disabled={!userAddress || isSendingComment || !newMessage.trim()}
                  className="absolute bottom-3 right-3 text-primary hover:text-primary-bright transition-colors disabled:opacity-0"
                >
                  {isSendingComment ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </NetworkGuard>
  );
};

export default TokenDetailPage;
