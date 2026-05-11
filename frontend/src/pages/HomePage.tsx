import React, { useEffect, useRef } from 'react';
import GlowButton from '@/components/shared/GlowButton';
import { useNavigate } from 'react-router-dom';

const ANIMAL_SQUAD = [
  { name: 'Goku Gorilla', role: 'Frontline hype engine', image: '/goku-removebg-preview.png' },
  { name: 'Move Monkey', role: 'Momentum and trend scout', image: '/move-removebg-preview.png' },
  { name: 'Gym Panda', role: 'Community grind captain', image: '/gym-removebg-preview.png' },
  { name: 'Punch Tiger', role: 'Raid and meme enforcer', image: '/punch-removebg-preview.png' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-12');
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.2 }
    );

    imageRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="pb-20 relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 min-h-[84vh] flex items-center">
        <img src="/background.png" alt="Meme arena background" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(18,5,15,0.88)_0%,rgba(18,5,15,0.72)_45%,rgba(18,5,15,0.35)_100%)]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 mb-7 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/75">
                  Memecoin Launchpad on Monad
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-[5.1rem] xl:text-[5.7rem] mb-7 tracking-normal font-body font-black leading-[1.08]">
                <span className="block text-white">Launch Trade</span>
                <span className="block text-primary-highlight">Grow with SquadFun.</span>
              </h1>

              <p className="max-w-2xl text-base md:text-lg text-white/75 mb-10 font-body leading-relaxed">
                Create and scale community-driven memecoins with a clean interface, fast flow, and tools built for real momentum.
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <GlowButton onClick={() => navigate('/market')} className="!w-full sm:!w-56 !py-4 !text-base">
                  View Market
                </GlowButton>
                <GlowButton variant="secondary" onClick={() => navigate('/create')} className="!w-full sm:!w-56 !py-4 !text-base">
                  Create Token
                </GlowButton>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center xl:justify-end">
              <img
                src="/intro-pre.png"
                alt="SquadFun mascot"
                className="w-full max-w-[720px] xl:max-w-[780px] object-contain scale-110 xl:scale-115 -translate-y-2 drop-shadow-[0_32px_70px_rgba(0,0,0,0.58)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10 border-t border-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="text-center md:text-left">
            <div className="text-4xl font-body font-extrabold mb-1 text-white">2,481</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">Tokens</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-4xl font-body font-extrabold mb-1 text-primary-highlight">◈ 1.2M</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">Volume</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-4xl font-body font-extrabold mb-1 text-white">15.4K</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">Holders</div>
          </div>
          <div className="text-center md:text-left">
            <div className="text-4xl font-body font-extrabold mb-1 text-primary-highlight">◈ 6.9K</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">Graduation Goal</div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 space-y-24">
        {ANIMAL_SQUAD.map((member, index) => (
          <div
            key={member.name}
            className={`grid md:grid-cols-2 gap-12 lg:gap-16 items-center ${index % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
          >
            <img
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              src={member.image}
              alt={member.name}
              className="w-full max-w-[560px] mx-auto object-contain opacity-0 translate-y-12 transition-all duration-700 ease-out"
            />
            <div className="text-center md:text-left max-w-lg mx-auto md:mx-0">
              <h3 className="text-4xl md:text-5xl font-body font-black tracking-normal text-white mb-3">{member.name}</h3>
              <p className="text-white/65 text-lg">{member.role}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
