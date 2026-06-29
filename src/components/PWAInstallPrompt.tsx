import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, Check } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

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
      } else {
        console.log('PWA installation prompt not deferred yet or unsupported by browser.');
      }
    };

    window.addEventListener('trigger-pwa-install', handleTriggerInstall);
    return () => {
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We no longer need the prompt, clear it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isInstalled) {
    return null; // App already installed
  }

  if (!isVisible) {
    return null;
  }

  return (
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
              <Sparkles className="w-3.5 h-3.5" /> Native PWA App
            </span>
          </div>
          <h4 className="text-sm font-black text-white">Install FreshLink Connect</h4>
          <p className="text-zinc-400 text-[11px] leading-relaxed font-semibold">
            Add FreshLink to your home screen for rapid offline loading, zero-delay push notices, and an immersive fullscreen blogging experience!
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
          className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-[11px] font-black uppercase tracking-wider rounded-xl border border-zinc-800 transition-all cursor-pointer"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Now</span>
        </button>
      </div>
    </div>
  );
};
