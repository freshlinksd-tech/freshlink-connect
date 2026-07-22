/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Elegant PWA Control Panel, Live Connection Monitor, Cache Auditor, and Offline Synchronizer.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { 
  getCache, 
  setCache, 
  getPendingInteractions, 
  clearPendingInteractions 
} from '../lib/dbCache';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  Bell, 
  BellOff, 
  Server, 
  Database, 
  Clock, 
  CheckCircle, 
  FileText, 
  Users, 
  Heart, 
  MessageSquare, 
  ShieldAlert, 
  Compass, 
  Share2, 
  Check, 
  X,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PWAMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CacheStats {
  posts: number;
  users: number;
  comments: number;
  likes: number;
  followers: number;
  ads: number;
}

export const PWAMonitor: React.FC<PWAMonitorProps> = ({ isOpen, onClose }) => {
  const { isOnline, syncPendingInteractions, refetchData } = useSocialPlatform();
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    posts: 0,
    users: 0,
    comments: 0,
    likes: 0,
    followers: 0,
    ads: 0
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('Detecting...');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string>('');

  // Read current permissions & stats
  useEffect(() => {
    if (isOpen) {
      loadStatsAndStatus();
    }
  }, [isOpen, isOnline]);

  const loadStatsAndStatus = async () => {
    try {
      // Load cache lengths
      const posts = await getCache<any[]>('posts') || [];
      const users = await getCache<any[]>('users') || [];
      const comments = await getCache<any[]>('comments') || [];
      const likes = await getCache<any[]>('likes') || [];
      const followers = await getCache<any[]>('followers') || [];
      const ads = await getCache<any[]>('ads') || [];

      setCacheStats({
        posts: posts.length,
        users: users.length,
        comments: comments.length,
        likes: likes.length,
        followers: followers.length,
        ads: ads.length
      });

      // Load pending interactions length
      const pending = await getPendingInteractions();
      setPendingCount(pending.length);

      // Notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }

      // SW Registration
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.active) {
            setServiceWorkerStatus('Active (v2)');
          } else if (registration.installing) {
            setServiceWorkerStatus('Installing...');
          } else if (registration.waiting) {
            setServiceWorkerStatus('Waiting (Pending Refresh)');
          } else {
            setServiceWorkerStatus('Registered');
          }
        } else {
          setServiceWorkerStatus('Not Registered');
        }
      } else {
        setServiceWorkerStatus('Unsupported');
      }
    } catch (err) {
      console.warn('Failed to load PWA system stats:', err);
    }
  };

  const handleForceSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      // 1. Force network refetch if online
      if (isOnline) {
        console.log('[PWA Monitor] Force refetching network data...');
        if (refetchData) {
          await refetchData();
        }
        // 2. Trigger pending sync
        if (syncPendingInteractions) {
          await syncPendingInteractions();
        }
      }
      // Reload stats
      await loadStatsAndStatus();
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  const handleClearCache = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      // Clear IndexedDB stores
      await setCache('posts', []);
      await setCache('users', []);
      await setCache('comments', []);
      await setCache('likes', []);
      await setCache('followers', []);
      await setCache('ads', []);
      await clearPendingInteractions();

      // Clear Service Worker Caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      setCacheStats({
        posts: 0,
        users: 0,
        comments: 0,
        likes: 0,
        followers: 0,
        ads: 0
      });
      setPendingCount(0);
    } catch (err) {
      console.warn('Error clearing cached data:', err);
    } finally {
      setTimeout(() => setClearing(false), 600);
    }
  };

  const handleRequestNotification = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  const handleTriggerTestNotification = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setTestNotificationStatus('Unsupported');
      return;
    }

    if (Notification.permission !== 'granted') {
      setTestNotificationStatus('Permission required');
      setTimeout(() => setTestNotificationStatus(''), 3000);
      return;
    }

    try {
      setTestNotificationStatus('Sending...');
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        registration.showNotification('FreshLink Connect', {
          body: '🔔 Premium PWA Integration active! Service worker background push channel fully functional.',
          icon: '/favicon.png',
          badge: '/favicon.png',
          vibrate: [200, 100, 200],
          tag: 'test-pwa-push',
          data: {
            url: '/'
          }
        } as any);
        setTestNotificationStatus('Sent!');
      } else {
        setTestNotificationStatus('Worker not ready');
      }
    } catch (err) {
      setTestNotificationStatus('Failed');
      console.warn('Test push failed:', err);
    }
    setTimeout(() => setTestNotificationStatus(''), 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[90] animate-in fade-in duration-200">
        {/* Backdrop overlay */}
        <div className="absolute inset-0 cursor-default" onClick={onClose} />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border border-stone-200 rounded-[2rem] w-full max-w-2xl shadow-2xl relative font-sans text-zinc-900 z-10 overflow-hidden flex flex-col max-h-[90vh]"
          id="pwa-monitor-dashboard"
        >
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 p-6 text-white relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-orange-600 px-2 py-0.5 rounded-full text-white animate-pulse">
                v2.0 PWA
              </span>
              <button 
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close Dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 mt-2">
              <div className="bg-orange-500 p-3 rounded-2xl border border-orange-400/25 text-white shrink-0">
                <Layers className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                  PWA Operations Dashboard
                </h3>
                <p className="text-zinc-400 text-[11px] font-semibold">
                  Inspect connection latency, service worker health, cached collection metrics, and sync schedules.
                </p>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-stone-50/50">
            {/* Top row: Statuses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Network Health */}
              <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
                <div className={`p-2.5 rounded-xl shrink-0 ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div className="space-y-1 text-left min-w-0">
                  <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Network Health</h5>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                    <span className="font-sans font-extrabold text-[12.5px] text-zinc-800">
                      {isOnline ? 'Online (Pruned)' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight font-medium truncate">
                    {isOnline ? 'Broadband connection active' : 'Local databases engaged'}
                  </p>
                </div>
              </div>

              {/* Service Worker */}
              <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
                <div className="bg-orange-50 text-orange-600 border border-orange-100 p-2.5 rounded-xl shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-left min-w-0">
                  <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Service Worker</h5>
                  <span className="font-sans font-extrabold text-[12.5px] text-zinc-800 block truncate">
                    {serviceWorkerStatus}
                  </span>
                  <p className="text-[10px] text-zinc-500 leading-tight font-medium">
                    Caching & resource hijacking
                  </p>
                </div>
              </div>

              {/* Background Sync Queue */}
              <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
                <div className={`p-2.5 rounded-xl shrink-0 ${pendingCount > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-stone-50 text-stone-500 border border-stone-150'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-left min-w-0">
                  <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pending Sync</h5>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-[12.5px] text-zinc-800">
                      {pendingCount} item{pendingCount !== 1 ? 's' : ''}
                    </span>
                    {pendingCount > 0 && (
                      <span className="bg-amber-500 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                        OUTBOX
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight font-medium">
                    Likes, comments saved offline
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Cache Audit Analytics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-zinc-500" />
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">IndexedDB Cache Auditor</h4>
                </div>
                <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                  High Reliability Offline Storage
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Articles / Posts', key: 'posts', count: cacheStats.posts, icon: FileText, color: 'text-orange-500 bg-orange-50 border-orange-100' },
                  { name: 'User Profiles', key: 'users', count: cacheStats.users, icon: Users, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
                  { name: 'Comments', key: 'comments', count: cacheStats.comments, icon: MessageSquare, color: 'text-pink-500 bg-pink-50 border-pink-100' },
                  { name: 'Likes', key: 'likes', count: cacheStats.likes, icon: Heart, color: 'text-red-500 bg-red-50 border-red-100' },
                  { name: 'Follow Graph', key: 'followers', count: cacheStats.followers, icon: Compass, color: 'text-sky-500 bg-sky-50 border-sky-100' },
                  { name: 'Cached Ads', key: 'ads', count: cacheStats.ads, icon: Sparkles, color: 'text-amber-500 bg-amber-50 border-amber-100' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.key} 
                      className="bg-white border border-stone-200/60 rounded-xl p-3.5 flex items-center justify-between shadow-xs hover:border-zinc-300 transition-all text-left"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-400 font-bold block">{item.name}</span>
                        <span className="text-base font-black text-zinc-800 block font-mono">
                          {item.count} <span className="text-[10px] font-sans text-zinc-400 font-medium">items</span>
                        </span>
                      </div>
                      <div className={`p-2 rounded-lg shrink-0 border ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Interactive Push and Control Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Push Notification Controls */}
              <div className="bg-white border border-stone-200/60 rounded-2xl p-5 space-y-4 text-left shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${notificationPermission === 'granted' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-stone-50 border-stone-150 text-zinc-400'}`}>
                    {notificationPermission === 'granted' ? <Bell className="w-4.5 h-4.5 animate-bounce" /> : <BellOff className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tight">Push Notifications</h4>
                    <p className="text-[9.5px] text-zinc-400 font-semibold uppercase tracking-wider">
                      Status: <strong className={notificationPermission === 'granted' ? 'text-emerald-600' : 'text-zinc-600'}>{notificationPermission}</strong>
                    </p>
                  </div>
                </div>

                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                  Receive zero-delay background notifications when articles are posted, or when people follow or message you offline.
                </p>

                <div className="flex gap-2">
                  {notificationPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestNotification}
                      className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-orange-600/10 cursor-pointer"
                    >
                      Request Permission
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200/40 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Permission Granted</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTriggerTestNotification}
                    className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border border-zinc-200/40 cursor-pointer min-w-[100px]"
                  >
                    {testNotificationStatus || 'Send Test'}
                  </button>
                </div>
              </div>

              {/* Offline Actions & Cache Refresher */}
              <div className="bg-white border border-stone-200/60 rounded-2xl p-5 space-y-4 text-left shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="bg-stone-50 border border-stone-150 text-zinc-600 p-2 rounded-xl">
                    <RefreshCw className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tight">Database Operations</h4>
                    <p className="text-[9.5px] text-zinc-400 font-semibold uppercase tracking-wider">
                      Force Cache Sync & Purges
                    </p>
                  </div>
                </div>

                <p className="text-[10.5px] text-zinc-500 leading-relaxed font-semibold">
                  Manually trigger background sync protocols or purge completely all caches (including service worker precache) to start from fresh.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={syncing || !isOnline}
                    onClick={handleForceSync}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Syncing...' : 'Sync Cache'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={clearing}
                    onClick={handleClearCache}
                    className="py-2 px-3 border border-red-200 hover:bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{clearing ? 'Clearing...' : 'Wipe Cache'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="bg-stone-50 border-t border-stone-150 p-4 flex items-center justify-between font-mono text-[9px] text-zinc-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>IndexedDB Sync Engine Stable</span>
            </div>
            <span>FRESHLINK-CONNECT-PWA</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
