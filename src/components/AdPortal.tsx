/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, AdBanner } from '../types';
import { 
  Megaphone, 
  QrCode, 
  Calendar, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink, 
  Tv, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface AdPortalProps {
  currentUser: User;
  ads: AdBanner[];
  createOrUpdateAd: (ad: any) => Promise<void>;
}

export const AdPortal: React.FC<AdPortalProps> = ({ currentUser, ads, createOrUpdateAd }) => {
  // Local state
  const [adStep, setAdStep] = useState<1 | 2>(1);
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adPlacement, setAdPlacement] = useState<'workspace' | 'bubble'>('workspace');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adDurationTier, setAdDurationTier] = useState<'7' | '15' | '30'>('7');
  const [scheduledDate, setScheduledDate] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [adSuccess, setAdSuccess] = useState('');
  const [adError, setAdError] = useState('');
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

  const myAdRequests = useMemo(() => {
    if (!currentUser || !ads) return [];
    return ads.filter(a => a.userId === currentUser.id);
  }, [ads, currentUser]);

  const getTierDetails = (tier: string) => {
    switch (tier) {
      case '7': return { days: 7, price: 500, label: 'Micro Banner Spark (7 Days)' };
      case '15': return { days: 15, price: 1000, label: 'Growth Accelerator (15 Days)' };
      case '30': return { days: 30, price: 1800, label: 'Ecosystem Elite (30 Days)' };
      default: return { days: 7, price: 500, label: 'Micro Banner Spark (7 Days)' };
    }
  };

  const selectedTier = getTierDetails(adDurationTier);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'banner' | 'screenshot') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setAdError(`File too large. Please upload an image under 1.5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'banner') {
          setAdImageUrl(reader.result as string);
        } else {
          setPaymentScreenshotUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdError('');
    setAdSuccess('');

    if (!adTitle.trim() || !adDescription.trim() || !adTargetUrl.trim() || !adImageUrl) {
      setAdError("Validation failed: Please complete all campaign creative fields.");
      return;
    }

    if (!scheduledDate) {
      setAdError("Validation failed: Please specify a target launch schedule date.");
      return;
    }

    if (!paymentScreenshotUrl) {
      setAdError("Validation failed: Please upload your eSewa transaction screenshot receipt.");
      return;
    }

    setIsAdSubmitting(true);
    try {
      const adId = `ad_req_${Date.now()}`;
      await createOrUpdateAd({
        id: adId,
        title: adTitle.trim(),
        description: adDescription.trim(),
        imageUrl: adImageUrl,
        targetUrl: adTargetUrl.trim(),
        active: false,
        placement: adPlacement,
        userId: currentUser.id,
        paymentScreenshotUrl: paymentScreenshotUrl,
        status: 'pending',
        amountPaid: selectedTier.price,
        paymentStatus: 'pending',
        scheduledDate: scheduledDate,
        createdAt: new Date().toISOString(),
        welcomeBadge: adPlacement === 'bubble' ? 'Sponsored Welcome' : undefined,
        welcomeTitle: adPlacement === 'bubble' ? 'Active Sponsor Bubbles live!' : undefined,
        welcomeText: adPlacement === 'bubble' ? 'Pop this glossy bubble orbiting your feed to test and view this campaign.' : undefined
      });

      setAdSuccess(`Success! Your campaign "${adTitle}" has been queued. Admin will verify your eSewa receipt and activate it.`);
      // Clear forms
      setAdTitle('');
      setAdDescription('');
      setAdTargetUrl('');
      setAdImageUrl('');
      setPaymentScreenshotUrl('');
      setScheduledDate('');
      setAdStep(1);
    } catch (err) {
      setAdError("Database clearance failed: unable to submit ad request.");
    } finally {
      setIsAdSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-200" id="ad-promotion-portal-section">
      
      {/* Info and Intro Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 md:p-6 border border-emerald-250/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2 uppercase tracking-wider">
            <Megaphone className="w-5 h-5 text-emerald-600 animate-pulse" />
            Sponsor Ads on FreshLink Connect
          </h3>
          <p className="text-xs text-emerald-800 font-medium leading-relaxed max-w-2xl">
            Reach our active creator community directly. Put up a prominent <strong>Workspace Feed Banner</strong> or distribute <strong>Interactive Floating Bubbles</strong>. Pay instantly via eSewa and manage your campaigns below.
          </p>
        </div>
        <div className="shrink-0 bg-white/80 backdrop-blur-md border border-emerald-200/60 px-4 py-2.5 rounded-2xl text-right">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block">Starts From Only</span>
          <span className="text-sm font-black text-emerald-600">Rs. 500 <span className="text-[9.5px] font-normal text-zinc-500 font-sans tracking-normal">for 7 Days</span></span>
        </div>
      </div>

      {adSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{adSuccess}</span>
        </div>
      )}

      {adError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <span>{adError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Campaign Composition Desk (Left Form) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          
          {/* Form Progress Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                {adStep === 1 ? 'Step 1: Campaign Composition' : 'Step 2: eSewa Gateway Verification'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">
                {adStep === 1 ? 'Design your advertisement banner and targeting parameters' : 'Complete the billing and upload your payment transaction screenshot receipt'}
              </p>
            </div>
            <span className="text-xs font-mono font-black text-emerald-650 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shrink-0">
              {adStep} / 2
            </span>
          </div>

          {adStep === 1 ? (
            <div className="space-y-5">
              
              {/* Choose Ad Type Placement */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Ad Placement Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdPlacement('workspace')}
                    className={`py-3 px-4 text-xs font-bold rounded-xl transition border text-center flex items-center justify-center gap-2 ${
                      adPlacement === 'workspace' 
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer'
                    }`}
                  >
                    <span>📰 Feed Banner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdPlacement('bubble')}
                    className={`py-3 px-4 text-xs font-bold rounded-xl transition border text-center flex items-center justify-center gap-2 ${
                      adPlacement === 'bubble' 
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer'
                    }`}
                  >
                    <span>🫧 Floating Bubble</span>
                  </button>
                </div>
              </div>

              {/* Campaign Duration Tier */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Campaign Duration & Pricing Tier</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAdDurationTier('7')}
                    className={`p-3 rounded-xl transition border text-left flex flex-col justify-between h-20 ${
                      adDurationTier === '7' 
                        ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">7 Days</span>
                    <span className="text-xs font-black text-zinc-900">Rs. 500 NPR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdDurationTier('15')}
                    className={`p-3 rounded-xl transition border text-left flex flex-col justify-between h-20 ${
                      adDurationTier === '15' 
                        ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">15 Days</span>
                    <span className="text-xs font-black text-zinc-900">Rs. 1,000 NPR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdDurationTier('30')}
                    className={`p-3 rounded-xl transition border text-left flex flex-col justify-between h-20 ${
                      adDurationTier === '30' 
                        ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500' 
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">30 Days</span>
                    <span className="text-xs font-black text-zinc-900">Rs. 1,800 NPR</span>
                  </button>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Ad Headline Title</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g. Visit Nepal Tourism Promo"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-bold text-zinc-850 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Description Copy */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Short Ad Copy (Description)</label>
                <textarea
                  required
                  rows={3}
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="e.g. Discover breathtaking views, organic mountain tea, and beautiful local homestays. Get 20% off bookings today!"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-medium text-zinc-800 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Target link */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Destination Link Redirection URL</label>
                <input
                  type="url"
                  required
                  value={adTargetUrl}
                  onChange={(e) => setAdTargetUrl(e.target.value)}
                  placeholder="e.g. https://www.visitnepaltours.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-mono text-zinc-800 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Banner Image file or URL selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Ad Banner Image Asset</label>
                  <span className="text-[8.5px] font-mono text-zinc-400 uppercase">JPEG / PNG Under 1.5MB</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-150">
                  {/* File upload click target */}
                  <div className="relative border border-dashed border-zinc-250 hover:bg-zinc-100/50 rounded-xl transition overflow-hidden h-24 flex flex-col items-center justify-center p-3 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'banner')}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[9.5px] font-black text-zinc-700">Choose local image</span>
                    <span className="text-[8.5px] text-zinc-400">or drag and drop</span>
                  </div>

                  {/* Image URL text input as fallback */}
                  <div className="flex flex-col justify-center space-y-1">
                    <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-zinc-400">Or Paste Image URL</span>
                    <input
                      type="text"
                      value={adImageUrl}
                      onChange={(e) => setAdImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-[10px] font-mono text-zinc-850 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Stock Preset recommendations */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-400 shrink-0 font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80')}
                    className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] text-zinc-650 hover:bg-zinc-200 border border-zinc-200 cursor-pointer shrink-0 font-bold"
                  >
                    Nepal Mountains 🏔️
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80')}
                    className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] text-zinc-650 hover:bg-zinc-200 border border-zinc-200 cursor-pointer shrink-0 font-bold"
                  >
                    Corporate Branding 🏢
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80')}
                    className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] text-zinc-650 hover:bg-zinc-200 border border-zinc-200 cursor-pointer shrink-0 font-bold"
                  >
                    Startup Team 🚀
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!adTitle.trim() || !adDescription.trim() || !adTargetUrl.trim() || !adImageUrl) {
                    setAdError("Composition incomplete: Please fill in Title, Description, Redirect URL, and Banner Image!");
                    return;
                  }
                  setAdError('');
                  setAdStep(2);
                }}
                className="w-full py-3 bg-zinc-950 hover:bg-black text-white font-sans font-black uppercase text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Proceed to eSewa Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdSubmit} className="space-y-5 animate-in slide-in-from-right duration-150">
              
              {/* Nepal eSewa Invoice Summary Sheet */}
              <div className="bg-[#60bb46]/5 rounded-3xl p-5 border border-[#60bb46]/20 space-y-4">
                <div className="flex justify-between items-center border-b border-[#60bb46]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#60bb46] flex items-center justify-center text-white font-black text-xs font-sans">
                      e
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#60bb46] uppercase block">eSewa Merchant Invoice</span>
                      <span className="text-xs font-black text-zinc-900">FreshLink Ad Portal</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-[#60bb46]/20 text-[#2E7D32] border border-[#60bb46]/35 px-2.5 py-0.5 rounded-full font-black uppercase">
                    READY TO PAY
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-zinc-500">
                    <span>Selected Campaign Tier</span>
                    <span className="text-zinc-800 font-extrabold">{selectedTier.label}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-zinc-500">
                    <span>Ad Placement Style</span>
                    <span className="text-zinc-800 font-extrabold uppercase">{adPlacement}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-zinc-500">
                    <span>Estimated Campaign Views</span>
                    <span className="text-[#2E7D32] font-extrabold">Unlimited Impressions</span>
                  </div>
                  <div className="border-t border-[#60bb46]/10 pt-2.5 flex justify-between items-end">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Total NPR Payable</span>
                    <span className="text-lg font-black text-[#60bb46]">Rs. {selectedTier.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Container and Transfer Guides */}
              <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-200 text-center space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-widest block">ESewa merchant Scan QR</span>
                  <p className="text-[10.5px] text-zinc-500 leading-snug font-medium max-w-sm mx-auto">
                    Open eSewa mobile app, click the QR scanner, scan the merchant QR below, and complete transfer of exactly <strong>Rs. {selectedTier.price} NPR</strong>.
                  </p>
                </div>

                {/* Our beautifully dynamic eSewa scan-to-pay QR code representation */}
                <div className="relative w-48 h-48 mx-auto shadow-md rounded-2xl overflow-hidden bg-white">
                  <svg className="w-full h-full border-4 border-[#60bb46] p-2 rounded-2xl bg-white" viewBox="0 0 100 100">
                    <rect width="100" height="100" rx="10" fill="#f4faf6" />
                    <rect x="10" y="10" width="25" height="25" fill="#1e293b" />
                    <rect x="14" y="14" width="17" height="17" fill="#ffffff" />
                    <rect x="18" y="18" width="9" height="9" fill="#1e293b" />
                    <rect x="65" y="10" width="25" height="25" fill="#1e293b" />
                    <rect x="69" y="14" width="17" height="17" fill="#ffffff" />
                    <rect x="73" y="18" width="9" height="9" fill="#1e293b" />
                    <rect x="10" y="65" width="25" height="25" fill="#1e293b" />
                    <rect x="14" y="69" width="17" height="17" fill="#ffffff" />
                    <rect x="18" y="73" width="9" height="9" fill="#1e293b" />
                    <rect x="42" y="10" width="5" height="10" fill="#60bb46" />
                    <rect x="52" y="15" width="10" height="5" fill="#1e293b" />
                    <rect x="42" y="25" width="15" height="5" fill="#1e293b" />
                    <rect x="10" y="42" width="10" height="5" fill="#1e293b" />
                    <rect x="15" y="52" width="5" height="10" fill="#60bb46" />
                    <rect x="25" y="42" width="5" height="15" fill="#1e293b" />
                    <rect x="42" y="42" width="15" height="15" fill="#1e293b" />
                    <rect x="47" y="47" width="5" height="5" fill="#ffffff" />
                    <rect x="65" y="42" width="5" height="10" fill="#1e293b" />
                    <rect x="75" y="52" width="15" height="5" fill="#60bb46" />
                    <rect x="42" y="65" width="10" height="5" fill="#60bb46" />
                    <rect x="52" y="75" width="5" height="15" fill="#1e293b" />
                    <rect x="65" y="65" width="15" height="15" fill="#1e293b" />
                    <rect x="70" y="70" width="5" height="5" fill="#ffffff" />
                    <rect x="85" y="85" width="5" height="5" fill="#60bb46" />
                    <rect x="80" y="75" width="5" height="5" fill="#1e293b" />
                    <rect x="40" y="40" width="20" height="20" rx="4" fill="#60bb46" stroke="#ffffff" strokeWidth="2" />
                    <text x="50" y="52" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">eSewa</text>
                  </svg>
                </div>
              </div>

              {/* Schedule Go Live Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Target Scheduled Launch Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-[#F8F7F4] focus:bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Payment Receipt Upload Target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Upload Screenshot of Completed Transaction Receipt</label>
                {paymentScreenshotUrl ? (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-250 shrink-0">
                        <img src={paymentScreenshotUrl} alt="eSewa Receipt Thumbnail" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10.5px] font-black text-zinc-800">Screenshot Loaded</p>
                        <p className="text-[9px] text-zinc-400">Click button on right to select another</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentScreenshotUrl('')}
                      className="text-[9px] font-black uppercase text-red-650 hover:underline px-3 py-1 rounded-lg hover:bg-red-50 border border-transparent transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative border border-dashed border-zinc-300 hover:bg-zinc-50 rounded-2xl transition overflow-hidden p-6 text-center cursor-pointer flex flex-col items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleFileChange(e, 'screenshot')}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-6 h-6 text-[#60bb46] mb-1.5 animate-bounce" />
                    <span className="text-[10.5px] font-black text-zinc-850">Select eSewa Screenshot Proof</span>
                    <span className="text-[9px] text-zinc-400">PNG / JPEG under 1.5MB</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAdStep(1)}
                  className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-750 font-sans font-bold uppercase tracking-wider text-[10px] rounded-xl transition flex items-center gap-1 cursor-pointer border border-zinc-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isAdSubmitting}
                  className="flex-1 py-3 bg-[#60bb46] hover:bg-[#4fa037] disabled:bg-zinc-200 text-white font-sans font-black uppercase text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{isAdSubmitting ? 'Submitting Receipt...' : 'Submit Campaign for Review'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* My Ad Campaigns Archive (Right List) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Simulated Preview Box */}
          <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm space-y-3.5 text-left">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Campaign Preview</h3>
            {adTitle || adDescription || adImageUrl ? (
              <div className="bg-zinc-50/50 border border-zinc-150 rounded-2xl p-4 flex flex-col items-center gap-3.5">
                {adImageUrl && (
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200">
                    <img src={adImageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="w-full text-left">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-mono bg-zinc-950 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {adPlacement === 'bubble' ? '🫧 BUBBLE SPONSOR' : '📰 FEED SPONSOR'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 mt-1 truncate">{adTitle || 'Your Headline Title'}</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{adDescription || 'Your ad body text copy details...'}</p>
                  {adTargetUrl && (
                    <div className="text-[9.5px] font-mono text-emerald-650 font-bold truncate mt-1 flex items-center gap-0.5">
                      <span>{adTargetUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 border border-dashed border-zinc-200 rounded-2xl text-center text-[10px] text-zinc-400 font-bold">
                Design features in Form to view real-time feed placement.
              </div>
            )}
          </div>

          {/* My actual submitted requests */}
          <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-zinc-500" />
              My Ad Campaign Ledger
            </h3>

            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {myAdRequests.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed text-zinc-400">
                  <p className="text-[10.5px] font-bold">No ad campaigns requested yet.</p>
                  <p className="text-[9px] text-zinc-400 mt-1">Submit your first promotion on the left!</p>
                </div>
              ) : (
                [...myAdRequests].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((campaign) => (
                  <div key={campaign.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl space-y-2.5 text-left">
                    <div className="flex gap-2.5 items-start">
                      {campaign.imageUrl && (
                        <div className="w-12 h-10 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-white">
                          <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-black text-zinc-850 truncate leading-tight">{campaign.title}</h4>
                        <p className="text-[9.5px] text-zinc-400 mt-0.5 font-mono">
                          Scheduled: <span className="text-zinc-650 font-bold">{campaign.scheduledDate || 'Not set'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-zinc-150/50 pt-2 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-zinc-650 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                          Rs. {campaign.amountPaid || 500}
                        </span>
                        
                        <span className={`px-1.5 py-0.5 rounded border uppercase text-[8px] font-bold ${
                          campaign.placement === 'bubble'
                            ? 'text-purple-700 bg-purple-50 border-purple-100'
                            : 'text-blue-700 bg-blue-50 border-blue-100'
                        }`}>
                          {campaign.placement === 'bubble' ? 'Bubble' : 'Banner'}
                        </span>
                      </div>

                      <span className={`text-[8.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        campaign.status === 'published'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                          : campaign.status === 'approved'
                          ? 'text-indigo-700 bg-indigo-50 border-indigo-100'
                          : campaign.status === 'rejected'
                          ? 'text-red-700 bg-red-50 border-red-100'
                          : 'text-amber-700 bg-amber-50 border-amber-100'
                      }`}>
                        {campaign.status || 'pending'}
                      </span>
                    </div>

                    {/* If rejected, show why */}
                    {campaign.status === 'rejected' && campaign.welcomeText && (
                      <div className="p-2 bg-red-50/50 border border-red-100/60 rounded-xl text-[9px] text-red-750 font-sans leading-tight">
                        <span className="font-black uppercase text-[8px] block tracking-wider text-red-800 mb-0.5">Admin Reject Reason</span>
                        {campaign.welcomeText}
                      </div>
                    )}

                    {campaign.status === 'published' && (
                      <div className="text-[9px] font-mono text-zinc-400 bg-emerald-50/30 border border-emerald-150/40 p-1.5 rounded-lg text-center font-bold">
                        🎯 Click rate: <span className="text-zinc-800 font-extrabold">{campaign.clickCount || 0}</span> redirection clicks
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
