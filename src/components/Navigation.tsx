/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
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
  Coins
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
  const { currentUser, logout, messages, updateProfile } = useSocialPlatform();

  const isAdmin = currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com' || currentUser?.isAdmin === true || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const unreadCount = currentUser && messages ? messages.filter(
    msg => msg.receiverId === currentUser.id && !msg.read
  ).length : 0;

  const navItems = [
    { id: 'feed', name: 'Home Feed', icon: Compass },
    { id: 'create', name: 'Create Post', icon: PlusCircle },
    { id: 'chat', name: 'Direct Messages', icon: MessageCircle },
    { id: 'bookmarks', name: 'Saved Blogs', icon: Bookmark },
    { id: 'monetization', name: 'Monetization Hub', icon: Coins },
    ...(isAdmin ? [{ id: 'admin', name: 'Admin Control', icon: ShieldCheck }] : [])
  ];

  const handleProfileClick = () => {
    setSelectedUser(null); // Clear selected user to view own profile
    setActiveTab('profile');
  };

  return (
    <aside className="w-64 bg-white border-r border-zinc-100 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Platform Branding */}
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex flex-col gap-1" id="brand-logo">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-500/20">
              FL
            </div>
            <span className="font-sans font-black text-xl tracking-tight text-zinc-900">
              FRESHLINK<span className="font-normal text-orange-600">.</span>
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Connect & Publish</p>
        </div>
        <div className="text-[9px] bg-orange-100/60 text-orange-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          MVP 1.0
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="main-navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 font-sans text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-600 shadow-sm shadow-orange-500/5'
                    : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-zinc-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.id === 'chat' && unreadCount > 0 && (
                  <span className="bg-orange-600 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Profile Navigation Shortcut */}
          {currentUser && (
            <button
              id="nav-tab-profile"
              onClick={handleProfileClick}
              className={`w-full flex items-center gap-3 px-4 py-3 font-sans text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'bg-orange-500/10 text-orange-600 shadow-sm shadow-orange-500/5'
                  : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-orange-600' : 'text-zinc-400'}`} />
              My Profile
            </button>
          )}
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
        {currentUser && (currentUser.email?.toLowerCase() === 'fresh.linksd@gmail.com' || currentUser.role === 'super_admin') && (
          <div className="mb-2.5 flex items-center justify-between p-2 bg-amber-500/[0.04] border border-amber-200/40 rounded-xl text-[9px] font-sans">
            <span className="font-mono text-amber-800 font-bold uppercase tracking-wider">DEV PRIVILEGES</span>
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
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-800'
              }`}
            >
              {currentUser?.role === 'super_admin' ? '👑 Super Admin Active' : '👤 Change to Admin'}
            </button>
          </div>
        )}

        {currentUser ? (
          <div className="flex items-center justify-between gap-2 p-2.5 bg-white border border-zinc-200/60 rounded-xl shadow-sm" id="user-footer-card">
            <div className="flex items-center gap-2 truncate max-w-[85%]">
              <img
                src={currentUser.profileImage}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-zinc-100 shrink-0"
              />
              <div className="truncate ml-1.5">
                <p className="text-xs font-bold text-zinc-800 truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-zinc-400 truncate leading-none mt-0.5" title={currentUser.email}>
                  @{currentUser.name.toLowerCase().replace(/\s+/g, '')}
                </p>
              </div>
            </div>
            <button
              id="logout-button"
              onClick={logout}
              className="p-1.5 text-zinc-450 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all shrink-0"
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
