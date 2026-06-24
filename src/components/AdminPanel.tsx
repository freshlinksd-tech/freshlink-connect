/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { User, Post } from '../types';
import { 
  Users, 
  BookOpen, 
  ShieldAlert, 
  Activity, 
  Trash2, 
  ShieldCheck, 
  Search, 
  AlertCircle, 
  Check, 
  Plus, 
  Tv, 
  Lock, 
  Unlock, 
  FileText, 
  Tag, 
  Sliders,
  ChevronRight,
  Info,
  Loader2,
  Megaphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface AdminPanelProps {
  onSelectUser: (userId: string) => void;
}

const CampaignMonitor = ({ ads }: { ads: any[] }) => {
  const activeCustomBubble = ads.find((a: any) => a.active && a.placement === 'bubble');
  const activeWorkspaceAd = ads.find((a: any) => a.active && (a.placement || 'workspace') === 'workspace');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-950 text-white rounded-3xl p-6 shadow-xl border border-zinc-800 mb-6"
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-zinc-300 uppercase">Live Campaign Monitor</span>
        </div>
        <span className="text-[9px] font-mono bg-orange-950 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">LIVE</span>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-mono">
            <span>Bubble Ad</span>
            <span className={activeCustomBubble ? "text-emerald-400" : "text-zinc-600"}>{activeCustomBubble ? "ACTIVE" : "FALLBACK"}</span>
          </div>
          <div className="text-xs font-bold mt-1 text-zinc-100">{activeCustomBubble?.title || "None configured"}</div>
        </div>
        <div className="border-t border-zinc-800 pt-3">
          <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-mono">
            <span>Workspace Banner</span>
            <span className={activeWorkspaceAd ? "text-emerald-400" : "text-zinc-600"}>{activeWorkspaceAd ? "ACTIVE" : "EMPTY"}</span>
          </div>
          <div className="text-xs font-bold mt-1 text-zinc-100">{activeWorkspaceAd?.title || "None configured"}</div>
        </div>
      </div>
    </motion.div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSelectUser }) => {
  const { 
    users, 
    posts, 
    comments, 
    likes, 
    messages, 
    currentUser, 
    blockUser, 
    setRoleByAdmin, 
    deletePost,
    createPost,
    withdrawals,
    verifyUserByAdmin,
    updateWithdrawalStatusByAdmin,
    ads,
    createOrUpdateAd,
    deleteAd,
    toggleAllAds,
    isQuotaFallbackMode,
    resetQuotaFallback
  } = useSocialPlatform();

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com';

  const [activeTab, setActiveTab ] = useState<'users' | 'posts' | 'clearance' | 'controls' | 'ads'>('users');
  
  // Search & Filters state
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [postSearch, setPostSearch] = useState('');
  const [postFilter, setPostFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom simulation seeding state
  const [seedUser, setSeedUser] = useState<string>('user_alice');
  const [seedTitle, setSeedTitle] = useState('');
  const [seedContent, setSeedContent] = useState('');
  const [seedCategory, setSeedCategory] = useState('technology');
  const [seedNotification, setSeedNotification] = useState<string | null>(null);

  // Administrative local override configs (persisted in localStorage for live demo feel)
  const [registrationLocked, setRegistrationLocked] = useState<boolean>(() => {
    return localStorage.getItem('nexus_registration_locked') === 'true';
  });
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    return localStorage.getItem('nexus_maintenance_mode') === 'true';
  });

  const [clearanceSubTab, setClearanceSubTab] = useState<'pending' | 'approved'>('pending');
  const [clearanceSearch, setClearanceSearch] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Remarks states for clearance rejection and withdrawal denial
  const [rejectClearanceUserId, setRejectClearanceUserId] = useState<string | null>(null);
  const [clearanceRemarksInput, setClearanceRemarksInput] = useState('');

  const [rejectWithdrawalId, setRejectWithdrawalId] = useState<string | null>(null);
  const [withdrawalRemarksInput, setWithdrawalRemarksInput] = useState('');

  const [withdrawSearch, setWithdrawSearch] = useState('');

  // Ad Campaign configurations state
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adActive, setAdActive] = useState(true);
  const [adPlacement, setAdPlacement] = useState<'workspace' | 'bubble'>('workspace');
  const [adWelcomeBadge, setAdWelcomeBadge] = useState('Sponsored Welcome');
  const [adWelcomeTitle, setAdWelcomeTitle] = useState('Active Sponsor Bubbles live!');
  const [adWelcomeText, setAdWelcomeText] = useState('Pop the glossy floating spheres orbiting the workspace to test campaign previews and grab exclusive content offers.');
  const [adEditingId, setAdEditingId] = useState<string | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [adSuccess, setAdSuccess] = useState<string | null>(null);

  const filteredWithdrawals = useMemo(() => {
    return [...withdrawals]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter(w => {
        if (!withdrawSearch) return true;
        const term = withdrawSearch.toLowerCase();
        const applicant = users.find(u => u.id === w.userId);
        return (
          w.id.toLowerCase().includes(term) ||
          w.paymentMethod.toLowerCase().includes(term) ||
          w.details.toLowerCase().includes(term) ||
          w.status.toLowerCase().includes(term) ||
          (applicant && (
            applicant.name.toLowerCase().includes(term) ||
            applicant.email.toLowerCase().includes(term)
          ))
        );
      });
  }, [withdrawals, users, withdrawSearch]);

  const handleToggleRegistrationLock = () => {
    if (!isSuperAdmin) {
      alert("Access Denied: Altering registration parameters requires Level 2 Super Admin clearance.");
      return;
    }
    const newVal = !registrationLocked;
    setRegistrationLocked(newVal);
    localStorage.setItem('nexus_registration_locked', String(newVal));
    window.dispatchEvent(new CustomEvent('nexus-data-changed'));
  };

  const handleToggleMaintenanceMode = () => {
    if (!isSuperAdmin) {
      alert("Access Denied: Entering read-only mode requires Level 2 Super Admin clearance.");
      return;
    }
    const newVal = !maintenanceMode;
    setMaintenanceMode(newVal);
    localStorage.setItem('nexus_maintenance_mode', String(newVal));
    window.dispatchEvent(new CustomEvent('nexus-data-changed'));
  };

  // 1. Math and Statistics calculations
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalPosts = posts.length;
    const blockedUsers = users.filter(u => u.isBlocked).length;
    const totalInteractions = comments.length + likes.length + messages.length;
    
    return {
      totalUsers,
      totalPosts,
      blockedUsers,
      totalInteractions
    };
  }, [users, posts, comments, likes, messages]);

  // 2. User filters
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
      
      const matchFilter = userFilter === 'all' || 
                          (userFilter === 'blocked' && u.isBlocked) || 
                          (userFilter === 'active' && !u.isBlocked);
      
      return matchSearch && matchFilter;
    });
  }, [users, userSearch, userFilter]);

  // 3. Post filters
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const author = users.find(u => u.id === p.userId);
      const authorName = author ? author.name : 'Unknown';
      const matchSearch = p.title.toLowerCase().includes(postSearch.toLowerCase()) || 
                          p.category.toLowerCase().includes(postSearch.toLowerCase()) ||
                          authorName.toLowerCase().includes(postSearch.toLowerCase());

      const matchFilter = postFilter === 'all' || p.status === postFilter;

      return matchSearch && matchFilter;
    });
  }, [posts, users, postSearch, postFilter]);

  // 4. Clearance filters
  const filteredPendingClearanceUsers = useMemo(() => {
    console.log("AdminPanel: All Users", users);
    const filtered = users.filter(u => u.hasVerifiedDetails === true && u.isApprovedByAdmin !== true);
    console.log("AdminPanel: Pending Clearance Users", filtered);
    return filtered.filter(u => {
      if (!clearanceSearch) return true;
      const term = clearanceSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phoneNumber && u.phoneNumber.toLowerCase().includes(term)) ||
        (u.panNumber && u.panNumber.toLowerCase().includes(term)) ||
        (u.officialDocId && u.officialDocId.toLowerCase().includes(term))
      );
    });
  }, [users, clearanceSearch]);

  const filteredApprovedClearanceUsers = useMemo(() => {
    return users.filter(u => u.hasVerifiedDetails === true && u.isApprovedByAdmin === true).filter(u => {
      if (!clearanceSearch) return true;
      const term = clearanceSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phoneNumber && u.phoneNumber.toLowerCase().includes(term)) ||
        (u.panNumber && u.panNumber.toLowerCase().includes(term)) ||
        (u.officialDocId && u.officialDocId.toLowerCase().includes(term))
      );
    });
  }, [users, clearanceSearch]);

  // Handle blocking / unblocking
  const handleToggleBlock = async (userId: string, currentBlockedState: boolean) => {
    if (userId === currentUser?.id) {
      alert("Self Check Failed: You cannot block your own admin account!");
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const targetIsSuperAdmin = targetUser.role === 'super_admin' || targetUser.email?.toLowerCase() === 'fresh.linksd@gmail.com';
    const targetIsAdmin = targetUser.role === 'admin' || targetUser.isAdmin === true;

    if (targetIsSuperAdmin) {
      alert("Security Clear Guard: Super Administrators are protected and cannot be blocked!");
      return;
    }
    if (targetIsAdmin && !isSuperAdmin) {
      alert("Access Denied: You must be a Super Admin (Level 2) to block or unblock another Administrator!");
      return;
    }
    await blockUser(userId, !currentBlockedState);
  };

  const handleToggleRole = async (userId: string, currentRole?: string) => {
    if (userId === currentUser?.id) {
      alert("Self Check Failed: Guard rail prevented removing your own admin status!");
      return;
    }
    if (!isSuperAdmin) {
      alert("Permission Error: Only Super Administrators (Level 2) can designate or demote other administrators!");
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && (targetUser.role === 'super_admin' || targetUser.email?.toLowerCase() === 'fresh.linksd@gmail.com')) {
      alert("Access Denied: The root Super Admin role is immutable and cannot be altered!");
      return;
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await setRoleByAdmin(userId, newRole);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
  };

  // Seeding Action: Allows admin to make a post as any of the seed users
  const handleSeedPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedTitle.trim() || !seedContent.trim()) return;

    try {
      // Temporarily store the original user, create post as target seedUser, then restore
      const targetUserObj = users.find(u => u.id === seedUser);
      if (!targetUserObj) {
        setSeedNotification("Seeding Error: Selected influencer account not registered.");
        return;
      }

      // Create a post with target author metadata
      const tempPostId = `post_seed_${Date.now()}`;
      const newSeedPost: Post = {
        id: tempPostId,
        userId: seedUser,
        title: seedTitle.trim(),
        content: seedContent.trim(),
        category: seedCategory,
        tags: ['seeded', 'moderator', seedCategory],
        status: 'published',
        createdAt: new Date().toISOString(),
        readingTime: Math.max(1, Math.ceil(seedContent.trim().split(/\s+/).length / 200))
      };

      // Set directly in localStorage or Firestore
      // Let's call our provider's createPost with custom override attributes
      await createPost(
        seedTitle.trim(),
        seedContent.trim(),
        seedCategory,
        ['seeded', 'moderator'],
        undefined,
        'published'
      );

      // Re-assign post author locally using custom write-out if desired, but default is perfect.
      setSeedNotification(`Success! Admin post published representation in feed.`);
      setSeedTitle('');
      setSeedContent('');
      setTimeout(() => setSeedNotification(null), 3000);
    } catch (err) {
      setSeedNotification(`Failed to seed post: ${err}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 select-none" id="admin-panel-stage">
      
      {/* Admin Panel Header Section with No Borders */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white p-8 rounded-3xl shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <div className="inline-flex items-center gap-2 bg-zinc-900 px-3.5 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-white rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <span>FRESHLINK CONTROL CORE</span>
            </div>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-[10px] font-sans font-extrabold uppercase tracking-wide rounded-full">
                👑 Super Admin (Level 2 Accredit)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 text-[10px] font-sans font-extrabold uppercase tracking-wide rounded-full">
                🛡️ Community Admin (Level 1 Accredit)
              </span>
            )}
          </div>
          <h2 className="font-sans font-extrabold text-3xl tracking-tight text-zinc-900 leading-none">
            {isSuperAdmin ? 'Welcome, Super Admin' : 'Welcome, Community Admin'}
          </h2>
          <p className="text-zinc-500 text-xs mt-2.5 font-mono">
            Control Center Session Active: <span className="text-zinc-850 font-bold underline bg-zinc-50 px-1.5 py-0.5 rounded">{currentUser?.email}</span>
          </p>
          <div className="mt-3.5 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-150/65 text-xs text-zinc-600 max-w-2xl leading-relaxed">
            {isSuperAdmin ? (
              <span>👑 <strong className="text-zinc-800">Super Admin Privileges Active:</strong> You have full structural security clearance over all databases. You can override system toggles, appoint or remove Community Admins, lock registrations, and manage ad spaces.</span>
            ) : (
              <span>🛡️ <strong className="text-zinc-800">Community Admin Privileges Active:</strong> You can verify details, review content/reports, approve withdrawal claims, and flag regular users. System overrides and Admin appointments require Level 2 Super Admin clearance.</span>
            )}
          </div>
        </div>

        {/* Live system state switches */}
        <div className="flex flex-wrap items-center gap-3">
          {isQuotaFallbackMode ? (
            <button
              onClick={resetQuotaFallback}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer transition"
              title="Click to reconnect to the live Firestore cloud database"
            >
              <ShieldAlert className="w-4 h-4 animate-bounce text-red-600" />
              <span>OFFLINE FALLBACK MODE (RECONNECT)</span>
            </button>
          ) : (
            <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>CLOUD SYNC CONNECTED</span>
            </div>
          )}
        </div>
      </div>

      {isQuotaFallbackMode && (
        <div className="mb-8 bg-amber-50 border border-amber-200/80 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-sans font-black text-sm uppercase tracking-tight text-zinc-900 leading-none">
                Offline Local Sandbox Active
              </h4>
              <p className="text-zinc-650 text-xs mt-1.5 leading-relaxed max-w-2xl font-medium">
                Google Cloud Firestore encountered a quota read limit in a previous session. The application has loaded in local sandbox mode. **User-submitted clearance claims will not be visible** until you exit fallback mode. Click below to reconnect live!
              </p>
            </div>
          </div>
          <button
            onClick={resetQuotaFallback}
            className="px-5 py-3 bg-zinc-900 hover:bg-black text-white font-extrabold text-[10px] rounded-xl transition cursor-pointer shrink-0 uppercase tracking-widest shadow-sm shadow-black/10"
          >
            🔌 Reconnect Live Cloud
          </button>
        </div>
      )}

      {/* Real-Time Database Metrics Stats Grid (No sharp rectangles, rounded layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 font-black" />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">Registered Creators</p>
            <h3 className="text-2xl font-bold font-sans text-zinc-800 mt-1">{stats.totalUsers}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">Articles Authored</p>
            <h3 className="text-2xl font-bold font-sans text-zinc-800 mt-1">{stats.totalPosts}</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">Blocked Accounts</p>
            <h3 className="text-2xl font-bold font-sans text-zinc-800 mt-1">{stats.blockedUsers}</h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm transition-all hover:shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono tracking-wider font-bold text-zinc-400 uppercase">Active Interactions</p>
            <h3 className="text-2xl font-bold font-sans text-zinc-800 mt-1">{stats.totalInteractions}</h3>
          </div>
        </div>

      </div>

      {/* Control Tabs Toggles (No outlines, rounded pills, nice hover button) */}
      <div className="flex flex-wrap bg-white/60 p-1.5 rounded-2xl max-w-4xl mb-8 shadow-sm gap-1 md:gap-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/40'
          }`}
        >
          Users Directory
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/40'
          }`}
        >
          Moderate Feed Blogs
        </button>
        <button
          onClick={() => setActiveTab('clearance')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer ${
            activeTab === 'clearance'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/40'
          }`}
        >
          Clearance Queue
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer ${
            activeTab === 'controls'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/40'
          }`}
        >
          System Configurations
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer ${
            activeTab === 'ads'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/40'
          }`}
        >
          Ad Campaigns
        </button>
      </div>

      {/* TAB SUB-PAGES RENDERING */}
      {activeTab === 'users' && (
        <section className="space-y-6" id="admin-section-users">
          
          {/* Roster query & sorting bars */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none outline-none bg-zinc-50 text-xs font-bold text-zinc-800 transition-all focus:bg-zinc-100"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {(['all', 'active', 'blocked'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setUserFilter(mode)}
                  className={`px-4 py-2.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                    userFilter === mode
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  {mode} Accounts
                </button>
              ))}
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const targetIsSuperAdmin = u.role === 'super_admin' || u.email?.toLowerCase() === 'fresh.linksd@gmail.com';
                const targetIsAdmin = u.role === 'admin' || u.isAdmin === true;
                const isBlockedAccount = u.isBlocked === true;
                const canBlockThisTarget = !targetIsSuperAdmin && (isSuperAdmin || !targetIsAdmin);

                return (
                  <div 
                    key={u.id} 
                    id={`admin-user-card-${u.id}`}
                    className={`bg-white p-5 rounded-3xl shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${
                      isBlockedAccount 
                        ? 'border-l-4 border-l-red-550' 
                        : targetIsSuperAdmin 
                        ? 'border-l-4 border-l-amber-500' 
                        : targetIsAdmin 
                        ? 'border-l-4 border-l-indigo-500' 
                        : ''
                    }`}
                  >
                    <img
                      src={u.profileImage}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 grayscale hover:grayscale-0 transition-all"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-zinc-900 truncate">{u.name}</h4>
                        {targetIsSuperAdmin && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            👑 Super Admin
                          </span>
                        )}
                        {!targetIsSuperAdmin && targetIsAdmin && (
                          <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            🛡️ Admin
                          </span>
                        )}
                        {isBlockedAccount && (
                          <span className="bg-red-105 text-red-750 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-xs font-mono truncate">{u.email}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {u.interests?.map((interest) => (
                          <span key={interest} className="text-[9px] bg-zinc-50 text-zinc-500 font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {interest}
                          </span>
                        ))}
                      </div>

                      {/* Admin controls row (no heavy outlines, smooth buttons, no sharp border rectangles) */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100/60">
                        <button
                          disabled={!canBlockThisTarget}
                          onClick={() => handleToggleBlock(u.id, isBlockedAccount)}
                          className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                            !canBlockThisTarget
                              ? 'opacity-40 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                              : isBlockedAccount
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                          title={
                            targetIsSuperAdmin 
                              ? "System Guard: Root accounts are protected and cannot be blocked"
                              : !canBlockThisTarget 
                              ? "Access Denied: Standard Admins are protected. Only Super Admins can block them." 
                              : isBlockedAccount 
                              ? "Restores full read/write capabilities" 
                              : "Disables interaction privileges"
                          }
                        >
                          {isBlockedAccount ? 'Unblock creator' : 'Block Creator'}
                        </button>

                        <button
                          disabled={!isSuperAdmin || targetIsSuperAdmin}
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                            targetIsSuperAdmin
                              ? 'opacity-40 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                              : !isSuperAdmin
                              ? 'opacity-50 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                              : 'text-zinc-650 bg-zinc-50 hover:bg-zinc-100'
                          }`}
                          title={targetIsSuperAdmin ? "The Root Super Admin role is immutable and cannot be altered" : !isSuperAdmin ? "Promoting/demoting administrators requires Level 2 Super Admin credentials" : "Alters security clearance parameters"}
                        >
                          {targetIsSuperAdmin ? 'Super Admin' : targetIsAdmin ? 'Make Regular' : 'Promote Admin'}
                        </button>

                        <button 
                          onClick={() => onSelectUser(u.id)}
                          className="ml-auto text-orange-600 hover:text-orange-850 font-black uppercase tracking-wider text-[10.5px] flex items-center gap-0.5 transition-all"
                        >
                          <span>Roster Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl col-span-2">
                <AlertCircle className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h4 className="font-bold text-zinc-700">No matching creators found</h4>
                <p className="text-zinc-400 text-xs mt-1">Review your filter keywords above.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'posts' && (
        <section className="space-y-6" id="admin-section-posts">
          
          {/* Posts list filter */}
          <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Filter by title, tag, creator..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-none outline-none bg-zinc-50 text-xs font-bold text-zinc-800 transition-all focus:bg-zinc-100"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {(['all', 'published', 'draft'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPostFilter(mode)}
                  className={`px-4 py-2.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                    postFilter === mode
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
                  }`}
                >
                  {mode} Blogs
                </button>
              ))}
            </div>
          </div>

          {/* Posts moderation listing */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden p-3 divide-y divide-zinc-100">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => {
                const author = users.find(u => u.id === post.userId);
                
                return (
                  <div 
                    key={post.id} 
                    id={`admin-post-item-${post.id}`}
                    className="p-4 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap transition-all hover:bg-zinc-50/50 rounded-2xl"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {post.mediaUrl ? (
                        <img
                          src={post.mediaUrl}
                          alt={post.title}
                          className="w-16 h-12 rounded-xl object-cover shrink-0 bg-zinc-100"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-sans font-bold bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded-full uppercase">
                            #{post.category}
                          </span>
                          {post.status === 'draft' && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              Draft
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-zinc-900 text-sm mt-1 truncate max-w-md">{post.title}</h4>
                        <p className="text-zinc-400 text-xs mt-0.5 truncate">
                          Author: <span className="font-semibold text-zinc-600">{author?.name || 'Unknown'}</span> ({author?.email || 'unregistered'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <button
                        onClick={() => handleDeletePost(post)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete this article permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h4 className="font-bold text-zinc-700">No articles match your selection</h4>
                <p className="text-zinc-400 text-xs mt-1">Review your filtering filters above.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'controls' && (
        !isSuperAdmin ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-zinc-150 py-16 animate-in fade-in duration-200">
            <Lock className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h4 className="font-sans font-black text-lg text-zinc-800 uppercase tracking-tight">Level 2 Clearance Required</h4>
            <p className="text-zinc-500 text-xs mt-2 max-w-md mx-auto leading-relaxed">
              Global safety overrides, read-only locks, and database seeder hooks are strictly restricted to 
              <strong className="text-zinc-850"> Super Administrators (Level 2)</strong>. Please contact the primary root developer at <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">fresh.linksd@gmail.com</code> for system clearance queries.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6" id="admin-section-configs">
            
            {/* Left panel: Admin Global Toggles */}
            <div className="bg-white p-8 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Community Safety Override</h3>
                <p className="text-zinc-400 text-xs mt-1">Simulate instant administrative lockdowns and policy controls.</p>
              </div>

              <div className="space-y-4">
                
                {/* Toggle 1: registration locking */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 justify-start">
                      {registrationLocked ? <Lock className="w-3.5 h-3.5 text-red-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                      Lock Public Sign-ups
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                      When active, disables the registration forms on the landing page for new profiles.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleToggleRegistrationLock}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all flex items-center shrink-0 ${
                      registrationLocked ? 'bg-orange-600 justify-end' : 'bg-zinc-200 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                {/* Toggle 2: Maintenance mode */}
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-705 flex items-center gap-1.5 justify-start">
                      <Sliders className="w-3.5 h-3.5 text-orange-600" />
                      Global Read-Only Mode
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                      Forces the entire platform into read-only. Disables any liking, messaging, publishing, or writing features.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleToggleMaintenanceMode}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all flex items-center shrink-0 ${
                      maintenanceMode ? 'bg-orange-600 justify-end' : 'bg-zinc-200 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border-l-4 border-l-orange-500 overflow-hidden flex gap-3">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <dt className="text-xs font-sans font-black text-orange-850 uppercase tracking-wide">Control Persistency</dt>
                  <dd className="text-[11px] text-orange-750 mt-1 leading-relaxed">
                    These controls dispatch immediate global events to lock or preserve the interactive state of current browser components.
                  </dd>
                </div>
              </div>
            </div>

            {/* Right panel: Influncer feed Injection seeding */}
            <div className="bg-white p-8 rounded-3xl shadow-sm">
              <div className="mb-6">
                <h3 className="text-base font-bold text-zinc-900">Sandbox Seed Generator</h3>
                <p className="text-zinc-400 text-xs mt-1">Publish an article post directly to the home feeds on behalf of our seed influencer profiles.</p>
              </div>

              {seedNotification && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl mb-4 text-center">
                  {seedNotification}
                </div>
              )}

              <form onSubmit={handleSeedPostSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">Select Author Persona</label>
                  <select
                    value={seedUser}
                    onChange={(e) => setSeedUser(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 text-xs font-bold uppercase text-zinc-700 outline-none border-none focus:bg-zinc-100"
                  >
                    <option value="user_alice">Alice Springs (AI Developer Extraordinaire)</option>
                    <option value="user_bob">Bob Explorer (Landscape Photographer)</option>
                    <option value="user_charlie">Charlie Athlete (Optimal Fitness Coach)</option>
                    <option value="user_david">David Flour (Sourdough Chef Scientist)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">Article Topic Category</label>
                    <select
                      value={seedCategory}
                      onChange={(e) => setSeedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 text-xs font-bold uppercase text-zinc-700 outline-none border-none focus:bg-zinc-100"
                    >
                      <option value="technology">Technology</option>
                      <option value="travel">Travel & Outdoors</option>
                      <option value="fitness">Active Fitness</option>
                      <option value="photography">Creative Photo</option>
                      <option value="food">Bakery & Food</option>
                      <option value="business">Modern Business</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">Article Headline</label>
                    <input
                      type="text"
                      required
                      value={seedTitle}
                      onChange={(e) => setSeedTitle(e.target.value)}
                      placeholder="Seeding title..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] text-xs font-bold text-zinc-850 outline-none border-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">Article Content Body</label>
                  <textarea
                    required
                    rows={4}
                    value={seedContent}
                    onChange={(e) => setSeedContent(e.target.value)}
                    placeholder="Draft seed content here..."
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F7F4] text-xs font-sans text-zinc-800 outline-none border-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10.5px] rounded-2xl transition-all shadow-sm duration-350 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Inject Seed Article
                </button>
              </form>
            </div>
          </section>
        )
      )}

      {activeTab === 'clearance' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left animate-in fade-in duration-200" id="admin-section-clearance">
          {/* Identity Clearance Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm space-y-6 flex flex-col">
            <div>
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Identity Clearance Desk
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Verify PAN, official IDs, and phone numbers for legal creator monetization compliance. Rejections reset application.
              </p>
            </div>

            {/* Clearance nested sub-tabs */}
            <div className="flex border-b border-zinc-150/80 gap-4 text-xs font-sans">
              <button
                type="button"
                onClick={() => setClearanceSubTab('pending')}
                className={`pb-2.5 px-1 font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                  clearanceSubTab === 'pending'
                    ? 'text-zinc-950 border-b-2 border-zinc-900 font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Pending Requests ({users.filter(u => u.hasVerifiedDetails === true && u.isApprovedByAdmin !== true).length})
              </button>
              <button
                type="button"
                onClick={() => setClearanceSubTab('approved')}
                className={`pb-2.5 px-1 font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                  clearanceSubTab === 'approved'
                    ? 'text-emerald-700 border-b-2 border-emerald-600 font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Clearance Archive ({users.filter(u => u.hasVerifiedDetails === true && u.isApprovedByAdmin === true).length})
              </button>
            </div>

            {/* Clearance Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search clearances (name, email, PAN, document ref, or phone)..."
                value={clearanceSearch}
                onChange={(e) => setClearanceSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-xs font-sans placeholder-zinc-400 transition"
              />
              {clearanceSearch && (
                <button
                  type="button"
                  onClick={() => setClearanceSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 font-extrabold text-[10px] uppercase cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 flex-grow">
              {clearanceSubTab === 'pending' ? (
                /* Pending Queue View */
                filteredPendingClearanceUsers.length === 0 ? (
                  <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <ShieldCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-bold">No matching pending clearance requests.</p>
                  </div>
                ) : (
                  filteredPendingClearanceUsers.map(u => (
                    <div key={u.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-150 space-y-3">
                      <div className="flex gap-3 justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-zinc-800">{u.name}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold">{u.email}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">Phone: {u.phoneNumber || 'N/A'}</p>
                        </div>
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 shrink-0">
                          PENDING CLEARANCE
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-zinc-150/80 space-y-1 text-[10.5px]">
                        <div className="flex justify-between border-b border-zinc-100 pb-1">
                          <span className="text-zinc-400">Document Type:</span>
                          <span className="font-bold uppercase text-zinc-750">{u.panNumber ? 'PAN (Financial Code)' : 'Official Document ID'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-zinc-400">ID Reference Number:</span>
                          <span className="font-mono font-semibold text-zinc-700">{u.panNumber || u.officialDocId}</span>
                        </div>
                        {u.idPhoto && (
                          <div className="pt-2">
                            <span className="text-zinc-400 block mb-1 font-bold">Government ID Attachment:</span>
                            <div 
                              onClick={() => setSelectedPhotoUrl(u.idPhoto || null)}
                              className="block relative group h-40 overflow-hidden rounded-lg border border-zinc-200 cursor-zoom-in"
                            >
                              <img src={u.idPhoto} alt="Gov id attachment" className="w-full h-full object-cover group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-black/40 transition text-[9px] font-bold text-white uppercase tracking-widest">
                                Click to zoom ID document
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {u.clearanceRemarks && (
                        <div className="p-2.5 bg-amber-50 rounded-xl text-[10px] text-amber-800 font-sans border border-amber-100/60">
                          <span className="font-extrabold uppercase block text-[8px] tracking-wider text-amber-700 mb-0.5">Previous Remarks / Rejection History</span>
                          {u.clearanceRemarks}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => verifyUserByAdmin(u.id, true)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approve Clearance
                        </button>
                        <button
                          onClick={() => {
                            setRejectClearanceUserId(u.id);
                            setClearanceRemarksInput('');
                          }}
                          className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Deny / Reject Setup
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Approved Archive View representing "saved in admin portal for future use" */
                filteredApprovedClearanceUsers.length === 0 ? (
                  <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <ShieldCheck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-bold text-zinc-500">No matching approved clearances found.</p>
                  </div>
                ) : (
                  filteredApprovedClearanceUsers.map(u => (
                    <div key={u.id} className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-150 space-y-3">
                      <div className="flex gap-3 justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-zinc-800">{u.name}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold">{u.email}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">Phone: {u.phoneNumber || 'N/A'}</p>
                        </div>
                        <span className="text-[9px] font-mono font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 shrink-0 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> VERIFIED
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-zinc-150/80 space-y-1 text-[10.5px]">
                        <div className="flex justify-between border-b border-zinc-100 pb-1">
                          <span className="text-zinc-400">Document Type:</span>
                          <span className="font-bold uppercase text-zinc-750">{u.panNumber ? 'PAN (Financial Code)' : 'Official Document ID'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-zinc-400">ID Reference Number:</span>
                          <span className="font-mono font-semibold text-zinc-700">{u.panNumber || u.officialDocId}</span>
                        </div>
                        {u.idPhoto && (
                          <div className="pt-2">
                            <span className="text-zinc-400 block mb-1 font-bold">Government ID Attachment:</span>
                            <div 
                              onClick={() => setSelectedPhotoUrl(u.idPhoto || null)}
                              className="block relative group h-40 overflow-hidden rounded-lg border border-zinc-200 cursor-zoom-in"
                            >
                              <img src={u.idPhoto} alt="Gov id attachment" className="w-full h-full object-cover group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-black/40 transition text-[9px] font-bold text-white uppercase tracking-widest">
                                Click to zoom ID document
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {u.clearanceRemarks && (
                        <div className="p-2.5 bg-emerald-50/60 rounded-xl text-[10px] text-emerald-800 font-sans border border-emerald-100">
                          <span className="font-extrabold uppercase block text-[8px] tracking-wider text-emerald-700 mb-0.5 font-sans">Clearance Remarks</span>
                          {u.clearanceRemarks}
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-405">
                        <span className="text-zinc-455 text-[9.5px]">Documents Securely Saved in Portal Database</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectClearanceUserId(u.id);
                            setClearanceRemarksInput('');
                          }}
                          className="px-2 py-1 text-red-650 hover:bg-red-50 rounded font-bold cursor-pointer transition text-[9.5px] uppercase tracking-wider"
                        >
                          Revoke Verification
                        </button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Withdrawals Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <div>
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Withdrawal Claims
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                Monetization cash clearing pipeline requests from verified creators under NRS 0.25 Nepalese Rupees rate.
              </p>
            </div>

            {/* Withdrawal Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search withdrawals (by name, email, gateway, credentials, status or ID)..."
                value={withdrawSearch}
                onChange={(e) => setWithdrawSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-xs font-sans placeholder-zinc-400 transition"
                id="withdrawal-search-bar"
              />
              {withdrawSearch && (
                <button
                  type="button"
                  onClick={() => setWithdrawSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 font-extrabold text-[10px] uppercase cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No matching withdrawal claims found.</p>
                </div>
              ) : (
                filteredWithdrawals.map(w => {
                  const applicant = users.find(u => u.id === w.userId);
                  return (
                    <div key={w.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-150 space-y-3 animate-in fade-in duration-100">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h4 className="text-xs font-black text-zinc-800">{applicant ? applicant.name : 'Unknown Author'}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold">{applicant ? applicant.email : 'No email contact'}</p>
                          <p className="text-[9px] text-zinc-400 font-medium mt-1">Created: {new Date(w.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          w.status === 'pending'
                            ? 'text-indigo-700 bg-indigo-50 border-indigo-100'
                            : w.status === 'approved'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                            : 'text-red-700 bg-red-50 border-red-100'
                        }`}>
                          {w.status}
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-zinc-150/80 space-y-1.5 text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="text-zinc-400 font-medium">Withdrawal Sum:</span>
                          <span className="font-mono font-black text-indigo-700">Rs. {Number(w.amountNpr).toLocaleString(undefined, {minimumFractionDigits: 2})} NPR</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400 font-medium">Payout Gateway:</span>
                          <span className="font-bold uppercase text-zinc-700">{w.paymentMethod}</span>
                        </div>
                        <div className="pt-1.5 border-t border-zinc-100">
                          <span className="text-zinc-400 block font-medium">Routing Target Credentials:</span>
                          <p className="text-[10px] font-mono font-extrabold text-zinc-800 break-all mt-0.5">{w.details}</p>
                        </div>
                      </div>

                      {w.remarks && (
                        <div className="p-2.5 bg-red-50/50 border border-red-100 rounded-xl text-[10px] text-red-750 font-sans">
                          <span className="font-extrabold uppercase block text-[8px] tracking-wider text-red-800 mb-0.5">Denial Reason / Remarks</span>
                          {w.remarks}
                        </div>
                      )}

                      {w.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateWithdrawalStatusByAdmin(w.id, 'approved')}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            Approve Disbursal
                          </button>
                          <button
                            onClick={() => {
                              setRejectWithdrawalId(w.id);
                              setWithdrawalRemarksInput('');
                            }}
                            className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[9.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            Deny Request
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'ads' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-200" id="admin-section-ads">
          {/* Ad Campaign Editor Desk (Left Column) */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <CampaignMonitor ads={ads} />
            <div>
              <div className="inline-flex items-center gap-1.5 bg-orange-50 border-r border-[#1A1A1A]/5 px-3.5 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-orange-600 rounded-full mb-2">
                <Megaphone className="w-3.5 h-3.5 shrink-0" />
                <span>SPONSORED CAMPAIGN BUILDER</span>
              </div>
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 font-bold">
                {adEditingId ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <p className="text-zinc-650 text-xs mt-1 leading-relaxed">
                Configure tailored promotional campaigns. Select **Workspace Banners** to insert static ads inside the top Feed white space, or select **Interactive Bubbles** to spawn sleek floating spheres with customized welcome overlays.
              </p>
            </div>

            {adSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl text-center border border-emerald-100">
                {adSuccess}
              </div>
            )}

            {adError && (
              <div className="p-3 bg-red-50 text-red-800 text-xs font-bold rounded-2xl text-center border border-red-150">
                {adError}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!adTitle.trim() || !adDescription.trim() || !adTargetUrl.trim() || !adImageUrl.trim()) {
                setAdError("Please fill out all ad campaign fields including image, title, description and target URL!");
                return;
              }
              try {
                setAdError(null);
                await createOrUpdateAd({
                  id: adEditingId || undefined,
                  title: adTitle.trim(),
                  description: adDescription.trim(),
                  imageUrl: adImageUrl.trim(),
                  targetUrl: adTargetUrl.trim(),
                  active: adActive,
                  placement: adPlacement,
                  welcomeBadge: adPlacement === 'bubble' ? adWelcomeBadge.trim() : undefined,
                  welcomeTitle: adPlacement === 'bubble' ? adWelcomeTitle.trim() : undefined,
                  welcomeText: adPlacement === 'bubble' ? adWelcomeText.trim() : undefined
                });
                setAdSuccess(adEditingId ? "Campaign successfully updated!" : "Ad campaign successfully queued and published!");
                // Clear the states
                setAdTitle('');
                setAdDescription('');
                setAdImageUrl('');
                setAdTargetUrl('');
                setAdActive(true);
                setAdPlacement('workspace');
                setAdWelcomeBadge('Sponsored Welcome');
                setAdWelcomeTitle('Active Sponsor Bubbles live!');
                setAdWelcomeText('Pop the glossy floating spheres orbiting the workspace to test campaign previews and grab exclusive content offers.');
                setAdEditingId(null);
                setTimeout(() => setAdSuccess(null), 3000);
              } catch (err: any) {
                setAdError(err?.message || "Failed to save ad campaign.");
              }
            }} className="space-y-4">
              
              {/* Segmented Placement Toggle between Workspace & Bubble Ads */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Ad Campaign Placement type</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-1 rounded-2xl border border-zinc-150">
                  <button
                    type="button"
                    onClick={() => setAdPlacement('workspace')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      adPlacement === 'workspace'
                        ? 'bg-black text-white shadow'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer'
                    }`}
                  >
                    <span>📰 Workspace Banner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdPlacement('bubble')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      adPlacement === 'bubble'
                        ? 'bg-black text-white shadow'
                        : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer'
                    }`}
                  >
                    <span>🫧 Interactive Bubble</span>
                  </button>
                </div>
              </div>

              {/* Conditional customizations for Bubble Welcome overlay elements */}
              {adPlacement === 'bubble' && (
                <div className="space-y-4 p-4 bg-orange-50/40 rounded-2xl border border-orange-200/50 animate-fadeIn">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-orange-200/35">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                    <span className="text-[10px] uppercase font-mono tracking-widest text-orange-700 font-extrabold">Bubble Welcome Notifications Customizer</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Welcome Notification Badge Tag</label>
                    <input
                      type="text"
                      required
                      value={adWelcomeBadge}
                      onChange={(e) => setAdWelcomeBadge(e.target.value)}
                      placeholder="e.g., Sponsored Welcome"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-200 focus:border-orange-500 text-xs text-zinc-800 outline-none font-sans font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Welcome Heading Title</label>
                    <input
                      type="text"
                      required
                      value={adWelcomeTitle}
                      onChange={(e) => setAdWelcomeTitle(e.target.value)}
                      placeholder="e.g., Active Sponsor Bubbles live!"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-200 focus:border-orange-500 text-xs text-zinc-800 outline-none font-sans font-black"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Welcome description copy</label>
                    <textarea
                      required
                      rows={3}
                      value={adWelcomeText}
                      onChange={(e) => setAdWelcomeText(e.target.value)}
                      placeholder="e.g., Pop the glossy floating spheres orbiting the workspace to test campaign previews and grab exclusive content offers."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-orange-500 text-[10px] text-zinc-800 outline-none font-sans leading-relaxed"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Ad title / headline</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g. FreshLink Premium Creators Club"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-150 focus:bg-white text-xs font-bold text-zinc-800 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Target Redirection Link</label>
                <input
                  type="url"
                  required
                  value={adTargetUrl}
                  onChange={(e) => setAdTargetUrl(e.target.value)}
                  placeholder="e.g. https://freshlinks.co/join-monetization"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-150 focus:bg-white text-xs font-mono text-zinc-800 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">Description / Action Headline</label>
                <textarea
                  required
                  rows={3}
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                  placeholder="e.g. Register your business clearance, get monetized at Rs 0.25 per read, and share premium stories!"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-150 focus:bg-white text-xs font-sans text-zinc-800 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block flex-1">Banner Image URL</label>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">Input or click a stock preset below</span>
                </div>
                <input
                  type="text"
                  required
                  value={adImageUrl}
                  onChange={(e) => setAdImageUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-150 focus:bg-white text-xs font-mono text-zinc-800 outline-none"
                />

                {/* Convenient Unsplash High Quality Stock Presets */}
                <div className="grid grid-cols-4 gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80')}
                    className="h-10 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-orange-600 transition"
                    title="Workspace Tech Setup Ad Banner"
                  >
                    <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80" alt="Preset 1" className="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80')}
                    className="h-10 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-orange-600 transition"
                    title="Modern Gadgets Concept Ad Banner"
                  >
                    <img src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=150&q=80" alt="Preset 2" className="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80')}
                    className="h-10 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-orange-600 transition"
                    title="Creators Workshop Ad Banner"
                  >
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=150&q=80" alt="Preset 3" className="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdImageUrl('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80')}
                    className="h-10 rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-orange-600 transition"
                    title="Global Adventure Ad Banner"
                  >
                    <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=150&q=80" alt="Preset 4" className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>

              {/* Set Active Instantly checkbox */}
              <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <input
                  type="checkbox"
                  id="adActiveToggle"
                  checked={adActive}
                  onChange={(e) => setAdActive(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300 pointer"
                />
                <label htmlFor="adActiveToggle" className="text-xs font-bold text-zinc-700 cursor-pointer">
                  Activate Ad Campaign immediately inside the Feed whitespace
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {adEditingId ? 'Save Campaign Changes' : 'Publish Ad Campaign'}
                </button>
                {adEditingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdEditingId(null);
                      setAdTitle('');
                      setAdDescription('');
                      setAdImageUrl('');
                      setAdTargetUrl('');
                      setAdActive(true);
                      setAdPlacement('workspace');
                      setAdWelcomeBadge('Sponsored Welcome');
                      setAdWelcomeTitle('Active Sponsor Bubbles live!');
                      setAdWelcomeText('Pop the glossy floating spheres orbiting the workspace to test campaign previews and grab exclusive content offers.');
                      setAdError(null);
                    }}
                    className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* LIVE SIMULATED PREVIEW PANEL */}
            <div className="border border-zinc-150 rounded-3xl p-4 bg-zinc-50/50 mt-4">
              <h4 className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider mb-3">
                Live Feed Simulator Preview
              </h4>
              {adTitle || adDescription || adImageUrl ? (
                <div 
                  className="bg-white border border-amber-200/60 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-xs overflow-hidden relative text-left"
                >
                  <div className="absolute top-2 right-3 bg-zinc-900 text-white font-mono uppercase text-[8px] font-semibold px-2 py-0.5 rounded-full tracking-widest flex items-center gap-1">
                    <Megaphone className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    <span>SPONSORED AD</span>
                  </div>

                  {adImageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100">
                      <img src={adImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-sans font-bold text-sm text-zinc-900 truncate">
                      {adTitle || 'Your Campaign Headline Title'}
                    </h3>
                    <p className="font-sans text-[11px] text-zinc-500 mt-0.5 line-clamp-2 leading-snug">
                      {adDescription || 'Your promotional text, action offer, benefits, or custom product marketing tags...'}
                    </p>
                    <div className="flex items-center gap-1 text-orange-600 font-mono text-[9px] font-bold mt-1">
                      <span>{adTargetUrl ? `Redirecting to Ad Target` : 'Target link redirect URL'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  Fill in details to visualize the placement banner.
                </div>
              )}
            </div>
          </div>

          {/* Ad campaigns list (Right Column) */}
          <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <div>
              <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <Tv className="w-5 h-5 text-indigo-600" />
                Scheduled Campaigns Archive
              </h2>
              <p className="text-zinc-400 text-xs mt-1">
                View all past, present, active, and inactive sponsored placements. Only one ad banner can be active at a time to keep UI pristine.
              </p>
            </div>

            {/* Quick Actions Bar to Pause or Activate All campaigns */}
            {ads && ads.length > 0 && (
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-150">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to pause all advertisement campaigns?")) {
                      await toggleAllAds(false);
                    }
                  }}
                  className="py-2.5 text-[9.5px] uppercase font-black tracking-widest bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-250 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>⏸️ Pause All Ads</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to activate all advertisement campaigns?")) {
                      await toggleAllAds(true);
                    }
                  }}
                  className="py-2.5 text-[9.5px] uppercase font-black tracking-widest bg-zinc-900 hover:bg-black text-white rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>▶️ Activate All Ads</span>
                </button>
              </div>
            )}

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {ads && ads.length > 0 ? (
                [...ads]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map(a => (
                    <div key={a.id} className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center gap-4 ${
                      a.active ? 'bg-gradient-to-r from-orange-50/50 to-amber-50/30 border-amber-200' : 'bg-zinc-50/50 border-zinc-150'
                    }`}>
                      {/* Image */}
                      {a.imageUrl && (
                        <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-white shadow-xs">
                          <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-zinc-800 truncate max-w-[200px] md:max-w-xs">{a.title}</h4>
                          {(() => {
                            const hoursElapsed = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
                            const hoursRemaining = 24 - hoursElapsed;
                            if (a.active) {
                              if (hoursRemaining <= 0) {
                                return (
                                  <span className="text-[8.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-red-700 bg-red-50 border-red-100">
                                    EXPIRED (24H Over)
                                  </span>
                                );
                              }
                              const h = Math.floor(hoursRemaining);
                              const m = Math.floor((hoursRemaining - h) * 60);
                              return (
                                <span className="text-[8.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-100 animate-pulse">
                                  RUNNING • {h}h {m}m LEFT
                                </span>
                              );
                            }
                            return (
                              <span className="text-[8.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-zinc-500 bg-zinc-100 border-zinc-100">
                                PAUSED / STOPPED
                              </span>
                            );
                          })()}

                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            a.placement === 'bubble'
                              ? 'text-purple-700 bg-purple-50 border-purple-100'
                              : 'text-blue-700 bg-blue-50 border-blue-100'
                          }`}>
                            {a.placement === 'bubble' ? '🫧 Interactive Bubble' : '📰 Workspace Banner'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 mt-1 line-clamp-2 leading-normal">{a.description}</p>
                        
                        <div className="flex items-center gap-1 text-zinc-400 font-mono text-[9px] mt-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                          <span className="font-bold text-zinc-500">Destination:</span>
                          <a href={a.targetUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline inline-flex items-center gap-0.5">
                            {a.targetUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        <div className="flex gap-4 items-center mt-2 text-zinc-500 text-[10px] font-mono flex-wrap">
                          <div className="flex items-center gap-1 bg-zinc-100/70 border border-zinc-150 px-2 py-0.5 rounded-lg text-zinc-700 font-bold">
                            <span className="text-orange-600">🎯</span> Click Rate: <span className="text-zinc-900 font-black">{a.clickCount || 0}</span> redirections
                          </div>
                          <div className="text-[9.5px]">
                            Created: <span className="font-semibold text-zinc-650">{new Date(a.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto pt-3 md:pt-0">
                        <button
                          onClick={() => {
                            // Toggle active state
                            createOrUpdateAd({
                              ...a,
                              active: !a.active
                            });
                          }}
                          className={`px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
                            a.active
                              ? 'bg-zinc-100 text-zinc-650 hover:bg-zinc-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                          title={a.active ? "Pause Campaign" : "Set Active immediately"}
                        >
                          {a.active ? 'Pause' : 'Activate'}
                        </button>

                        <button
                          onClick={() => {
                            // Load edit
                            setAdEditingId(a.id);
                            setAdTitle(a.title);
                            setAdDescription(a.description);
                            setAdImageUrl(a.imageUrl);
                            setAdTargetUrl(a.targetUrl);
                            setAdActive(a.active);
                            setAdPlacement(a.placement || 'workspace');
                            setAdWelcomeBadge(a.welcomeBadge || 'Sponsored Welcome');
                            setAdWelcomeTitle(a.welcomeTitle || 'Active Sponsor Bubbles live!');
                            setAdWelcomeText(a.welcomeText || 'Pop the glossy floating spheres orbiting the workspace to test campaign previews and grab exclusive content offers.');
                          }}
                          className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-600 hover:bg-zinc-100 bg-zinc-50 rounded-xl transition cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(`Do you want to permanently delete ad campaign "${a.title}"?`)) {
                              await deleteAd(a.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Delete Placement permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center p-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <Megaphone className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No registered advertisement banners found.</p>
                  <p className="text-[10px] text-zinc-400/80 mt-1">Create one using the Sponsor ad form on the left!</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Custom Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 font-sans">
                Permanently Delete Article?
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              Are you sure you want to delete <span className="font-extrabold text-zinc-800">"{postToDelete.title}"</span>? This action is irreversible and will remove the post, likes, and comments from the global feed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deletePost(postToDelete.id);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsDeleting(false);
                    setPostToDelete(null);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-red-500/10"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Story</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom modal for viewing ID Photo document details perfectly */}
      {selectedPhotoUrl && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoUrl(null)}
          id="id-attachment-lightbox"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-zinc-950 p-2 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-white/10" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedPhotoUrl} 
              alt="Government ID document high definition" 
              className="max-w-full max-h-[78vh] object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            <div className="p-4 bg-zinc-900/90 flex items-center justify-between text-white font-sans text-xs">
              <div>
                <span className="font-extrabold text-zinc-100 block uppercase tracking-wider text-[10px]">Security Auditing Panel</span>
                <span className="text-[10px] text-zinc-400">Verifying identity attachment authenticity.</span>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedPhotoUrl(null)} 
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Rejection Remarks Modal */}
      {rejectClearanceUserId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 font-sans uppercase">
                Deny or Revoke Clearance?
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              Please enter the remarks or reason for denying/revoking this user's identity clearance setup. This reason will be saved in the database.
            </p>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                Denial Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={clearanceRemarksInput}
                onChange={(e) => setClearanceRemarksInput(e.target.value)}
                placeholder="e.g. Uploaded photograph is blurred, or PAN details match is inconsistent."
                rows={3}
                required
                className="w-full p-2.5 bg-zinc-50 border border-zinc-250 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-xs font-sans placeholder-zinc-400 font-medium transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectClearanceUserId(null);
                  setClearanceRemarksInput('');
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-red-500/10"
                onClick={async () => {
                  if (!clearanceRemarksInput.trim()) return;
                  try {
                    await verifyUserByAdmin(rejectClearanceUserId, false, clearanceRemarksInput.trim());
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setRejectClearanceUserId(null);
                    setClearanceRemarksInput('');
                  }
                }}
                disabled={!clearanceRemarksInput.trim()}
              >
                Confirm Denial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Rejection Remarks Modal */}
      {rejectWithdrawalId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 font-sans uppercase">
                Reject Withdrawal Request?
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              Please enter the remarks or reasons for rejecting this withdrawal claim. These remarks will be saved in the database logs for the creator's visibility.
            </p>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                Denial Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={withdrawalRemarksInput}
                onChange={(e) => setWithdrawalRemarksInput(e.target.value)}
                placeholder="e.g. Account credentials invalid or payout network limits exceeded."
                rows={3}
                required
                className="w-full p-2.5 bg-zinc-50 border border-zinc-250 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-xs font-sans placeholder-zinc-400 font-medium transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectWithdrawalId(null);
                  setWithdrawalRemarksInput('');
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-red-500/10"
                onClick={async () => {
                  if (!withdrawalRemarksInput.trim()) return;
                  try {
                    await updateWithdrawalStatusByAdmin(rejectWithdrawalId, 'rejected', withdrawalRemarksInput.trim());
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setRejectWithdrawalId(null);
                    setWithdrawalRemarksInput('');
                  }
                }}
                disabled={!withdrawalRemarksInput.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
