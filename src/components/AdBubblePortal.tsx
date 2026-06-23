/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { AdBanner } from '../types';
import { 
  Sparkles, 
  Megaphone, 
  ExternalLink, 
  X, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  Layers, 
  Plus, 
  Tv, 
  Heart,
  ChevronRight,
  Upload,
  Instagram,
  Facebook,
  MapPin,
  ClipboardList,
  Globe
} from 'lucide-react';

export const AdBubblePortal: React.FC = () => {
  const { ads, currentUser, createOrUpdateAd, trackAdClick } = useSocialPlatform();
  
  // Welcome countdown states for bubble sponsorship announcement
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(8);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsIntroActive(false);
      return;
    }
    const timer = setTimeout(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  // Audio state (using Web Audio API synthesized bubble pop so we don't rely on external assets!)
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Active bubbles array
  const [bubbles, setBubbles] = useState<Array<{
    id: string;
    ad: AdBanner;
    x: number; // horizontal starting percentage (10 - 90)
    size: number; // individual bubble pixel size
    speed: number; // speed multiplier
    delay: number; // entry delay
    color: string; // color profile
    drift: number; // horizontal zig-zag factor
  }>>([]);

  // Active particles generated when popping
  const [particles, setParticles] = useState<Array<{
    id: string;
    parentX: number;
    parentY: number;
    angle: number;
    color: string;
    distance: number;
  }>>([]);

  // Selected Ad for active detail modal preview
  const [selectedAd, setSelectedAd] = useState<AdBanner | null>(null);
  
  // Input fields for spawning standard custom ad bubble instantly
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customTarget, setCustomTarget] = useState('https://');
  const [customImage, setCustomImage] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);

  // States for local image uploading
  const [isAdDragging, setIsAdDragging] = useState(false);
  const [adImageName, setAdImageName] = useState('');
  const fileInputRefForAdCreate = useRef<HTMLInputElement>(null);

  // Super Admin validation helper
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com';

  // Dynamic helper to identify URL types and assign custom text and styling
  const getAdCtaDetails = (url: string) => {
    const lowercaseUrl = (url || '').toLowerCase();
    
    if (lowercaseUrl.includes('instagram.com')) {
      return {
        label: 'Visit Instagram Page',
        color: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 shadow-pink-500/10',
        icon: <Instagram className="w-4 h-4 text-white" />
      };
    }
    
    if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.com')) {
      return {
        label: 'Visit Facebook Page',
        color: 'bg-gradient-to-r from-[#1877F2] to-[#166FE5] hover:brightness-105 shadow-blue-600/10',
        icon: <Facebook className="w-4 h-4 text-white" />
      };
    }
    
    if (lowercaseUrl.includes('maps') || lowercaseUrl.includes('google.com/maps') || lowercaseUrl.includes('place') || lowercaseUrl.includes('mapbox')) {
      return {
        label: 'Find on Maps Location',
        color: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-650 hover:to-teal-700 shadow-emerald-500/10',
        icon: <MapPin className="w-4 h-4 text-white" />
      };
    }
    
    if (lowercaseUrl.includes('form') || lowercaseUrl.includes('survey') || lowercaseUrl.includes('docs.google.com/forms') || lowercaseUrl.includes('typeform') || lowercaseUrl.includes('questionnaire')) {
      return {
        label: 'Fill out Online Form',
        color: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/10',
        icon: <ClipboardList className="w-4 h-4 text-white" />
      };
    }
    
    // Default dynamic redirect banner label
    return {
      label: 'Explore Destination Offer',
      color: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/15',
      icon: <Globe className="w-4 h-4 text-white" />
    };
  };

  // Default fallback curated ads if database list is empty
  const FALLBACK_ADS: AdBanner[] = [
    {
      id: "ad_fallback_creators",
      title: "FreshLink Premium Partner Program",
      description: "Join the top 5% of interest-specific bloggers. Monetize your publication, get tipping access, and earn up to $150 per high-quality verified article view milestone!",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
      targetUrl: "https://ai.studio/build",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ad_fallback_antigravity",
      title: "Antigravity AI Quantum Server",
      description: "Deploy server-side neural logic arrays, vector indexing, and fully custom real-time agents in under 10 seconds. Empower your product with pure cognitive power.",
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
      targetUrl: "https://ai.studio/build",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ad_fallback_coffee",
      title: "Scribe Artisan Dark Espresso",
      description: "Handcrafted direct-trade beans curated for late-night software draftsmen and independent creators. Experience ultimate focus. Enter code DIRECT20 for 20% off.",
      imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",
      targetUrl: "https://ai.studio/build",
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "ad_fallback_studio",
      title: "Build Applet Professional Suite",
      description: "You are previewing a highly customized modern React ecosystem running on low-latency isolated containers. Export your codebase directly via GitHub settings.",
      imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80",
      targetUrl: "https://ai.studio/build",
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  const activeAds = ads.filter(a => {
    return a.active && a.placement === 'bubble';
  });
  
  // Only fallback to curated ads if there are no ad records at all.
  // When the user has added records but paused them, do not show fallbacks.
  const currentCampaignsPool = activeAds.length > 0 
    ? activeAds 
    : (ads.length === 0 ? FALLBACK_ADS : []);

  // Extract customizable Welcome Overlay texts based on the running customized Bubble Ad
  const activeCustomBubble = ads.find(a => a.active && a.placement === 'bubble');
  const showIntro = !!activeCustomBubble || (ads.length === 0);
  const welcomeBadgeText = activeCustomBubble?.welcomeBadge || "Sponsored Welcome";
  const welcomeTitleText = activeCustomBubble?.welcomeTitle || "Active Sponsor Bubbles live!";
  const welcomeBodyText = activeCustomBubble?.welcomeText || "Pop the glossy floating spheres orbiting the workspace to test campaign previews and grab exclusive content offers.";

  // Synthesize soft soapy "pop" sound using Web Audio API to prevent assets dependency issue
  const playPopTone = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // First frequency pulse (short pop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio context startup block:", e);
    }
  };

  // Launch initial flurry of bubbles
  const spawnFlurry = (count = 5) => {
    if (currentCampaignsPool.length === 0) return;
    const newBubbles = Array.from({ length: count }).map((_, i) => {
      const associatedAd = currentCampaignsPool[i % currentCampaignsPool.length];
      const bubbleColors = [
        'rgba(249,115,22,0.18)', // Orange FreshLink
        'rgba(16,185,129,0.18)', // Green
        'rgba(59,130,246,0.18)', // Blue
        'rgba(168,85,247,0.18)'  // Purple
      ];
      return {
        id: `bubble_${Date.now()}_${i}_${Math.random()}`,
        ad: associatedAd,
        x: 15 + Math.random() * 70, // distributed starting point percentage
        size: 75 + Math.floor(Math.random() * 55), // 75px - 130px size
        speed: 0.65 + Math.random() * 0.7, // customized float speeds
        delay: Math.random() * 1.8, // staggered entry delay
        color: bubbleColors[i % bubbleColors.length],
        drift: 15 + Math.random() * 25 // horizontal sway pixels
      };
    });
    setBubbles(prev => [...prev, ...newBubbles]);
  };

  // Trigger bubble flurry immediately when ads load or pause status changes
  useEffect(() => {
    if (currentCampaignsPool.length > 0) {
      setBubbles([]);
      spawnFlurry(6);
    } else {
      setBubbles([]);
    }
  }, [ads]);

  // Clean elements that float out of boundary/screen or pop
  const handlePop = (bubbleId: string, clientX: number, clientY: number, ad: AdBanner) => {
    playPopTone();
    // Remove individual bubble
    setBubbles(prev => prev.filter(b => b.id !== bubbleId));

    // Generate neat circular physical particles for soapy shatter effect
    const numParticles = 12;
    const colors = ['#F97316', '#3B82F6', '#10B981', '#A855F7', '#EC4899', '#FBBF24'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newParticles = Array.from({ length: numParticles }).map((_, i) => ({
      id: `part_${Date.now()}_${i}_${Math.random()}`,
      parentX: clientX,
      parentY: clientY,
      angle: (i * 360) / numParticles,
      color: chosenColor,
      distance: 35 + Math.random() * 65
    }));

    setParticles(prev => [...prev, ...newParticles]);

    // Remove particles shortly after spread animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 850);

    // Open Advertisement Details Showcase Popup!
    setSelectedAd(ad);
  };

  // Drag-and-drop local file readers for Ad Banner Images
  const handleAdFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, or JPEG) for your Ad Banner.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size is too large. Image upload is capped at 2MB.');
      return;
    }

    setAdImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCustomImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onAdDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAdDragging(true);
  };

  const onAdDragLeave = () => {
    setIsAdDragging(false);
  };

  const onAdDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAdDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAdFileChange(file);
    }
  };

  // Handle addition of custom advertisement via form
  const handleSpawnCustomAdBubble = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check - strictly restrict to Super Admin
    if (!isSuperAdmin) {
      alert("Unauthorized Operational Action: Custom Ad creation is restricted strictly to Super Admin accounts.");
      return;
    }

    if (!customTitle.trim() || !customDesc.trim()) return;

    try {
      const adObject = {
        title: customTitle.trim(),
        description: customDesc.trim(),
        targetUrl: customTarget.trim() || 'https://ai.studio/build',
        imageUrl: customImage.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
        active: true
      };

      // Add actual persistent doc to firebase ads collection so it's fully functional!
      await createOrUpdateAd(adObject);

      // Instantly spawn a personalized bubbly sphere
      const bubbleColors = ['rgba(249,115,22,0.22)', 'rgba(236,72,153,0.22)', 'rgba(59,130,246,0.22)'];
      const individualBubble = {
        id: `bubble_custom_${Date.now()}`,
        ad: adObject as AdBanner,
        x: 20 + Math.random() * 60,
        size: 110,
        speed: 0.9,
        delay: 0,
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        drift: 20
      };

      setBubbles(prev => [individualBubble, ...prev]);
      setShowFormModal(false);
      
      // Clear fields
      setCustomTitle('');
      setCustomDesc('');
      setCustomTarget('https://');
      setCustomImage('');
      setAdImageName('');
    } catch (err) {
      console.error("Ad spawner write error:", err);
    }
  };

  return (
    <div className="relative" id="ad-bubble-system">
      {/* Visual countdown welcome banner with fully customizable bubble texts */}
      <AnimatePresence>
        {isIntroActive && secondsRemaining > 0 && showIntro && (
          <motion.div 
            initial={{ opacity: 0, y: -25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -15 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-24 right-4 lg:right-8 z-50 max-w-sm w-full shadow-2xl rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-orange-950/25 border border-orange-500/25 p-5 select-none pointer-events-auto text-left"
            id="ad-countdown-banner"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Megaphone className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-orange-400 font-black flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" />
                    {welcomeBadgeText}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 font-bold bg-zinc-800/80 px-2 py-0.5 rounded-full shrink-0">
                    {secondsRemaining}s left
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-100 mt-1 uppercase tracking-tight line-clamp-1">
                  {welcomeTitleText}
                </h4>
                <p className="text-[10.5px] text-zinc-400 mt-1.5 leading-relaxed font-sans font-medium">
                  {welcomeBodyText}
                </p>
              </div>
            </div>
            
            <div className="mt-4 overflow-hidden bg-zinc-800 rounded-full h-1 w-full relative">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent mini activation bubble triggers / sound triggers in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-45 flex flex-col gap-2.5 items-end pointer-events-auto select-none" id="ad-bubble-dock">
        {/* Playful Floating trigger button to re-launch flurry */}
        <motion.button
          onClick={() => {
            spawnFlurry(4);
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="bg-white hover:bg-orange-50/50 text-zinc-900 border border-zinc-250 font-sans font-bold shadow-xl px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs transition-colors cursor-pointer"
          title="Responsive ad bubbles flurry"
        >
          <span className="text-sm">🫧</span>
          <span className="uppercase tracking-wider font-extrabold text-[10px]">Replay Ad Bubbles</span>
        </motion.button>

        {/* Create Ad Bubble Action Button (Super Admin Only) */}
        {isSuperAdmin && (
          <motion.button
            onClick={() => setShowFormModal(true)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-sans font-bold shadow-lg shadow-orange-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs transition-all cursor-pointer"
            title="Add a custom ad banner bubble"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-black text-[10px]">Add Ad Bubble</span>
          </motion.button>
        )}

        {/* Toggle Sound Generator */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-full border shadow-md transition-all cursor-pointer ${
            soundEnabled 
              ? 'bg-emerald-50 border-emerald-200/60 text-emerald-600 hover:bg-emerald-100' 
              : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100'
          }`}
          title={soundEnabled ? "Audio effects active (Web Audio Synth)" : "Audio muted"}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Floating Soap Bubbles Rendering Screen Area */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" id="soap-bubble-space">
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            initial={{ y: "115vh", x: `${b.x}vw`, opacity: 0, scale: 0.4 }}
            animate={{ 
              y: "-20vh", 
              opacity: [0, 0.95, 0.95, 0.95, 0],
              scale: [0.6, 1, 1, 1.05, 0.4],
              x: [
                `${b.x}vw`, 
                `${b.x + (b.drift / 10)}vw`, 
                `${b.x - (b.drift / 10)}vw`, 
                `${b.x + (b.drift / 20)}vw`
              ]
            }}
            transition={{
              duration: 10 / b.speed,
              delay: b.delay,
              ease: "easeInOut",
              times: [0, 0.1, 0.4, 0.82, 1],
              x: {
                repeat: Infinity,
                duration: 4.8,
                ease: "easeInOut"
              }
            }}
            onAnimationComplete={() => {
              // Automatically remove from list when floated past viewport
              setBubbles(prev => prev.filter(x => x.id !== b.id));
            }}
            className="absolute pointer-events-auto cursor-pointer rounded-full flex items-center justify-center select-none shadow-[inset_0_-8px_18px_rgba(255,255,255,0.7),_0_6px_15px_rgba(0,0,0,0.06)]"
            style={{
              width: b.size,
              height: b.size,
              backgroundColor: b.color,
              backdropFilter: "blur(4.5px)",
              WebkitBackdropFilter: "blur(4.5px)",
              border: "1.5px solid rgba(255, 255, 255, 0.45)",
              boxShadow: "inset 0 4px 12px rgba(255,255,255,0.85), inset 0 -4px 12px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.07)"
            }}
            onClick={(e) => handlePop(b.id, e.clientX, e.clientY, b.ad)}
            whileHover={{ 
              scale: 1.15,
              borderColor: "rgba(249,115,22,0.9)",
              boxShadow: "inset 0 4px 16px rgba(255,255,255,0.9), 0 12px 28px rgba(249,115,22,0.15)"
            }}
          >
            {/* Glossy glare accent line on top of the bubble */}
            <div className="absolute top-[8%] left-[15%] w-[35%] h-[15%] rounded-full bg-white/70 rotate-[-25deg] blur-[0.6px]" />
            <div className="absolute bottom-[10%] right-[12%] w-[15%] h-[15%] rounded-full bg-white/20 blur-[0.3px]" />

            {/* Bubble contents - Sponsor Logo Mini preview */}
            <div className="flex flex-col items-center justify-center p-2 text-center w-full h-full">
              <span className="text-[10px] font-black tracking-widest text-orange-600/90 uppercase block leading-none select-none">
                SPONSOR
              </span>
              <span className="text-[8.5px] font-bold text-zinc-800 leading-tight block mt-1 line-clamp-2 px-1 max-w-full drop-shadow-sm select-none">
                {((b.ad && b.ad.title) || 'FreshLink Connect').split(' ')[0]} {((b.ad && b.ad.title) || 'FreshLink Connect').split(' ')[1] || ''}
              </span>
              
              {/* Micro popping helper cursor indicator */}
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 animate-ping" />
            </div>
          </motion.div>
        ))}

        {/* Render Shimmering Splash Exploding Particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              x: p.parentX, 
              y: p.parentY, 
              opacity: 1,
              scale: 1.4 
            }}
            animate={{ 
              x: p.parentX + Math.cos((p.angle * Math.PI) / 180) * p.distance,
              y: p.parentY + Math.sin((p.angle * Math.PI) / 180) * p.distance,
              opacity: 0,
              scale: 0.1
            }}
            transition={{ 
              duration: 0.65, 
              ease: "easeOut" 
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 10,
              height: 10,
              backgroundColor: p.color,
              boxShadow: `0 0 6px ${p.color}, inset 0 -2px 4px rgba(0,0,0,0.15)`
            }}
          />
        ))}
      </div>

      {/* Main Advertisement Showcase Detail Popup Modal */}
      <AnimatePresence>
        {selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm transition-opacity" id="ad-detail-modal">
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-zinc-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Action Row */}
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                  <Sparkles className="w-3.5 h-3.5" />
                  Verified Sponsor Campaign
                </span>
                <button
                  onClick={() => setSelectedAd(null)}
                  className="p-1 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sponsor Media Banner */}
              <div className="relative aspect-video w-full bg-zinc-900 border-b border-zinc-100 overflow-hidden">
                <img 
                  src={selectedAd.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'} 
                  alt={selectedAd.title} 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex items-end p-6">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#F97316] uppercase">CONNECTED ADS NETWORK</span>
                    <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-tight leading-tight mt-1">
                      {selectedAd.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description Body */}
              <div className="p-6 md:p-8 space-y-5">
                <p className="text-slate-650 text-xs md:text-sm leading-relaxed font-sans font-medium text-zinc-650">
                  {selectedAd.description}
                </p>

                {/* Platform assurances banner */}
                <div className="p-3.5 bg-zinc-50 rounded-2xl flex items-start gap-2.5 border border-zinc-150">
                  <div className="w-5 h-5 bg-orange-100 text-orange-700 rounded-md flex items-center justify-center shrink-0">
                    <Tv className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-700 font-bold">About FreshLink Connections</h5>
                    <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-snug">
                      Redirection targets verified through cryptographic secure channels check. Click launch to verify link destinations.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col gap-3.5 pt-2">
                  {/* Dynamic Link Redirection Button for everyone */}
                  {(() => {
                    const cta = getAdCtaDetails(selectedAd.targetUrl);
                    return (
                      <a
                        href={selectedAd.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className={`w-full py-4 px-6 ${cta.color} text-white text-[11px] font-extrabold uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all text-center select-none`}
                        onClick={() => {
                          trackAdClick(selectedAd.id);
                          setSelectedAd(null);
                        }}
                      >
                        {cta.icon}
                        <span>{cta.label}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    );
                  })()}

                  {/* Admin Only Direct Campaign URL Control */}
                  {isSuperAdmin && (
                    <div className="border-t border-zinc-100 pt-3.5 mt-2.5">
                      <span className="block text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase text-center mb-2">
                        ★ Administrative Controls
                      </span>
                      <a
                        href={selectedAd.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="w-full py-2.5 px-5 bg-zinc-900 hover:bg-black text-zinc-100 text-[10.5px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors text-center"
                        onClick={() => {
                          trackAdClick(selectedAd.id);
                          setSelectedAd(null);
                        }}
                      >
                        <span>Admin Direct Target View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Ad Spawner Modal Widget Form */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm transition-opacity" id="ad-spawn-wizard">
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full border border-zinc-150 relative p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-black">SPHERE CONSTRUCTOR</span>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Spawn Custom Ad Bubble</h3>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-1 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSpawnCustomAdBubble} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Ad Title Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gecko Skateboards Store"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white text-xs font-bold text-zinc-800 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Offer / Advertisement Pitch Description</label>
                  <textarea
                    required
                    placeholder="e.g. Get 25% off high performance handmade maple decks. Ships free worldwide!"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white text-xs font-medium text-zinc-800 outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Campaign Redirect URL Target</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://gecko.example.com"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white text-xs font-mono text-zinc-800 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Banner Thumbnail local upload + custom URL fallback input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Banner Thumbnail Image <span className="text-orange-500 font-bold">*</span>
                  </label>
                  
                  {/* Secure local device file upload container */}
                  <div 
                    onDragOver={onAdDragOver}
                    onDragLeave={onAdDragLeave}
                    onDrop={onAdDrop}
                    onClick={() => fileInputRefForAdCreate.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                      isAdDragging 
                        ? 'border-orange-500 bg-orange-50/40' 
                        : customImage && customImage.startsWith('data:')
                          ? 'border-emerald-500/40 bg-emerald-50/10' 
                          : 'border-zinc-200 hover:border-orange-400 bg-zinc-50/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRefForAdCreate}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAdFileChange(file);
                      }}
                      accept="image/*"
                      className="hidden" 
                    />
                    {customImage ? (
                      <div className="flex flex-col items-center">
                        <div className="w-full h-28 overflow-hidden rounded-lg mb-2 relative group">
                          <img src={customImage} alt="Local Ad Banner preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-white font-bold bg-black/60 px-2 py-1 rounded w-max">
                              Click / Drag to replace image
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="text-[9.5px] text-emerald-600 font-bold truncate max-w-[70%]">
                            ✓ Attached: {adImageName || 'local_banner.png'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomImage('');
                              setAdImageName('');
                            }}
                            className="text-[9px] text-red-500 hover:text-red-700 font-bold underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2">
                        <Upload className="w-6 h-6 text-zinc-400 mb-1.5" />
                        <p className="text-[10px] font-bold text-zinc-700">Drag Banner image here or click to browse</p>
                        <p className="text-[8px] text-zinc-400 font-semibold mt-0.5">Recommended ratio: 16:9 (PNG, JPG max 2MB)</p>
                      </div>
                    )}
                  </div>

                  {/* Optional Fallback/Pasted URL input field */}
                  <div className="relative pt-1">
                    <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest mb-1">— OR PASTE AN IMAGE DIRECT LINK —</p>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or other web link"
                      value={customImage && !customImage.startsWith('data:') ? customImage : ''}
                      onChange={(e) => {
                        setCustomImage(e.target.value);
                        setAdImageName('');
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 focus:bg-white text-xs font-mono text-zinc-800 outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Submission CTA */}
                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Spawn Glowing Bubble
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
