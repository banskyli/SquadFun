import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { formatMON } from '@/utils/format';
import logo from '@/assets/logosquadfun.png';
import { API_BASE_URL } from '@/config/constants';

const Navbar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const location = useLocation();

  // Sync user with backend on connection
  useEffect(() => {
    if (isConnected && address) {
      fetch(`${API_BASE_URL}/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      }).catch(err => console.error('Sync error:', err));
    }
  }, [isConnected, address]);

  const isActive = (path: string) => location.pathname === path;
  const isProfileActive = () => location.pathname.startsWith('/profile/');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/15">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="SquadFun" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-body font-black tracking-normal text-white relative top-[2px]">
            SquadFun
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/market" className={`text-sm font-medium transition-colors ${isActive('/market') ? 'text-primary' : 'text-white/60 hover:text-white'}`}>Market</Link>
          <Link to="/bridge" className={`text-sm font-medium transition-colors ${isActive('/bridge') ? 'text-primary' : 'text-white/60 hover:text-white'}`}>Bridge</Link>
          <Link to="/hall-of-fame" className={`text-sm font-medium transition-colors ${isActive('/hall-of-fame') ? 'text-primary' : 'text-white/60 hover:text-white'}`}>Hall of Fame</Link>
          <Link to="/create" className={`text-sm font-medium transition-colors ${isActive('/create') ? 'text-primary' : 'text-white/60 hover:text-white'}`}>Cast Spell</Link>
          {isConnected && (
            <Link to={`/profile/${address}`} className={`text-sm font-medium transition-colors ${isProfileActive() ? 'text-primary' : 'text-white/60 hover:text-white'}`}>My Profile</Link>
          )}
        </div>

          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                  className="flex items-center gap-4"
                >
                  {connected && balance && (
                    <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/40 font-semibold border-r border-white/10 pr-2.5">Your Mana</span>
                      <span className="font-mono text-sm font-bold text-primary-glow">{formatMON(balance.value)}</span>
                    </div>
                  )}

                  {ready && (
                    <button 
                      onClick={openChainModal}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                        chain?.unsupported 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                          : 'bg-primary/10 border-primary/30 text-primary-highlight hover:bg-primary/20'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full animate-pulse ${chain?.unsupported ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.06em]">
                        {chain?.unsupported ? 'Unsupported' : (chain?.name || 'Select Network')}
                      </span>
                    </button>
                  )}

                  {(() => {
                    if (!connected) {
                      return (
                        <button 
                          onClick={openConnectModal} 
                          className="bg-primary hover:bg-primary-glow text-white px-6 py-2.5 rounded-xl font-body font-semibold tracking-[0.04em] transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] active:scale-95"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button onClick={openChainModal} className="bg-red-400 text-white px-6 py-2.5 rounded-xl font-body font-semibold tracking-[0.04em]">
                          Switch Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/profile/${account.address}`}
                          className="flex items-center gap-3 bg-surface border border-white/10 hover:border-primary/50 px-4 py-2.5 rounded-xl transition-all"
                        >
                          <div className="w-6 h-6 rounded-lg bg-primary shadow-lg" />
                          <span className="font-mono text-sm font-bold">{account.displayName}</span>
                        </Link>
                        <button 
                          onClick={openAccountModal}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                          title="Wallet Settings"
                        >
                          ⚙️
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
    </nav>
  );
};

export default Navbar;
