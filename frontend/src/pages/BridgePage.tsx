import React from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import PageTransition from '@/components/shared/PageTransition';
import NetworkGuard from '@/components/shared/NetworkGuard';

gsap.registerPlugin(useGSAP);

const bridges = [
  {
    name: 'Stargate',
    description: 'Bridge LayerZero OFT tokens across multiple chains.',
    url: 'https://stargate.finance/?dstChain=monad',
    logo: 'https://icons.llama.fi/stargate.jpg',
    type: 'LayerZero'
  },
  {
    name: 'Transporter',
    description: 'Official Chainlink CCIP bridge for secure cross-chain transfers.',
    url: 'https://app.transporter.io/?tab=token&to=monad',
    logo: 'https://icons.llama.fi/chainlink.jpg',
    type: 'Chainlink CCIP'
  },
  {
    name: 'Nexus',
    description: 'Hyperlane-powered bridge for fast asset transfers.',
    url: 'http://nexus.hyperlane.xyz/',
    logo: 'https://icons.llama.fi/hyperlane.jpg',
    type: 'Hyperlane'
  },
  {
    name: 'MonadBridge',
    description: 'Official NTT bridge for native token transfers.',
    url: 'https://monadbridge.com/',
    logo: 'https://pbs.twimg.com/profile_images/1684048753239322624/kGjM7WvX_400x400.jpg',
    type: 'NTT'
  },
  {
    name: 'Jumper',
    description: 'Best-in-class bridge aggregator powered by LI.FI.',
    url: 'https://jumper.exchange/',
    logo: 'https://icons.llama.fi/li.fi.jpg',
    type: 'Aggregator'
  }
];

const BridgePage: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from('.bridge-card', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
    });

    gsap.from('.bridge-header', {
      scale: 0.9,
      opacity: 0,
      duration: 1,
      ease: 'back.out(1.7)',
    });
  }, { scope: containerRef });

  return (
    <PageTransition>
      <NetworkGuard requiredChainId={143} networkName="Monad Mainnet">
        <div ref={containerRef} className="min-h-screen pt-24 pb-20 px-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-20 bridge-header">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">Cross-Chain Infrastructure</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-body font-black mb-6 text-white tracking-tight">
                Portal to <span className="text-primary-glow">Monad</span>
              </h1>
              <p className="text-white/60 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                Seamlessly move liquidity across ecosystems. SquadFun integrates with the most secure bridge protocols on Monad.
              </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { label: 'Supported Chains', value: '15+', detail: 'ETH, SOL, ARB, BASE...' },
                { label: 'Settlement Time', value: '~2-5 min', detail: 'Varies by protocol' },
                { label: 'Security Level', value: 'High', detail: 'Audited Smart Contracts' }
              ].map((stat, i) => (
                <div key={i} className="bg-surface/30 border border-white/5 p-8 rounded-3xl backdrop-blur-md hover:border-primary/20 transition-colors group">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2 group-hover:text-primary/60 transition-colors">{stat.label}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-white/30">{stat.detail}</div>
                </div>
              ))}
            </div>

            {/* Bridge Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bridges.map((bridge) => (
                <motion.a
                  key={bridge.name}
                  href={bridge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -12, scale: 1.02 }}
                  className="bridge-card group relative bg-surface/40 border border-white/10 p-8 rounded-[2.5rem] overflow-hidden backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-surface/60 shadow-2xl"
                >
                  {/* Animated Background Glow */}
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/25 transition-all duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border border-white/5">
                        <img src={bridge.logo} alt={bridge.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-primary/80 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                          {bridge.type}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-glow transition-colors">
                      {bridge.name}
                    </h3>
                    <p className="text-sm text-white/50 leading-relaxed mb-8">
                      {bridge.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                      Launch Portal 
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Security & Support Section */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6">
                  🛡️
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Security Standards</h4>
                <p className="text-white/40 text-sm leading-relaxed">
                  All listed bridges are official partners or industry-standard protocols. We prioritize solutions with high Total Value Locked (TVL) and multiple third-party audits.
                </p>
              </div>
              <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/20">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6">
                  💡
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Bridging Tip</h4>
                <p className="text-white/40 text-sm leading-relaxed">
                  Need gas for your first transaction on Monad? Use bridges like **Jumper** or **Stargate** which often support "Gas Refuel" features to get native MON tokens automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </NetworkGuard>
    </PageTransition>
  );
};

export default BridgePage;
