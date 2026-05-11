import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://monadexplorer.com' },
  },
  testnet: false,
});

export const config = getDefaultConfig({
  appName: 'SquadFun',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [monadMainnet, monadTestnet],
  transports: {
    [monadMainnet.id]: http(),
    [monadTestnet.id]: http(),
  },
  ssr: true,
});
