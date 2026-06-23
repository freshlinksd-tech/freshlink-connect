/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Post, Like, Comment, Follower, Message, Achievement, WithdrawalRequest, Notification, PostReport, AdBanner } from '../types';
import { SEED_USERS, SEED_POSTS, SEED_FOLLOWERS, SEED_COMMENTS, SEED_MESSAGES } from '../data/seedData';
import { censorText } from '../lib/security';
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
  writeBatch
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

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
    isPremium?: boolean
  ) => Promise<Post>;
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
    isPremium?: boolean
  ) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  isPostLiked: (postId: string) => boolean;
  getPostLikesCount: (postId: string) => number;
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
  setRoleByAdmin: (userId: string, role: 'admin' | 'user') => Promise<void>;
  activeChatPartnerId: string | null;
  setActiveChatPartnerId: (id: string | null) => void;
  withdrawals: WithdrawalRequest[];
  verifyUserByAdmin: (userId: string, approved: boolean, remarks?: string) => Promise<void>;
  requestWithdrawal: (amountNpr: number, paymentMethod: string, details: string) => Promise<void>;
  updateWithdrawalStatusByAdmin: (withdrawalId: string, status: 'approved' | 'rejected', remarks?: string) => Promise<void>;
  notifications: Notification[];
  postReports: PostReport[];
  ads: AdBanner[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  reportPost: (postId: string, reason: string, remarks: string) => Promise<void>;
  resolveReport: (reportId: string, action: 'delete_post' | 'dismiss') => Promise<void>;
  createOrUpdateAd: (ad: { 
    id?: string; 
    imageUrl: string; 
    title: string; 
    description: string; 
    targetUrl: string; 
    active: boolean; 
    clickCount?: number; 
    createdAt?: string;
    placement?: 'workspace' | 'bubble';
    welcomeBadge?: string;
    welcomeTitle?: string;
    welcomeText?: string;
  }) => Promise<void>;
  deleteAd: (adId: string) => Promise<void>;
  trackAdClick: (adId: string) => Promise<void>;
  toggleAllAds: (active: boolean) => Promise<void>;
  isQuotaFallbackMode: boolean;
}

const SocialPlatformContext = createContext<SocialPlatformContextType | undefined>(undefined);

export const SocialPlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const activeChatPartnerRef = useRef<string | null>(null);

  const [isQuotaFallbackMode, setIsQuotaFallbackMode] = useState<boolean>(() => {
    return localStorage.getItem('freshlink_quota_fallback') === 'true';
  });

  // Helper to load all stored local data or seed if empty
  const triggerLocalQuotaFallback = () => {
    localStorage.setItem('freshlink_quota_fallback', 'true');
    setIsQuotaFallbackMode(true);

    const getOrSeed = <T,>(key: string, seed: T[]): T[] => {
      const stored = localStorage.getItem(`freshlink_loc_${key}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Local storage fallback retrieve fail for key:", key, e);
        }
      }
      return seed;
    };

    setUsers(getOrSeed('users', SEED_USERS));
    setPosts(getOrSeed('posts', SEED_POSTS));
    setFollowers(getOrSeed('followers', SEED_FOLLOWERS));
    setComments(getOrSeed('comments', SEED_COMMENTS));
    setMessages(getOrSeed('messages', SEED_MESSAGES));
    setLikes(getOrSeed('likes', []));
    setWithdrawals(getOrSeed('withdrawals', []));
    setNotifications(getOrSeed('notifications', []));
    setPostReports(getOrSeed('postReports', []));
    setAds(getOrSeed('ads', []));
    setLoading(false);
  };

  const saveLocalValue = <T,>(key: string, list: T[]) => {
    localStorage.setItem(`freshlink_loc_${key}`, JSON.stringify(list));
  };

  const runWriteOperation = async (
    firestoreCallback: () => Promise<void>,
    localFallbackCallback: () => void,
    pathInfo: string
  ) => {
    if (isQuotaFallbackMode) {
      localFallbackCallback();
      return;
    }
    try {
      await firestoreCallback();
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
        triggerLocalQuotaFallback();
        localFallbackCallback();
      } else {
        throw err;
      }
    }
  };

  // Automatic side-effect listeners to guarantee absolute state data integrity for offline sandbox testing
  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('users', users);
  }, [users, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('posts', posts);
  }, [posts, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('followers', followers);
  }, [followers, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('comments', comments);
  }, [comments, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('messages', messages);
  }, [messages, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('likes', likes);
  }, [likes, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('withdrawals', withdrawals);
  }, [withdrawals, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('notifications', notifications);
  }, [notifications, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('postReports', postReports);
  }, [postReports, isQuotaFallbackMode]);

  useEffect(() => {
    if (isQuotaFallbackMode) saveLocalValue('ads', ads);
  }, [ads, isQuotaFallbackMode]);

  useEffect(() => {
    activeChatPartnerRef.current = activeChatPartnerId;
  }, [activeChatPartnerId]);

  // 1. Initial Authentication & User Profile Sync
  useEffect(() => {
    let authUnsub = () => {};

    const syncAuthAndUser = async () => {
      try {
        // Authenticate anonymously if no current session exists
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Silent anonymous authentication skipped (use Google Sign-In or sandbox accounts):", err);
      }

      authUnsub = onAuthStateChanged(auth, async (user) => {
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

  // 2. Seeding & Real-Time Sync subscriptions
  useEffect(() => {
    const handleSubError = (error: any, collectionName: string) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
        triggerLocalQuotaFallback();
      } else {
        handleFirestoreError(error, OperationType.GET, collectionName);
      }
    };

    const initializeDatabaseAndSync = async () => {
      if (isQuotaFallbackMode) {
        setLoading(false);
        return;
      }
      try {
        // Check if DB is already populated by checking posts collection
        const postsColRef = collection(db, 'posts');
        const postsSnap = await getDocs(postsColRef);

        if (postsSnap.empty) {
          console.log("Firestore is empty. Ready for authentic user actions.");
        }
      } catch (err: any) {
        console.error("An error occurred during Firestore seeding:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
          triggerLocalQuotaFallback();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDatabaseAndSync();

    // Attach reactive sync listeners
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      if (isQuotaFallbackMode) return;
      const list: User[] = [];
      snap.forEach((d) => list.push(d.data() as User));
      setUsers(list);
    }, (error) => {
      handleSubError(error, 'users');
    });

    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) => {
      if (isQuotaFallbackMode) return;
      const list: Post[] = [];
      snap.forEach((d) => list.push(d.data() as Post));
      setPosts(list);
    }, (error) => {
      handleSubError(error, 'posts');
    });

    const unsubLikes = onSnapshot(collection(db, 'likes'), (snap) => {
      if (isQuotaFallbackMode) return;
      const list: Like[] = [];
      snap.forEach((d) => list.push(d.data() as Like));
      setLikes(list);
    }, (error) => {
      handleSubError(error, 'likes');
    });

    const unsubComments = onSnapshot(collection(db, 'comments'), (snap) => {
      if (isQuotaFallbackMode) return;
      const list: Comment[] = [];
      snap.forEach((d) => list.push(d.data() as Comment));
      setComments(list);
    }, (error) => {
      handleSubError(error, 'comments');
    });

    const unsubFollowers = onSnapshot(collection(db, 'followers'), (snap) => {
      if (isQuotaFallbackMode) return;
      const list: Follower[] = [];
      snap.forEach((d) => list.push(d.data() as Follower));
      setFollowers(list);
    }, (error) => {
      handleSubError(error, 'followers');
    });

    let unsubWithdrawals = () => {};
    if (currentUserId) {
      unsubWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snap) => {
        if (isQuotaFallbackMode) return;
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
    if (currentUserId) {
      const qNotif = query(collection(db, 'notifications'), where('userId', '==', currentUserId));
      unsubNotifications = onSnapshot(qNotif, (snap) => {
        if (isQuotaFallbackMode) return;
        const list: Notification[] = [];
        snap.forEach((d) => list.push(d.data() as Notification));
        setNotifications(list);
      }, (error) => {
        handleSubError(error, 'notifications');
      });
    } else {
      setNotifications([]);
    }

    const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
      if (isQuotaFallbackMode) return;
      const list: AdBanner[] = [];
      snap.forEach((d) => list.push(d.data() as AdBanner));
      setAds(list);
    }, (error) => {
      handleSubError(error, 'ads');
    });

    return () => {
      unsubUsers();
      unsubPosts();
      unsubLikes();
      unsubComments();
      unsubFollowers();
      unsubWithdrawals();
      unsubNotifications();
      unsubAds();
    };
  }, [currentUserId, isQuotaFallbackMode]);

  // 2.5 Dynamic Admin-Only Post Reports subscription
  useEffect(() => {
    if (isQuotaFallbackMode) return;
    const matchedUser = users.find(u => u.id === currentUserId);
    const isUserAdmin = matchedUser?.role === 'admin' || matchedUser?.isAdmin === true || matchedUser?.email?.toLowerCase() === 'fresh.linksd@gmail.com';
    
    if (!currentUserId || !isUserAdmin) {
      setPostReports([]);
      return;
    }

    const unsubReports = onSnapshot(collection(db, 'postReports'), (snap) => {
      const list: PostReport[] = [];
      snap.forEach((d) => list.push(d.data() as PostReport));
      setPostReports(list);
    }, (error) => {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('Quota limit') || errMsg.includes('quota') || errMsg.includes('exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('Resource exhausted')) {
        triggerLocalQuotaFallback();
      } else {
        handleFirestoreError(error, OperationType.GET, 'postReports');
      }
    });

    return () => {
      unsubReports();
    };
  }, [currentUserId, users, isQuotaFallbackMode]);

  // 3. User Private Messages subscription
  useEffect(() => {
    if (!currentUserId) {
      setMessages([]);
      return;
    }

    // Load messages where user is the sender
    const qSender = query(collection(db, 'messages'), where('senderId', '==', currentUserId));
    const unsubSender = onSnapshot(qSender, (snap) => {
      setMessages((prev) => {
        const otherMsgs = prev.filter((m) => m.senderId !== currentUserId);
        const updatedSenderMsgs: Message[] = [];
        snap.forEach((doc) => updatedSenderMsgs.push(doc.data() as Message));
        const merged = [...otherMsgs, ...updatedSenderMsgs];
        return Array.from(new Map(merged.map((m) => [m.id, m])).values());
      });
    }, (error) => {
      console.error("Messages sender synchronization error:", error);
    });

    // Load messages where user is the receiver
    const qReceiver = query(collection(db, 'messages'), where('receiverId', '==', currentUserId));
    const unsubReceiver = onSnapshot(qReceiver, (snap) => {
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
      console.error("Messages receiver synchronization error:", error);
    });

    return () => {
      unsubSender();
      unsubReceiver();
    };
  }, [currentUserId]);

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
    if (!matched && email.toLowerCase() === 'fresh.linksd@gmail.com') {
      try {
        const defaultSuperAdmin: User = {
          id: `super_admin_seed_${Date.now()}`,
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
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      return result.user !== null;
    } catch (err) {
      console.error("Google authentication failed:", err);
      return false;
    }
  };

  // Sign out cleanly
  const logout = async () => {
    try {
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
    isPremium?: boolean
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
      isPremium: isPremium || false
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
    isPremium?: boolean
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
        if (isLikedAlready) {
          setLikes(prev => prev.filter(l => l.userId !== currentUserId || l.postId !== postId));
        } else {
          setLikes(prev => [...prev, { userId: currentUserId, postId }]);
          
          // Notify post owner locally
          const post = posts.find(p => p.id === postId);
          if (post && post.userId !== currentUserId) {
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
  };

  const isPostLiked = (postId: string) => {
    if (!currentUserId) return false;
    return likes.some(l => l.userId === currentUserId && l.postId === postId);
  };

  const getPostLikesCount = (postId: string) => {
    return likes.filter(l => l.postId === postId).length;
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

        // Notify post owner locally
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== currentUserId) {
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
    try {
      const cleanText = censorText(newText);
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        comment: cleanText,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `comments/${commentId}`);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `comments/${commentId}`);
    }
  };

  // Creators Following system
  const toggleFollowUser = async (targetUserId: string) => {
    if (!currentUserId || currentUserId === targetUserId) return;
    const followId = `${currentUserId}_${targetUserId}`;
    const followingAlready = followers.some(f => f.followerId === currentUserId && f.followingId === targetUserId);

    try {
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `followers/${followId}`);
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

    try {
      await setDoc(doc(db, 'messages', id), newMsg);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messages/${id}`);
    }
    return newMsg;
  };

  const editMessage = async (messageId: string, newText: string) => {
    try {
      const cleanText = censorText(newText);
      const msgRef = doc(db, 'messages', messageId);
      await updateDoc(msgRef, {
        message: cleanText,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messages/${messageId}`);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `messages/${messageId}`);
    }
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
    try {
      await updateDoc(doc(db, 'users', userId), { isBlocked: blocked });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  };

  const setRoleByAdmin = async (userId: string, role: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role, isAdmin: role === 'admin' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  };

  const verifyUserByAdmin = async (userId: string, approved: boolean, remarks?: string) => {
    try {
      if (approved) {
        await updateDoc(doc(db, 'users', userId), { 
          isApprovedByAdmin: true,
          clearanceRemarks: remarks || ""
        });
        await addNotification(
          userId,
          'report_decision',
          `Your identity document verification request has been APPROVED by the admin.${remarks ? ` Remarks: ${remarks}` : ''}`
        );
      } else {
        await updateDoc(doc(db, 'users', userId), { 
          isApprovedByAdmin: false, 
          hasVerifiedDetails: false,
          clearanceRemarks: remarks || ""
        });
        await addNotification(
          userId,
          'report_decision',
          `Your identity document verification request was REJECTED by the admin.${remarks ? ` Reason: ${remarks}` : ''}`
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
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
    try {
      await setDoc(doc(db, 'withdrawals', id), newRequest);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `withdrawals/${id}`);
    }
  };

  const updateWithdrawalStatusByAdmin = async (withdrawalId: string, status: 'approved' | 'rejected', remarks?: string) => {
    try {
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `withdrawals/${withdrawalId}`);
    }
  };

  // --- New Methods Implementation ---
  const addNotification = async (
    userId: string,
    type: 'like' | 'comment' | 'follow' | 'report_decision' | 'withdrawal_decision' | 'ad_alert' | 'system',
    message: string,
    postId?: string
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
      read: false
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), newNotification);
    } catch (err) {
      console.error("Error creating notification:", err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${id}`);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const userNotifs = notifications.filter(n => n.userId === currentUserId && !n.read);
      if (userNotifs.length === 0) return;
      const batch = writeBatch(db);
      userNotifs.forEach(notif => {
        batch.update(doc(db, 'notifications', notif.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
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
    title: string; 
    description: string; 
    targetUrl: string; 
    active: boolean; 
    clickCount?: number; 
    createdAt?: string;
    placement?: 'workspace' | 'bubble';
    welcomeBadge?: string;
    welcomeTitle?: string;
    welcomeText?: string;
  }) => {
    const id = adData.id || `ad_${Date.now()}`;
    const existingAd = ads.find(a => a.id === id);
    const placement = adData.placement || 'workspace';
    const newAd: AdBanner = {
      id,
      imageUrl: adData.imageUrl,
      title: adData.title,
      description: adData.description,
      targetUrl: adData.targetUrl,
      active: adData.active,
      createdAt: adData.createdAt || existingAd?.createdAt || new Date().toISOString(),
      clickCount: adData.clickCount !== undefined ? adData.clickCount : (existingAd?.clickCount || 0),
      placement,
      welcomeBadge: adData.welcomeBadge,
      welcomeTitle: adData.welcomeTitle,
      welcomeText: adData.welcomeText
    };

    try {
      await setDoc(doc(db, 'ads', id), newAd);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `ads/${id}`);
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      await deleteDoc(doc(db, 'ads', adId));
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'ads');
    }
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
        deletePost,
        updatePost,
        toggleLikePost,
        isPostLiked,
        getPostLikesCount,
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
        setRoleByAdmin,
        activeChatPartnerId,
        setActiveChatPartnerId,
        withdrawals,
        verifyUserByAdmin,
        requestWithdrawal,
        updateWithdrawalStatusByAdmin,
        notifications,
        postReports,
        ads,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        reportPost,
        resolveReport,
        createOrUpdateAd,
        deleteAd,
        trackAdClick,
        toggleAllAds
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
