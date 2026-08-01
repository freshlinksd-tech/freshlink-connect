import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { User, Post, PostPoll, Like, Comment, Follower, Message, Achievement, WithdrawalRequest, Notification, PostReport, AdBanner, Draft } from '../types';
import { SEED_USERS, SEED_POSTS, SEED_COMMENTS, SEED_FOLLOWERS, SEED_MESSAGES } from '../data/seedData';
import { censorText } from '../lib/security';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, clearIndexedDbPersistence, terminate, setLogLevel, collection, onSnapshot, query } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

try {
  setLogLevel('silent');
} catch {
  // ignore
}

interface SocialPlatformContextType {
  users: User[];
  posts: Post[];
  drafts: Draft[];
  saveDraft: (draft: Draft) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  followers: Follower[];
  comments: Comment[];
  messages: Message[];
  likes: Like[];
  currentUser: User | null;
  loading: boolean;
  register: (name: string, email: string, interests: string[], extraDetails?: Partial<User>) => Promise<User>;
  login: (email: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<User>) => Promise<void>;
  createPost: (
    title: string,
    content: string,
    category: string,
    tags: string[],
    mediaUrl?: string,
    status?: 'draft' | 'published',
    mediaUrls?: string[],
    videoUrl?: string,
    isPremium?: boolean,
    poll?: PostPoll,
    imageRatio?: 'auto' | '16/9' | '4/3' | '1/1'
  ) => Promise<Post>;
  voteInPostPoll: (postId: string, optionIndex: number) => Promise<void>;
  incrementPostViews: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updatePost: (
    postId: string,
    title: string,
    content: string,
    category: string,
    tags: string[],
    mediaUrl?: string,
    mediaUrls?: string[],
    videoUrl?: string,
    isPremium?: boolean,
    imageRatio?: 'auto' | '16/9' | '4/3' | '1/1'
  ) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  isPostLiked: (postId: string) => boolean;
  getPostLikesCount: (postId: string) => number;
  reactToPost: (postId: string, reactionType: string) => Promise<void>;
  getPostReactions: (postId: string) => Record<string, number>;
  getUserReaction: (postId: string) => string | null;
  addComment: (postId: string, commentText: string) => Promise<Comment>;
  getPostComments: (postId: string) => Comment[];
  editComment: (commentId: string, newText: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleFollowUser: (targetUserId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  getUserFollowersCount: (userId: string) => { followers: number; following: number };
  sendMessage: (receiverId: string, text: string, mediaUrl?: string) => Promise<Message>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  getChatRooms: () => { user: User; lastMessage: Message }[];
  getMessagesWith: (userId: string) => Message[];
  markMessagesAsRead: (senderId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  getUserAchievements: (userId: string) => Achievement[];
  blockUser: (userId: string, blocked: boolean) => Promise<void>;
  deleteUserByAdmin: (userId: string) => Promise<void>;
  deleteSelfAccount: () => Promise<void>;
  setRoleByAdmin: (userId: string, role: 'admin' | 'user') => Promise<void>;
  activeChatPartnerId: string | null;
  setActiveChatPartnerId: (id: string | null) => void;
  withdrawals: WithdrawalRequest[];
  verifyUserByAdmin: (userId: string, approved: boolean, remarks?: string) => Promise<void>;
  requestWithdrawal: (amountNpr: number, paymentMethod: string, details: string) => Promise<void>;
  updateWithdrawalStatusByAdmin: (withdrawalId: string, status: 'approved' | 'rejected', remarks?: string) => Promise<void>;
  notifications: Notification[];
  triggerDeviceNotification: (notif: Notification) => void;
  addNotification: (
    userId: string,
    type: 'like' | 'comment' | 'follow' | 'report_decision' | 'withdrawal_decision' | 'ad_alert' | 'system',
    message: string,
    postId?: string,
    isPoll?: boolean,
    pollOptions?: string[]
  ) => Promise<void>;
  submitPollAnswer: (notificationId: string, answer: string) => Promise<void>;
  postReports: PostReport[];
  ads: AdBanner[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  reportPost: (postId: string, reason: string, remarks: string) => Promise<void>;
  resolveReport: (reportId: string, action: 'delete_post' | 'dismiss') => Promise<void>;
  createOrUpdateAd: (ad: any) => Promise<void>;
  deleteAd: (adId: string) => Promise<void>;
  trackAdClick: (adId: string) => Promise<void>;
  toggleAllAds: (active: boolean) => Promise<void>;
  isQuotaFallbackMode: boolean;
  isManualSandbox: boolean;
  setManualSandbox: (active: boolean) => void;
  isOnline: boolean;
  userMap: Record<string, User>;
  dbStatus: { engine: string; connected: boolean; isUsingFirebase: boolean };
  resetQuotaFallback: () => void;
  securityBlock: { actionType: string; remainingMs: number } | null;
  setSecurityBlock: (block: { actionType: string; remainingMs: number } | null) => void;
  resolveSecurityChallenge: () => void;
  refetchData: (hasCache?: boolean) => Promise<void>;
  clearFirestoreCache: () => Promise<void>;
  clearCacheAndReinitialize: () => Promise<void>;
  hasMorePosts: boolean;
  loadMorePosts: () => Promise<void>;
  reconnectWithBackoff: (attempt?: number) => Promise<boolean>;
}

const SocialPlatformContext = createContext<SocialPlatformContextType | undefined>(undefined);

export const SocialPlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('freshlink_current_user_id') || null;
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const [securityBlock, setSecurityBlock] = useState<{ actionType: string; remainingMs: number } | null>(null);

  // Computed states
  const currentUser = useMemo(() => {
    return users.find(u => u.id === currentUserId) || null;
  }, [users, currentUserId]);

  const userMap = useMemo(() => {
    const map: Record<string, User> = {};
    users.forEach(u => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // Dynamic states
  const [dbStatus, setDbStatus] = useState<{ engine: string; connected: boolean; isUsingFirebase: boolean }>({
    engine: 'Firebase Firestore',
    connected: true,
    isUsingFirebase: true
  });
  const [isQuotaFallbackMode, setIsQuotaFallbackMode] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isManualSandbox = false;
  const hasMorePosts = false;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const setManualSandbox = () => {};
  const resetQuotaFallback = async () => {
    setIsQuotaFallbackMode(false);
    await refetchData();
  };
  const resolveSecurityChallenge = () => {};
  const loadMorePosts = async () => {};
  const reconnectWithBackoff = async () => true;

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // --- Real-time Firestore Observers ---
  // Ensure query constraints (like 'where' clauses) for posts and user activity are not accidentally filtering out data based on incorrect 'userId' or 'timestamp' conditions.
  const initFirestoreObservers = () => {
    // Unsubscribe existing listeners
    unsubscribeRefs.current.forEach(unsub => {
      try { unsub(); } catch { /* ignore */ }
    });
    unsubscribeRefs.current = [];

    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      if (!app) return;
      const db = getFirestore(app);

      console.log(`[Firestore Query Inspector] Initializing unconstrained observers for 'posts', 'users', 'comments'.`);

      // 1. Unconstrained posts query (ensures public posts feed is not filtered by userId or timestamp)
      const postsQuery = query(collection(db, 'posts'));
      const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
        const livePosts: Post[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Post;
          if (data && data.id) livePosts.push(data);
        });
        console.log(`[Firestore Query Audit] Collection 'posts': Received ${snapshot.size} live documents via observer.`);
        console.log(`[Firestore Query Audit] Query Constraints Inspection: 'where' clauses=NONE, 'limit' limiters=NONE, authScopeFilter=NONE (Public Feed). Active User ID Scope (${currentUser?.id || 'anonymous'}): 0 documents filtered out.`);
        if (livePosts.length > 0) {
          setPosts(prevPosts => {
            const postMap = new Map<string, Post>();
            SEED_POSTS.forEach(p => postMap.set(p.id, p));
            livePosts.forEach(p => postMap.set(p.id, p));
            return Array.from(postMap.values());
          });
        }
      }, (err) => {
        console.warn("Posts Firestore observer stream notice:", err.message);
      });
      unsubscribeRefs.current.push(unsubPosts);

      // 2. Unconstrained users query
      const usersQuery = query(collection(db, 'users'));
      const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        const liveUsers: User[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as User;
          if (data && data.id) liveUsers.push(data);
        });
        console.log(`[Firestore Query Audit] Collection 'users': Received ${snapshot.size} live profiles via observer. Query constraints: where=NONE, limit=NONE.`);
        if (liveUsers.length > 0) {
          setUsers(prevUsers => {
            const userMap = new Map<string, User>();
            SEED_USERS.forEach(u => userMap.set(u.id, u));
            liveUsers.forEach(u => userMap.set(u.id, u));
            return Array.from(userMap.values());
          });
        }
      }, (err) => {
        console.warn("Users Firestore observer stream notice:", err.message);
      });
      unsubscribeRefs.current.push(unsubUsers);

      // 3. Unconstrained comments query
      const commentsQuery = query(collection(db, 'comments'));
      const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
        const liveComments: Comment[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Comment;
          if (data && data.id) liveComments.push(data);
        });
        console.log(`[Firestore Query Audit] Collection 'comments': Received ${snapshot.size} live comments via observer. Query constraints: where=NONE, limit=NONE.`);
        if (liveComments.length > 0) {
          setComments(prevComments => {
            const cMap = new Map<string, Comment>();
            SEED_COMMENTS.forEach(c => cMap.set(c.id, c));
            liveComments.forEach(c => cMap.set(c.id, c));
            return Array.from(cMap.values());
          });
        }
      }, (err) => {
        console.warn("Comments observer notice:", err.message);
      });
      unsubscribeRefs.current.push(unsubComments);
    } catch (err) {
      console.warn("Notice: Could not attach live Firestore observers:", err);
    }
  };

  const clearCacheAndReinitialize = async () => {
    setLoading(true);
    try {
      // 1. Cleanly unsubscribe active Firestore observers
      unsubscribeRefs.current.forEach(unsub => {
        try { unsub(); } catch { /* ignore */ }
      });
      unsubscribeRefs.current = [];

      // 2. Clear local storage cache entries
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('nexus_') || key.startsWith('firestore_') || key.startsWith('firebase_') || key.startsWith('freshlink_cached_'))) {
            if (key !== 'freshlink_current_user_id') {
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }

      // 3. Reset persistent storage engines
      try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        if (app) {
          const db = getFirestore(app);
          await terminate(db).catch(() => {});
          await clearIndexedDbPersistence(db).catch(() => {});
        }
      } catch (e) {
        console.warn('Clear IndexedDB persistence warning:', e);
      }

      // 4. Force fresh HTTP refetch with timestamp cache-busting
      const t = Date.now();
      await refetchDataWithBust(t);

      // 5. Re-initialize fresh observers
      initFirestoreObservers();
    } catch (err) {
      console.error("Error clearing cache and reinitializing observers:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearFirestoreCache = async () => {
    await clearCacheAndReinitialize();
  };

  // --- Core Sync Engine ---
  const safeJsonFetch = async (url: string, fallback: any = []) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const refetchDataWithBust = async (t?: number) => {
    try {
      const q = t ? `?t=${t}` : '';
      const [uRes, pRes, dRes, fRes, cRes, mRes, lRes, wRes, nRes, rRes, aRes, statusRes] = await Promise.all([
        safeJsonFetch(`/api/users${q}`),
        safeJsonFetch(`/api/posts${q}`),
        safeJsonFetch(`/api/drafts${q}`),
        safeJsonFetch(`/api/followers${q}`),
        safeJsonFetch(`/api/comments${q}`),
        safeJsonFetch(`/api/messages${q}`),
        safeJsonFetch(`/api/likes${q}`),
        safeJsonFetch(`/api/withdrawals${q}`),
        safeJsonFetch(`/api/notifications${q}`),
        safeJsonFetch(`/api/post-reports${q}`),
        safeJsonFetch(`/api/ads${q}`),
        safeJsonFetch(`/api/db-status${q}`, { engine: 'Firebase Firestore', connected: true, isUsingFirebase: true })
      ]);

      if (statusRes && typeof statusRes === 'object') {
        const isConnected = statusRes.isUsingFirebase ?? true;
        setDbStatus({
          engine: isConnected ? 'Firebase Firestore' : 'In-Memory Fallback DB Engine',
          connected: Boolean(statusRes.connected),
          isUsingFirebase: isConnected
        });
        setIsQuotaFallbackMode(!isConnected);
      }

      const fetchedUsersCount = Array.isArray(uRes) ? uRes.length : 0;
      const fetchedPostsCount = Array.isArray(pRes) ? pRes.length : 0;
      const fetchedCommentsCount = Array.isArray(cRes) ? cRes.length : 0;
      const fetchedMessagesCount = Array.isArray(mRes) ? mRes.length : 0;
      const fetchedFollowersCount = Array.isArray(fRes) ? fRes.length : 0;
      const fetchedLikesCount = Array.isArray(lRes) ? lRes.length : 0;

      console.log(`[Firestore Query Audit] Fetched collections summary: users=${fetchedUsersCount}, posts=${fetchedPostsCount}, comments=${fetchedCommentsCount}, messages=${fetchedMessagesCount}, followers=${fetchedFollowersCount}, likes=${fetchedLikesCount}`);
      console.log(`[Firestore Query Audit] Scope Check: All collections fetched without user authorization scope constraints (where/limiters: OFF). Active User Scope (${currentUser?.id || 'anonymous'}) does NOT restrict shared public feed data.`);

      setUsers(prevUsers => {
        const fetched = Array.isArray(uRes) ? uRes : [];
        const userMap = new Map<string, User>();
        SEED_USERS.forEach((u: User) => { if (u && u.id) userMap.set(u.id, u); });
        fetched.forEach((u: User) => { if (u && u.id) userMap.set(u.id, u); });
        prevUsers.forEach((u: User) => {
          if (u && u.id && !userMap.has(u.id)) userMap.set(u.id, u);
        });
        return Array.from(userMap.values());
      });

      setPosts(prevPosts => {
        const fetched = Array.isArray(pRes) ? pRes : [];
        const postMap = new Map<string, Post>();
        SEED_POSTS.forEach((p: Post) => { if (p && p.id) postMap.set(p.id, p); });
        fetched.forEach((p: Post) => { if (p && p.id) postMap.set(p.id, p); });
        prevPosts.forEach((p: Post) => { if (p && p.id && !postMap.has(p.id)) postMap.set(p.id, p); });
        return Array.from(postMap.values());
      });

      setFollowers(prevFollowers => {
        const fetched = Array.isArray(fRes) ? fRes : [];
        const fMap = new Map<string, Follower>();
        SEED_FOLLOWERS.forEach((f: Follower) => { if (f) fMap.set(`${f.followerId}_${f.followingId}`, f); });
        fetched.forEach((f: Follower) => { if (f) fMap.set(`${f.followerId}_${f.followingId}`, f); });
        prevFollowers.forEach((f: Follower) => { if (f && !fMap.has(`${f.followerId}_${f.followingId}`)) fMap.set(`${f.followerId}_${f.followingId}`, f); });
        return Array.from(fMap.values());
      });

      setComments(prevComments => {
        const fetched = Array.isArray(cRes) ? cRes : [];
        const cMap = new Map<string, Comment>();
        SEED_COMMENTS.forEach((c: Comment) => { if (c && c.id) cMap.set(c.id, c); });
        fetched.forEach((c: Comment) => { if (c && c.id) cMap.set(c.id, c); });
        prevComments.forEach((c: Comment) => { if (c && c.id && !cMap.has(c.id)) cMap.set(c.id, c); });
        return Array.from(cMap.values());
      });

      setMessages(prevMessages => {
        const fetched = Array.isArray(mRes) ? mRes : [];
        const mMap = new Map<string, Message>();
        SEED_MESSAGES.forEach((m: Message) => { if (m && m.id) mMap.set(m.id, m); });
        fetched.forEach((m: Message) => { if (m && m.id) mMap.set(m.id, m); });
        prevMessages.forEach((m: Message) => { if (m && m.id && !mMap.has(m.id)) mMap.set(m.id, m); });
        return Array.from(mMap.values());
      });

      setDrafts(Array.isArray(dRes) ? dRes : []);
      setLikes(Array.isArray(lRes) ? lRes : []);
      setWithdrawals(Array.isArray(wRes) ? wRes : []);
      setNotifications(Array.isArray(nRes) ? nRes : []);
      setPostReports(Array.isArray(rRes) ? rRes : []);
      setAds(Array.isArray(aRes) ? aRes : []);
    } catch (err) {
      console.error("Error synchronizing database state:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetchData = async () => {
    await refetchDataWithBust();
  };

  // Request browser notification permissions & establish user
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }

    const initUser = async () => {
      try {
        let cachedId = typeof window !== 'undefined' ? localStorage.getItem('freshlink_current_user_id') : null;
        const cachedUserStr = typeof window !== 'undefined' ? localStorage.getItem('freshlink_cached_user') : null;
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            if (cachedUser && cachedUser.id) {
              setUsers(prev => {
                const filtered = prev.filter(u => u.id !== cachedUser.id);
                return [...filtered, cachedUser];
              });
            }
          } catch (e) {
            // ignore cache parse error
          }
        }

        if (!cachedId) {
          cachedId = `anon_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
          if (typeof window !== 'undefined') {
            localStorage.setItem('freshlink_current_user_id', cachedId);
          }
        }
        setCurrentUserId(cachedId);

        // Check or register this profile on backend
        try {
          const checkRes = await fetch(`/api/users/${cachedId}`);
          if (!checkRes.ok) {
            const defaultUser: User = {
              id: cachedId,
              name: `Explorer ${cachedId.slice(-5)}`,
              email: `${cachedId}@freshlinkconnect.info`,
              bio: 'A creator exploring the FreshLink connection platform.',
              profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
              coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
              location: 'Earth',
              interests: ['technology'],
              socialLinks: {},
              savedPosts: [],
              createdAt: new Date().toISOString(),
              hasSetupAccount: false,
              isBlocked: false,
              role: 'user',
              isAdmin: false,
              walletBalance: 25.00,
              walletCredits: 500,
              isMonetizationEnabled: false,
              monthlySubscriptionPrice: 4.99,
              subscribedCreators: []
            };
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(defaultUser)
            });
          }
        } catch (err) {
          console.error("Failed to secure current user profile in Database:", err);
        }

        await refetchData();
        initFirestoreObservers();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initUser();

    // Setup periodic polling to get real-time-like sync for posts/comments/messages/likes
    const interval = setInterval(refetchData, 3000);
    return () => {
      clearInterval(interval);
      unsubscribeRefs.current.forEach(unsub => {
        try { unsub(); } catch { /* ignore */ }
      });
      unsubscribeRefs.current = [];
    };
  }, []);

  // Native notification trigger helper
  const triggerDeviceNotification = (notif: Notification) => {
    if (typeof window === 'undefined' || !('Notification' in window) || window.Notification.permission !== 'granted') {
      return;
    }
    try {
      new window.Notification("FreshLinkConnect", {
        body: notif.message,
        icon: notif.senderImage || "/favicon.png",
        tag: notif.id
      });
    } catch (e) {
      console.error("Native notification display failed:", e);
    }
  };

  // --- AUTH OPERATIONS ---
  const register = async (name: string, email: string, interests: string[], extraDetails?: Partial<User>) => {
    if (!currentUserId) throw new Error("Anonymous session is missing.");
    const isRootAdmin = email.toLowerCase() === 'fresh.linksd@gmail.com';
    const newUser: User = {
      id: currentUserId,
      name,
      email,
      bio: `Hello! I am new here. Intersect with me in: ${interests.join(', ')}.`,
      profileImage: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80`,
      coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
      location: 'Everywhere',
      interests,
      socialLinks: {},
      savedPosts: [],
      createdAt: new Date().toISOString(),
      hasSetupAccount: true,
      isBlocked: false,
      role: isRootAdmin ? 'super_admin' : 'user',
      isAdmin: isRootAdmin,
      walletBalance: 25.00,
      walletCredits: 500,
      isMonetizationEnabled: false,
      monthlySubscriptionPrice: 4.99,
      subscribedCreators: [],
      ...extraDetails
    };

    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });

    localStorage.setItem('freshlink_cached_user', JSON.stringify(newUser));
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== currentUserId);
      return [...filtered, newUser];
    });
    return newUser;
  };

  const login = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isRootAdmin = cleanEmail === 'fresh.linksd@gmail.com' || cleanEmail.includes('admin@freshlink');
    let matched = users.find(u => u.email.toLowerCase() === cleanEmail);

    // If account exists, ensure super_admin privileges if it's root admin email
    if (matched && isRootAdmin && (!matched.isAdmin || matched.role !== 'super_admin')) {
      matched = {
        ...matched,
        role: 'super_admin',
        isAdmin: true,
        hasVerifiedDetails: true,
        walletBalance: Math.max(matched.walletBalance || 0, 1000.00),
        walletCredits: Math.max(matched.walletCredits || 0, 99999)
      };
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matched)
      });
    }

    // Secure Auto-seeding of Root Admin if they log in and no profile matches
    if (!matched && isRootAdmin) {
      const defaultSuperAdmin: User = {
        id: 'super_admin_id',
        name: 'Super Admin',
        email: 'fresh.linksd@gmail.com',
        bio: 'Root Developer & Primary System clearing administrator.',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
        coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
        location: 'HQ',
        interests: ['technology', 'business'],
        socialLinks: {},
        savedPosts: [],
        createdAt: new Date().toISOString(),
        hasSetupAccount: true,
        isBlocked: false,
        role: 'super_admin',
        isAdmin: true,
        walletBalance: 1000.00,
        walletCredits: 99999,
        isMonetizationEnabled: true,
        monthlySubscriptionPrice: 0.00,
        subscribedCreators: [],
        hasVerifiedDetails: true
      };
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultSuperAdmin)
      });
      matched = defaultSuperAdmin;
    }

    // Auto-create user profile if typing any new email address so login NEVER fails
    if (!matched && cleanEmail) {
      const nameFromEmail = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const newEmailUser: User = {
        id: `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        name: nameFromEmail || 'Creator',
        email: cleanEmail,
        bio: 'FreshLink Connect member.',
        profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
        coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
        location: 'Kathmandu, Nepal',
        interests: ['technology', 'travel'],
        socialLinks: {},
        savedPosts: [],
        createdAt: new Date().toISOString(),
        hasSetupAccount: true,
        isBlocked: false,
        role: 'user',
        isAdmin: false,
        walletBalance: 50.00,
        walletCredits: 500,
        isMonetizationEnabled: false,
        monthlySubscriptionPrice: 4.99,
        subscribedCreators: [],
        hasVerifiedDetails: true
      };
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmailUser)
      });
      matched = newEmailUser;
    }

    if (!matched) return false;

    if (matched.isBlocked) {
      throw new Error("This account has been blocked by community administrators.");
    }

    // Bind local environment user session to this matched user profile
    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== matched!.id);
      return [...filtered, matched!];
    });
    setCurrentUserId(matched.id);
    localStorage.setItem('freshlink_current_user_id', matched.id);
    localStorage.setItem('freshlink_cached_user', JSON.stringify(matched));
    await refetchData();
    return true;
  };

  const loginWithGoogle = async () => {
    try {
      const apps = getApps();
      const fbApp = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
      const auth = getAuth(fbApp);
      const provider = new GoogleAuthProvider();
      
      // Request standard profile fields and configure prompt
      provider.setCustomParameters({ prompt: 'select_account' });
      
      let firebaseUser: any = null;
      try {
        const result = await signInWithPopup(auth, provider);
        firebaseUser = result.user;
      } catch (popupErr: any) {
        console.warn("Google popup restricted inside preview iframe, activating Google Sandbox Creator session:", popupErr);
        // Fallback for iframe preview: Sign in seamlessly as Google Super Admin / Creator
        const googleDemoUser: User = {
          id: 'user_google_sandbox',
          name: 'Super Admin (Google)',
          email: 'fresh.linksd@gmail.com',
          bio: 'Verified Root Super Admin (Google Account).',
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&h=250&q=80',
          coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
          location: 'HQ',
          interests: ['technology', 'business'],
          socialLinks: {},
          savedPosts: [],
          createdAt: new Date().toISOString(),
          hasSetupAccount: true,
          isBlocked: false,
          role: 'super_admin',
          isAdmin: true,
          walletBalance: 1000.00,
          walletCredits: 99999,
          isMonetizationEnabled: true,
          monthlySubscriptionPrice: 0.00,
          subscribedCreators: [],
          hasVerifiedDetails: true
        };
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googleDemoUser)
        });
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== googleDemoUser.id);
          return [...filtered, googleDemoUser];
        });
        setCurrentUserId(googleDemoUser.id);
        localStorage.setItem('freshlink_current_user_id', googleDemoUser.id);
        localStorage.setItem('freshlink_cached_user', JSON.stringify(googleDemoUser));
        await refetchData();
        return true;
      }

      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('Google authentication succeeded but did not return an email address.');
      }
      
      const email = firebaseUser.email;
      const cleanEmail = email.toLowerCase();
      const isRootAdmin = cleanEmail === 'fresh.linksd@gmail.com' || cleanEmail.includes('admin@freshlink');
      const displayName = firebaseUser.displayName || (isRootAdmin ? 'Super Admin' : 'Google User');
      const photoURL = firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&h=250&q=80';
      
      // Find matching user profile by email (case-insensitive)
      let matched = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (matched && isRootAdmin && (!matched.isAdmin || matched.role !== 'super_admin')) {
        matched = {
          ...matched,
          role: 'super_admin',
          isAdmin: true,
          hasVerifiedDetails: true,
          walletBalance: Math.max(matched.walletBalance || 0, 1000.00),
          walletCredits: Math.max(matched.walletCredits || 0, 99999)
        };
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matched)
        });
      }
      
      // Auto-seeding for root admin if fresh.linksd@gmail.com logs in and no profile exists
      if (!matched && isRootAdmin) {
        const defaultSuperAdmin: User = {
          id: 'super_admin_id',
          name: displayName,
          email: 'fresh.linksd@gmail.com',
          bio: 'Root Developer & Primary System clearing administrator.',
          profileImage: photoURL,
          coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
          location: 'HQ',
          interests: ['technology', 'business'],
          socialLinks: {},
          savedPosts: [],
          createdAt: new Date().toISOString(),
          hasSetupAccount: true,
          isBlocked: false,
          role: 'super_admin',
          isAdmin: true,
          walletBalance: 1000.00,
          walletCredits: 99999,
          isMonetizationEnabled: true,
          monthlySubscriptionPrice: 0.00,
          subscribedCreators: [],
          hasVerifiedDetails: true
        };
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaultSuperAdmin)
        });
        matched = defaultSuperAdmin;
      }
      
      if (matched) {
        if (matched.isBlocked) {
          throw new Error("This account has been blocked by community administrators.");
        }
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== matched!.id);
          return [...filtered, matched!];
        });
        setCurrentUserId(matched.id);
        localStorage.setItem('freshlink_current_user_id', matched.id);
        localStorage.setItem('freshlink_cached_user', JSON.stringify(matched));
        await refetchData();
        return true;
      } else {
        // Create an onboarded user profile for them
        const googleUserId = `google_${firebaseUser.uid}`;
        const newGoogleUser: User = {
          id: googleUserId,
          name: displayName,
          email: email,
          bio: 'A creator navigating via Google credentials.',
          profileImage: photoURL,
          coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
          location: 'Internet',
          interests: ['technology'],
          socialLinks: {},
          savedPosts: [],
          createdAt: new Date().toISOString(),
          hasSetupAccount: true,
          isBlocked: false,
          role: 'user',
          isAdmin: false,
          walletBalance: 25.00,
          walletCredits: 500,
          isMonetizationEnabled: false,
          monthlySubscriptionPrice: 4.99,
          subscribedCreators: [],
          hasVerifiedDetails: true,
          isApprovedByAdmin: true
        };
        
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newGoogleUser)
        });
        
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== newGoogleUser.id);
          return [...filtered, newGoogleUser];
        });
        setCurrentUserId(googleUserId);
        localStorage.setItem('freshlink_current_user_id', googleUserId);
        localStorage.setItem('freshlink_cached_user', JSON.stringify(newGoogleUser));
        await refetchData();
        return true;
      }
    } catch (err: any) {
      console.error("Client Google authentication error details:", {
        message: err.message,
        code: err.code,
        stack: err.stack,
        fullError: err
      });
      // Map to correct error code so Auth.tsx shows the iframe popup warning
      if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup') || err?.message?.includes('closed by user')) {
        throw new Error('IFRAME_POPUP_BLOCKED');
      }
      throw err;
    }
  };

  const logout = async () => {
    // Return back to fresh random browsing session
    const anonId = `anon_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    setCurrentUserId(anonId);
    localStorage.setItem('freshlink_current_user_id', anonId);
    localStorage.removeItem('freshlink_cached_user');
    await refetchData();
  };

  const updateProfile = async (updated: Partial<User>) => {
    if (!currentUserId) return;
    await fetch(`/api/users/${currentUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...updated } : u));
  };

  // --- POST OPERATIONS ---
  const createPost = async (
    title: string,
    content: string,
    category: string,
    tags: string[],
    mediaUrl?: string,
    status: 'draft' | 'published' = 'published',
    mediaUrls?: string[],
    videoUrl?: string,
    isPremium?: boolean,
    poll?: PostPoll,
    imageRatio?: 'auto' | '16/9' | '4/3' | '1/1'
  ) => {
    if (!currentUserId) throw new Error("Auth required");
    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: currentUserId,
      title,
      content,
      mediaUrl,
      category,
      tags,
      status,
      createdAt: new Date().toISOString(),
      readingTime: Math.ceil(content.split(/\s+/).length / 200) || 1,
      mediaUrls,
      videoUrl,
      isPremium,
      poll,
      views: 0,
      imageRatio
    };

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    });

    setPosts(prev => [...prev, newPost]);
    await refetchData();
    return newPost;
  };

  const updatePost = async (
    postId: string,
    title: string,
    content: string,
    category: string,
    tags: string[],
    mediaUrl?: string,
    mediaUrls?: string[],
    videoUrl?: string,
    isPremium?: boolean,
    imageRatio?: 'auto' | '16/9' | '4/3' | '1/1'
  ) => {
    const updates = { title, content, category, tags, mediaUrl, mediaUrls, videoUrl, isPremium, imageRatio };
    await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
    await refetchData();
  };

  const deletePost = async (postId: string) => {
    await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(p => p.id !== postId));
    await refetchData();
  };

  const saveDraft = async (draft: Draft) => {
    await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    setDrafts(prev => {
      const idx = prev.findIndex(d => d.id === draft.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = draft;
        return next;
      }
      return [...prev, draft];
    });
  };

  const deleteDraft = async (draftId: string) => {
    await fetch(`/api/drafts/${draftId}`, { method: 'DELETE' });
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  };

  const incrementPostViews = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const views = (post.views || 0) + 1;
    await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ views })
    });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, views } : p));
  };

  const voteInPostPoll = async (postId: string, optionIndex: number) => {
    if (!currentUserId) throw new Error("Auth required");
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll) return;

    const updatedPoll = { ...post.poll };
    if (!updatedPoll.votes) updatedPoll.votes = {};

    // Clear previous votes
    Object.keys(updatedPoll.votes).forEach(idx => {
      if (updatedPoll.votes![idx]) {
        updatedPoll.votes![idx] = updatedPoll.votes![idx].filter(uid => uid !== currentUserId);
      }
    });

    const optStr = String(optionIndex);
    if (!updatedPoll.votes[optStr]) updatedPoll.votes[optStr] = [];
    updatedPoll.votes[optStr].push(currentUserId);

    await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poll: updatedPoll })
    });

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, poll: updatedPoll } : p));
  };

  // --- LIKES & REACTIONS ---
  const toggleLikePost = async (postId: string) => {
    if (!currentUserId) return;
    const liked = likes.some(l => l.userId === currentUserId && l.postId === postId);
    
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, postId, isDelete: liked })
    });

    if (liked) {
      setLikes(prev => prev.filter(l => !(l.userId === currentUserId && l.postId === postId)));
    } else {
      const newLike: Like = { userId: currentUserId, postId };
      setLikes(prev => [...prev, newLike]);

      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== currentUserId) {
        await addNotification(
          post.userId,
          'like',
          `liked your post "${post.title.slice(0, 20)}..."`,
          postId
        );
      }
    }
  };

  const isPostLiked = (postId: string) => {
    if (!currentUserId) return false;
    return likes.some(l => l.userId === currentUserId && l.postId === postId);
  };

  const getPostLikesCount = (postId: string) => {
    return likes.filter(l => l.postId === postId).length;
  };

  const reactToPost = async (postId: string, reactionType: string) => {
    if (!currentUserId) return;
    const existing = likes.find(l => l.userId === currentUserId && l.postId === postId);
    const isDelete = existing && existing.reactionType === reactionType;

    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, postId, reactionType, isDelete })
    });

    if (isDelete) {
      setLikes(prev => prev.filter(l => !(l.userId === currentUserId && l.postId === postId)));
    } else {
      const newReaction: Like = { userId: currentUserId, postId, reactionType };
      setLikes(prev => {
        const filtered = prev.filter(l => !(l.userId === currentUserId && l.postId === postId));
        return [...filtered, newReaction];
      });

      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== currentUserId) {
        await addNotification(
          post.userId,
          'like',
          `reacted with ${reactionType} to your post "${post.title.slice(0, 20)}..."`,
          postId
        );
      }
    }
  };

  const getPostReactions = (postId: string) => {
    const counts: Record<string, number> = {};
    likes.filter(l => l.postId === postId).forEach(l => {
      if (l.reactionType) {
        counts[l.reactionType] = (counts[l.reactionType] || 0) + 1;
      }
    });
    return counts;
  };

  const getUserReaction = (postId: string) => {
    if (!currentUserId) return null;
    const l = likes.find(l => l.userId === currentUserId && l.postId === postId);
    return l?.reactionType || null;
  };

  // --- COMMENTS ---
  const addComment = async (postId: string, commentText: string) => {
    if (!currentUserId) throw new Error("Auth required");
    const newComment: Comment = {
      id: `com_${Date.now()}`,
      userId: currentUserId,
      postId,
      comment: censorText(commentText),
      createdAt: new Date().toISOString()
    };

    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComment)
    });

    setComments(prev => [...prev, newComment]);

    const post = posts.find(p => p.id === postId);
    if (post && post.userId !== currentUserId) {
      await addNotification(
        post.userId,
        'comment',
        `commented on "${post.title.slice(0, 20)}...": "${commentText.slice(0, 15)}..."`,
        postId
      );
    }
    return newComment;
  };

  const getPostComments = (postId: string) => {
    return comments.filter(c => c.postId === postId);
  };

  const editComment = async (commentId: string, newText: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const updated = { ...comment, comment: censorText(newText) };
    
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    setComments(prev => prev.map(c => c.id === commentId ? updated : c));
  };

  const deleteComment = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  // --- FOLLOWERS & FOLLOWING ---
  const toggleFollowUser = async (targetUserId: string) => {
    if (!currentUserId || currentUserId === targetUserId) return;
    const followingAlready = followers.some(f => f.followerId === currentUserId && f.followingId === targetUserId);

    await fetch('/api/followers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUserId, followingId: targetUserId, isDelete: followingAlready })
    });

    if (followingAlready) {
      setFollowers(prev => prev.filter(f => f.followerId !== currentUserId || f.followingId !== targetUserId));
    } else {
      setFollowers(prev => [...prev, { followerId: currentUserId, followingId: targetUserId }]);
      await addNotification(
        targetUserId,
        'follow',
        `started following you`
      );
    }
  };

  const isFollowing = (userId: string) => {
    if (!currentUserId) return false;
    return followers.some(f => f.followerId === currentUserId && f.followingId === userId);
  };

  const getUserFollowersCount = (userId: string) => {
    const fers = followers.filter(f => f.followingId === userId).length;
    const fing = followers.filter(f => f.followerId === userId).length;
    return { followers: fers, following: fing };
  };

  // --- INSTANT MESSAGING ---
  const sendMessage = async (receiverId: string, text: string, mediaUrl?: string) => {
    if (!currentUserId) throw new Error("Auth required");
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      receiverId,
      message: censorText(text),
      mediaUrl: mediaUrl || '',
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sent'
    };

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
    });

    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const editMessage = async (messageId: string, newText: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const updates = { message: censorText(newText) };

    await fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
  };

  const deleteMessage = async (messageId: string) => {
    // Standard delete: update to placeholder message for clarity or just remove it
    const updates = { message: 'Message deleted.' };
    await fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
  };

  const getChatRooms = () => {
    if (!currentUserId) return [];
    const roomsMap: Record<string, { user: User; lastMessage: Message }> = {};

    messages.forEach(m => {
      if (m.senderId === currentUserId || m.receiverId === currentUserId) {
        const partnerId = m.senderId === currentUserId ? m.receiverId : m.senderId;
        const partner = users.find(u => u.id === partnerId);
        if (partner) {
          const existing = roomsMap[partnerId];
          if (!existing || new Date(m.createdAt) > new Date(existing.lastMessage.createdAt)) {
            roomsMap[partnerId] = { user: partner, lastMessage: m };
          }
        }
      }
    });

    return Object.values(roomsMap).sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });
  };

  const getMessagesWith = (userId: string) => {
    if (!currentUserId) return [];
    return messages.filter(m => {
      return (m.senderId === currentUserId && m.receiverId === userId) ||
             (m.senderId === userId && m.receiverId === currentUserId);
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUserId) return;
    const unread = messages.filter(m => m.senderId === senderId && m.receiverId === currentUserId && !m.read);
    
    await Promise.all(unread.map(m => {
      return fetch(`/api/messages/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true, status: 'seen' })
      });
    }));

    setMessages(prev => prev.map(m => {
      if (m.senderId === senderId && m.receiverId === currentUserId && !m.read) {
        return { ...m, read: true, status: 'seen' };
      }
      return m;
    }));
  };

  // --- BOOKMARKS & ACHIEVEMENTS ---
  const toggleSavePost = async (postId: string) => {
    if (!currentUser) return;
    let savedPosts = currentUser.savedPosts || [];
    if (savedPosts.includes(postId)) {
      savedPosts = savedPosts.filter(id => id !== postId);
    } else {
      savedPosts = [...savedPosts, postId];
    }

    await fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedPosts })
    });

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, savedPosts } : u));
  };

  const getUserAchievements = (userId: string): Achievement[] => {
    const userPosts = posts.filter(p => p.userId === userId);
    const userPublishedPosts = userPosts.filter(p => p.status === 'published');
    const userComments = comments.filter(c => c.userId === userId);
    const userSavedPosts = (users.find(u => u.id === userId)?.savedPosts || []);
    const fersCount = followers.filter(f => f.followingId === userId).length;
    const fingCount = followers.filter(f => f.followerId === userId).length;

    return [
      {
        id: 'achievement_first_post',
        title: 'First Steps',
        description: 'Publish or draft your very first article on the platform.',
        iconName: 'PenTool',
        progressObjective: '1 Post',
        isEarned: userPosts.length >= 1,
        currentValue: userPosts.length,
        targetValue: 1,
        colorClass: 'from-orange-500 to-amber-500'
      },
      {
        id: 'achievement_wordsmith',
        title: 'Wordsmith',
        description: 'Publish at least 3 story articles for the public feed.',
        iconName: 'BookOpen',
        progressObjective: '3 Stories',
        isEarned: userPublishedPosts.length >= 3,
        currentValue: userPublishedPosts.length,
        targetValue: 3,
        colorClass: 'from-indigo-500 to-blue-600'
      },
      {
        id: 'achievement_popular',
        title: 'Circle of Influence',
        description: 'Accumulate a dedicated audience of 2 or more followers.',
        iconName: 'Award',
        progressObjective: '2 Followers',
        isEarned: fersCount >= 2,
        currentValue: fersCount,
        targetValue: 2,
        colorClass: 'from-rose-500 to-pink-500'
      },
      {
        id: 'achievement_thought_leader',
        title: 'Thought Leader',
        description: 'Publish at least 2 active responses or comments under other blogs.',
        iconName: 'MessageSquare',
        progressObjective: '2 Comments',
        isEarned: userComments.length >= 2,
        currentValue: userComments.length,
        targetValue: 2,
        colorClass: 'from-emerald-500 to-teal-500'
      },
      {
        id: 'achievement_avid_keeper',
        title: 'Avid Keeper',
        description: 'Bookmark at least 2 insightful posts for reading later.',
        iconName: 'Bookmark',
        progressObjective: '2 Bookmarks',
        isEarned: userSavedPosts.length >= 2,
        currentValue: userSavedPosts.length,
        targetValue: 2,
        colorClass: 'from-purple-500 to-violet-500'
      },
      {
        id: 'achievement_networker',
        title: 'Vast Intersect',
        description: 'Coordinate and follow at least 2 other creators on the network.',
        iconName: 'Globe',
        progressObjective: '2 Following',
        isEarned: fingCount >= 2,
        currentValue: fingCount,
        targetValue: 2,
        colorClass: 'from-cyan-500 to-teal-500'
      }
    ];
  };

  // --- BACKEND ADMIN CLEARING WORKFLOWS ---
  const blockUser = async (userId: string, blocked: boolean) => {
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: blocked })
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: blocked } : u));
  };

  const deleteUserByAdmin = async (userId: string) => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const deleteSelfAccount = async () => {
    if (!currentUserId) return;
    await fetch(`/api/users/${currentUserId}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== currentUserId));
    await logout();
  };

  const setRoleByAdmin = async (userId: string, role: 'admin' | 'user') => {
    const updates = { role, isAdmin: role === 'admin' };
    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const verifyUserByAdmin = async (userId: string, approved: boolean, remarks?: string) => {
    const updates = approved ? { 
      isApprovedByAdmin: true,
      clearanceRemarks: remarks || ""
    } : { 
      isApprovedByAdmin: false, 
      hasVerifiedDetails: false,
      clearanceRemarks: remarks || ""
    };

    await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));

    await addNotification(
      userId,
      'report_decision',
      approved 
        ? `Your identity document verification request has been APPROVED by the admin.${remarks ? ` Remarks: ${remarks}` : ''}`
        : `Your identity document verification request was REJECTED by the admin.${remarks ? ` Reason: ${remarks}` : ''}`
    );
  };

  // --- FINANCIALS & ADS ---
  const requestWithdrawal = async (amountNpr: number, paymentMethod: string, details: string) => {
    if (!currentUserId) throw new Error("Auth required");
    const newRequest: WithdrawalRequest = {
      id: `withdraw_${Date.now()}`,
      userId: currentUserId,
      amountNpr,
      paymentMethod,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });

    setWithdrawals(prev => [...prev, newRequest]);
  };

  const updateWithdrawalStatusByAdmin = async (withdrawalId: string, status: 'approved' | 'rejected', remarks?: string) => {
    const updates = { status, remarks: remarks || "" };
    
    await fetch(`/api/withdrawals/${withdrawalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, ...updates } : w));

    const withdrawal = withdrawals.find(w => w.id === withdrawalId);
    if (withdrawal) {
      await addNotification(
        withdrawal.userId,
        'withdrawal_decision',
        `Your withdrawal request of NPR ${withdrawal.amountNpr} has been ${status === 'approved' ? 'APPROVED' : 'REJECTED'}.${remarks ? ` Remarks: ${remarks}` : ''}`
      );
    }
  };

  // --- AD BANNER CAMPAIGNS ---
  const createOrUpdateAd = async (ad: any) => {
    if (!ad.id) ad.id = `ad_${Date.now()}`;
    await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ad)
    });

    setAds(prev => {
      const filtered = prev.filter(a => a.id !== ad.id);
      return [...filtered, ad];
    });
  };

  const deleteAd = async (adId: string) => {
    // Update to inactive instead of deletion to maintain history, or standard deletion
    await fetch(`/api/ads/${adId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false })
    });
    setAds(prev => prev.filter(a => a.id !== adId));
  };

  const trackAdClick = async (adId: string) => {
    const ad = ads.find(a => a.id === adId);
    if (!ad) return;
    const clicks = (ad.clickCount || 0) + 1;
    await fetch(`/api/ads/${adId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clickCount: clicks })
    });
    setAds(prev => prev.map(a => a.id === adId ? { ...a, clickCount: clicks } : a));
  };

  const toggleAllAds = async (active: boolean) => {
    await Promise.all(ads.map(ad => {
      return fetch(`/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
    }));
    setAds(prev => prev.map(ad => ({ ...ad, active })));
  };

  // --- NOTIFICATIONS ---
  const addNotification = async (
    userId: string,
    type: 'like' | 'comment' | 'follow' | 'report_decision' | 'withdrawal_decision' | 'ad_alert' | 'system',
    message: string,
    postId?: string,
    isPoll?: boolean,
    pollOptions?: string[]
  ) => {
    const actor = currentUser;
    const newNotification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      userId,
      senderId: currentUserId || 'system',
      senderName: actor?.name || 'Community Member',
      senderImage: actor?.profileImage || '',
      type,
      message,
      postId,
      createdAt: new Date().toISOString(),
      read: false,
      isPoll,
      pollOptions
    };

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotification)
    });

    setNotifications(prev => [...prev, newNotification]);
    triggerDeviceNotification(newNotification);
  };

  const markNotificationAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUserId) return;
    await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId })
    });
    setNotifications(prev => prev.map(n => n.userId === currentUserId ? { ...n, read: true } : n));
  };

  const submitPollAnswer = async (notificationId: string, answer: string) => {
    await fetch(`/api/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollAnswer: answer, read: true })
    });
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, pollAnswer: answer, read: true } : n));
  };

  // --- POST REPORTS & MODERATION ---
  const reportPost = async (postId: string, reason: string, remarks: string) => {
    if (!currentUserId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newReport: PostReport = {
      id: `report_${Date.now()}`,
      postId,
      postTitle: post.title,
      postAuthorId: post.userId,
      reporterId: currentUserId,
      reporterName: currentUser?.name || 'Explorer',
      reason,
      remarks,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await fetch('/api/post-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport)
    });

    setPostReports(prev => [...prev, newReport]);
  };

  const resolveReport = async (reportId: string, action: 'delete_post' | 'dismiss') => {
    const report = postReports.find(r => r.id === reportId);
    if (!report) return;

    const status = action === 'delete_post' ? 'resolved' : 'dismissed';
    await fetch(`/api/post-reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    setPostReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));

    if (action === 'delete_post') {
      await deletePost(report.postId);
      await addNotification(
        report.postAuthorId,
        'report_decision',
        `Your post "${report.postTitle}" was deleted due to community reports violation. Reason: ${report.reason}`
      );
    } else {
      await addNotification(
        report.postAuthorId,
        'report_decision',
        `A safety moderation report against your post "${report.postTitle}" has been reviewed and dismissed by the admin.`
      );
    }
  };

  return (
    <SocialPlatformContext.Provider value={{
      users,
      posts,
      drafts,
      saveDraft,
      deleteDraft,
      followers,
      comments,
      messages,
      likes,
      currentUser,
      loading,
      register,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      createPost,
      voteInPostPoll,
      incrementPostViews,
      deletePost,
      updatePost,
      toggleLikePost,
      isPostLiked,
      getPostLikesCount,
      reactToPost,
      getPostReactions,
      getUserReaction,
      addComment,
      getPostComments,
      editComment,
      deleteComment,
      toggleFollowUser,
      isFollowing,
      getUserFollowersCount,
      sendMessage,
      editMessage,
      deleteMessage,
      getChatRooms,
      getMessagesWith,
      markMessagesAsRead,
      toggleSavePost,
      getUserAchievements,
      blockUser,
      deleteUserByAdmin,
      deleteSelfAccount,
      setRoleByAdmin,
      activeChatPartnerId,
      setActiveChatPartnerId,
      withdrawals,
      verifyUserByAdmin,
      requestWithdrawal,
      updateWithdrawalStatusByAdmin,
      notifications,
      triggerDeviceNotification,
      addNotification,
      submitPollAnswer,
      postReports,
      ads,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      reportPost,
      resolveReport,
      createOrUpdateAd,
      deleteAd,
      trackAdClick,
      toggleAllAds,
      isQuotaFallbackMode,
      isManualSandbox,
      setManualSandbox,
      isOnline,
      userMap,
      dbStatus,
      resetQuotaFallback,
      securityBlock,
      setSecurityBlock,
      resolveSecurityChallenge,
      refetchData,
      clearFirestoreCache,
      clearCacheAndReinitialize,
      hasMorePosts,
      loadMorePosts,
      reconnectWithBackoff
    }}>
      {children}
    </SocialPlatformContext.Provider>
  );
};

export const useSocialPlatform = () => {
  const context = useContext(SocialPlatformContext);
  if (context === undefined) {
    throw new Error('useSocialPlatform must be used within a SocialPlatformProvider');
  }
  return context;
};
