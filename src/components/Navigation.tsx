/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { useTheme } from '../hooks/useTheme';
import { FreshLinkLogo } from './FreshLinkLogo';
import { motion } from 'motion/react';
import { 
  Compass, 
  PlusCircle, 
  MessageCircle, 
  User, 
  Bookmark, 
  LogOut, 
  Cpu,
  Dumbbell,
  Camera,
  Utensils,
  Briefcase,
  ShieldCheck,
  Coins,
  Bell,
  Smartphone,
  Download,
  Sun,
  Moon
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  setSelectedUser: (userId: string | null) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenAuth,
  setSelectedUser
}) => {
  const { currentUser, logout, messages, updateProfile, notifications, isOnline } = useSocialPlatform();
  const { isDark, toggleTheme } = useTheme();
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }
  }, []);

  const isAdmin = currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com' || currentUser?.isAdmin === true || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const unreadCount = currentUser && messages ? messages.filter(
    msg => msg.receiverId === currentUser.id && !msg.read
  ).length : 0;

  const unreadNotificationsCount = currentUser && notifications ? notifications.filter(
    n => n.userId === currentUser.id && !n.read
  ).length : 0;

  const navItems = [
    { id: 'feed', name: 'Home Feed', icon: Compass },
    { id: 'create', name: 'Create Post', icon: PlusCircle },
    { id: 'chat', name: 'Direct Messages', icon: MessageCircle },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'bookmarks', name: 'Saved Blogs', icon: Bookmark },
    { id: 'monetization', name: 'Monetization Hub', icon: Coins },
    ...(isAdmin ? [{ id: 'admin', name: 'Admin Control', icon: ShieldCheck }] : [])
  ];

  const handleProfileClick = () => {
    setSelectedUser(null); // Clear selected user to view own profile
    setActiveTab('profile');
  };

  return (
    <aside className="w-64 bg-white dark:bg-stone-950 border-r border-stone-200/50 dark:border-stone-850/50 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Platform Branding */}
      <div className="p-6 border-b border-stone-200/40 dark:border-stone-850/40 flex items-center justify-between">
        <div className="flex flex-col gap-1.5" id="brand-logo">
          <div className="flex items-center gap-2">
            <FreshLinkLogo className="w-8 h-8 text-orange-500 transform hover:scale-105 transition-smooth" />
            <span className="font-display font-black text-lg tracking-tight text-zinc-950 dark:text-stone-50 block">
              FRESHLINK <span className="text-orange-500">CONNECT</span>
            </span>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">Connect & Publish</p>
        </div>

        <button
          type="button"
          id="dark-mode-toggle-btn"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-zinc-700 dark:text-stone-200 border border-stone-200/60 dark:border-stone-800 rounded-xl transition-all cursor-pointer outline-none shrink-0 text-[10px] font-bold shadow-2xs"
          title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500 font-extrabold hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold hidden sm:inline">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="main-navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={`w-full flex items-center justify-between px-4 py-3 font-sans text-xs font-semibold rounded-xl transition-smooth cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 dark:bg-stone-900 text-white shadow-sm shadow-zinc-950/10 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-stone-50 hover:bg-stone-100/60 dark:hover:bg-stone-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.id === 'chat' && unreadCount > 0 && (
                  <span className={`font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse ${isActive ? 'bg-orange-500 text-white' : 'bg-orange-600 text-white'}`}>
                    {unreadCount}
                  </span>
                )}
                {item.id === 'notifications' && unreadNotificationsCount > 0 && (
                  <span className={`font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse ${isActive ? 'bg-orange-500 text-white' : 'bg-orange-600 text-white'}`}>
                    {unreadNotificationsCount}
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* Profile Navigation Shortcut */}
          {currentUser && (
            <motion.button
              id="nav-tab-profile"
              onClick={handleProfileClick}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`w-full flex items-center gap-3 px-4 py-3 font-sans text-xs font-semibold rounded-xl transition-smooth cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-zinc-950 dark:bg-stone-900 text-white shadow-sm shadow-zinc-950/10 font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-stone-50 hover:bg-stone-100/60 dark:hover:bg-stone-900/60'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`} />
              My Profile
            </motion.button>
          )}
        </div>
      </nav>

      {/* PWA Operations & Telemetry Sidebar Card */}
      <div className="mx-4 mb-4 p-3.5 bg-gradient-to-br from-stone-50/90 to-zinc-50/40 dark:from-stone-900/40 dark:to-stone-950/20 border border-stone-200/50 dark:border-stone-850/50 rounded-2xl animate-fadeIn" id="nav-pwa-install-prompter">
        {isStandalone ? (
          <div className="space-y-3">
            <div className="flex gap-2.5 items-start">
              <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-600 shrink-0 relative">
                <Smartphone className="w-4 h-4" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white animate-ping" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <h4 className="font-sans font-black text-[10.5px] text-zinc-950 dark:text-stone-200 uppercase tracking-tighter flex items-center gap-1.5">
                  FreshLink Standalone
                </h4>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    {isOnline ? 'System Online' : 'Offline Mode Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2.5 items-start">
              <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20 text-orange-600 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <h4 className="font-sans font-black text-[10.5px] text-zinc-900 dark:text-stone-200 uppercase tracking-tighter">Use like Mobile App</h4>
                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-normal font-semibold">Zero-delay loading, background push notes, and offline databases.</p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                }}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition shadow-sm shadow-orange-650/10 flex items-center justify-center gap-1.5 cursor-pointer outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Native PWA</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-zinc-100 dark:border-stone-850 bg-zinc-50/50 dark:bg-stone-900/10">
        {currentUser && (currentUser.email?.toLowerCase() === 'fresh.linksd@gmail.com' || currentUser.role === 'super_admin') && (
          <div className="mb-2.5 flex items-center justify-between p-2 bg-amber-500/[0.04] border border-amber-200/40 dark:border-amber-500/20 rounded-xl text-[9px] font-sans">
            <span className="font-mono text-amber-800 dark:text-amber-500 font-bold uppercase tracking-wider">DEV PRIVILEGES</span>
            <button
              type="button"
              id="dev-admin-toggle-btn"
              onClick={async () => {
                try {
                  const isAlreadySuperAdmin = currentUser?.role === 'super_admin';
                  await updateProfile({
                    isAdmin: !isAlreadySuperAdmin,
                    role: !isAlreadySuperAdmin ? 'super_admin' : 'user'
                  });
                } catch (e) {
                  console.error("Failed to toggle admin status:", e);
                }
              }}
              className={`px-2 py-0.5 rounded-lg font-black uppercase text-[8px] transition cursor-pointer ${
                currentUser?.role === 'super_admin'
                  ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700' 
                  : 'bg-zinc-200 dark:bg-stone-800 text-zinc-600 dark:text-zinc-450 hover:bg-zinc-300 dark:hover:bg-stone-700 hover:text-zinc-800 dark:hover:text-stone-200'
              }`}
            >
              {currentUser?.role === 'super_admin' ? '👑 Super Admin Active' : '👤 Change to Admin'}
            </button>
          </div>
        )}

        {currentUser ? (
          <div className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-stone-900 border border-zinc-200/60 dark:border-stone-800/60 rounded-xl shadow-sm animate-fadeIn" id="user-footer-card">
            <div className="flex items-center gap-2 truncate max-w-[85%]">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-zinc-100 dark:border-stone-800 shrink-0"
              />
              <div className="truncate ml-1.5">
                <p className="text-xs font-bold text-zinc-800 dark:text-stone-100 truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5" title={currentUser.email}>
                  @{currentUser.name.toLowerCase().replace(/\s+/g, '')}
                </p>
              </div>
            </div>
            <button
              id="logout-button"
              onClick={logout}
              className="p-1.5 text-zinc-450 dark:text-zinc-500 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-all shrink-0"
              title="Logout / Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id="login-trigger-btn"
            onClick={onOpenAuth}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-655 hover:to-orange-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            Authenticate
          </button>
        )}
      </div>
    </aside>
  );
};
