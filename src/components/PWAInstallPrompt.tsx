import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Sparkles, 
  Smartphone, 
  ExternalLink, 
  Share2, 
  Plus, 
  Info,
  ChevronRight
} from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [visitCount, setVisitCount] = useState<number>(1);
  const [hasNudgeMetRequirements, setHasNudgeMetRequirements] = useState<boolean>(false);

  // Detect context
  const isIframe = window.self !== window.top;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Track visit count (tab session based)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const sessionVisited = sessionStorage.getItem('freshlink_session_visited');
    let count = parseInt(localStorage.getItem('freshlink_visit_count') || '0', 10);
    
    if (!sessionVisited) {
      count += 1;
      localStorage.setItem('freshlink_visit_count', count.toString());
      sessionStorage.setItem('freshlink_session_visited', 'true');
    }
    setVisitCount(count);
  }, []);

  // Monitor installation status and nudge eligibility
  useEffect(() => {
    if (isInstalled) return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const dismissedAt = localStorage.getItem('freshlink_pwa_dismissed_at');
    const dismissCount = parseInt(localStorage.getItem('freshlink_pwa_dismissed_count') || '0', 10);
    
    let shouldShow = false;
    if (visitCount >= 2) {
      if (!dismissedAt) {
        shouldShow = true;
      } else {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        // Cooldown: 24h for first dismiss, 3 days for second, 7 days for subsequent
        const cooldownMs = dismissCount === 1 
          ? 24 * 60 * 60 * 1000 
          : dismissCount === 2 
            ? 3 * 24 * 60 * 60 * 1000 
            : 7 * 24 * 60 * 60 * 1000;
            
        if (timeDiff > cooldownMs) {
          shouldShow = true;
        }
      }
    }

    setHasNudgeMetRequirements(shouldShow);
  }, [visitCount, isInstalled]);

  useEffect(() => {
    // Check if app is already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show our customized install prompt banner if nudge requirements are met
      if (hasNudgeMetRequirements) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
      setShowGuide(false);
      console.log('FreshLink Connect was successfully installed to device!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Also auto-trigger banner visible on mobile to increase engagement if prompt is null (fallback)
    const timer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt && hasNudgeMetRequirements) {
        setIsVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [isInstalled, hasNudgeMetRequirements]);

  useEffect(() => {
    const handleTriggerInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          console.log(`User response to install prompt: ${choiceResult.outcome}`);
          setDeferredPrompt(null);
          setIsVisible(false);
        });
      } else if (isIframe) {
        // Instantly open in a new browser tab to bypass the iframe sandbox and enable native PWA installation!
        window.open(window.location.href, '_blank');
      } else {
        // Fallback: If prompt is not available, show the step-by-step installation guide modal/sheet
        setShowGuide(true);
        setIsVisible(true);
      }
    };

    window.addEventListener('trigger-pwa-install', handleTriggerInstall);
    return () => {
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, [deferredPrompt, isIframe]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsVisible(false);
    } else if (isIframe) {
      // Instantly open top-level site in a new tab where browser allows native PWA installation
      window.open(window.location.href, '_blank');
    } else {
      // Show manual install guide
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowGuide(false);
    
    // Save dismissal info with timestamp and count to enforce polite nudge interval
    localStorage.setItem('freshlink_pwa_dismissed_at', Date.now().toString());
    const count = parseInt(localStorage.getItem('freshlink_pwa_dismissed_count') || '0', 10);
    localStorage.setItem('freshlink_pwa_dismissed_count', (count + 1).toString());
  };

  if (isInstalled) {
    return null; // App already installed
  }

  const getExternalLink = () => {
    return window.location.href;
  };

  return (
    <>
      {/* Banner view: displayed at the bottom right */}
      {isVisible && !showGuide && (
        <div 
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white text-zinc-900 rounded-2xl p-4 border border-stone-200 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 font-sans"
          id="pwa-install-banner"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20 shrink-0 text-orange-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PWA Application
                </span>
              </div>
              <h4 className="text-xs font-black text-zinc-900">Install FreshLink Connect</h4>
              <p className="text-zinc-500 text-[10.5px] leading-relaxed font-semibold">
                Get lightning-fast loading, zero-delay notifications, and fullscreen social blogging on your mobile screen.
              </p>
            </div>
            <button 
              type="button"
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer p-1 rounded-full hover:bg-zinc-50"
              aria-label="Dismiss PWA Promotion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-zinc-650 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer outline-none"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 cursor-pointer outline-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      )}

      {/* Guide bottom sheet (mobile) or modal (desktop) */}
      {showGuide && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-0 sm:p-4 z-[100] animate-in fade-in duration-200">
          {/* Backdrop dismiss button */}
          <div className="absolute inset-0 cursor-default" onClick={handleDismiss} />
          
          <div className="bg-white border-t sm:border border-stone-200 rounded-t-[2.5rem] sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative font-sans text-zinc-900 z-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            {/* Drag Handle for Mobile visual hint */}
            <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-4 sm:hidden" />

            <button
              type="button; "
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full bg-zinc-50 border border-zinc-100 transition-all cursor-pointer hidden sm:block"
              aria-label="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5 space-y-1.5">
              <div className="inline-flex bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 text-orange-600 mb-1">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black tracking-tight text-zinc-900">Add to Home Screen</h3>
              <p className="text-[11px] text-zinc-500 font-bold leading-relaxed max-w-xs mx-auto">
                No store required. Run FreshLink as a high-performance native-like app on your device.
              </p>
            </div>

            {/* CASE 1: Inside Iframe (Vite sandbox preview) */}
            {isIframe ? (
              <div className="space-y-3.5">
                <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 items-start">
                  <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-orange-700">Frame Sandbox Limit</h4>
                    <p className="text-[10.5px] text-zinc-600 leading-normal font-semibold">
                      Browser security prevents direct installations inside preview sandboxes. Open in a top-level tab to automatically install!
                    </p>
                  </div>
                </div>

                <a
                  href={getExternalLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-[10.5px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-600/10 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : isIOS ? (
              /* CASE 2: Apple iOS Devices (Safari, Chrome iOS) */
              <div className="space-y-3.5">
                <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-3.5 space-y-3 text-left">
                  <div className="flex gap-3 items-start">
                    <span className="bg-orange-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-[11px] text-zinc-700 font-semibold leading-relaxed">
                      Tap the <span className="inline-flex items-center gap-1 font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 text-[10px]"><Share2 className="w-3 h-3" /> Share</span> button in Safari's lower menu bar.
                    </p>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="bg-orange-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-[11px] text-zinc-700 font-semibold leading-relaxed">
                      Scroll through options and tap <span className="inline-flex items-center gap-1 font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 text-[10px]"><Plus className="w-3 h-3" /> Add to Home Screen</span>.
                    </p>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="bg-orange-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-[11px] text-zinc-700 font-semibold leading-relaxed">
                      Tap <span className="font-extrabold text-orange-600">"Add"</span> in the top-right corner to instantly install!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer outline-none"
                >
                  Dismiss Guide
                </button>
              </div>
            ) : (
              /* CASE 3: Desktop or Android where prompt was missed/blocked */
              <div className="space-y-3.5">
                <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-3.5 space-y-3 text-left">
                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      A
                    </span>
                    <p className="text-[11px] text-zinc-700 font-semibold leading-relaxed">
                      Look at your browser's <span className="text-orange-600 font-bold">Address Bar</span> and click the install icon (usually a <span className="font-extrabold text-orange-600">⊕ plus</span> or <span className="font-extrabold text-orange-600">⤓ download</span> button on the right side of the URL bar).
                    </p>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      B
                    </span>
                    <p className="text-[11px] text-zinc-700 font-semibold leading-relaxed">
                      Open your browser's menu (click <span className="font-extrabold text-orange-600">⋮</span> or <span className="font-extrabold text-orange-600">≡</span> in top-right) and select <span className="text-orange-600 font-bold">"Install App"</span> or <span className="text-orange-600 font-bold">"Add to Home screen"</span>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer outline-none"
                >
                  Dismiss Guide
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
