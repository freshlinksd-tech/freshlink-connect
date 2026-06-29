import React, { useState, useEffect } from 'react';
import { 
  Download, 
  X, 
  Sparkles, 
  Smartphone, 
  Check, 
  ExternalLink, 
  Share2, 
  Plus, 
  Chrome, 
  Laptop, 
  Info
} from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Detect context
  const isIframe = window.self !== window.top;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);

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
      // Show our customized install prompt banner
      setIsVisible(true);
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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

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
        // Fallback: If prompt is not available, show the step-by-step installation guide modal
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
  };

  if (isInstalled) {
    return null; // App already installed
  }

  // Generate current external link
  const getExternalLink = () => {
    return window.location.href;
  };

  return (
    <>
      {/* Banner view: displayed at the bottom right */}
      {isVisible && !showGuide && (
        <div 
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-zinc-950 text-white rounded-3xl p-5 border border-zinc-800 shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 font-sans"
          id="pwa-install-banner"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="bg-orange-600/10 p-2.5 rounded-2xl border border-orange-500/20 shrink-0 text-orange-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> PWA Application
                </span>
              </div>
              <h4 className="text-sm font-black text-white">Install FreshLink Connect</h4>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
                Add FreshLink to your home screen for rapid offline loading, zero-delay notifications, and an immersive fullscreen app experience!
              </p>
            </div>
            <button 
              type="button"
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-zinc-900"
              aria-label="Dismiss PWA Promotion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-800 transition-all cursor-pointer outline-none"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-600/15 flex items-center justify-center gap-1.5 cursor-pointer outline-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Guide modal view: displayed when native prompt is unavailable (e.g., in iframe, iOS, or manual) */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 max-w-md w-full shadow-2xl relative font-sans text-white">
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
              aria-label="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5 space-y-2">
              <div className="inline-flex bg-orange-600/15 p-3 rounded-2xl border border-orange-500/20 text-orange-500 mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight">Add to Home Screen</h3>
              <p className="text-xs text-zinc-400 font-medium">
                Install FreshLink Connect as a lightweight app for offline access and native multitasking.
              </p>
            </div>

            {/* CASE 1: Inside Iframe (Vite sandbox preview) */}
            {isIframe ? (
              <div className="space-y-4">
                <div className="p-3 bg-orange-950/20 border border-orange-500/20 rounded-2xl flex gap-3 items-start">
                  <Info className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">Sandbox IFrame Detected</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                      Browsers block PWA installation inside sandbox frames. To add FreshLink to your home screen, you must first open it in a top-level tab!
                    </p>
                  </div>
                </div>

                <a
                  href={getExternalLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : isIOS ? (
              /* CASE 2: Apple iOS Devices (Safari, Chrome iOS) */
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 text-left">
                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      Tap the <span className="inline-flex items-center gap-1 font-bold text-orange-400 bg-zinc-850 px-1.5 py-0.5 rounded border border-zinc-800"><Share2 className="w-3 h-3" /> Share</span> button in Safari's lower navigation bar.
                    </p>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      Scroll down through the share options menu and tap <span className="inline-flex items-center gap-1 font-bold text-orange-400 bg-zinc-850 px-1.5 py-0.5 rounded border border-zinc-800"><Plus className="w-3 h-3" /> Add to Home Screen</span>.
                    </p>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      Tap <span className="font-bold text-orange-500">"Add"</span> in the top-right corner to complete!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl border border-zinc-800 transition-all cursor-pointer outline-none"
                >
                  Got It
                </button>
              </div>
            ) : (
              /* CASE 3: Desktop or Android Chrome/Firefox where prompt was missed/blocked */
              <div className="space-y-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4 text-left">
                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      Option A
                    </span>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      Look at your browser's <span className="text-orange-400 font-bold">Address Bar</span> and click the install icon (usually a <span className="font-bold text-orange-400">⊕ plus</span> or <span className="font-bold text-orange-400">⤓ download</span> button on the right side of the URL bar).
                    </p>
                  </div>

                  <div className="flex gap-3.5 items-start">
                    <span className="bg-orange-600 text-white font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      Option B
                    </span>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed">
                      Open your browser menu (click <span className="font-bold text-orange-400">⋮</span> or <span className="font-bold text-orange-400">≡</span> in the top right) and select <span className="text-orange-400 font-bold">"Install app..."</span> or <span className="text-orange-400 font-bold">"Add to Home screen"</span>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl border border-zinc-800 transition-all cursor-pointer outline-none"
                >
                  I'm on it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
