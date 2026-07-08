/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { User, Post, PostPoll, Like, Comment, Follower, Message, Achievement, WithdrawalRequest, Notification, PostReport, AdBanner } from '../types';
import { SEED_USERS, SEED_POSTS, SEED_FOLLOWERS, SEED_COMMENTS, SEED_MESSAGES } from '../data/seedData';
import { censorText } from '../lib/security';
import { checkRateLimit, resetRateLimit } from '../lib/rateLimiter';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { getCache, setCache, addPendingInteraction, getPendingInteractions, clearPendingInteractions } from '../lib/dbCache';

interface SocialPlatformContextType {
  users: User[];
  posts: Post[];
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
  isOnline: boolean;
  userMap: Record<string, User>;
  resetQuotaFallback: () => void;
  securityBlock: { actionType: string; remainingMs: number } | null;
  setSecurityBlock: (block: { actionType: string; remainingMs: number } | null) => void;
  resolveSecurityChallenge: () => void;
  refetchData: (hasCache?: boolean) => Promise<void>;
  hasMorePosts: boolean;
  loadMorePosts: () => Promise<void>;
}

const DEFAULT_SEED_AD: AdBanner = {
  id: 'ad_default_nepal_tourism',
  name: 'Explore the Majesty of Nepal Mountains & Homestays',
  purpose: 'Tourism & Travel',
  contact: '+977-1-4200000',
  content: 'Discover organic tea trails, spectacular Everest panorama homestays, and get 20% off with partner local communities today!',
  location: 'Nepal',
  email: 'info@visitnepal.com',
  title: 'Explore the Majesty of Nepal Mountains & Homestays',
  description: 'Discover organic tea trails, spectacular Everest panorama homestays, and get 20% off with partner local communities today!',
  imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80',
  targetUrl: 'https://www.visitnepaltours.com',
  active: true,
  placement: 'workspace',
  status: 'published',
  paymentStatus: 'verified',
  amountPaid: 1000,
  clickCount: 142,
  createdAt: '2026-07-07T00:00:00.000Z',
  userId: 'seed_admin_user_id'
};

const SocialPlatformContext = createContext<SocialPlatformContextType | undefined>(undefined);

export const SocialPlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window !== 'undefined') {
      const cachedUserStr = localStorage.getItem('freshlink_cached_user');
      if (cachedUserStr) {
        try {
          const parsed = JSON.parse(cachedUserStr);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            return [parsed];
          }
        } catch (e) {}
      }
    }
    return [];
  });
  const [posts, setPosts] = useState<Post[]>([]);
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
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cachedUserId = localStorage.getItem('freshlink_current_user_id');
      const cachedUserStr = localStorage.getItem('freshlink_cached_user');
      return !(cachedUserId && cachedUserStr);
    }
    return true;
  });
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const activeChatPartnerRef = useRef<string | null>(null);

  const [isQuotaFallbackMode, setIsQuotaFallbackMode] = useState<boolean>(() => {
    return localStorage.getItem('freshlink_quota_fallback') === 'true';
  });
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [securityBlock, setSecurityBlock] = useState<{ actionType: string; remainingMs: number } | null>(null);
  const [postLimit, setPostLimit] = useState<number>(20);
  const [hasMorePosts, setHasMorePosts] = useState<boolean>(true);

  const userMap = useMemo(() => {
    const map: Record<string, User> = {};
    users.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  const resolveSecurityChallenge = () => {
    if (securityBlock) {
      resetRateLimit(currentUserId || 'anonymous', securityBlock.actionType);
      setSecurityBlock(null);
    }
  };

  // Helper is triggered to activate offline fallback mode when Firestore is exhausted
  const triggerLocalQuotaFallback = () => {
    localStorage.setItem('freshlink_quota_fallback', 'true');
    setIsQuotaFallbackMode(true);
    console.warn("Firebase Quota Limit reached! Fallback to Offline/Maintenance Mode activated.");
  };

  const resetQuotaFallback = () => {
    localStorage.removeItem('freshlink_quota_fallback');
    setIsQuotaFallbackMode(false);
    window.location.reload();
  };

  const saveLocalValue = <T,>(key: string, list: T[]) => {
    localStorage.setItem(`freshlink_loc_${key}`, JSON.stringify(list));
  };

  const runWriteOperation = async (
    firestoreCallback: () => Promise<void>,
    localFallbackCallback: () => void,
    pathInfo: string
  ) => {
    // Client-side Anti-Spam / Anti-DDoS rate limiter layer
    const actionType = pathInfo.split('/')[0] || 'write';
    const limitCheck = checkRateLimit(currentUserId || 'anonymous', actionType);
    if (!limitCheck.allowed) {
      setSecurityBlock({ actionType, remainingMs: limitCheck.blockedRemainingMs });
      console.warn(`Spam Defense System blocked write to ${pathInfo} (cooling down)`);
      return; // Stop execution of the write to protect server resources
    }

    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      localFallbackCallback();
      return;
    }
    try {
      await firestoreCallback();
      localFallbackCallback(); // Always update local React state on successful write to avoid needing real-time sync listeners
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
        triggerLocalQuotaFallback();
        localFallbackCallback();
      } else if (errMsg.includes('offline') || errMsg.includes('network') || errMsg.includes('failed to fetch') || errMsg.includes('Failed to get document')) {
        console.log("[PWA Offline] Connection unavailable. Saving write locally.");
        localFallbackCallback();
      } else {
        throw err;
      }
    }
  };

  // Automatic side-effect listeners to guarantee absolute state data integrity for offline sandbox testing
  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('users', users);
      setCache('users', users).catch(e => console.warn(e));
    }
  }, [users, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('posts', posts);
      setCache('posts', posts).catch(e => console.warn(e));
    }
  }, [posts, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('followers', followers);
      setCache('followers', followers).catch(e => console.warn(e));
    }
  }, [followers, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('comments', comments);
      setCache('comments', comments).catch(e => console.warn(e));
    }
  }, [comments, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('messages', messages);
      setCache('messages', messages).catch(e => console.warn(e));
    }
  }, [messages, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('likes', likes);
      setCache('likes', likes).catch(e => console.warn(e));
    }
  }, [likes, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('withdrawals', withdrawals);
      setCache('withdrawals', withdrawals).catch(e => console.warn(e));
    }
  }, [withdrawals, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('notifications', notifications);
      setCache('notifications', notifications).catch(e => console.warn(e));
    }
  }, [notifications, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('postReports', postReports);
      setCache('postReports', postReports).catch(e => console.warn(e));
    }
  }, [postReports, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      saveLocalValue('ads', ads);
      setCache('ads', ads).catch(e => console.warn(e));
    }
  }, [ads, isQuotaFallbackMode, isOnline]);

  useEffect(() => {
    activeChatPartnerRef.current = activeChatPartnerId;
  }, [activeChatPartnerId]);

  const syncPendingInteractions = async () => {
    if (!navigator.onLine || !currentUserId) return;
    try {
      const pending = await getPendingInteractions();
      if (pending.length === 0) return;

      console.log(`[PWA Sync] Syncing ${pending.length} pending interactions...`);
      const successfullySyncedIds: string[] = [];

      for (const item of pending) {
        try {
          if (item.type === 'like') {
            const { isLikedAlready, likeId } = item.payload;
            if (isLikedAlready) {
              await deleteDoc(doc(db, 'likes', likeId));
            } else {
              await setDoc(doc(db, 'likes', likeId), {
                userId: item.userId,
                postId: item.postId
              });
              // Notify post owner
              const post = posts.find(p => p.id === item.postId);
              if (post && post.userId !== item.userId) {
                await addNotification(
                  post.userId,
                  'like',
                  `liked your post "${post.title}"`,
                  item.postId
                );
              }
            }
          } else if (item.type === 'comment') {
            const { id, comment, createdAt } = item.payload;
            const commentObj: Comment = {
              id,
              userId: item.userId,
              postId: item.postId,
              comment,
              createdAt
            };
            await setDoc(doc(db, 'comments', id), commentObj);

            // Notify post owner
            const post = posts.find(p => p.id === item.postId);
            if (post && post.userId !== item.userId) {
              await addNotification(
                post.userId,
                'comment',
                `commented on your post "${post.title}": "${comment.slice(0, 30)}${comment.length > 30 ? '...' : ''}"`,
                item.postId
              );
            }
          } else if (item.type === 'post') {
            const postObj = item.payload;
            await setDoc(doc(db, 'posts', postObj.id), postObj);
            console.log(`[PWA Sync] Post ${postObj.id} successfully synced.`);
          } else if (item.type === 'chat') {
            const msgObj = item.payload;
            await setDoc(doc(db, 'messages', msgObj.id), msgObj);
            console.log(`[PWA Sync] Message ${msgObj.id} successfully synced.`);
            try {
              await addNotification(
                msgObj.receiverId,
                'system',
                `sent you a chat message: "${msgObj.message.slice(0, 35)}${msgObj.message.length > 35 ? '...' : ''}"`
              );
            } catch (notifErr) {
              console.warn("Failed to create message sync notification:", notifErr);
            }
          }
          successfullySyncedIds.push(item.id);
        } catch (itemErr) {
          console.error(`[PWA Sync] Failed to sync item ${item.id}:`, itemErr);
        }
      }

      if (successfullySyncedIds.length > 0) {
        await clearPendingInteractions(successfullySyncedIds);
        console.log(`[PWA Sync] Successfully synced ${successfullySyncedIds.length} interactions.`);
        await refetchData();
      }
    } catch (err) {
      console.warn("[PWA Sync] Error in syncPendingInteractions:", err);
    }
  };

  // Synchronize pending offline actions when connection comes back online
  useEffect(() => {
    const handleOnline = () => {
      console.log("[Network] Connection restored, triggering sync...");
      syncPendingInteractions();
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_PENDING_INTERACTIONS') {
        console.log("[Service Worker] Sync request received...");
        syncPendingInteractions();
      }
    };

    window.addEventListener('online', handleOnline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Try to sync on mount if online
    if (navigator.onLine) {
      syncPendingInteractions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [currentUserId, posts]);

  // 1. Initial Authentication & User Profile Sync
  useEffect(() => {
    let authUnsub = () => {};

    const syncAuthAndUser = async () => {
      authUnsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          try {
            // Authenticate anonymously only if no session (Google or Anonymous) is active
            await signInAnonymously(auth);
          } catch (err) {
            console.warn("Silent anonymous authentication skipped (use Google Sign-In or sandbox accounts):", err);
          }
          return;
        }

        if (user) {
          setCurrentUserId(user.uid);
          localStorage.setItem('freshlink_current_user_id', user.uid);

          // Guarantee user document exists in Firestore
          try {
            if (isQuotaFallbackMode) {
              const cachedUsersStr = localStorage.getItem('freshlink_loc_users');
              let cachedUsers: User[] = [];
              if (cachedUsersStr) {
                try { cachedUsers = JSON.parse(cachedUsersStr); } catch(e) {}
              }
              if (cachedUsers.length === 0) {
                cachedUsers = [...SEED_USERS];
              }
              const isRootAdmin = user.email?.toLowerCase() === 'fresh.linksd@gmail.com';
              let existingLocal = cachedUsers.find(u => u.id === user.uid);
              if (!existingLocal) {
                existingLocal = {
                  id: user.uid,
                  name: isRootAdmin ? 'Super Admin' : (user.displayName || `Writer ${user.uid.slice(0, 5)}`),
                  email: isRootAdmin ? 'fresh.linksd@gmail.com' : (user.email || `${user.uid}@freshlinkconnect.info`),
                  bio: isRootAdmin ? 'Root Developer & Primary System clearing administrator.' : 'A creator exploring the FreshLink connection platform.',
                  profileImage: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
                  coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
                  location: isRootAdmin ? 'HQ' : 'Earth',
                  interests: isRootAdmin ? ['technology', 'business'] : ['technology'],
                  socialLinks: {},
                  savedPosts: [],
                  createdAt: new Date().toISOString(),
                  hasSetupAccount: isRootAdmin,
                  isBlocked: false,
                  role: isRootAdmin ? 'super_admin' : 'user',
                  isAdmin: isRootAdmin,
                  walletBalance: isRootAdmin ? 1000.00 : 25.00,
                  walletCredits: isRootAdmin ? 99999 : 500,
                  isMonetizationEnabled: isRootAdmin,
                  monthlySubscriptionPrice: isRootAdmin ? 0.00 : 4.99,
                  subscribedCreators: []
                };
                cachedUsers.push(existingLocal);
                localStorage.setItem('freshlink_loc_users', JSON.stringify(cachedUsers));
              }
              setUsers(cachedUsers);
              return;
            }

            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            const isRootAdmin = user.email?.toLowerCase() === 'fresh.linksd@gmail.com';
 
            if (!userSnap.exists()) {
              // Create default profile for this Firebase Auth session
              const defaultUser: User = {
                id: user.uid,
                name: isRootAdmin ? 'Super Admin' : (user.displayName || `Writer ${user.uid.slice(0, 5)}`),
                email: isRootAdmin ? 'fresh.linksd@gmail.com' : (user.email || `${user.uid}@freshlinkconnect.info`),
                bio: isRootAdmin ? 'Root Developer & Primary System clearing administrator.' : 'A creator exploring the FreshLink connection platform.',
                profileImage: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
                coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
                location: isRootAdmin ? 'HQ' : 'Earth',
                interests: isRootAdmin ? ['technology', 'business'] : ['technology'],
                socialLinks: {},
                savedPosts: [],
                createdAt: new Date().toISOString(),
                hasSetupAccount: isRootAdmin,
                isBlocked: false,
                role: isRootAdmin ? 'super_admin' : 'user',
                isAdmin: isRootAdmin,
                walletBalance: isRootAdmin ? 1000.00 : 25.00,
                walletCredits: isRootAdmin ? 99999 : 500,
                isMonetizationEnabled: isRootAdmin,
                monthlySubscriptionPrice: isRootAdmin ? 0.00 : 4.99,
                subscribedCreators: []
              };
              await setDoc(userDocRef, defaultUser);
            } else {
              // Document exists! If they are the root admin, force email, role & isAdmin to be correct
              if (isRootAdmin) {
                const currentData = userSnap.data();
                if (currentData.email?.toLowerCase() !== 'fresh.linksd@gmail.com' || currentData.role !== 'super_admin' || !currentData.isAdmin) {
                  await updateDoc(userDocRef, {
                    name: currentData.name || 'Super Admin',
                    email: 'fresh.linksd@gmail.com',
                    role: 'super_admin',
                    isAdmin: true,
                    hasSetupAccount: true,
                    isBlocked: false
                  });
                }
              }
            }
          } catch (err: any) {
            console.error("Failed to guarantee user profile document in Firestore, falling back to local database:", err);
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
              triggerLocalQuotaFallback();
              
              const cachedUsersStr = localStorage.getItem('freshlink_loc_users');
              let cachedUsers: User[] = [];
              if (cachedUsersStr) {
                try { cachedUsers = JSON.parse(cachedUsersStr); } catch(e) {}
              }
              if (cachedUsers.length === 0) {
                cachedUsers = [...SEED_USERS];
              }
              const isRootAdmin = user.email?.toLowerCase() === 'fresh.linksd@gmail.com';
              let existingLocal = cachedUsers.find(u => u.id === user.uid);
              if (!existingLocal) {
                existingLocal = {
                  id: user.uid,
                  name: isRootAdmin ? 'Super Admin' : (user.displayName || `Writer ${user.uid.slice(0, 5)}`),
                  email: isRootAdmin ? 'fresh.linksd@gmail.com' : (user.email || `${user.uid}@freshlinkconnect.info`),
                  bio: isRootAdmin ? 'Root Developer & Primary System clearing administrator.' : 'A creator exploring the FreshLink connection platform.',
                  profileImage: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
                  coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
                  location: isRootAdmin ? 'HQ' : 'Earth',
                  interests: isRootAdmin ? ['technology', 'business'] : ['technology'],
                  socialLinks: {},
                  savedPosts: [],
                  createdAt: new Date().toISOString(),
                  hasSetupAccount: isRootAdmin,
                  isBlocked: false,
                  role: isRootAdmin ? 'super_admin' : 'user',
                  isAdmin: isRootAdmin,
                  walletBalance: isRootAdmin ? 1000.00 : 25.00,
                  walletCredits: isRootAdmin ? 99999 : 500,
                  isMonetizationEnabled: isRootAdmin,
                  monthlySubscriptionPrice: isRootAdmin ? 0.00 : 4.99,
                  subscribedCreators: []
                };
                cachedUsers.push(existingLocal);
                localStorage.setItem('freshlink_loc_users', JSON.stringify(cachedUsers));
              }
              setUsers(cachedUsers);
            }
          }
        } else {
          setCurrentUserId(null);
        }
      });
    };

    syncAuthAndUser();

    return () => authUnsub();
  }, []);

  // Real-time listener for ads
  useEffect(() => {
    if (isQuotaFallbackMode) return;
    const adsQuery = collection(db, 'ads');
    const unsubAds = onSnapshot(adsQuery, (snap) => {
      const updatedAds: AdBanner[] = [];
      snap.forEach((doc) => updatedAds.push(doc.data() as AdBanner));
      if (updatedAds.length === 0) {
        updatedAds.push(DEFAULT_SEED_AD);
      }
      setAds(updatedAds);
    }, (error) => {
      handleSubError(error, 'ads');
    });

    return () => unsubAds();
  }, [isQuotaFallbackMode]);

  // 2. High-Performance One-Time Initial Data Load & Caching
  const handleSubError = (error: any, collectionName: string) => {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
      triggerLocalQuotaFallback();
    } else {
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  };

  const refetchData = async (hasCache = false) => {
    if (isQuotaFallbackMode || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setLoading(false);
      return;
    }
    try {
      if (!hasCache) {
        setLoading(true);
      }
      // Execute single-round concurrent reads instead of maintaining heavy, permanent wide-collection listeners
      const [usersSnap, postsSnap, likesSnap, commentsSnap, followersSnap, adsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(postLimit))),
        getDocs(collection(db, 'likes')),
        getDocs(collection(db, 'comments')),
        getDocs(collection(db, 'followers')),
        getDocs(collection(db, 'ads'))
      ]);

      const usersList: User[] = [];
      usersSnap.forEach((d) => usersList.push(d.data() as User));
      setUsers(usersList);

      const postsList: Post[] = [];
      postsSnap.forEach((d) => postsList.push(d.data() as Post));
      setPosts(postsList);
      setHasMorePosts(postsSnap.docs.length >= postLimit);

      const likesList: Like[] = [];
      likesSnap.forEach((d) => likesList.push(d.data() as Like));
      setLikes(likesList);

      const commentsList: Comment[] = [];
      commentsSnap.forEach((d) => commentsList.push(d.data() as Comment));
      setComments(commentsList);

      const followersList: Follower[] = [];
      followersSnap.forEach((d) => followersList.push(d.data() as Follower));
      setFollowers(followersList);

      const adsList: AdBanner[] = [];
      adsSnap.forEach((d) => adsList.push(d.data() as AdBanner));
      
      if (adsList.length === 0) {
        adsList.push(DEFAULT_SEED_AD);
      }
      setAds(adsList);

      // Save fresh lists to IndexedDB for offline access
      try {
        await setCache('users', usersList);
        await setCache('posts', postsList);
        await setCache('likes', likesList);
        await setCache('comments', commentsList);
        await setCache('followers', followersList);
        await setCache('ads', adsList);
      } catch (cacheErr) {
        console.warn("Failed to update IndexedDB cache:", cacheErr);
      }

      // Fetch postReports separately and handle permissions gracefully (since only admins can read them)
      try {
        const reportsSnap = await getDocs(collection(db, 'postReports'));
        const reportsList: PostReport[] = [];
        reportsSnap.forEach((d) => reportsList.push(d.data() as PostReport));
        setPostReports(reportsList);
      } catch (reportErr: any) {
        console.log("Post reports skipped or permission denied (expected for non-admins):", reportErr.message || reportErr);
        setPostReports([]);
      }

    } catch (err: any) {
      console.error("An error occurred during Firestore load:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
        triggerLocalQuotaFallback();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCacheAndFetch = async () => {
      // 1. Load cached state from IndexedDB instantly to enable offline / zero latency startup
      let hasCache = false;
      try {
        let cachedUsers = await getCache('users');
        let cachedPosts = await getCache('posts');
        let cachedComments = await getCache('comments');
        let cachedLikes = await getCache('likes');
        let cachedFollowers = await getCache('followers');
        let cachedAds = await getCache('ads');

        // Check localStorage backups as a high-reliability fallback
        if (!cachedUsers || cachedUsers.length === 0) {
          const backup = localStorage.getItem('freshlink_loc_users');
          if (backup) {
            try { cachedUsers = JSON.parse(backup); } catch (e) {}
          }
        }
        if (!cachedPosts || cachedPosts.length === 0) {
          const backup = localStorage.getItem('freshlink_loc_posts');
          if (backup) {
            try { cachedPosts = JSON.parse(backup); } catch (e) {}
          }
        }
        if (!cachedComments || cachedComments.length === 0) {
          const backup = localStorage.getItem('freshlink_loc_comments');
          if (backup) {
            try { cachedComments = JSON.parse(backup); } catch (e) {}
          }
        }
        if (!cachedLikes || cachedLikes.length === 0) {
          const backup = localStorage.getItem('freshlink_loc_likes');
          if (backup) {
            try { cachedLikes = JSON.parse(backup); } catch (e) {}
          }
        }
        if (!cachedFollowers || cachedFollowers.length === 0) {
          const backup = localStorage.getItem('freshlink_loc_followers');
          if (backup) {
            try { cachedFollowers = JSON.parse(backup); } catch (e) {}
          }
        }
        if (!cachedAds || cachedAds.length === 0) {
          const backup = localStorage.getItem('freshlink_loc_ads');
          if (backup) {
            try { cachedAds = JSON.parse(backup); } catch (e) {}
          }
        }

        if (cachedUsers && cachedUsers.length > 0) {
          setUsers(cachedUsers);
          hasCache = true;
        }
        if (cachedPosts && cachedPosts.length > 0) {
          setPosts(cachedPosts);
          hasCache = true;
        }
        if (cachedComments) setComments(cachedComments);
        if (cachedLikes) setLikes(cachedLikes);
        if (cachedFollowers) setFollowers(cachedFollowers);
        if (cachedAds) {
          setAds(cachedAds.length === 0 ? [DEFAULT_SEED_AD] : cachedAds);
        }
      } catch (e) {
        console.warn("Failed to read IndexedDB startup cache:", e);
      }

      if (hasCache) {
        setLoading(false);
      }

      // 2. Fetch fresh network updates
      await refetchData(hasCache);
    };

    loadCacheAndFetch();
  }, [currentUserId, isQuotaFallbackMode, postLimit]);

  // Periodic automatic background revalidation every 60 seconds
  useEffect(() => {
    if (isQuotaFallbackMode) return;
    const interval = setInterval(() => {
      if (navigator.onLine) {
        refetchData(true).catch(err => console.warn("Background revalidation failed:", err));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isQuotaFallbackMode]);

  // Request browser notification permissions on login/mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }
  }, [currentUserId]);

  const triggerDeviceNotification = (notif: Notification) => {
    console.log("[Notification System] triggerDeviceNotification called for:", notif);
    if (typeof window === 'undefined') {
      console.warn("[Notification System] window is undefined - skipping device alert");
      return;
    }
    if (!('Notification' in window)) {
      console.warn("[Notification System] 'Notification' is not supported in this browser");
      return;
    }

    console.log("[Notification System] Current browser Notification permission state:", window.Notification.permission);
    
    // Read and respect target user's notification toggles
    const userToNotify = users.find(u => u.id === notif.userId);
    if (userToNotify && userToNotify.notificationSettings) {
      const settings = userToNotify.notificationSettings;
      console.log("[Notification System] Evaluating target user notification preferences:", settings);
      if (notif.type === 'like' && settings.likes === false) {
        console.log("[Notification System] Blocked: user 'likes' notifications are disabled");
        return;
      }
      if (notif.type === 'comment' && settings.comments === false) {
        console.log("[Notification System] Blocked: user 'comments' notifications are disabled");
        return;
      }
      if (notif.type === 'follow' && settings.follows === false) {
        console.log("[Notification System] Blocked: user 'follows' notifications are disabled");
        return;
      }
      if (notif.type === 'system' && settings.system === false) {
        console.log("[Notification System] Blocked: user 'system' notifications are disabled");
        return;
      }
      if (notif.type === 'ad_alert' && settings.adAlerts === false) {
        console.log("[Notification System] Blocked: user 'ad_alert' notifications are disabled");
        return;
      }
    }

    if (window.Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          console.log("[Notification System] Service Worker controller detected. Using registration to display alert...");
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification("FreshLinkConnect", {
              body: notif.message,
              icon: notif.senderImage || "/favicon.png",
              tag: notif.id,
              badge: "/favicon.png"
            }).then(() => {
              console.log("[Notification System] Service Worker successfully scheduled/rendered notification banner");
            }).catch((swErr) => {
              console.error("[Notification System] SW registration notification failed, falling back to legacy constructor:", swErr);
              new window.Notification("FreshLinkConnect", {
                body: notif.message,
                icon: notif.senderImage || "/favicon.png",
                tag: notif.id,
              });
            });
          });
        } else {
          console.log("[Notification System] Service Worker not active. Spawning direct browser window.Notification...");
          new window.Notification("FreshLinkConnect", {
            body: notif.message,
            icon: notif.senderImage || "/favicon.png",
            tag: notif.id,
          });
          console.log("[Notification System] Direct window.Notification constructor executed successfully");
        }
      } catch (e) {
        console.error("[Notification System] Failed to render native notification banner:", e);
      }
    } else {
      console.warn("[Notification System] Notification permission is not 'granted' (current status: " + window.Notification.permission + "). Banner cannot be rendered directly. Please prompt user to grant permissions.");
    }
  };

  // 2. Real-time collections listener
  useEffect(() => {
    let unsubWithdrawals = () => {};
    if (currentUserId && !isQuotaFallbackMode) {
      unsubWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snap) => {
        const list: WithdrawalRequest[] = [];
        snap.forEach((d) => list.push(d.data() as WithdrawalRequest));
        setWithdrawals(list);
      }, (error) => {
        handleSubError(error, 'withdrawals');
      });
    } else {
      setWithdrawals([]);
    }

    let unsubNotifications = () => {};
    if (currentUserId && !isQuotaFallbackMode) {
      const qNotif = query(collection(db, 'notifications'), where('userId', '==', currentUserId));
      unsubNotifications = onSnapshot(qNotif, (snap) => {
        const list: Notification[] = [];
        const newlyArrived: Notification[] = [];
        const nowMs = Date.now();
        
        snap.forEach((d) => {
          list.push(d.data() as Notification);
        });
        
        setNotifications(prev => {
          list.forEach(n => {
            if (!n.read) {
              const createdMs = n.createdAt ? new Date(n.createdAt).getTime() : 0;
              // Created in the last 15 seconds, and not already in state
              if (nowMs - createdMs < 15000) {
                const alreadyExists = prev.some(p => p.id === n.id);
                if (!alreadyExists) {
                  newlyArrived.push(n);
                }
              }
            }
          });
          return list;
        });

        newlyArrived.forEach(notif => {
          triggerDeviceNotification(notif);
        });
      }, (error) => {
        handleSubError(error, 'notifications');
      });
    } else {
      setNotifications([]);
    }

    return () => {
      unsubWithdrawals();
      unsubNotifications();
    };
  }, [currentUserId, isQuotaFallbackMode]);

  // 3. User Private Messages subscription
  useEffect(() => {
    if (!currentUserId) {
      setMessages([]);
      return;
    }

    if (isQuotaFallbackMode) {
      // Offline/Sandbox Mode: read cached local messages instead of subscribing to Firestore
      const cachedMsgsStr = localStorage.getItem('freshlink_loc_messages');
      if (cachedMsgsStr) {
        try {
          setMessages(JSON.parse(cachedMsgsStr));
        } catch (e) {}
      } else {
        setMessages(SEED_MESSAGES);
      }
      return;
    }

    // Load messages where user is the sender
    const qSender = query(collection(db, 'messages'), where('senderId', '==', currentUserId));
    const unsubSender = onSnapshot(qSender, (snap) => {
      if (isQuotaFallbackMode) return;
      setMessages((prev) => {
        const otherMsgs = prev.filter((m) => m.senderId !== currentUserId);
        const updatedSenderMsgs: Message[] = [];
        snap.forEach((doc) => updatedSenderMsgs.push(doc.data() as Message));
        const merged = [...otherMsgs, ...updatedSenderMsgs];
        return Array.from(new Map(merged.map((m) => [m.id, m])).values());
      });
    }, (error) => {
      handleSubError(error, 'messages_sender');
    });

    // Load messages where user is the receiver
    const qReceiver = query(collection(db, 'messages'), where('receiverId', '==', currentUserId));
    const unsubReceiver = onSnapshot(qReceiver, (snap) => {
      if (isQuotaFallbackMode) return;
      setMessages((prev) => {
        const otherMsgs = prev.filter((m) => m.receiverId !== currentUserId);
        const updatedReceiverMsgs: Message[] = [];
        snap.forEach((doc) => updatedReceiverMsgs.push(doc.data() as Message));
        const merged = [...otherMsgs, ...updatedReceiverMsgs];
        return Array.from(new Map(merged.map((m) => [m.id, m])).values());
      });

      // Automatically batch-update messages to 'seen' or 'delivered'
      const batch = writeBatch(db);
      let needsCommit = false;
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Message;
        if (data.receiverId === currentUserId && !data.read) {
          if (data.senderId === activeChatPartnerRef.current) {
            batch.update(docSnap.ref, { read: true, status: 'seen' });
            needsCommit = true;
          } else if (!data.status || data.status === 'sent') {
            batch.update(docSnap.ref, { status: 'delivered' });
            needsCommit = true;
          }
        }
      });
      if (needsCommit) {
        batch.commit().catch(e => console.error("Error committing message status update:", e));
      }
    }, (error) => {
      handleSubError(error, 'messages_receiver');
    });

    return () => {
      unsubSender();
      unsubReceiver();
    };
  }, [currentUserId, isQuotaFallbackMode]);

   const rawCurrentUser = users.find(u => u.id === currentUserId) || null;
  const currentUser = React.useMemo(() => {
    if (!rawCurrentUser) return null;
    const isRootAdmin = rawCurrentUser.email?.toLowerCase() === 'fresh.linksd@gmail.com' || auth.currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com';
    if (isRootAdmin) {
      return {
        ...rawCurrentUser,
        email: 'fresh.linksd@gmail.com',
        role: 'super_admin' as const,
        isAdmin: true
      };
    }
    return rawCurrentUser;
  }, [rawCurrentUser, auth.currentUser?.email]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentUser) {
        localStorage.setItem('freshlink_current_user_id', currentUser.id);
        localStorage.setItem('freshlink_cached_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('freshlink_current_user_id');
        localStorage.removeItem('freshlink_cached_user');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const isRootGmail = rawCurrentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com' || auth.currentUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com';
    if (rawCurrentUser && isRootGmail) {
      if (rawCurrentUser.role !== 'super_admin' || !rawCurrentUser.isAdmin || rawCurrentUser.email?.toLowerCase() !== 'fresh.linksd@gmail.com') {
        const userDocRef = doc(db, 'users', rawCurrentUser.id);
        updateDoc(userDocRef, {
          email: 'fresh.linksd@gmail.com',
          role: 'super_admin',
          isAdmin: true
        }).catch(err => console.error("Auto-promoting root user to super_admin failed:", err));
      }
    }
  }, [rawCurrentUser, auth.currentUser?.email]);

  // Custom User Profile Registration
  const register = async (name: string, email: string, interests: string[], extraDetails?: Partial<User>) => {
    if (!currentUserId) throw new Error("Authenticated session is required for registering profiles");
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

    await runWriteOperation(
      async () => {
        await setDoc(doc(db, 'users', currentUserId), newUser);
      },
      () => {
        setUsers(prev => {
          const index = prev.findIndex(u => u.id === currentUserId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newUser;
            return updated;
          } else {
            return [...prev, newUser];
          }
        });
      },
      `users/${currentUserId}`
    );
    return newUser;
  };

  // Login via Copying Attributes from Registered Template
  const login = async (email: string) => {
    let matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Auto-create/guarantee root super_admin if they login with this specific email
    if (!matched && email.toLowerCase() === 'fresh.linksd@gmail.com' && currentUserId) {
      try {
        const defaultSuperAdmin: User = {
          id: currentUserId,
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
        await setDoc(doc(db, 'users', defaultSuperAdmin.id), defaultSuperAdmin);
        matched = defaultSuperAdmin;
      } catch (err) {
        console.error("Failed to seed fresh.linksd@gmail.com on-demand:", err);
      }
    }

    if (!matched || !currentUserId) return false;

    if (matched.isBlocked) {
      throw new Error("This account has been blocked by community administrators.");
    }

    const isRootAdmin = matched.email.toLowerCase() === 'fresh.linksd@gmail.com';
    const updatedAttrs: Partial<User> = {
      name: matched.name,
      email: matched.email,
      bio: matched.bio,
      profileImage: matched.profileImage,
      coverImage: matched.coverImage,
      location: matched.location,
      interests: matched.interests,
      socialLinks: matched.socialLinks || {},
      savedPosts: matched.savedPosts || [],
      hasSetupAccount: true,
      isBlocked: matched.isBlocked || false,
      role: isRootAdmin ? 'super_admin' : (matched.role || 'user'),
      isAdmin: isRootAdmin ? true : (matched.isAdmin || false),
      phoneNumber: matched.phoneNumber || '',
      panNumber: matched.panNumber || '',
      officialDocId: matched.officialDocId || '',
      idPhoto: matched.idPhoto || '',
      isApprovedByAdmin: matched.isApprovedByAdmin || false,
      walletBalance: matched.walletBalance !== undefined ? matched.walletBalance : 25.00,
      walletCredits: matched.walletCredits !== undefined ? matched.walletCredits : 500,
      isMonetizationEnabled: matched.isMonetizationEnabled || false,
      monthlySubscriptionPrice: matched.monthlySubscriptionPrice !== undefined ? matched.monthlySubscriptionPrice : 4.99,
      subscribedCreators: matched.subscribedCreators || [],
      subscribedTiers: matched.subscribedTiers || {},
      hasVerifiedDetails: matched.hasVerifiedDetails || false
    };

    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'users', currentUserId), updatedAttrs);
      },
      () => {
        setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...updatedAttrs } : u));
      },
      `users/${currentUserId}`
    );
    return true;
  };

  // Login via Google Sign-In (real auth session)
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const isIframe = window.self !== window.top;

    try {
      const result = await signInWithPopup(auth, provider);
      return result.user !== null;
    } catch (err: any) {
      console.error("Google signInWithPopup failed:", err);
      
      const isPopupBlocked = err?.code === 'auth/popup-blocked' || 
                             err?.message?.toLowerCase().includes('popup') || 
                             err?.message?.toLowerCase().includes('blocked');

      if (isPopupBlocked) {
        if (isIframe) {
          // In an iframe, Google Auth Redirect will also fail because accounts.google.com has frame ancestors restriction.
          // Throw a specialized error so the front-end UI can guide the user.
          throw new Error('IFRAME_POPUP_BLOCKED');
        } else {
          // Outside iframe, try fallback redirect
          try {
            await signInWithRedirect(auth, provider);
            return false;
          } catch (redirectErr) {
            console.error("Google signInWithRedirect fallback failed:", redirectErr);
            throw redirectErr;
          }
        }
      }
      throw err;
    }
  };

  // Sign out cleanly
  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshlink_current_user_id');
        localStorage.removeItem('freshlink_cached_user');
      }
      setCurrentUserId(null);
      await signOut(auth);
    } catch (err) {
      console.error("Auth session signout error:", err);
    }
  };

  // Profile fields updating
  const updateProfile = async (updated: Partial<User>) => {
    if (!currentUserId) return;
    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'users', currentUserId), updated);
      },
      () => {
        setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, ...updated } : u));
      },
      `users/${currentUserId}`
    );
  };

  // Create article blog post
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
    if (!currentUserId) throw new Error("Authentication required to publish articles");
    const id = `post_${Date.now()}`;
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    const newPost: Post = {
      id,
      userId: currentUserId,
      title,
      content,
      mediaUrl: mediaUrl || '',
      category,
      tags: tags.map(t => t.trim().replace(/^#/, '')).filter(Boolean),
      status,
      createdAt: new Date().toISOString(),
      readingTime,
      mediaUrls: mediaUrls || [],
      videoUrl: videoUrl || '',
      isPremium: isPremium || false,
      poll: poll || undefined,
      views: 0,
      imageRatio: imageRatio || 'auto'
    };

    await runWriteOperation(
      async () => {
        await setDoc(doc(db, 'posts', id), newPost);
      },
      () => {
        setPosts(prev => [...prev, newPost]);
      },
      `posts/${id}`
    );

    if (!navigator.onLine) {
      console.log(`[PWA Offline] Queueing post ${id}`);
      try {
        await addPendingInteraction({
          type: 'post',
          postId: id,
          userId: currentUserId,
          payload: newPost
        });
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).sync.register('sync-interactions');
        }
      } catch (e) {
        console.warn("Failed to register offline post sync:", e);
      }
    }

    return newPost;
  };

  // Delete article blog post
  const deletePost = async (postId: string) => {
    await runWriteOperation(
      async () => {
        await deleteDoc(doc(db, 'posts', postId));
      },
      () => {
        setPosts(prev => prev.filter(p => p.id !== postId));
      },
      `posts/${postId}`
    );
  };

  // Vote in a post's attached poll
  const voteInPostPoll = async (postId: string, optionIndex: number) => {
    if (!currentUserId) throw new Error("Authentication required to vote in polls");
    const post = posts.find(p => p.id === postId);
    if (!post || !post.poll) return;

    const updatedPoll = { ...post.poll };
    if (!updatedPoll.votes) {
      updatedPoll.votes = {};
    }
    // Remove user's previous vote if any
    Object.keys(updatedPoll.votes).forEach(optIdx => {
      if (updatedPoll.votes[optIdx]) {
        updatedPoll.votes[optIdx] = updatedPoll.votes[optIdx].filter(uid => uid !== currentUserId);
      }
    });
    // Add user's vote
    const optStr = String(optionIndex);
    if (!updatedPoll.votes[optStr]) {
      updatedPoll.votes[optStr] = [];
    }
    updatedPoll.votes[optStr].push(currentUserId);

    await runWriteOperation(
      async () => {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { poll: updatedPoll });
      },
      () => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, poll: updatedPoll } : p));
      },
      `posts/${postId}`
    );
  };

  // Increment view count of a post
  const incrementPostViews = async (postId: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        views: increment(1)
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p));
    } catch (err) {
      console.warn("Could not increment post views on server:", err);
    }
  };

  // Update article blog post
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
    const updateData: any = {
      title,
      content,
      category,
      tags: tags.map(t => t.trim().replace(/^#/, '')).filter(Boolean),
      mediaUrl: mediaUrl || '',
      updatedAt: new Date().toISOString()
    };
    if (mediaUrls !== undefined) {
      updateData.mediaUrls = mediaUrls;
    }
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl;
    }
    if (isPremium !== undefined) {
      updateData.isPremium = isPremium;
    }
    if (imageRatio !== undefined) {
      updateData.imageRatio = imageRatio;
    }

    await runWriteOperation(
      async () => {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, updateData);
      },
      () => {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updateData } : p));
      },
      `posts/${postId}`
    );
  };

  // Toggle Like on Post
  const toggleLikePost = async (postId: string) => {
    if (!currentUserId) return;
    const likeId = `${currentUserId}_${postId}`;
    const isLikedAlready = likes.some(l => l.userId === currentUserId && l.postId === postId);

    // Save current state for rollback
    const previousLikes = [...likes];

    // Optimistically update state immediately
    if (isLikedAlready) {
      setLikes(prev => prev.filter(l => l.userId !== currentUserId || l.postId !== postId));
    } else {
      setLikes(prev => [...prev, { id: likeId, userId: currentUserId, postId, createdAt: new Date().toISOString() }]);
    }

    if (!navigator.onLine) {
      console.log(`[PWA Offline] Queueing like for post ${postId}`);
      
      try {
        await addPendingInteraction({
          type: 'like',
          postId,
          userId: currentUserId,
          payload: { isLikedAlready, likeId }
        });

        // Trigger PWA background sync registration
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).sync.register('sync-interactions');
        }
      } catch (err) {
        console.warn("Failed to register offline like sync:", err);
      }
      return;
    }

    try {
      await runWriteOperation(
        async () => {
          if (isLikedAlready) {
            await deleteDoc(doc(db, 'likes', likeId));
          } else {
            await setDoc(doc(db, 'likes', likeId), {
              userId: currentUserId,
              postId
            });

            // Notify post owner
            const post = posts.find(p => p.id === postId);
            if (post && post.userId !== currentUserId) {
              await addNotification(
                post.userId,
                'like',
                `liked your post "${post.title}"`,
                postId
              );
            }
          }
        },
        () => {
          // Notify post owner locally (only in local fallback mode / quota mode)
          if (!isLikedAlready) {
            const post = posts.find(p => p.id === postId);
            if (post && post.userId !== currentUserId && isQuotaFallbackMode) {
              addNotification(
                post.userId,
                'like',
                `liked your post "${post.title}"`,
                postId
              );
            }
          }
        },
        `likes/${likeId}`
      );
    } catch (err) {
      console.error("Failed to toggle like post, rolling back optimistic update:", err);
      setLikes(previousLikes);
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
    const likeId = `${currentUserId}_${postId}`;
    const existingLike = likes.find(l => l.userId === currentUserId && l.postId === postId);

    // Save previous state for rollback on error
    const previousLikes = [...likes];

    // Optimistically update local state synchronously and immediately
    if (existingLike) {
      if (existingLike.reactionType === reactionType) {
        // Remove reaction
        setLikes(prev => prev.filter(l => l.userId !== currentUserId || l.postId !== postId));
      } else {
        // Change reaction
        setLikes(prev => prev.map(l => l.userId === currentUserId && l.postId === postId ? { ...l, reactionType } : l));
      }
    } else {
      // Add new reaction
      setLikes(prev => [...prev, { id: likeId, userId: currentUserId, postId, reactionType, createdAt: new Date().toISOString() }]);
    }

    if (!navigator.onLine) {
      console.log(`[PWA Offline] Queueing reaction ${reactionType} for post ${postId}`);
      return;
    }

    try {
      await runWriteOperation(
        async () => {
          if (existingLike) {
            if (existingLike.reactionType === reactionType) {
              // Delete reaction document
              await deleteDoc(doc(db, 'likes', likeId));
            } else {
              // Update reaction document
              await setDoc(doc(db, 'likes', likeId), {
                userId: currentUserId,
                postId,
                reactionType
              });
            }
          } else {
            // Create reaction document
            await setDoc(doc(db, 'likes', likeId), {
              userId: currentUserId,
              postId,
              reactionType
            });

            // Notify post owner
            const post = posts.find(p => p.id === postId);
            if (post && post.userId !== currentUserId) {
              await addNotification(
                post.userId,
                'like',
                `reacted with ${reactionType} to your post "${post.title}"`,
                postId
              );
            }
          }
        },
        () => {
          // Since we already performed the optimistic update, we don't need to do anything here on success.
          // However, if we are in local quota fallback mode, we still ensure local notification works
          if (!existingLike) {
            const post = posts.find(p => p.id === postId);
            if (post && post.userId !== currentUserId && isQuotaFallbackMode) {
              addNotification(
                post.userId,
                'like',
                `reacted with ${reactionType} to your post "${post.title}"`,
                postId
              );
            }
          }
        },
        `likes/${likeId}`
      );
    } catch (err) {
      console.error("Failed to persist reaction, rolling back optimistic update:", err);
      // Rollback to previous state
      setLikes(previousLikes);
    }
  };

  const getPostReactions = (postId: string) => {
    const postLikes = likes.filter(l => l.postId === postId);
    const reactionCounts: Record<string, number> = {};
    postLikes.forEach(l => {
      const type = l.reactionType || '👍';
      reactionCounts[type] = (reactionCounts[type] || 0) + 1;
    });
    return reactionCounts;
  };

  const getUserReaction = (postId: string) => {
    if (!currentUserId) return null;
    const existing = likes.find(l => l.userId === currentUserId && l.postId === postId);
    if (!existing) return null;
    return existing.reactionType || '👍';
  };

  // Comments write, edit, delete & lookup
  const addComment = async (postId: string, commentText: string) => {
    if (!currentUserId) throw new Error("Authenticated session is required for commenting");
    const id = `com_${Date.now()}`;
    const cleanText = censorText(commentText);
    const newComment: Comment = {
      id,
      userId: currentUserId,
      postId,
      comment: cleanText,
      createdAt: new Date().toISOString()
    };

    if (!navigator.onLine) {
      console.log(`[PWA Offline] Queueing comment for post ${postId}`);
      // Optimistically update local state immediately
      setComments(prev => [...prev, newComment]);

      try {
        await addPendingInteraction({
          type: 'comment',
          postId,
          userId: currentUserId,
          payload: { id, comment: cleanText, createdAt: newComment.createdAt }
        });

        // Trigger PWA background sync registration
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).sync.register('sync-interactions');
        }
      } catch (err) {
        console.warn("Failed to register offline comment sync:", err);
      }
      return newComment;
    }

    await runWriteOperation(
      async () => {
        await setDoc(doc(db, 'comments', id), newComment);

        // Notify post owner
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== currentUserId) {
          await addNotification(
            post.userId,
            'comment',
            `commented on your post "${post.title}": "${commentText.slice(0, 30)}${commentText.length > 30 ? '...' : ''}"`,
            postId
          );
        }
      },
      () => {
        setComments(prev => [...prev, newComment]);

        // Notify post owner locally (only in local fallback mode)
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== currentUserId && isQuotaFallbackMode) {
          addNotification(
            post.userId,
            'comment',
            `commented on your post "${post.title}": "${commentText.slice(0, 30)}${commentText.length > 30 ? '...' : ''}"`,
            postId
          );
        }
      },
      `comments/${id}`
    );
    return newComment;
  };

  const getPostComments = (postId: string) => {
    return comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const editComment = async (commentId: string, newText: string) => {
    const cleanText = censorText(newText);
    const updatedAt = new Date().toISOString();
    await runWriteOperation(
      async () => {
        const commentRef = doc(db, 'comments', commentId);
        await updateDoc(commentRef, {
          comment: cleanText,
          updatedAt
        });
      },
      () => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment: cleanText, updatedAt } : c));
      },
      `comments/${commentId}`
    );
  };

  const deleteComment = async (commentId: string) => {
    await runWriteOperation(
      async () => {
        await deleteDoc(doc(db, 'comments', commentId));
      },
      () => {
        setComments(prev => prev.filter(c => c.id !== commentId));
      },
      `comments/${commentId}`
    );
  };

  // Creators Following system
  const toggleFollowUser = async (targetUserId: string) => {
    if (!currentUserId || currentUserId === targetUserId) return;
    const followId = `${currentUserId}_${targetUserId}`;
    const followingAlready = followers.some(f => f.followerId === currentUserId && f.followingId === targetUserId);

    await runWriteOperation(
      async () => {
        if (followingAlready) {
          await deleteDoc(doc(db, 'followers', followId));
        } else {
          await setDoc(doc(db, 'followers', followId), {
            followerId: currentUserId,
            followingId: targetUserId
          });

          // Notify the creator
          await addNotification(
            targetUserId,
            'follow',
            `started following you`
          );
        }
      },
      () => {
        if (followingAlready) {
          setFollowers(prev => prev.filter(f => f.followerId !== currentUserId || f.followingId !== targetUserId));
        } else {
          setFollowers(prev => [...prev, { followerId: currentUserId, followingId: targetUserId }]);
          if (isQuotaFallbackMode) {
            addNotification(
              targetUserId,
              'follow',
              `started following you`
            );
          }
        }
      },
      `followers/${followId}`
    );
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

  // Instant messaging systems with editing and deleting support
  const sendMessage = async (receiverId: string, text: string, mediaUrl?: string) => {
    if (!currentUserId) throw new Error("Sender authentication required for instant chatting");
    const id = `msg_${Date.now()}`;
    const cleanText = censorText(text);
    const newMsg: Message = {
      id,
      senderId: currentUserId,
      receiverId,
      message: cleanText,
      mediaUrl: mediaUrl || '',
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sent'
    };

    await runWriteOperation(
      async () => {
        await setDoc(doc(db, 'messages', id), newMsg);
      },
      () => {
        setMessages(prev => {
          if (prev.some(m => m.id === id)) return prev;
          return [...prev, newMsg];
        });
      },
      `messages/${id}`
    );

    if (!navigator.onLine) {
      console.log(`[PWA Offline] Queueing message ${id}`);
      try {
        await addPendingInteraction({
          type: 'chat',
          postId: '',
          userId: currentUserId,
          payload: newMsg
        });
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).sync.register('sync-interactions');
        }
      } catch (e) {
        console.warn("Failed to register offline chat sync:", e);
      }
    } else {
      // Create a real-time notification to trigger device and system alerts for the recipient
      try {
        await addNotification(
          receiverId,
          'system',
          `✉️ texted you: "${cleanText.length > 60 ? cleanText.substring(0, 60) + '...' : cleanText}"`
        );
      } catch (err) {
        console.warn("Failed to create message system/device notification:", err);
      }
    }

    return newMsg;
  };

  const editMessage = async (messageId: string, newText: string) => {
    const cleanText = censorText(newText);
    const updatedAt = new Date().toISOString();
    await runWriteOperation(
      async () => {
        const msgRef = doc(db, 'messages', messageId);
        await updateDoc(msgRef, {
          message: cleanText,
          updatedAt
        });
      },
      () => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message: cleanText, updatedAt } : m));
      },
      `messages/${messageId}`
    );
  };

  const deleteMessage = async (messageId: string) => {
    await runWriteOperation(
      async () => {
        await deleteDoc(doc(db, 'messages', messageId));
      },
      () => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      },
      `messages/${messageId}`
    );
  };

  const getChatRooms = () => {
    if (!currentUserId) return [];

    const interactedUserIdsSet = new Set<string>();
    messages.forEach(msg => {
      if (msg.senderId === currentUserId) {
        interactedUserIdsSet.add(msg.receiverId);
      } else if (msg.receiverId === currentUserId) {
        interactedUserIdsSet.add(msg.senderId);
      }
    });

    const rooms = Array.from(interactedUserIdsSet).map(userId => {
      const chatUser = users.find(u => u.id === userId);
      const conversation = messages.filter(
        msg => (msg.senderId === currentUserId && msg.receiverId === userId) ||
               (msg.senderId === userId && msg.receiverId === currentUserId)
      );

      const sortedConv = [...conversation].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        user: chatUser!,
        lastMessage: sortedConv[0]
      };
    }).filter(room => room.user !== undefined);

    return rooms.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  };

  const getMessagesWith = (userId: string) => {
    if (!currentUserId) return [];
    return messages
      .filter(
        msg => (msg.senderId === currentUserId && msg.receiverId === userId) ||
               (msg.senderId === userId && msg.receiverId === currentUserId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const markMessagesAsRead = async (senderId: string) => {
    if (!currentUserId) return;
    const unreadMessages = messages.filter(
      msg => msg.senderId === senderId && msg.receiverId === currentUserId && !msg.read
    );

    const batch = writeBatch(db);
    let needsUpdate = false;
    unreadMessages.forEach(msg => {
      const msgRef = doc(db, 'messages', msg.id);
      batch.update(msgRef, { read: true, status: 'seen' });
      needsUpdate = true;
    });

    try {
      if (needsUpdate) {
        await batch.commit();
      }
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  // Saved Posts bookmark triggers
  const toggleSavePost = async (postId: string) => {
    if (!currentUserId) return;
    const userToUpdate = users.find(u => u.id === currentUserId);
    if (!userToUpdate) return;

    let savedPosts = userToUpdate.savedPosts || [];
    if (savedPosts.includes(postId)) {
      savedPosts = savedPosts.filter(id => id !== postId);
    } else {
      savedPosts = [...savedPosts, postId];
    }

    try {
      await updateDoc(doc(db, 'users', currentUserId), { savedPosts });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUserId}`);
    }
  };

  // Achievements dynamic progress checks
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

  const blockUser = async (userId: string, blocked: boolean) => {
    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'users', userId), { isBlocked: blocked });
      },
      () => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: blocked } : u));
      },
      `users/${userId}`
    );
  };

  const deleteUserByAdmin = async (userId: string) => {
    await runWriteOperation(
      async () => {
        await deleteDoc(doc(db, 'users', userId));
      },
      () => {
        setUsers(prev => prev.filter(u => u.id !== userId));
      },
      `users/${userId}`
    );
  };

  const deleteSelfAccount = async () => {
    if (!currentUserId) return;
    const userId = currentUserId;

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('freshlink_current_user_id');
        localStorage.removeItem('freshlink_cached_user');
      }
      
      if (isQuotaFallbackMode) {
        const cachedUsersStr = localStorage.getItem('freshlink_loc_users');
        if (cachedUsersStr) {
          try {
            const cachedUsers = JSON.parse(cachedUsersStr) as User[];
            const updated = cachedUsers.filter(u => u.id !== userId);
            localStorage.setItem('freshlink_loc_users', JSON.stringify(updated));
          } catch(e) {}
        }
      } else {
        await runWriteOperation(
          async () => {
            await deleteDoc(doc(db, 'users', userId));
          },
          () => {},
          `users/${userId}`
        );
      }
    } catch (err) {
      console.error("Self account deletion Firestore error, logging out anyway:", err);
    } finally {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setCurrentUserId(null);
      await signOut(auth);
    }
  };

  const setRoleByAdmin = async (userId: string, role: 'admin' | 'user') => {
    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'users', userId), { role, isAdmin: role === 'admin' });
      },
      () => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role, isAdmin: role === 'admin' } : u));
      },
      `users/${userId}`
    );
  };

  const verifyUserByAdmin = async (userId: string, approved: boolean, remarks?: string) => {
    const updateData = approved ? { 
      isApprovedByAdmin: true,
      clearanceRemarks: remarks || ""
    } : { 
      isApprovedByAdmin: false, 
      hasVerifiedDetails: false,
      clearanceRemarks: remarks || ""
    };

    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'users', userId), updateData);
        await addNotification(
          userId,
          'report_decision',
          approved 
            ? `Your identity document verification request has been APPROVED by the admin.${remarks ? ` Remarks: ${remarks}` : ''}`
            : `Your identity document verification request was REJECTED by the admin.${remarks ? ` Reason: ${remarks}` : ''}`
        );
      },
      () => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updateData } : u));
        if (isQuotaFallbackMode) {
          addNotification(
            userId,
            'report_decision',
            approved 
              ? `Your identity document verification request has been APPROVED by the admin.${remarks ? ` Remarks: ${remarks}` : ''}`
              : `Your identity document verification request was REJECTED by the admin.${remarks ? ` Reason: ${remarks}` : ''}`
          );
        }
      },
      `users/${userId}`
    );
  };

  const requestWithdrawal = async (amountNpr: number, paymentMethod: string, details: string) => {
    if (!currentUserId) throw new Error("Authentication required to request withdrawals");
    const id = `withdraw_${Date.now()}`;
    const newRequest: WithdrawalRequest = {
      id,
      userId: currentUserId,
      amountNpr,
      paymentMethod,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await runWriteOperation(
      async () => {
        await setDoc(doc(db, 'withdrawals', id), newRequest);
      },
      () => {
        setWithdrawals(prev => [...prev, newRequest]);
      },
      `withdrawals/${id}`
    );
  };

  const updateWithdrawalStatusByAdmin = async (withdrawalId: string, status: 'approved' | 'rejected', remarks?: string) => {
    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'withdrawals', withdrawalId), { 
          status,
          remarks: remarks || ""
        });
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          await addNotification(
            withdrawal.userId,
            'withdrawal_decision',
            `Your withdrawal request of NPR ${withdrawal.amountNpr} has been ${status === 'approved' ? 'APPROVED' : 'REJECTED'}.${remarks ? ` Remarks: ${remarks}` : ''}`
          );
        }
      },
      () => {
        setWithdrawals(prev => prev.map(w => w.id === withdrawalId ? { ...w, status, remarks: remarks || "" } : w));
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal && isQuotaFallbackMode) {
          addNotification(
            withdrawal.userId,
            'withdrawal_decision',
            `Your withdrawal request of NPR ${withdrawal.amountNpr} has been ${status === 'approved' ? 'APPROVED' : 'REJECTED'}.${remarks ? ` Remarks: ${remarks}` : ''}`
          );
        }
      },
      `withdrawals/${withdrawalId}`
    );
  };

  // --- New Methods Implementation ---
  const addNotification = async (
    userId: string,
    type: 'like' | 'comment' | 'follow' | 'report_decision' | 'withdrawal_decision' | 'ad_alert' | 'system',
    message: string,
    postId?: string,
    isPoll?: boolean,
    pollOptions?: string[]
  ) => {
    if (!userId) return;
    if (userId === currentUserId && type !== 'system' && type !== 'withdrawal_decision' && type !== 'report_decision') return;

    const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newNotification: Notification = {
      id: notifId,
      userId,
      senderId: currentUserId || 'system',
      senderName: currentUser?.name || 'System',
      senderImage: currentUser?.profileImage || '',
      type,
      message,
      postId,
      createdAt: new Date().toISOString(),
      read: false,
      isPoll,
      pollAnswer: isPoll ? null : undefined,
      pollOptions: isPoll ? pollOptions : undefined
    };

    // Remove undefined values to avoid Firestore serialization errors
    const cleanNotification = JSON.parse(JSON.stringify(newNotification));

    try {
      await setDoc(doc(db, 'notifications', notifId), cleanNotification);
      // Also update notifications local state if not in quota fallback (since snapshot handles normal real-time notifications stream)
      if (isQuotaFallbackMode) {
        setNotifications(prev => [...prev, newNotification]);
        // Trigger manual native push for fallback
        triggerDeviceNotification(newNotification);
      }
    } catch (err) {
      console.error("Error creating notification:", err);
    }
  };

  const submitPollAnswer = async (notificationId: string, answer: string) => {
    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'notifications', notificationId), {
          pollAnswer: answer,
          read: true
        });
      },
      () => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, pollAnswer: answer, read: true } : n));
      },
      `notifications/${notificationId}`
    );
  };

  const markNotificationAsRead = async (id: string) => {
    await runWriteOperation(
      async () => {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      },
      () => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      },
      `notifications/${id}`
    );
  };

  const markAllNotificationsAsRead = async () => {
    const userNotifs = notifications.filter(n => n.userId === currentUserId && !n.read);
    if (userNotifs.length === 0) return;
    await runWriteOperation(
      async () => {
        const batch = writeBatch(db);
        userNotifs.forEach(notif => {
          batch.update(doc(db, 'notifications', notif.id), { read: true });
        });
        await batch.commit();
      },
      () => {
        setNotifications(prev => prev.map(n => n.userId === currentUserId ? { ...n, read: true } : n));
      },
      'notifications/all'
    );
  };

  const reportPost = async (postId: string, reason: string, remarks: string) => {
    if (!currentUserId) throw new Error("Authentication required to report posts");
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("Post not found");

    const id = `report_${Date.now()}`;
    const newReport: PostReport = {
      id,
      postId,
      postTitle: post.title,
      postAuthorId: post.userId,
      reporterId: currentUserId,
      reporterName: currentUser?.name || 'Anonymous User',
      reason,
      remarks,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'postReports', id), newReport);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `postReports/${id}`);
    }
  };

  const resolveReport = async (reportId: string, action: 'delete_post' | 'dismiss') => {
    const report = postReports.find(r => r.id === reportId);
    if (!report) throw new Error("Report not found");

    try {
      if (action === 'delete_post') {
        // Delete post
        await deleteDoc(doc(db, 'posts', report.postId));

        // Notify author
        await addNotification(
          report.postAuthorId,
          'report_decision',
          `Your post "${report.postTitle}" was deleted by Admin following a content policy report. Reason: ${report.reason}.${report.remarks ? ` Remarks: ${report.remarks}` : ''}`
        );

        // Update report status
        await updateDoc(doc(db, 'postReports', reportId), { status: 'resolved' });
      } else {
        // Dismiss report
        await updateDoc(doc(db, 'postReports', reportId), { status: 'dismissed' });

        // Notify reporter
        await addNotification(
          report.reporterId,
          'report_decision',
          `Your report regarding post "${report.postTitle}" was reviewed and dismissed by the admin.`
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `postReports/${reportId}`);
    }
  };

  const createOrUpdateAd = async (adData: { 
    id?: string; 
    imageUrl: string; 
    title?: string; 
    description?: string; 
    targetUrl?: string; 
    active: boolean; 
    clickCount?: number; 
    createdAt?: string;
    placement?: 'workspace' | 'bubble';
    welcomeBadge?: string;
    welcomeTitle?: string;
    welcomeText?: string;
    userId?: string;
    paymentScreenshotUrl?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'published';
    amountPaid?: number;
    paymentStatus?: 'pending' | 'verified' | 'failed';
    scheduledDate?: string;
    name?: string;
    purpose?: string;
    contact?: string;
    content?: string;
    location?: string;
    email?: string;
  }) => {
    const id = adData.id || `ad_${Date.now()}`;
    const existingAd = ads.find(a => a.id === id);
    const placement = adData.placement || 'workspace';
    const newAd: AdBanner = {
      id,
      imageUrl: adData.imageUrl || "",
      name: adData.name || existingAd?.name || adData.title || existingAd?.title || "",
      purpose: adData.purpose || existingAd?.purpose || "",
      contact: adData.contact || existingAd?.contact || "",
      content: adData.content || existingAd?.content || adData.description || existingAd?.description || "",
      location: adData.location || existingAd?.location || "",
      email: adData.email || existingAd?.email || "",
      active: adData.active,
      createdAt: adData.createdAt || existingAd?.createdAt || new Date().toISOString(),
      clickCount: adData.clickCount !== undefined ? adData.clickCount : (existingAd?.clickCount || 0),
      status: adData.status || existingAd?.status || 'published',
      scheduledDate: adData.scheduledDate || existingAd?.scheduledDate || "",
      
      // Keep backwards compatibility
      title: adData.name || existingAd?.name || adData.title || existingAd?.title || "",
      description: adData.content || existingAd?.content || adData.description || existingAd?.description || "",
      targetUrl: adData.targetUrl || existingAd?.targetUrl || "",
      placement,
      welcomeBadge: adData.welcomeBadge || "",
      welcomeTitle: adData.welcomeTitle || "",
      welcomeText: adData.welcomeText || "",
      userId: adData.userId || existingAd?.userId || currentUserId || "system",
      paymentScreenshotUrl: adData.paymentScreenshotUrl || existingAd?.paymentScreenshotUrl || "",
      amountPaid: adData.amountPaid || existingAd?.amountPaid || 0,
      paymentStatus: adData.paymentStatus || existingAd?.paymentStatus || 'verified',
    };

    try {
      await setDoc(doc(db, 'ads', id), newAd);
      setAds(prev => {
        const otherAds = prev.filter(a => a.id !== id);
        return [...otherAds, newAd];
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `ads/${id}`);
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      await deleteDoc(doc(db, 'ads', adId));
      setAds(prev => prev.filter(a => a.id !== adId));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `ads/${adId}`);
    }
  };

  const trackAdClick = async (adId: string) => {
    try {
      if (adId.startsWith('ad_fallback_')) return;
      const adDocRef = doc(db, 'ads', adId);
      const adSnapshot = await getDoc(adDocRef);
      if (adSnapshot.exists()) {
        const currentCount = adSnapshot.data().clickCount || 0;
        await updateDoc(adDocRef, { clickCount: currentCount + 1 });
        setAds(prev => prev.map(a => a.id === adId ? { ...a, clickCount: currentCount + 1 } : a));
      }
    } catch (err) {
      console.error("Failed to increment click count:", err);
    }
  };

  const toggleAllAds = async (active: boolean) => {
    try {
      const batch = writeBatch(db);
      ads.forEach(ad => {
        batch.update(doc(db, 'ads', ad.id), { active });
      });
      await batch.commit();
      setAds(prev => prev.map(ad => ({ ...ad, active })));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'ads');
    }
  };

  const loadMorePosts = async () => {
    if (!hasMorePosts || loading) return;
    setPostLimit(prev => prev + 20);
  };

  return (
    <SocialPlatformContext.Provider
      value={{
        users,
        posts,
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
        isOnline,
        userMap,
        resetQuotaFallback,
        securityBlock,
        setSecurityBlock,
        resolveSecurityChallenge,
        refetchData,
        hasMorePosts,
        loadMorePosts
      }}
    >
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
