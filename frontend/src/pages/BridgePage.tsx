import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import PageTransition from '@/components/shared/PageTransition';

gsap.registerPlugin(useGSAP);

const bridges = [
  {
    name: 'Stargate V2',
    description: 'The most trusted bridge for native token transfers via LayerZero.',
    url: 'https://stargate.finance/?dstChain=monad',
    logo: 'https://icons.llama.fi/stargate.jpg',
    type: 'LayerZero'
  },
  {
    name: 'Across',
    description: 'Insanely fast and cheap bridge for L2s and Monad.',
    url: 'https://across.to/',
    logo: 'https://across.to/favicon.ico',
    type: 'Canonical'
  },
  {
    name: 'Jupiter',
    description: 'The best bridge aggregator for Solana users moving to Monad.',
    url: 'https://jup.ag/bridge',
    logo: 'https://jup.ag/favicon.ico',
    type: 'Solana/EVM'
  },
  {
    name: 'Jumper',
    description: 'Advanced bridge aggregator. Finds the cheapest route for you.',
    url: 'https://jumper.exchange/',
    logo: 'https://icons.llama.fi/li.fi.jpg',
    type: 'Aggregator'
  },
  {
    name: 'Transporter',
    description: 'Official Chainlink CCIP bridge for ultra-secure transfers.',
    url: 'https://app.transporter.io/',
    logo: 'https://app.transporter.io/favicon.ico',
    type: 'CCIP'
  },
  {
    name: 'Rubic',
    description: 'Cross-chain swap aggregator supporting 80+ blockchains.',
    url: 'https://rubic.exchange/',
    logo: 'https://rubic.exchange/favicon.ico',
    type: 'Aggregator'
  },
  {
    name: 'Owlto',
    description: 'Decentralized bridge focused on speed and low fees.',
    url: 'https://owlto.finance/',
    logo: 'https://owlto.finance/favicon.ico',
    type: 'L2 Bridge'
  }
];

const BridgePage: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <PageTransition>
      <div ref={containerRef} className="min-h-screen pt-32 pb-20 px-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <motion.div
          className="max-w-6xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header Section */}
          <motion.div className="text-center mb-16 bridge-header" variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">Official Ecosystem Gateways</span>
            </div>
            <h1 className="text-6xl md:text-7xl mb-6 text-white leading-tight">
              Portal to <span className="text-primary-glow">Monad</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Connect your assets to the most performant L1. <br className="hidden md:block" />
              Choose a trusted gateway below to begin your journey.
            </p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16" variants={itemVariants}>
            {[
              { label: 'Network Finality', value: '~1 sec', detail: 'Blazing fast transactions' },
              { label: 'Ecosystem Capacity', value: '10k+ TPS', detail: 'Built for scale' },
              { label: 'Security Status', value: 'Verified', detail: 'Trusted Bridge Partners' }
            ].map((stat, i) => (
              <div key={i} className="bg-surface/30 border border-white/5 p-8 rounded-3xl backdrop-blur-md hover:border-primary/20 transition-all group">
                <div className="text-[11px] font-mono font-bold text-white/40 uppercase tracking-wider mb-2 group-hover:text-primary/60 transition-colors">{stat.label}</div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/30">{stat.detail}</div>
              </div>
            ))}
          </motion.div>

          {/* Bridge Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {bridges.map((bridge) => (
              <motion.a
                key={bridge.name}
                href={bridge.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.01 }}
                className="bridge-card group relative bg-surface/40 border border-white/10 p-8 rounded-[2.5rem] overflow-hidden backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-surface/60 shadow-2xl flex flex-col h-full"
              >
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-primary/10 rounded-full blur-[60px] group-hover:bg-primary/25 transition-all duration-500" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center p-2 shadow-inner border border-white/10 shrink-0">
                      <img
                        src={bridge.logo}
                        alt={bridge.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${bridge.name}&background=ec4899&color=fff`;
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary/80 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 whitespace-nowrap">
                      {bridge.type}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-glow transition-colors">
                    {bridge.name}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed mb-8 flex-grow">
                    {bridge.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 mt-auto">
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
          <motion.div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8" variants={itemVariants}>
            <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-xl font-bold text-white mb-2">Security Standards</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                All listed bridges are official partners or industry-standard protocols. We prioritize solutions with high Total Value Locked (TVL) and multiple third-party audits.
              </p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20">
              <h4 className="text-xl font-bold text-white mb-2">Bridging Tip</h4>
              <p className="text-white/40 text-sm leading-relaxed">
                Need gas for your first transaction on Monad? Use bridges like **Jumper** or **Stargate** which often support "Gas Refuel" features to get native MON tokens automatically.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default BridgePage;
