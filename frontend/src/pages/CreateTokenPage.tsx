import React, { useState } from 'react';
import PreviewCard from '@/components/create/PreviewCard';
import GlowButton from '@/components/shared/GlowButton';
import confetti from 'canvas-confetti';
import { supabase } from '@/config/supabase';
import { useAccount, useWriteContract, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { FACTORY_ADDRESSES, CREATION_FEE, GRADUATION_TARGET } from '@/config/constants';
import { MEME_FACTORY_ABI } from '@/config/abi';
import { useNavigate } from 'react-router-dom';
import { showToast } from '@/components/shared/Toast';
import NetworkGuard from '@/components/shared/NetworkGuard';

const CreateTokenPage: React.FC = () => {
  const { address, chain } = useAccount();
  const navigate = useNavigate();
  const factoryAddress = FACTORY_ADDRESSES[chain?.id || 10143] || FACTORY_ADDRESSES[10143];
  const { writeContractAsync } = useWriteContract();
  const [isCasting, setIsCasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: balanceData } = useBalance({
    address: address,
  });

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    initialBuy: '',
  });

  const handlePercentageSelect = (percent: number) => {
    if (!balanceData) return;
    const balance = Number(formatEther(balanceData.value));
    const creationFee = Number(CREATION_FEE);
    
    if (percent === 100) {
      // For Max, we subtract creation fee and leave a bit more for gas (0.01)
      const maxBuy = Math.max(0, balance - creationFee - 0.01);
      setFormData(prev => ({ ...prev, initialBuy: maxBuy.toFixed(4) }));
    } else {
      const amount = (balance * percent) / 100;
      // Also ensure amount + fee < balance
      const safeAmount = Math.max(0, Math.min(amount, balance - creationFee - 0.01));
      setFormData(prev => ({ ...prev, initialBuy: safeAmount.toFixed(4) }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${address}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tokens')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tokens')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Image upload failed!', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      showToast('Please upload an image for your spell!', 'info');
      return;
    }
    if (!address) {
      showToast('Please connect your wallet first!', 'info');
      return;
    }

    try {
      setIsCasting(true);

      const creationFee = parseEther(CREATION_FEE.toString());
      const buyAmount = formData.initialBuy ? parseEther(formData.initialBuy) : 0n;
      const totalValue = creationFee + buyAmount;

      const hash = await writeContractAsync({
        address: factoryAddress,
        abi: MEME_FACTORY_ABI,
        functionName: 'createToken',
        args: [formData.name, formData.symbol, formData.description, formData.imageUrl],
        value: totalValue,
        gas: 3000000n, // Set explicit gas limit to bypass estimation issues
      } as any);

      console.log('Transaction hash:', hash);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#A78BFA', '#7C3AED', '#ffffff']
      });

      showToast('Spell cast successfully! Your token is being created on Monad.', 'success');
      navigate('/market');
    } catch (error) {
      console.error('Error creating token:', error);
      showToast('Failed to cast spell. Please check your wallet.', 'error');
    } finally {
      setIsCasting(false);
    }
  };

  return (
    <NetworkGuard requiredChainId={10143} networkName="Monad Testnet">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass-card p-8 md:p-10 border-primary/20 bg-surface/40 mb-12 relative overflow-hidden">
          <div className="absolute -top-16 -right-10 w-56 h-56 bg-primary/10 blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-14 w-56 h-56 bg-monad/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/70">Spell Workshop</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-body font-black tracking-normal leading-[1.08] mb-4">
                Cast a New Spell
              </h1>
              <p className="text-white/60 font-body text-base md:text-lg leading-relaxed">
                Deploy your memecoin on Monad in seconds. Fill in the lore, lock the vibe, and launch straight into the curve.
              </p>
            </div>
          <div className="grid grid-cols-2 gap-4 min-w-full sm:min-w-[340px] lg:min-w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-xl md:text-2xl font-body font-extrabold text-primary-highlight">~1s</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-white/35 mt-1">Finality</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-xl md:text-2xl font-body font-extrabold text-white">{CREATION_FEE} ◈</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-white/35 mt-1">Creation Fee</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form onSubmit={handleCreate} className="space-y-8 glass-card p-6 md:p-10 bg-surface/35 border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30 ml-1">Token Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Monad Dragon"
                  className="w-full bg-background/60 border border-white/10 rounded-xl py-4 px-5 text-sm font-body focus:outline-none focus:border-primary/60 transition-all placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30 ml-1">Ticker Symbol</label>
                <input
                  type="text"
                  required
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="e.g. DRAGON"
                  className="w-full bg-background/60 border border-white/10 rounded-xl py-4 px-5 text-sm font-body focus:outline-none focus:border-primary/60 transition-all uppercase placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30 ml-1">Lore (Description)</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell the story of your token..."
                className="w-full bg-background/60 border border-white/10 rounded-xl py-4 px-5 text-sm font-body focus:outline-none focus:border-primary/60 transition-all min-h-[120px] resize-none placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30 ml-1">Initial Buy (Optional MON)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.initialBuy}
                  onChange={(e) => setFormData({ ...formData, initialBuy: e.target.value })}
                  placeholder="0.0"
                  className="w-full bg-background/60 border border-white/10 rounded-xl py-4 px-5 text-sm font-mono focus:outline-none focus:border-primary/60 transition-all placeholder:text-white/30"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 text-xs font-mono">MON</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[10, 20, 50, 100].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePercentageSelect(p)}
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-[10px] font-mono font-bold transition-all text-white/40 hover:text-primary-highlight"
                  >
                    {p === 100 ? 'MAX' : `${p}%`}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-white/20 ml-1 italic">* Tip: Buying early sets a strong floor and attracts investors.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.12em] font-semibold text-white/30 ml-1">Token Image</label>
              <div className="relative group cursor-pointer aspect-video w-full border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-primary/40 hover:bg-white/5 transition-all overflow-hidden bg-background/40">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-white/20 group-hover:text-primary/60">
                      {uploading ? 'Uploading Spell...' : 'Choose Meme Image'}
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
              <p className="text-[9px] text-white/20 ml-1 italic">* Recommended: Square or 16:9 images</p>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40 font-body">Creation Fee</span>
                <span className="font-mono font-bold text-white/80">{CREATION_FEE} ◈</span>
              </div>
              <div className="h-px w-full bg-white/5" />
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">✨</div>
                <p className="text-[10px] text-white/40 leading-relaxed font-body">
                  Your token will be launched on a bonding curve. Once it reaches the graduation goal of {Number(GRADUATION_TARGET).toLocaleString()} MON, liquidity will be automatically migrated to Uniswap.
                </p>
              </div>
            </div>

            <GlowButton type="submit" disabled={isCasting || uploading}>
              {isCasting ? 'Casting Spell on Monad...' : 'Cast Creation Spell'}
            </GlowButton>
          </form>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-5 sticky top-32">
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-primary-highlight">Live Preview</span>
          </div>
          <PreviewCard formData={formData} />

          <div className="mt-12 p-6 glass-card border-white/10 bg-surface/35 text-center">
            <div className="text-xs text-white/20 font-body leading-relaxed">
              <span className="text-monad-highlight font-bold">PRO TIP:</span> <br />
              Memecoins with great lore and distinct visuals <br />
              reach graduation 420% faster.
            </div>
          </div>
        </div>
      </div>
    </div>
    </NetworkGuard>
  );
};

export default CreateTokenPage;
