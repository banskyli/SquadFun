export const GRADUATION_TARGET = 69000n; // 69,000 MON target raise
export const MAX_BONDING_SUPPLY = 700_000_000n; // 70% of total supply
export const CREATION_FEE = 0.1; // Updated to 0.1 MON to prevent spam
export const TOTAL_SUPPLY = 1_000_000_000n; // 1 Billion tokens
export const BASE_PRICE = 0; // Show 0 initially for the "Real MC" model

export const MONAD_TESTNET_CONFIG = {
  chainId: 10143,
  name: 'Monad Testnet',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  blockExplorer: 'https://testnet.monadexplorer.com',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
};

export const FACTORY_ADDRESSES: Record<number, `0x${string}`> = {
  10143: (import.meta.env.VITE_FACTORY_ADDRESS_TESTNET as `0x${string}`) || '0xBB8702a0A0EF0844651c05555b3312dc2E0e913c',
  143: (import.meta.env.VITE_FACTORY_ADDRESS_MAINNET as `0x${string}`) || '0x0000000000000000000000000000000000000000', // Placeholder for Mainnet
};

// Default fallback for legacy code
export const FACTORY_ADDRESS = FACTORY_ADDRESSES[10143];

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

export const ROUTES = {
  HOME: '/',
  TOKEN_DETAIL: '/token/:address',
  CREATE: '/create',
  PROFILE: '/profile/:address',
  LEADERBOARD: '/leaderboard',
  HALL_OF_FAME: '/hall-of-fame',
};
