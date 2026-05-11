import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './config/wagmi';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import TokenDetailPage from './pages/TokenDetailPage';
import CreateTokenPage from './pages/CreateTokenPage';
import LeaderboardPage from './pages/LeaderboardPage';
import HallOfFamePage from './pages/HallOfFamePage';
import ProfilePage from './pages/ProfilePage';
import BridgePage from './pages/BridgePage';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#ec4899',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="market" element={<MarketPage />} />
                <Route path="bridge" element={<BridgePage />} />
                <Route path="token/:address" element={<TokenDetailPage />} />
                <Route path="create" element={<CreateTokenPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="hall-of-fame" element={<HallOfFamePage />} />
                <Route path="profile/:address" element={<ProfilePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
