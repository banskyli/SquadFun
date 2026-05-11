import React from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { motion } from 'framer-motion';

interface NetworkGuardProps {
  children: React.ReactNode;
  requiredChainId: number;
  networkName: string;
}

const NetworkGuard: React.FC<NetworkGuardProps> = ({ children, requiredChainId, networkName }) => {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  // If not connected, we show children but the components themselves should handle connection state (e.g. show Connect Wallet)
  // This avoids flashing the "Wrong Network" screen before connection.
  if (!isConnected) {
    return <>{children}</>;
  }

  if (chain?.id !== requiredChainId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6 pt-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 max-w-md text-center border-primary/20 bg-surface/40 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
              📡
            </div>
            <h2 className="text-3xl font-body font-black text-white mb-4 tracking-tight">Switch Network</h2>
            <p className="text-white/60 mb-8 leading-relaxed font-body">
              This feature is exclusively available on <span className="text-primary-glow font-bold">{networkName}</span>.
              Please switch your network to continue.
            </p>
            <button
              onClick={() => switchChain?.({ chainId: requiredChainId })}
              className="w-full bg-primary hover:bg-primary-glow text-white py-4 rounded-xl font-body font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] active:scale-95"
            >
              Switch to {networkName}
            </button>

            <p className="mt-6 text-[10px] text-white/30 uppercase tracking-widest font-mono font-bold">
              Current: {chain?.name || 'Unknown'}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NetworkGuard;
