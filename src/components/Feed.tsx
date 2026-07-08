/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { INTEREST_OPTIONS } from '../data/seedData';
import { Post, User, AdBanner } from '../types';
import { MultiPhotosLayout } from './MultiPhotosLayout';
import { BroadcastBanner } from './BroadcastBanner';
import { FeedPostSkeleton } from './SkeletonLoader';
import { VirtualPost } from './VirtualPost';
import { ArrowDown } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadToCloudinary, optimizeImageUrl } from '../lib/cloudinary';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  UserPlus, 
  UserCheck, 
  MapPin, 
  Eye, 
  Clock, 
  ArrowUpRight, 
  MessageCircle,
  Menu,
  Check,
  Send,
  Sparkles,
  Crown,
  Search,
  Edit3,
  Trash2,
  X,
  Upload,
  Loader2,
  Video,
  AlertTriangle,
  Bell,
  Megaphone,
  Link,
  ExternalLink,
  ShieldAlert,
  Lock,
  Coins,
  Cake,
  Compass,
  Vote,
  BarChart2,
  Crop,
  Database,
  WifiOff
} from 'lucide-react';

const COVER_SUGGESTIONS: Record<string, string[]> = {
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80'
  ],
  travel: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
  ],
  fitness: [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80'
  ],
  food: [
    'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80'
  ],
  culture: [
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
  ],
  business: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
  ]
};

interface FeedProps {
  onSelectUser: (userId: string) => void;
  onNavigateToChat: (userId: string) => void;
  activeCategoryFilter: string;
  setActiveCategoryFilter: (category: string) => void;
  isBookmarksOnly?: boolean;
}

export const Feed: React.FC<FeedProps> = ({ 
  onSelectUser, 
  onNavigateToChat,
  activeCategoryFilter,
  setActiveCategoryFilter,
  isBookmarksOnly = false
}) => {
  const {
    posts,
    users,
    followers,
    likes,
    comments,
    currentUser,
    toggleLikePost,
    isPostLiked,
    getPostLikesCount,
    addComment,
    getPostComments,
    toggleFollowUser,
    isFollowing,
    toggleSavePost,
    deletePost,
    updatePost,
    voteInPostPoll,
    incrementPostViews,
    editComment,
    deleteComment,
    updateProfile,
    userMap,
    reportPost,
    postReports,
    ads,
    trackAdClick,
    isQuotaFallbackMode,
    securityBlock,
    resolveSecurityChallenge,
    loading,
    refetchData,
    hasMorePosts,
    loadMorePosts,
    reactToPost,
    getPostReactions,
    getUserReaction,
    isOnline
  } = useSocialPlatform();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [localReactions, setLocalReactions] = useState<Record<string, string>>({});
  const [postRatios, setPostRatios] = useState<Record<string, 'auto' | '16/9' | '4/3' | '1/1'>>({});

  const renderPostPoll = (post: Post) => {
    if (!post.poll) return null;

    const options = post.poll.options;
    const votes = post.poll.votes || {};
    
    // Get total votes
    const optionVotes = options.map((_, idx) => votes[String(idx)]?.length || 0);
    const totalVotes = optionVotes.reduce((sum, v) => sum + v, 0);

    // Check if current user has voted
    const userVoteIdx = (() => {
      if (!currentUser) return null;
      const optIdx = Object.keys(votes).find(key => 
        votes[key]?.includes(currentUser.id)
      );
      return optIdx !== undefined ? Number(optIdx) : null;
    })();
    const hasVoted = userVoteIdx !== null;

    return (
      <div className="mt-4 p-5 bg-gradient-to-r from-orange-50/40 to-amber-50/10 border border-orange-500/10 rounded-2xl font-sans animate-fadeIn">
        <div className="flex items-center gap-2 mb-3">
          <Vote className="w-4 h-4 text-orange-600 shrink-0 animate-pulse" />
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 leading-snug">
            {post.poll.question || post.title}
          </h4>
        </div>

        <div className="space-y-2.5">
          {options.map((option, idx) => {
            const voteCount = optionVotes[idx];
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isMyVote = userVoteIdx === idx;

            if (hasVoted) {
              return (
                <div 
                  key={idx}
                  className={`relative overflow-hidden rounded-xl h-11 border transition-all ${
                    isMyVote 
                      ? 'border-orange-500 bg-orange-50/10' 
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  {/* Progress fill */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-orange-500/10 transition-all duration-500 ease-out" 
                    style={{ width: `${pct}%` }}
                  />
                  
                  {/* Content overlay */}
                  <div className="absolute inset-0 px-4 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 truncate text-zinc-800">
                      {isMyVote && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                      <span className="truncate">{option}</span>
                    </span>
                    <span className="text-zinc-500 shrink-0 font-mono ml-2">
                      {pct}% <span className="text-[10px] opacity-75">({voteCount} {voteCount === 1 ? 'vote' : 'votes'})</span>
                    </span>
                  </div>
                </div>
              );
            } else {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => voteInPostPoll(post.id, idx)}
                  className="w-full h-11 px-4 border border-zinc-200 hover:border-orange-500 bg-white hover:bg-orange-50/20 active:scale-[0.985] rounded-xl text-left text-xs font-bold text-zinc-750 hover:text-orange-600 transition-all duration-200 cursor-pointer"
                >
                  {option}
                </button>
              );
            }
          })}
        </div>

        <div className="mt-3.5 flex items-center justify-between text-[10px] font-bold text-zinc-450 uppercase tracking-wide px-1">
          <span>{totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}</span>
          {hasVoted && <span className="text-orange-600">✓ Vote Registered</span>}
        </div>
      </div>
    );
  };

  const renderRatioToggle = (postId: string, currentRatio: 'auto' | '16/9' | '4/3' | '1/1') => {
    const ratios: ('auto' | '16/9' | '4/3' | '1/1')[] = ['auto', '16/9', '4/3', '1/1'];
    const nextRatio = ratios[(ratios.indexOf(currentRatio) + 1) % ratios.length];
    const ratioLabels = {
      'auto': 'Original/Auto',
      '16/9': '16:9 Landscape',
      '4/3': '4:3 Standard',
      '1/1': '1:1 Square'
    };

    return (
      <button
        type="button"
        id={`ratio-toggle-btn-${postId}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent opening the details modal when clicking the ratio button
          setPostRatios(prev => ({ ...prev, [postId]: nextRatio }));
        }}
        className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-md hover:bg-zinc-900 text-white py-1 px-2.5 text-[9px] font-bold tracking-wider uppercase rounded-full flex items-center gap-1 transition-all border border-white/10 shadow-md cursor-pointer z-10"
        title="Adjust image display aspect ratio"
      >
        <Crop className="w-3 h-3 text-orange-500" />
        <span>Ratio: {ratioLabels[currentRatio]}</span>
      </button>
    );
  };

  const getUserReactionWithLocal = (postId: string) => {
    if (localReactions[postId] !== undefined) {
      return localReactions[postId] === 'none' ? null : localReactions[postId];
    }
    return getUserReaction(postId);
  };

  const getPostReactionsWithLocal = (postId: string) => {
    const baseReactions = { ...getPostReactions(postId) };
    const baseUserReaction = getUserReaction(postId);
    const localUserReaction = localReactions[postId];

    if (localUserReaction !== undefined) {
      if (baseUserReaction) {
        if (baseReactions[baseUserReaction] > 0) {
          baseReactions[baseUserReaction]--;
        }
      }
      if (localUserReaction !== 'none') {
        baseReactions[localUserReaction] = (baseReactions[localUserReaction] || 0) + 1;
      }
    }
    return baseReactions;
  };

  const handleReactClick = (postId: string, emoji: string) => {
    const currentReaction = getUserReactionWithLocal(postId);
    const nextReaction = currentReaction === emoji ? 'none' : emoji;
    
    // Apply local state immediately for instant feedback
    setLocalReactions(prev => ({ ...prev, [postId]: nextReaction }));
    
    // Trigger the backend/context update
    reactToPost(postId, emoji).catch(err => {
      console.error("[Feed] Backend reaction sync failed, rolling back:", err);
      setLocalReactions(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
    });
  };

  // Pull-to-refresh states
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      touchStartRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null || !isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    
    if (diff > 0) {
      const resistance = Math.min(diff * 0.4, 90);
      setPullY(resistance);
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    touchStartRef.current = null;

    if (pullY >= 65) {
      setIsRefreshing(true);
      setPullY(50);
      try {
        await refetchData();
      } catch (err) {
        console.warn("Pull-to-refresh refetch failed:", err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 500);
      }
    } else {
      setPullY(0);
    }
  };

  // Birthday & Security Challenge state
  const [showBirthdayCard, setShowBirthdayCard] = useState(true);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [challengeError, setChallengeError] = useState('');
  const [num1, setNum1] = useState(() => Math.floor(Math.random() * 9) + 2);
  const [num2, setNum2] = useState(() => Math.floor(Math.random() * 8) + 2);

  const isBirthdayToday = useMemo(() => {
    if (!currentUser || !currentUser.dob) return false;
    try {
      const today = new Date();
      const dobDate = new Date(currentUser.dob + 'T00:00:00'); // enforce local interpretation
      return today.getMonth() === dobDate.getMonth() && today.getDate() === dobDate.getDate();
    } catch (e) {
      return false;
    }
  }, [currentUser]);

  const handleChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(challengeAnswer) === num1 * num2) {
      resolveSecurityChallenge();
      setChallengeAnswer('');
      setChallengeError('');
      // Generate new numbers for next time
      setNum1(Math.floor(Math.random() * 9) + 2);
      setNum2(Math.floor(Math.random() * 8) + 2);
    } else {
      setChallengeError('Incorrect answer. Please try again to verify humanity.');
    }
  };

  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Controversial Topic / Disinformation');
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportingError, setReportingError] = useState('');
  const [reportingSuccess, setReportingSuccess] = useState(false);

  const [useAlgorithm, setUseAlgorithm] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFloatingReactionBarPostId, setActiveFloatingReactionBarPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const matchingUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q)) ||
      (u.interests && u.interests.some(i => i.toLowerCase().includes(q)))
    );
  }, [users, searchQuery]);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedWorkspaceAd, setSelectedWorkspaceAd] = useState<AdBanner | null>(null);
  const [activeDetailsImage, setActiveDetailsImage] = useState<string | null>(null);
  const [detailsViewMode, setDetailsViewMode] = useState<'image' | 'video'>('image');

  const handlePurchaseSubscription = async (creatorId: string, price: number, tier: 'Premium Member' | 'Elite Creator' = 'Premium Member') => {
    if (!currentUser) {
      alert("Authentication required to purchase creator subscriptions.");
      return;
    }
    const currentBalance = currentUser.walletBalance || 0;
    if (currentBalance < price) {
      alert(`Insufficient Funds. Your wallet balance ($${currentBalance.toFixed(2)}) is lower than the subscription price ($${price.toFixed(2)}). Fill your wallet or use credits! 💰`);
      return;
    }

    try {
      const updatedSubscribed = [...(currentUser.subscribedCreators || [])];
      if (!updatedSubscribed.includes(creatorId)) {
        updatedSubscribed.push(creatorId);
      }

      const updatedTiers = { ...(currentUser.subscribedTiers || {}) };
      updatedTiers[creatorId] = tier;

      await updateProfile({
        walletBalance: currentBalance - price,
        subscribedCreators: updatedSubscribed,
        subscribedTiers: updatedTiers
      });

      const creator = userMap[creatorId];
      if (creator) {
        const creatorBalance = creator.walletBalance || 0;
        await updateDoc(doc(db, 'users', creatorId), {
          walletBalance: creatorBalance + price
        });
      }

      alert(`Congratulations! You have subscribed to this creator as an [${tier}] successfully. Exclusive tier badge unlocked!`);
      if (selectedPost) {
        setSelectedPost({ ...selectedPost });
      }
    } catch (e) {
      alert("Transaction failed: " + e);
    }
  };

  const handleUnlockWithCredits = async (postId: string, creatorId: string, creditsCost: number) => {
    if (!currentUser) {
      alert("Authentication required to unlock premium articles.");
      return;
    }
    const currentCredits = currentUser.walletCredits || 0;
    if (currentCredits < creditsCost) {
      alert(`Insufficient Credits. Unlocking requires ${creditsCost} credits. You have ${currentCredits} pts.`);
      return;
    }

    try {
      const updatedSubscribed = [...(currentUser.subscribedCreators || []), creatorId];
      await updateProfile({
        walletCredits: currentCredits - creditsCost,
        subscribedCreators: updatedSubscribed
      });

      const creator = userMap[creatorId];
      if (creator) {
        const creatorCredits = creator.walletCredits || 0;
        await updateDoc(doc(db, 'users', creatorId), {
          walletCredits: creatorCredits + creditsCost
        });
      }

      alert(`Success! Unlocked publication using ${creditsCost} credits.`);
      if (selectedPost) {
        setSelectedPost({ ...selectedPost });
      }
    } catch (e) {
      alert("Verification failed: " + e);
    }
  };

  useEffect(() => {
    if (selectedPost) {
      setActiveDetailsImage(selectedPost.mediaUrl || (selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 ? selectedPost.mediaUrls[0] : null));
      setDetailsViewMode(selectedPost.videoUrl ? 'video' : 'image');
      
      // Increment views count
      incrementPostViews(selectedPost.id);
      
      // Prevent recursive update but ensure details view has the incremented view count
      setSelectedPost(prev => prev && prev.id === selectedPost.id ? { ...prev, views: (prev.views || 0) + 1 } : prev);
    } else {
      setActiveDetailsImage(null);
      setDetailsViewMode('image');
    }
  }, [selectedPost?.id]);

  const [newCommentText, setNewCommentText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const locDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for location dropdown query
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locDropdownRef.current && !locDropdownRef.current.contains(event.target as Node)) {
        setIsLocDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Post Edit fields
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostCategory, setEditPostCategory] = useState('');
  const [editPostTagsText, setEditPostTagsText] = useState('');
  const [editPostMediaUrl, setEditPostMediaUrl] = useState('');
  const [editUseLocalUpload, setEditUseLocalUpload] = useState(false);
  const [editIsDragging, setEditIsDragging] = useState(false);
  const [editUploadError, setEditUploadError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const startEditingPost = (post: Post) => {
    setEditingPost(post);
    setEditPostTitle(post.title || '');
    setEditPostContent(post.content || '');
    setEditPostCategory(post.category || '');
    setEditPostTagsText(post.tags ? post.tags.join(', ') : '');
    setEditPostMediaUrl(post.mediaUrl || '');
    setEditUseLocalUpload(!!post.mediaUrl && !post.mediaUrl.includes('unsplash.com'));
    setEditUploadError('');
  };

  // Post Edit states
  const [isUploadingEditCover, setIsUploadingEditCover] = useState(false);
  const [editCoverUploadProgress, setEditCoverUploadProgress] = useState('');

  const handleEditFileRead = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setEditUploadError('Please select or drop a valid cover image file.');
      return;
    }
    if (file.size > 1572864) {
      setEditUploadError('Local cover image is too heavy. Please use an image under 1.5MB.');
      return;
    }
    
    setEditUploadError('');
    setIsUploadingEditCover(true);
    setEditCoverUploadProgress('Uploading to Cloudinary... 0%');

    try {
      const url = await uploadToCloudinary(file, (progress) => {
        setEditCoverUploadProgress(`Uploading to Cloudinary... ${progress}%`);
      });
      setEditPostMediaUrl(url);
    } catch (err: any) {
      console.error("Post edit cover upload failed:", err);
      setEditUploadError(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploadingEditCover(false);
      setEditCoverUploadProgress('');
    }
  };

  const handleUpdatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || isUpdating) return;
    try {
      setIsUpdating(true);
      const tagsArray = editPostTagsText.split(',').map(t => t.trim()).filter(Boolean);
      await updatePost(editingPost.id, editPostTitle, editPostContent, editPostCategory, tagsArray, editPostMediaUrl);
      setEditingPost(null);
    } catch (err) {
      console.error("Error updating post:", err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Share notification state
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Compute unique locations of authors
  const uniqueLocations = useMemo(() => {
    const locSet = new Set<string>();
    posts.forEach(p => {
      if (p.status === 'published') {
        const author = userMap[p.userId];
        if (author && author.location) {
          locSet.add(author.location);
        }
      }
    });
    return Array.from(locSet).sort();
  }, [posts, userMap]);

  const filteredLocationOptions = useMemo(() => {
    const query = locationSearch.toLowerCase().trim();
    if (!query) return uniqueLocations;
    return uniqueLocations.filter(loc => loc.toLowerCase().includes(query));
  }, [uniqueLocations, locationSearch]);

  // Compute recommendation scores and rank posts
  const rankedPosts = useMemo(() => {
    let list = [...posts].filter(p => p.status === 'published');

    // Filter by bookmarks if requested
    if (isBookmarksOnly && currentUser) {
      const savedIds = currentUser.savedPosts || [];
      list = list.filter(p => savedIds.includes(p.id));
    }

    // Apply category filter
    if (activeCategoryFilter !== 'all') {
      list = list.filter(p => p.category === activeCategoryFilter);
    }

    // Apply location filter
    if (selectedLocation !== 'all') {
      list = list.filter(p => {
        const author = userMap[p.userId];
        if (!author || !author.location) return false;
        return author.location.toLowerCase().includes(selectedLocation.toLowerCase());
      });
    }

    // Apply search filter (title, description, tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (!useAlgorithm || !currentUser) {
      // Natural chronological sort
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Advanced Affinity & Recency-Decay Sorting Algorithm
    return list.map(post => {
      let score = 0;

      // 1. Prioritize followed authors (+150)
      const authorFollowed = isFollowing(post.userId);
      if (authorFollowed) score += 150;

      // 2. Interest matching (+80 if category matches user interests)
      const categoryMatch = currentUser.interests.includes(post.category);
      if (categoryMatch) score += 80;

      // 3. Tag intersection matches (+20 per tag matching user interests)
      const matchingTagsQty = post.tags.filter(tag => 
        currentUser.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
      ).length;
      score += matchingTagsQty * 20;

      // 4. Engagement Signals (Likes, comments weight)
      const postLikes = likes.filter(l => l.postId === post.id).length;
      const postComments = comments.filter(c => c.postId === post.id).length;
      score += (postLikes * 8);
      score += (postComments * 18);

      // 5. Reading Time bump (+3 pts per min to encourage richer content)
      score += post.readingTime * 3;

      // 6. Premium Post boost (+25 pts for high-quality premium blogs)
      if (post.isPremium) {
        score += 25;
      }

      // 7. Recency Factor (Newer posts get substantial priority)
      const postAgeInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 3600);
      const recencyBoost = Math.max(0, 100 - (postAgeInHours * 1.5)); // smooth linear decay first few days
      score += recencyBoost;

      // 8. Content Safety & Report Penalty
      // If a post is reported, drop its authority score dramatically (-500) so it sinks to the deep bottom
      const isReported = postReports.some(rep => rep.postId === post.id && rep.status === 'pending');
      if (isReported) {
        score -= 500;
      }

      return { post, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.post);

  }, [posts, userMap, isBookmarksOnly, activeCategoryFilter, selectedLocation, searchQuery, useAlgorithm, currentUser, followers, likes, comments, postReports]);

  const handleShare = (postId: string) => {
    setCopiedPostId(postId);
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
    setToastMessage('Link Copied! 🔗');
    setTimeout(() => {
      setCopiedPostId(null);
    }, 2000);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCreateComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await addComment(postId, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div 
      className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 select-none" 
      id="feed-screen-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Side: Main Feed Column */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Pull to Refresh Indicator */}
          {(pullY > 0 || isRefreshing) && (
            <div 
              style={{ height: `${pullY}px` }}
              className="w-full flex items-center justify-center overflow-hidden transition-all duration-150 ease-out bg-orange-50/50 border border-orange-100/30 rounded-3xl"
              id="pull-to-refresh-indicator"
            >
              <div className="flex items-center gap-2.5 text-orange-600 font-sans font-black text-[10px] tracking-widest uppercase">
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Refreshing Feed...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown 
                      className="w-4 h-4 text-orange-500 transition-transform duration-200"
                      style={{ transform: pullY >= 65 ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                    <span>{pullY >= 65 ? 'Release to Refresh' : 'Pull to Refresh'}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Admin Broadcast Announcements and Polls Banner */}
          <BroadcastBanner />
      
      {/* Dynamic Quota Fallback Mode Notice Badge */}
      {isQuotaFallbackMode && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-left shadow-sm"
          id="quota-alert-badge"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 select-none">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded-md leading-none">DEMO ACCELERATOR PASSIVE</span>
            <p className="text-zinc-700 font-sans font-medium text-xs mt-1.5 leading-relaxed">
              Google Cloud Firestore daily read/write limits exceeded. A high-resilience **local sandbox database** of curated campaign seeds has been fully synchronized so you can test comments, post creations, follows, and sponsor ad flows seamlessly on client session!
            </p>
          </div>
        </motion.div>
      )}

      {/* Birthday Celebration Greeting Card */}
      {isBirthdayToday && showBirthdayCard && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white rounded-3xl p-6 shadow-xl overflow-hidden"
          id="birthday-wishes-card"
        >
          {/* Background decorative bubbles */}
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={() => setShowBirthdayCard(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 outline-none"
            id="dismiss-birthday-btn"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4 items-start relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center border border-white/20 text-white shadow-inner animate-bounce shrink-0">
              <Cake className="w-7 h-7" />
            </div>
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-extrabold bg-white/20 border border-white/30 px-2 py-0.5 rounded-full uppercase tracking-wider">ANNIVERSARY MILESTONE</span>
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight leading-none text-white font-sans">
                Happy Birthday, {currentUser?.name || 'FreshLink Creator'}! 🎂
              </h3>
              <p className="text-white/90 text-xs md:text-sm leading-relaxed max-w-xl font-medium">
                The entire FreshLink connection ecosystem wishes you a beautiful birthday filled with inspiration, safety, and wonderful creative discoveries. Keep building elite links! ✨
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Spam Defense Security Gate Modal */}
      {securityBlock && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[999] font-sans" id="security-shield-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white border border-zinc-200 max-w-md w-full shadow-2xl rounded-3xl overflow-hidden p-6 text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-600 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold font-mono tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full uppercase">Shield Security Clearance</span>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">Spam Defense Gate Active</h3>
              <p className="text-zinc-500 text-xs leading-relaxed font-sans font-medium">
                FreshLink detected rapid clicks or automated requests. To block brute-force hacking attempts and defend database server limits, please solve this challenge to resume.
              </p>
            </div>

            <form onSubmit={handleChallengeSubmit} className="space-y-4 bg-zinc-50 border border-zinc-150 p-4 rounded-2xl">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Security Mathematics Challenge</label>
                <p className="text-lg font-black text-zinc-800 tracking-tight font-mono py-1">
                  How much is {num1} &times; {num2}?
                </p>
              </div>
              
              <input
                type="number"
                required
                id="security-challenge-answer"
                placeholder="Your answer"
                value={challengeAnswer}
                onChange={(e) => setChallengeAnswer(e.target.value)}
                className="w-full text-center px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold bg-white focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-zinc-950"
                autoFocus
              />

              {challengeError && (
                <p className="text-xs text-rose-600 font-semibold" id="challenge-error-msg">{challengeError}</p>
              )}

              <button
                type="submit"
                id="submit-security-challenge-btn"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-rose-600/10 uppercase tracking-wider outline-none"
              >
                Unlock Connection Session
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Elegant Header Block */}
      <header className="flex flex-col md:flex-row justify-between items-start gap-4 mb-2">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-orange-600 font-sans">
            {isBookmarksOnly ? 'ARCHIVED HIGHLIGHTS' : 'CURATED FOR YOU'}
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 leading-none">
            {isBookmarksOnly ? 'Saved Articles' : new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h2>
        </div>
      </header>

      {/* Search and Sorting controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, posts, or #tags..."
            className="w-full pl-10 pr-4 py-3 text-xs font-semibold rounded-xl border border-zinc-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-zinc-50/50 font-sans transition-all text-zinc-805 placeholder-zinc-400 font-bold"
          />
        </div>

        {/* Dynamic Location Filter Option - Type and Select Combobox */}
        <div ref={locDropdownRef} className="relative select-none shrink-0" id="feed-location-filter">
          <button
            type="button"
            onClick={() => {
              setIsLocDropdownOpen(!isLocDropdownOpen);
              setLocationSearch('');
            }}
            className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 hover:bg-zinc-100 transition cursor-pointer text-zinc-700 font-sans font-bold uppercase text-[10px] tracking-wider outline-none min-w-[130px] justify-between"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{selectedLocation === 'all' ? 'All Regions' : selectedLocation}</span>
            </span>
            <svg className={`w-2.5 h-2.5 fill-current text-zinc-400 transition-transform duration-200 ${isLocDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>

          {isLocDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-64 bg-white border border-zinc-200 shadow-xl rounded-2xl p-2.5 z-55 font-sans animate-in fade-in slide-in-from-top-1 duration-100">
              {/* Search input inside the select popover */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Type location to filter..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 outline-none focus:border-orange-500 bg-zinc-55 transition-all text-zinc-805 placeholder-zinc-400"
                  autoFocus
                />
                {locationSearch && (
                  <button
                    type="button"
                    onClick={() => setLocationSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation('all');
                    setIsLocDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                    selectedLocation === 'all' 
                      ? 'bg-orange-50/80 text-orange-600 font-extrabold' 
                      : 'text-zinc-600 hover:bg-zinc-55 hover:text-zinc-900'
                  }`}
                >
                  <span>All Regions</span>
                  {selectedLocation === 'all' && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                </button>

                {/* Show custom text search button if it doesn't match an existing location */}
                {locationSearch.trim() && !uniqueLocations.some(l => l.toLowerCase() === locationSearch.toLowerCase().trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation(locationSearch.trim());
                      setIsLocDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 text-[10px] font-bold tracking-wider rounded-lg border border-dashed border-orange-200 bg-orange-50/20 text-orange-600 hover:bg-orange-50 transition`}
                  >
                    <span className="truncate">Filter by "{locationSearch.trim()}"</span>
                    <span className="text-[8px] bg-orange-100 text-orange-600 px-1 py-0.2 rounded font-extrabold shrink-0 ml-1">Custom</span>
                  </button>
                )}

                {/* Existing matched options */}
                {filteredLocationOptions.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(loc);
                      setIsLocDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${
                      selectedLocation === loc 
                        ? 'bg-orange-50/80 text-orange-600 font-extrabold' 
                        : 'text-zinc-600 hover:bg-zinc-55 hover:text-zinc-900'
                    }`}
                  >
                    <span className="truncate">{loc}</span>
                    {selectedLocation === loc && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                  </button>
                ))}

                {filteredLocationOptions.length === 0 && !locationSearch.trim() && (
                  <div className="text-center py-4 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    No regions available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Algorithm vs Cron Switch */}
        <div className="flex items-center gap-1 bg-zinc-100/80 p-1.5 rounded-xl border border-zinc-200/20" id="feed-sorting-toggles">
          <button
            id="algo-sort-btn"
            onClick={() => setUseAlgorithm(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              useAlgorithm
                ? 'bg-white text-zinc-950 shadow-sm font-black'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Smart Feed
          </button>
          <button
            id="recent-sort-btn"
            onClick={() => setUseAlgorithm(false)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              !useAlgorithm
                ? 'bg-white text-zinc-950 shadow-sm font-black'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Recent
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scrolling tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-hide select-none" id="categories-filter-bar">
        <button
          id="category-tab-all"
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-4.5 py-2 text-[10.5px] font-extrabold uppercase tracking-widest transition-smooth rounded-full cursor-pointer ${
            activeCategoryFilter === 'all'
              ? 'bg-zinc-950 text-white shadow-xs'
              : 'bg-white border border-stone-200/60 hover:border-zinc-300 text-zinc-600 hover:bg-stone-50'
          }`}
        >
          All Topics
        </button>
        {INTEREST_OPTIONS.map((cat) => (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => setActiveCategoryFilter(cat.id)}
            className={`px-4.5 py-2 text-[10.5px] font-extrabold uppercase tracking-widest transition-smooth flex items-center gap-1.5 rounded-full cursor-pointer ${
              activeCategoryFilter === cat.id
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white border border-stone-200/60 hover:border-zinc-300 text-zinc-600 hover:bg-stone-50'
            }`}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Active Ad Banners inside the top white space */}
      {(() => {
        if (loading) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((idx) => (
                <div 
                  key={idx}
                  className="bg-stone-50/50 border border-stone-200/40 rounded-3xl p-5 md:p-6 flex flex-col items-center gap-6 shadow-sm animate-pulse"
                >
                  <div className="w-full h-32 rounded-2xl bg-zinc-200" />
                  <div className="w-full space-y-2">
                    <div className="h-3.5 bg-zinc-200 rounded w-3/4 mx-auto" />
                    <div className="h-2.5 bg-zinc-100 rounded w-1/2 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          );
        }

        const activeAds = ads.filter(a => a.active && (a.placement || 'workspace') === 'workspace').slice(0, 3);
        if (activeAds.length === 0) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {activeAds.map(activeAd => (
              <div 
                key={activeAd.id}
                id={`ad-banner-${activeAd.id}`}
                className="bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200/60 rounded-3xl p-5 md:p-6 flex flex-col items-center gap-6 shadow-sm overflow-hidden relative group cursor-pointer transition hover:border-amber-300"
                onClick={() => {
                  setSelectedWorkspaceAd(activeAd);
                }}
              >
                {/* Ad Poster Image Column */}
                {activeAd.imageUrl && (
                  <div className="w-full h-32 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 bg-white relative">
                    <img 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      src={activeAd.imageUrl} 
                      alt={activeAd.title}
                      className="w-full h-full object-cover transition duration-505 group-hover:scale-105" 
                    />
                  </div>
                )}
                <div className="text-center">
                  <h4 className="font-sans font-black text-xs text-zinc-900 uppercase tracking-tighter mb-1">{activeAd.title}</h4>
                  <p className="text-[10px] text-zinc-500 line-clamp-2">{activeAd.description}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}


      {/* Search results for Users / Creators */}
      {searchQuery.trim() && (
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-3xl p-5 space-y-4 shadow-xs" id="user-search-results">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-zinc-500">
                Matching People & Creators ({matchingUsers.length})
              </span>
            </div>
            {matchingUsers.length > 0 && (
              <span className="text-[9px] text-zinc-400 font-sans font-bold uppercase tracking-wide">
                Instantly follow & discover profiles
              </span>
            )}
          </div>
          
          {matchingUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {matchingUsers.slice(0, 6).map((u) => {
                const isMe = currentUser?.id === u.id;
                const isFollowed = isFollowing(u.id);
                const followersCount = followers.filter(f => f.followingId === u.id).length;
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-zinc-200/60 hover:border-orange-200 hover:shadow-md transition-all p-3.5 rounded-2xl flex items-center gap-3 relative min-w-0"
                  >
                    <img
                      src={u.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"}
                      alt={u.name}
                      onClick={() => onSelectUser(u.id)}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-100 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5 text-left">
                      <h4 
                        onClick={() => onSelectUser(u.id)}
                        className="text-xs font-black uppercase text-zinc-950 truncate tracking-wide cursor-pointer hover:text-orange-600 transition-colors"
                      >
                        {u.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate font-sans leading-none">{u.bio || "No bio added yet."}</p>
                      <p className="text-[9px] font-mono text-zinc-400 leading-none font-bold uppercase">{followersCount} Followers</p>
                    </div>

                    {!isMe && currentUser && (
                      <button
                        type="button"
                        onClick={() => toggleFollowUser(u.id)}
                        className={`px-3 py-1.5 font-sans font-extrabold text-[9px] uppercase tracking-wider rounded-xl border transition-all shrink-0 cursor-pointer outline-none ${
                          isFollowed
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                            : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-xs shadow-orange-600/10'
                        }`}
                      >
                        {isFollowed ? 'Followed' : 'Follow'}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-white border border-dashed border-zinc-200 rounded-2xl">
              <p className="text-xs text-zinc-400 font-sans font-bold uppercase tracking-wide">No creators match "{searchQuery}"</p>
              <p className="text-[10px] text-zinc-400 font-sans mt-1">Try another search or find them under #tags.</p>
            </div>
          )}
        </div>
      )}


      {/* Blogs / Posts Container */}
      <div className="space-y-8" id="feed-post-list">
        {loading ? (
          <>
            <FeedPostSkeleton />
            <FeedPostSkeleton />
            <FeedPostSkeleton />
          </>
        ) : rankedPosts.length > 0 ? (
          rankedPosts.map((post) => {
            const author = userMap[post.userId];
            const isAuthorLoading = !author;
            const authorName = author?.name || "Loading writer...";
            const authorImg = author?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
            const authorLoc = author?.location;

            const isLiked = isPostLiked(post.id);
            const likesCount = getPostLikesCount(post.id);
            const commentsCount = comments.filter(c => c.postId === post.id).length;
            const authorIsMe = currentUser?.id === post.userId;
            const authorIsFollowed = isFollowing(post.userId);

            const pollVotersCount = (() => {
              if (!post.poll?.votes) return 0;
              let total = 0;
              for (const key of Object.keys(post.poll.votes)) {
                const list = post.poll.votes[key] as unknown;
                if (Array.isArray(list)) {
                  total += list.length;
                }
              }
              return total;
            })();

            // Title styling helper mimicking "WHY Code IS THE NEW LATIN"
            const styledTitleContent = (() => {
              const words = post.title.split(' ');
              if (words.length <= 1) return <span className="uppercase">{post.title}</span>;
              
              // Highlight the second word, or last word in serif-italic lowercase
              const hIndex = words.length > 2 ? 1 : words.length - 1;
              return (
                <span className="uppercase tracking-tighter">
                  {words.map((w, idx) => {
                    const isHigh = idx === hIndex;
                    return (
                      <span key={idx}>
                        {idx > 0 && ' '}
                        {isHigh ? (
                          <span className="serif-italic font-normal text-orange-600 inline-block normal-case tracking-normal pl-1.5 pr-0.5">
                            {w.toLowerCase()}
                          </span>
                        ) : (
                          <span>{w}</span>
                        )}
                      </span>
                    );
                  })}
                </span>
              );
            })();

            return (
              <VirtualPost key={post.id} id={post.id}>
                <article
                  id={`post-card-${post.id}`}
                  className="bg-white border border-stone-200/45 rounded-[2rem] card-shadow hover:shadow-2xl hover:scale-[1.012] hover:-translate-y-1 hover:border-stone-300/65 transition-all duration-300 ease-out overflow-hidden transform"
                >
                  {/* Author Info row */}
                  <div className="p-6 flex items-center justify-between border-b border-stone-100/50 bg-white">
                    <div className="flex items-center gap-3">
                      <button
                        id={`post-${post.id}-author-avatar`}
                        onClick={() => author && onSelectUser(author.id)}
                        className="shrink-0 relative focus:outline-none"
                        disabled={isAuthorLoading}
                      >
                        <img
                          loading="lazy"
                          src={authorImg}
                          alt={authorName}
                          referrerPolicy="no-referrer"
                          className={`w-10 h-10 rounded-full object-cover border border-zinc-100 shadow-inner ${isAuthorLoading ? 'animate-pulse bg-zinc-200 opacity-60' : ''}`}
                        />
                      </button>
                      <div>
                        {isAuthorLoading ? (
                          <div className="space-y-1 text-left">
                            <div className="h-3 bg-zinc-200 rounded w-28 animate-pulse" />
                            <div className="h-2 bg-zinc-100 rounded w-16 animate-pulse" />
                          </div>
                        ) : (
                          <>
                            <button
                              id={`post-${post.id}-author-name`}
                              onClick={() => onSelectUser(author.id)}
                              className="font-semibold text-xs text-zinc-900 hover:text-orange-650 block text-left transition-all"
                            >
                              {authorName}
                            </button>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-sans uppercase mt-0.5 font-medium">
                              {authorLoc && (
                                <div className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-zinc-450" />
                                  <span>{authorLoc.split(',')[0]}</span>
                                </div>
                              )}
                              <span>•</span>
                              <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Follow actions button */}
                    {!authorIsMe && currentUser && author && (
                      <button
                        id={`follow-author-btn-${post.id}`}
                        onClick={() => toggleFollowUser(author.id)}
                        className={`flex items-center gap-1 px-3.5 py-1.5 font-sans text-[10px] font-bold uppercase tracking-wider rounded-full transition-all border-0 focus:outline-none ${
                          authorIsFollowed
                            ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                        }`}
                      >
                        {authorIsFollowed ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-orange-600" />
                            <span>Follow</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Cover Image and Video Attachment indicators */}
                  {post.mediaUrls && post.mediaUrls.length > 0 ? (
                    <div
                      id={`post-${post.id}-cover-gallery`}
                      onClick={() => setSelectedPost(post)}
                      className="cursor-pointer px-6 pt-4"
                    >
                      <div className="rounded-2xl overflow-hidden border border-stone-200/40">
                        <MultiPhotosLayout 
                          images={[post.mediaUrl, ...post.mediaUrls].filter(Boolean) as string[]} 
                          imageRatio={post.imageRatio}
                        />
                      </div>
                    </div>
                  ) : post.mediaUrl ? (
                    (() => {
                      const currentRatio = postRatios[post.id] || post.imageRatio || 'auto';
                      
                      let containerClasses = "cursor-pointer overflow-hidden relative rounded-2xl border border-stone-200/45 group flex justify-center items-center w-full bg-stone-100/50 transition-all duration-300 ";
                      let imgClasses = "transition-smooth group-hover:scale-[1.01] ";

                      if (currentRatio === '16/9') {
                        containerClasses += "aspect-video";
                        imgClasses += "w-full h-full object-cover";
                      } else if (currentRatio === '4/3') {
                        containerClasses += "aspect-[4/3]";
                        imgClasses += "w-full h-full object-cover";
                      } else if (currentRatio === '1/1') {
                        containerClasses += "aspect-square";
                        imgClasses += "w-full h-full object-cover";
                      } else {
                        containerClasses += "h-auto max-h-[500px] min-h-[220px]";
                        imgClasses += "w-full h-auto max-h-[500px] object-contain bg-stone-50/50";
                      }

                      return (
                        <div className="px-6 pt-4">
                          <div 
                            id={`post-${post.id}-cover`}
                            onClick={() => setSelectedPost(post)}
                            className={containerClasses}
                          >
                            <img
                              loading="lazy"
                              src={optimizeImageUrl(post.mediaUrl, { width: 800, crop: 'limit' })}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className={imgClasses}
                            />
                            
                            {/* Floating Aspect Ratio Adjustment button */}
                            {renderRatioToggle(post.id, currentRatio)}

                            <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-md text-white py-1.5 px-3 text-[10px] tracking-widest uppercase rounded-full font-extrabold shadow-sm">
                              #{post.category}
                            </div>
                            {post.videoUrl && (
                              <div className="absolute bottom-4 right-4 bg-orange-600 text-white flex items-center gap-1 py-1.5 px-3 text-[9px] tracking-wider uppercase rounded-full font-extrabold shadow-md border border-orange-500/20">
                                <Video className="w-3 h-3 text-white animate-pulse" />
                                <span>Has Video</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : post.videoUrl ? (
                    <div className="px-6 pt-4">
                      <div 
                        id={`post-${post.id}-video-cover`}
                        onClick={() => setSelectedPost(post)}
                        className="cursor-pointer overflow-hidden aspect-video relative bg-zinc-950 rounded-2xl border border-stone-200/45 flex items-center justify-center group"
                      >
                      <video
                        src={post.videoUrl}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/95 group-hover:bg-orange-600 text-zinc-900 group-hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg scale-100 group-hover:scale-105">
                          <Video className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-zinc-850 py-1.5 px-3 text-[10px] tracking-wider rounded-full font-bold shadow-sm">
                        #{post.category}
                      </div>
                    </div>
                    </div>
                  ) : null}

                  {/* Card Title & Content Summary */}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {!post.mediaUrl && (
                          <span className="bg-orange-50 text-orange-600 font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">
                            #{post.category}
                          </span>
                        )}
                        {!isOnline && (
                          <span className="bg-amber-500/10 text-amber-700 border border-amber-550/20 font-black text-[8.5px] uppercase tracking-wide px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-sans shrink-0">
                            <Database className="w-2.5 h-2.5 text-amber-600" />
                            Offline-Cached
                          </span>
                        )}
                      </div>
                      {post.isPremium && (
                        <span className="bg-amber-550/10 text-amber-700 border border-amber-205 font-black text-[8.5px] uppercase tracking-wide px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-sans shrink-0">
                          <Lock className="w-2.5 h-2.5 text-amber-600" />
                          Premium Member
                        </span>
                      )}
                    </div>

                    <h3 
                      id={`post-title-${post.id}`}
                      onClick={() => setSelectedPost(post)}
                      className="font-extrabold text-xl md:text-2xl tracking-tight text-zinc-900 group cursor-pointer hover:text-orange-600 transition-all leading-tight"
                    >
                      {styledTitleContent}
                    </h3>

                    {/* Text contents preview */}
                    <p className="text-zinc-600 text-xs font-sans leading-relaxed mt-4 line-clamp-3 whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* Attached Poll */}
                    {post.poll && renderPostPoll(post)}

                    {/* Read action trigger */}
                    <div className="mt-5 flex items-center justify-between">
                      <button
                        id={`read-more-btn-${post.id}`}
                        onClick={() => setSelectedPost(post)}
                        className="text-orange-600 hover:text-orange-700 text-[10px] uppercase font-bold tracking-widest inline-flex items-center gap-1 transition-all focus:outline-none"
                      >
                        Read full article
                        <ArrowUpRight className="w-3.5 h-3.5 text-orange-600" />
                      </button>
                      
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-sans uppercase">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{post.readingTime} min read</span>
                        </div>
                        <span className="text-zinc-300 text-[10px]">•</span>
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] font-sans uppercase">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span>{Math.max(12, (post.views || 0) + pollVotersCount * 15)} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags cluster */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap gap-1.5" id={`tags-cluster-[${post.id}]`}>
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={() => setSearchQuery(`#${tag}`)}
                          className="text-[10px] font-semibold tracking-wide text-zinc-650 bg-zinc-50 border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-100/50 px-3 py-1 rounded-full transition-all cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Engagement panel */}
                  <div className="bg-zinc-50/55 border-t border-zinc-100 p-4 px-6 flex items-center justify-between text-zinc-500 text-xs">
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                      {/* Likes integration with Floating Reaction Bar */}
                      <div 
                        className="relative"
                        onMouseEnter={() => setActiveFloatingReactionBarPostId(post.id)}
                        onMouseLeave={() => setActiveFloatingReactionBarPostId(null)}
                      >
                        <button
                          id={`like-btn-${post.id}`}
                          onClick={() => toggleLikePost(post.id)}
                          className={`flex items-center gap-1.5 font-semibold transition-all focus:outline-none py-1.5 px-2.5 rounded-xl hover:bg-zinc-100/60 ${
                            isLiked
                              ? 'text-orange-600 scale-102 font-bold'
                              : 'hover:text-zinc-850'
                          }`}
                        >
                          {(() => {
                            const reaction = getUserReactionWithLocal(post.id);
                            return reaction ? (
                              <span className="text-sm select-none animate-bounce">{reaction}</span>
                            ) : (
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-orange-600 stroke-orange-600' : ''}`} />
                            );
                          })()}
                          <span>{likesCount}</span>
                        </button>

                        <AnimatePresence>
                          {activeFloatingReactionBarPostId === post.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 12, scale: 0.8 }}
                              animate={{ opacity: 1, y: -45, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className="absolute left-0 bottom-full mb-1 bg-white border border-zinc-200 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-2.5 z-40 whitespace-nowrap"
                              id={`floating-reaction-bar-${post.id}`}
                            >
                              {['👍', '❤️', '✨', '💡', '🔥'].map((emoji, index) => {
                                const count = getPostReactionsWithLocal(post.id)[emoji] || 0;
                                const userHasReacted = getUserReactionWithLocal(post.id) === emoji;
                                const labels: Record<string, string> = {
                                  '👍': 'Like',
                                  '❤️': 'Heart',
                                  '✨': 'Spark',
                                  '💡': 'Insightful',
                                  '🔥': 'Fire'
                                };
                                return (
                                  <motion.button
                                    key={emoji}
                                    type="button"
                                    initial={{ scale: 0.8, y: 5 }}
                                    animate={{ scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.04, type: 'spring', stiffness: 300 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactClick(post.id, emoji);
                                      setActiveFloatingReactionBarPostId(null);
                                    }}
                                    className={`relative flex flex-col items-center group/emoji p-1 rounded-full hover:scale-125 transition-all outline-none cursor-pointer ${
                                      userHasReacted ? 'bg-orange-100/80 scale-110' : 'hover:bg-zinc-100'
                                    }`}
                                  >
                                    <span className="text-lg leading-none select-none">{emoji}</span>
                                    
                                    {/* Tooltip for Reaction Name and Count */}
                                    <span className="absolute bottom-full mb-2 bg-zinc-900 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md opacity-0 group-hover/emoji:opacity-100 pointer-events-none transition-opacity shadow-sm z-50">
                                      {labels[emoji]} {count > 0 ? `(${count})` : ''}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
   
                      {/* Quick Emoji Reactions */}
                      <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-full border border-stone-200/40 shrink-0">
                        {['👍', '❤️', '✨', '💡', '🔥'].map((emoji) => {
                          const count = getPostReactionsWithLocal(post.id)[emoji] || 0;
                          const userHasReacted = getUserReactionWithLocal(post.id) === emoji;
                          const labels: Record<string, string> = {
                            '👍': 'like',
                            '❤️': 'love',
                            '✨': 'spark',
                            '💡': 'insightful',
                            '🔥': 'fire'
                          };
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReactClick(post.id, emoji)}
                              className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer outline-none select-none hover:scale-108 active:scale-95 ${
                                userHasReacted
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold shadow-xs scale-105 border-0'
                                  : 'hover:bg-white text-zinc-650 hover:text-black border border-transparent'
                              }`}
                              title={`React with ${labels[emoji] || emoji}`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && (
                                <span className="text-[9.5px] leading-none opacity-90 font-bold ml-0.5">
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Comments button */}
                      <button
                        id={`comment-btn-${post.id}`}
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center gap-1.5 font-semibold hover:text-zinc-850 transition-all focus:outline-none"
                      >
                        <MessageSquare className="w-4 h-4 text-zinc-400" />
                        <span>{commentsCount}</span>
                      </button>

                      {/* Save draft / bookmark toggle */}
                      {currentUser && (
                        <button
                          id={`save-btn-${post.id}`}
                          onClick={() => toggleSavePost(post.id)}
                          className={`flex items-center gap-1.5 font-semibold transition-all focus:outline-none ${
                            currentUser.savedPosts?.includes(post.id)
                              ? 'text-orange-600 shadow-sm'
                              : 'hover:text-zinc-850'
                          }`}
                          title="Save for Reading later"
                        >
                          <Bookmark className={`w-4 h-4 ${currentUser.savedPosts?.includes(post.id) ? 'fill-orange-600 stroke-orange-600' : ''}`} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Direct message instant shortcut */}
                      {!authorIsMe && currentUser && author && (() => {
                        const hasFollowRelationship = followers.some(f => 
                          (f.followerId === currentUser.id && f.followingId === author.id) ||
                          (f.followerId === author.id && f.followingId === currentUser.id)
                        );
                        return (
                          <div className="relative group">
                            <button
                              id={`chat-shortcut-btn-${post.id}`}
                              disabled={!hasFollowRelationship}
                              onClick={() => {
                                if (hasFollowRelationship) {
                                  onNavigateToChat(author.id);
                                }
                              }}
                              className={`p-2 rounded-xl transition-all border ${
                                hasFollowRelationship
                                  ? 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100/60 bg-zinc-50 border-zinc-150/50 cursor-pointer'
                                  : 'text-zinc-300 bg-zinc-50/50 border-zinc-100/30 cursor-not-allowed opacity-50'
                              }`}
                              title={
                                hasFollowRelationship
                                  ? `Send direct Message to ${authorName.split(' ')[0]}`
                                  : `Follow ${authorName.split(' ')[0]} to unlock messaging`
                              }
                            >
                              {hasFollowRelationship ? (
                                <MessageCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {!hasFollowRelationship && (
                              <span className="absolute bottom-10 right-0 w-36 text-[8px] leading-normal font-medium text-zinc-500 bg-stone-50 border border-stone-200 p-1.5 rounded-lg text-right opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xs">
                                Follow to message
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Report trigger */}
                      {!authorIsMe && currentUser && (
                        <button
                          id={`report-btn-${post.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportingPostId(post.id);
                            setReportReason('Controversial Topic / Disinformation');
                            setReportRemarks('');
                          }}
                          className="text-zinc-400 hover:text-red-500 p-2 hover:bg-zinc-100/60 bg-zinc-50 rounded-xl transition-all border border-zinc-100/50"
                          title="Report this post"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Share trigger */}
                      <button
                        id={`share-btn-${post.id}`}
                        onClick={() => handleShare(post.id)}
                        className="text-zinc-400 hover:text-zinc-805 p-2 hover:bg-zinc-100/60 bg-zinc-50 rounded-xl transition-all border border-zinc-100/50"
                        title="Copy sharing link"
                      >
                        {copiedPostId === post.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Author Edit & Delete actions */}
                      {authorIsMe && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <button
                            id={`feed-edit-btn-${post.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingPost(post);
                            }}
                            className="text-zinc-400 hover:text-orange-600 p-2 hover:bg-orange-50 bg-zinc-50 rounded-xl transition-all border border-zinc-100/50"
                            title="Edit my post"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`feed-delete-btn-${post.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPostToDelete(post);
                            }}
                            className="text-zinc-400 hover:text-rose-600 p-2 hover:bg-rose-50 bg-zinc-50 rounded-xl transition-all border border-zinc-100/50"
                            title="Delete my post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </VirtualPost>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm" id="empty-feed-placeholder">
            <p className="text-zinc-400 text-sm">
              No blogs found in this selection. Explore other topics or draft your first post!
            </p>
            {activeCategoryFilter !== 'all' && (
              <button
                id="reset-category-btn"
                onClick={() => setActiveCategoryFilter('all')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold text-xs rounded-xl transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination / Load More button */}
      {hasMorePosts && !loading && (
        <div className="flex justify-center mt-12 pb-16" id="pagination-load-more-section">
          <button
            id="load-more-posts-btn"
            onClick={loadMorePosts}
            className="px-8 py-3.5 bg-white hover:bg-stone-50 text-zinc-800 hover:text-black font-sans font-bold uppercase tracking-wider text-[11px] border border-stone-200/80 rounded-2xl shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Load More Articles</span>
            <svg className="w-4 h-4 text-zinc-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Expanded Article Modal / Reader View */}
      {selectedPost && (
        <div 
          id="article-reader-overlay"
          className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          {(() => {
            const author = userMap[selectedPost.userId];
            if (!author) return null;

            const commentsList = getPostComments(selectedPost.id);
            const isLiked = isPostLiked(selectedPost.id);
            const likesCount = getPostLikesCount(selectedPost.id);
            const commentsCount = commentsList.length;

            return (
              <div 
                id="article-reader-container"
                className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-100 shadow-2xl overflow-hidden my-8"
              >
                {/* Header Action bar */}
                <div className="bg-zinc-55 border-b border-zinc-105 p-4 px-6 flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold tracking-wider text-orange-600 uppercase">
                    #{selectedPost.category} Room
                  </span>
                  <button
                    id="close-reader-btn"
                    onClick={() => {
                      setSelectedPost(null);
                      setNewCommentText('');
                    }}
                    className="p-1.5 text-zinc-500 hover:text-zinc-850 hover:bg-zinc-100 bg-white border border-zinc-200/50 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Article Body */}
                <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh] border-b border-zinc-100">
                  {/* Media (Image or Video Player) Box */}
                  {(activeDetailsImage || selectedPost.videoUrl) && (
                    <div className="space-y-3">
                      {detailsViewMode === 'video' && selectedPost.videoUrl ? (
                        <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center text-zinc-100">
                          <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-3.5 select-none flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
                            Active Cinematic Reel Loop
                          </div>
                          <div className="aspect-[9/16] w-full max-w-[250px] bg-black rounded-2xl overflow-hidden relative border-4 border-zinc-800 shadow-2xl group">
                            <video
                              src={selectedPost.videoUrl}
                              controls
                              loop
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            {/* Floating category overlay */}
                            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[8.5px] font-extrabold py-1 px-2.5 rounded-full text-zinc-200 border border-white/10 uppercase tracking-widest">
                              #{selectedPost.category}
                            </div>
                          </div>
                          <p className="text-[9.5px] text-zinc-400 mt-3.5 italic font-sans text-center">
                            💡 Features auto-looping. Use video seeker inside player to fast-forward!
                          </p>
                        </div>
                      ) : activeDetailsImage ? (
                        (() => {
                          const currentRatio = postRatios[selectedPost.id] || selectedPost.imageRatio || 'auto';
                          
                          let containerClasses = "bg-zinc-955 rounded-2xl border border-zinc-150 overflow-hidden shadow-sm relative flex items-center justify-center max-h-[60vh] w-full transition-all duration-300 ";
                          let imgClasses = "w-full max-h-[60vh] ";

                          if (currentRatio === '16/9') {
                            containerClasses += " aspect-video";
                            imgClasses += "h-full object-cover";
                          } else if (currentRatio === '4/3') {
                            containerClasses += " aspect-[4/3]";
                            imgClasses += "h-full object-cover";
                          } else if (currentRatio === '1/1') {
                            containerClasses += " aspect-square";
                            imgClasses += "h-full object-cover";
                          } else {
                            imgClasses += "h-auto object-contain";
                          }

                          return (
                            <div className={containerClasses}>
                              <img
                                src={optimizeImageUrl(activeDetailsImage, { width: 1000, crop: 'limit' })}
                                alt={selectedPost.title}
                                referrerPolicy="no-referrer"
                                className={imgClasses}
                              />
                              
                              {/* Floating Aspect Ratio Adjustment button */}
                              {renderRatioToggle(selectedPost.id, currentRatio)}
                            </div>
                          );
                        })()
                      ) : null}
                      
                      {/* Interactive Attachments & Media Gallery switchers */}
                      {((selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0) || selectedPost.mediaUrl || selectedPost.videoUrl) && (
                        <div className="space-y-1.5 font-sans text-left mt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Interactive Attachments & Media Gallery
                          </p>
                          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 max-w-full">
                            {/* Video Selector Button if video exists */}
                            {selectedPost.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setDetailsViewMode('video')}
                                className={`relative w-20 h-14 rounded-xl overflow-hidden border shrink-0 transition-all flex flex-col items-center justify-center bg-zinc-950 ${
                                  detailsViewMode === 'video' ? 'border-orange-500 scale-[1.03] ring-2 ring-orange-500/20 shadow-md' : 'border-zinc-200 hover:border-zinc-400'
                                }`}
                              >
                                <Video className="w-5 h-5 text-zinc-100" />
                                <span className="text-[8px] uppercase tracking-wider text-zinc-300 font-extrabold mt-1">Play Video</span>
                              </button>
                            )}

                            {/* Original cover main picture */}
                            {selectedPost.mediaUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDetailsImage(selectedPost.mediaUrl!);
                                  setDetailsViewMode('image');
                                }}
                                className={`relative w-20 h-14 rounded-xl overflow-hidden border shrink-0 transition-all ${
                                  detailsViewMode === 'image' && activeDetailsImage === selectedPost.mediaUrl ? 'border-orange-500 scale-[1.03] ring-2 ring-orange-500/20 shadow-md' : 'border-zinc-200 hover:border-zinc-400'
                                }`}
                              >
                                <img src={optimizeImageUrl(selectedPost.mediaUrl, { width: 120, height: 80, crop: 'fill' })} className="w-full h-full object-cover" alt="Main cover" />
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-white py-0.5 text-center font-bold">Cover</span>
                              </button>
                            )}

                            {/* Extra companion pictures */}
                            {selectedPost.mediaUrls && selectedPost.mediaUrls.map((photoUrl, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => {
                                  setActiveDetailsImage(photoUrl);
                                  setDetailsViewMode('image');
                                }}
                                className={`relative w-20 h-14 rounded-xl overflow-hidden border shrink-0 transition-all ${
                                  detailsViewMode === 'image' && activeDetailsImage === photoUrl ? 'border-orange-500 scale-[1.03] ring-2 ring-orange-500/20 shadow-md' : 'border-zinc-200 hover:border-zinc-400'
                                }`}
                              >
                                <img src={optimizeImageUrl(photoUrl, { width: 120, height: 80, crop: 'fill' })} className="w-full h-full object-cover" alt={`Companion ${idx + 1}`} />
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-white py-0.5 text-center font-bold">Image #{idx + 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isOnline && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg mb-2.5">
                      <Database className="w-3.5 h-3.5 shrink-0 text-amber-650" />
                      <span>Offline-Cached Content Browsing</span>
                    </div>
                  )}
                  <h1 className="font-extrabold text-2xl md:text-3xl tracking-tight text-zinc-900 leading-tight">
                    {selectedPost.title}
                  </h1>

                  {/* Author Header */}
                  <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 p-4 rounded-xl">
                    <img
                      src={author.profileImage}
                      alt={author.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-sm cursor-pointer"
                      onClick={() => {
                        onSelectUser(author.id);
                        setSelectedPost(null);
                      }}
                    />
                    <div>
                      <p 
                        className="text-xs font-bold text-zinc-800 hover:text-orange-650 cursor-pointer"
                        onClick={() => {
                          onSelectUser(author.id);
                          setSelectedPost(null);
                        }}
                      >
                        {author.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-sans">
                        Published on {new Date(selectedPost.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} • {selectedPost.readingTime} min read
                      </p>
                    </div>
                  </div>

                  {/* Post Content text with Premium checking gating */}
                  {(() => {
                    const authorUser = userMap[selectedPost.userId];
                    const authorName = authorUser ? authorUser.name : 'Creator Member';
                    const premiumPrice = authorUser?.monthlySubscriptionPrice || 4.99;

                    const isAuthorOrAdmin = currentUser && (
                      selectedPost.userId === currentUser.id || 
                      currentUser.isAdmin || 
                      currentUser.role === 'admin'
                    );

                    const hasSubscribed = currentUser && currentUser.subscribedCreators?.includes(selectedPost.userId);
                    const userSubscriptionTier = hasSubscribed 
                      ? (currentUser.subscribedTiers?.[selectedPost.userId] || 'Premium Member')
                      : null;

                    // Entire article is locked
                    const postIsLocked = selectedPost.isPremium && !isAuthorOrAdmin && !userSubscriptionTier;

                    if (postIsLocked) {
                      return (
                        <div className="space-y-6 py-4">
                          {/* Blurry content preview */}
                          <div className="relative select-none">
                            <p className="text-zinc-405 text-sm font-sans blur-[4.5px] opacity-40 pointer-events-none whitespace-pre-wrap leading-relaxed line-clamp-4">
                              {selectedPost.content.slice(0, 180)}...
                              {"\n\n"}
                              Standard readers must subscribe to unlock full exclusive research papers, live programming guides, and developer notes published by this creator.
                            </p>
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                          </div>

                          {/* Paywall Gate Card */}
                          <div className="border border-amber-200 bg-amber-500/[0.04] p-6 rounded-3xl text-center space-y-4 animate-fadeIn max-w-sm mx-auto">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-750 mx-auto border border-amber-200/50">
                              <Lock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-sans font-black text-sm uppercase tracking-wider text-amber-950">
                                Locked Publication
                              </h4>
                              <p className="text-[10.5px] text-amber-850 font-medium leading-normal mt-1">
                                This article is reserved for **Premium Subscribers** of {authorName}. Subscribing will give you direct access to all their custom writings and premium feed.
                              </p>
                            </div>

                            <div className="space-y-2 pt-2">
                              {/* Option A: Premium Member Tier */}
                              <button
                                onClick={() => handlePurchaseSubscription(selectedPost.userId, premiumPrice, 'Premium Member')}
                                className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-zinc-950/10 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span>Subscribe Premium: ${premiumPrice.toFixed(2)}/mo</span>
                              </button>

                              {/* Option B: Elite Creator Tier */}
                              <button
                                onClick={() => handlePurchaseSubscription(selectedPost.userId, premiumPrice * 2, 'Elite Creator')}
                                className="w-full py-2.5 bg-violet-600 hover:bg-violet-750 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-violet-950/10 cursor-pointer"
                              >
                                <Crown className="w-4 h-4 text-amber-300" />
                                <span>Subscribe Elite: ${(premiumPrice * 2).toFixed(2)}/mo</span>
                              </button>

                              {/* Option C: Unlock single coin tips */}
                              <button
                                onClick={() => handleUnlockWithCredits(selectedPost.id, selectedPost.userId, 50)}
                                className="w-full py-2 bg-white hover:bg-zinc-50 text-amber-700 hover:text-amber-800 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-amber-205 transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                <span>Unlock story with 50 credits</span>
                              </button>
                            </div>

                            {/* Displays balances */}
                            {currentUser && (
                              <div className="flex justify-center gap-4 text-[9px] text-zinc-400 font-bold pt-1 font-mono">
                                <span>My wallet: ${currentUser.walletBalance?.toFixed(2) || '0.00'}</span>
                                <span>•</span>
                                <span>My credits: {currentUser.walletCredits || 0} pts</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Otherwise, parse content for selective [premium] or [elite] blocks
                    const textContent = selectedPost.content || '';
                    const tagRegex = /\[(premium|elite)\]([\s\S]*?)\[\/\1\]/g;
                    const blocks: { type: 'text' | 'premium' | 'elite'; content: string }[] = [];
                    let lastIndex = 0;
                    let match;

                    while ((match = tagRegex.exec(textContent)) !== null) {
                      if (match.index > lastIndex) {
                        blocks.push({
                          type: 'text',
                          content: textContent.substring(lastIndex, match.index)
                        });
                      }
                      blocks.push({
                        type: match[1] as 'premium' | 'elite',
                        content: match[2]
                      });
                      lastIndex = tagRegex.lastIndex;
                    }

                    if (lastIndex < textContent.length) {
                      blocks.push({
                        type: 'text',
                        content: textContent.substring(lastIndex)
                      });
                    }

                    return (
                      <div className="space-y-4 text-zinc-800 text-sm md:text-base font-sans leading-relaxed">
                        {blocks.map((block, idx) => {
                          if (block.type === 'text') {
                            return (
                              <p key={idx} className="whitespace-pre-wrap">
                                {block.content}
                              </p>
                            );
                          }

                          if (block.type === 'premium') {
                            const hasPremiumAccess = isAuthorOrAdmin || userSubscriptionTier === 'Premium Member' || userSubscriptionTier === 'Elite Creator';
                            if (hasPremiumAccess) {
                              return (
                                <div key={idx} className="border-l-4 border-amber-500 bg-amber-500/[0.03] p-4 my-2 rounded-r-xl">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase mb-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                    <span>Premium Exclusive Segment</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-zinc-800 text-xs md:text-sm">{block.content}</p>
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx} className="border border-amber-200 bg-amber-500/[0.01] p-5 my-3 rounded-2xl relative overflow-hidden">
                                  <div className="relative select-none pointer-events-none blur-[4px] opacity-30">
                                    <p className="whitespace-pre-wrap text-xs">{block.content.slice(0, 100) || "Standard exclusive developer research content. Locked for non-subscribers."}</p>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/40 flex flex-col items-center justify-center p-3">
                                    <div className="bg-amber-100/80 p-1.5 rounded-lg mb-1 border border-amber-200/50">
                                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-950 text-center">Premium Subscriber Area</p>
                                    <p className="text-[9px] text-amber-800 text-center max-w-xs mt-0.5 leading-tight">
                                      Subscribe to <strong>Premium Member</strong> tier to unlock.
                                    </p>
                                    <button
                                      onClick={() => handlePurchaseSubscription(selectedPost.userId, premiumPrice, 'Premium Member')}
                                      className="mt-2 px-3 py-1 bg-zinc-900 hover:bg-black text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                                    >
                                      Subscribe for ${premiumPrice.toFixed(2)}/mo
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          }

                          if (block.type === 'elite') {
                            const hasEliteAccess = isAuthorOrAdmin || userSubscriptionTier === 'Elite Creator';
                            if (hasEliteAccess) {
                              return (
                                <div key={idx} className="border-l-4 border-violet-500 bg-violet-500/[0.03] p-4 my-2 rounded-r-xl">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-700 uppercase mb-1">
                                    <Crown className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                                    <span>Elite Creator Exclusive</span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-zinc-800 text-xs md:text-sm">{block.content}</p>
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx} className="border border-violet-200 bg-violet-500/[0.01] p-5 my-3 rounded-2xl relative overflow-hidden">
                                  <div className="relative select-none pointer-events-none blur-[4px] opacity-30">
                                    <p className="whitespace-pre-wrap text-xs">{block.content.slice(0, 100) || "High-value advanced financial charts and strategies. Locked for elite members."}</p>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/40 flex flex-col items-center justify-center p-3">
                                    <div className="bg-violet-100/80 p-1.5 rounded-lg mb-1 border border-violet-200/50">
                                      <Crown className="w-3.5 h-3.5 text-violet-600" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-955 text-center">Elite-Only Section</p>
                                    <p className="text-[9px] text-violet-850 text-center max-w-xs mt-0.5 leading-tight">
                                      Requires <strong>Elite Creator</strong> level subscription to unlock.
                                    </p>
                                    <button
                                      onClick={() => handlePurchaseSubscription(selectedPost.userId, premiumPrice * 2, 'Elite Creator')}
                                      className="mt-2 px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                                    >
                                      Subscribe Elite for ${(premiumPrice * 2).toFixed(2)}/mo
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          }

                          return null;
                        })}
                      </div>
                    );
                  })()}

                  {/* Attached Poll */}
                  {selectedPost.poll && (
                    <div className="border-t border-zinc-100 pt-5 mt-5">
                      {renderPostPoll(selectedPost)}
                    </div>
                  )}

                  {/* Likes / Save triggers inside reader */}
                  <div className="flex items-center justify-between border-t border-b border-zinc-100 py-4 flex-wrap gap-4">
                    <div className="flex items-center gap-4 text-zinc-650 text-xs font-bold font-sans uppercase flex-wrap">
                      <button
                        id={`reader-like-btn-${selectedPost.id}`}
                        onClick={() => toggleLikePost(selectedPost.id)}
                        className={`flex items-center gap-2 transition-all ${isLiked ? 'text-orange-600 font-extrabold' : 'hover:text-zinc-900'}`}
                      >
                        {(() => {
                          const reaction = getUserReactionWithLocal(selectedPost.id);
                          return reaction ? (
                            <span className="text-sm select-none animate-bounce">{reaction}</span>
                          ) : (
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-orange-600 stroke-orange-600' : ''}`} />
                          );
                        })()}
                        <span>{likesCount} Likes</span>
                      </button>

                      {/* Quick Emoji Reactions */}
                      <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-full border border-stone-200/40 shrink-0">
                        {['👍', '❤️', '😂', '✨'].map((emoji) => {
                          const count = getPostReactionsWithLocal(selectedPost.id)[emoji] || 0;
                          const userHasReacted = getUserReactionWithLocal(selectedPost.id) === emoji;
                          const labels: Record<string, string> = {
                            '👍': 'like',
                            '❤️': 'love',
                            '😂': 'laugh',
                            '✨': 'spark'
                          };
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReactClick(selectedPost.id, emoji)}
                              className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer outline-none select-none hover:scale-108 active:scale-95 ${
                                userHasReacted
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold shadow-xs scale-105 border-0'
                                  : 'hover:bg-white text-zinc-650 hover:text-black border border-transparent'
                              }`}
                              title={`React with ${labels[emoji] || emoji}`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && (
                                <span className="text-[9.5px] leading-none opacity-90 font-bold ml-0.5">
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 text-zinc-450 font-semibold text-xs lowercase">
                        <MessageSquare className="w-4 h-4 text-zinc-400" />
                        <span>{commentsCount} Responses</span>
                      </div>
                    </div>

                    {currentUser && (
                      <button
                        id={`reader-save-btn-${selectedPost.id}`}
                        onClick={() => toggleSavePost(selectedPost.id)}
                        className={`flex items-center gap-1.5 transition-all font-bold uppercase text-[10px] ${currentUser.savedPosts?.includes(selectedPost.id) ? 'text-orange-600' : 'hover:text-zinc-800'}`}
                        title="Bookmarked"
                      >
                        <Bookmark className={`w-4 h-4 ${currentUser.savedPosts?.includes(selectedPost.id) ? 'fill-orange-600 stroke-orange-600' : ''}`} />
                        <span>{currentUser.savedPosts?.includes(selectedPost.id) ? 'Saved' : 'Save'}</span>
                      </button>
                    )}
                  </div>

                  {/* Comment System Section */}
                  <div className="space-y-4" id="reader-comment-system">
                    <h4 className="font-sans font-bold text-xs text-zinc-850 uppercase tracking-wide">
                      Discussion ({commentsCount})
                    </h4>

                    {/* Quick message form */}
                    {currentUser ? (
                      <form onSubmit={(e) => handleCreateComment(e, selectedPost.id)} className="flex gap-2">
                        <input
                          type="text"
                          required
                          id="comment-text-input"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="What are your thoughts on this story?"
                          className="flex-1 px-4 py-3 text-xs bg-zinc-50 border border-zinc-200 outline-none font-sans focus:border-orange-500 rounded-xl transition-all"
                        />
                        <button
                          type="submit"
                          id="submit-comment-btn"
                          className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-600/15"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Respond</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 bg-zinc-50 border border-zinc-155 text-center text-xs font-bold text-zinc-500 rounded-xl">
                        Please sign in with your email to add responses here.
                      </div>
                    )}

                    {/* Comments list */}
                    <div className="space-y-3 pt-2">
                      {commentsList.length > 0 ? (
                        commentsList.map((com) => {
                          const commentator = userMap[com.userId];
                          if (!commentator) return null;

                          return (
                            <div 
                              key={com.id} 
                              id={`comment-item-${com.id}`}
                              className="bg-zinc-50/50 border border-zinc-100 p-4 rounded-2xl flex gap-3 text-sm"
                            >
                              <img
                                src={commentator.profileImage}
                                alt={commentator.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-zinc-200 cursor-pointer shrink-0 shadow-sm"
                                onClick={() => {
                                  onSelectUser(commentator.id);
                                  setSelectedPost(null);
                                }}
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <p 
                                      className="font-bold text-zinc-800 text-xs hover:text-orange-600 cursor-pointer"
                                      onClick={() => {
                                        onSelectUser(commentator.id);
                                        setSelectedPost(null);
                                      }}
                                    >
                                      {commentator.name}
                                    </p>

                                    {/* Creator subscription tier badges */}
                                    {commentator.subscribedCreators?.includes(selectedPost.userId) && (
                                      commentator.subscribedTiers?.[selectedPost.userId] === 'Elite Creator' ? (
                                        <span className="px-1.5 py-0.5 bg-violet-50 border border-violet-200 text-violet-800 text-[8.5px] font-black uppercase rounded-md tracking-wider flex items-center gap-0.5" title="Elite Creator Subscriber">
                                          👑 Elite Insider
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[8.5px] font-black uppercase rounded-md tracking-wider flex items-center gap-0.5" title="Premium Member Subscriber">
                                          ⭐ Premium Member
                                        </span>
                                      )
                                    )}
                                    
                                    {/* Edit / Delete control buttons */}
                                    {currentUser && (
                                      currentUser.id === com.userId || 
                                      selectedPost.userId === currentUser.id || 
                                      currentUser.role === 'admin' || 
                                      currentUser.isAdmin
                                    ) && (
                                      <div className="flex items-center gap-1 bg-white border border-zinc-150/80 rounded-md px-1 py-0.5 shadow-sm">
                                        {/* Edit Button: ONLY the commenter themselves can edit */}
                                        {currentUser && currentUser.id === com.userId && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingCommentId(com.id);
                                              setEditingCommentText(com.comment);
                                            }}
                                            className="text-zinc-450 hover:text-orange-600 transition p-0.5 rounded cursor-pointer"
                                            title="Edit comment"
                                          >
                                            <Edit3 className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                        {/* Delete Button: commentator OR original story author OR admin can delete */}
                                        <button
                                          type="button"
                                          onClick={() => deleteComment(com.id)}
                                          className="text-zinc-450 hover:text-red-650 transition p-0.5 rounded cursor-pointer"
                                          title="Delete comment"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-405 font-medium font-sans">
                                    {new Date(com.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>

                                {editingCommentId === com.id ? (
                                  <div className="space-y-2 mt-1.5 bg-white p-2.5 border border-orange-200 rounded-xl shadow-inner shadow-zinc-100">
                                    <textarea
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg outline-none focus:border-orange-500 bg-zinc-50/50 font-sans text-zinc-800"
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditingCommentText('');
                                        }}
                                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-md text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!editingCommentText.trim()) return;
                                          await editComment(com.id, editingCommentText.trim());
                                          setEditingCommentId(null);
                                          setEditingCommentText('');
                                        }}
                                        className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-zinc-650 text-xs font-sans leading-relaxed break-words whitespace-pre-wrap">
                                    {com.comment}
                                    {com.updatedAt && (
                                      <span className="text-[9px] text-zinc-400 font-medium italic ml-1.5" title={`Edited on ${new Date(com.updatedAt).toLocaleDateString()}`}>
                                        (edited)
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-zinc-450 text-[10px] tracking-wide text-center py-4 font-bold">
                          No responses yet. Be the first to start the discussion!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="p-4 bg-zinc-50/60 text-center text-[10px] text-zinc-400 font-semibold uppercase tracking-wider border-t border-zinc-100/60">
                  Enjoyed reading? Keep interacting with #{selectedPost.category}!
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Interactive Edit Post modal */}
      {editingPost && (
        <div id="editing-post-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 shadow-2xl" onClick={() => setEditingPost(null)}>
          <div className="bg-white border border-black max-w-lg w-full flex flex-col overflow-hidden text-black relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditingPost(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-zinc-100 rounded-lg transition"
              title="Close modal"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>

            <div className="p-6 border-b border-zinc-100 bg-[#F8F7F4]">
              <h2 className="font-sans font-black text-xs uppercase tracking-widest text-[#FF4F00]">Edit Article Story</h2>
              <p className="text-zinc-505 text-[10px] uppercase font-mono mt-0.5">Author Controls / Live Sandbox Sync</p>
            </div>

            <form onSubmit={handleUpdatePostSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">Story Title</label>
                <input
                  type="text"
                  required
                  value={editPostTitle}
                  onChange={(e) => setEditPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-none border border-black/15 text-xs font-sans focus:border-black outline-none bg-white font-bold"
                  placeholder="Enter story title..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">Category</label>
                  <select
                    value={editPostCategory}
                    onChange={(e) => setEditPostCategory(e.target.value)}
                    className="w-full p-2.5 rounded-none border border-black/15 text-xs font-sans focus:border-black outline-none bg-white uppercase font-mono"
                  >
                    <option value="technology">Technology</option>
                    <option value="travel">Travel & Adventure</option>
                    <option value="fitness">Fitness & Health</option>
                    <option value="food">Food & Culinary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">Tags (Comma Sep)</label>
                  <input
                    type="text"
                    value={editPostTagsText}
                    onChange={(e) => setEditPostTagsText(e.target.value)}
                    className="w-full p-2.5 rounded-none border border-black/15 text-xs font-sans focus:border-black outline-none bg-white"
                    placeholder="AI, Programming, Tech"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#FF4F00] font-bold">Story Cover Image</label>
                  <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => {
                        setEditUseLocalUpload(false);
                        if (COVER_SUGGESTIONS[editPostCategory]) {
                          setEditPostMediaUrl(COVER_SUGGESTIONS[editPostCategory][0]);
                        }
                      }}
                      className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                        !editUseLocalUpload ? 'bg-white text-zinc-850 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditUseLocalUpload(true);
                        setEditPostMediaUrl('');
                      }}
                      className={`px-3 py-1 text-[9px] font-bold rounded-md transition-all ${
                        editUseLocalUpload ? 'bg-white text-zinc-850 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                {editUploadError && (
                  <div className="p-2 mb-2 bg-red-50 text-red-700 text-[11px] rounded-lg border border-red-100 font-sans">
                    <p className="font-semibold">{editUploadError}</p>
                  </div>
                )}

                {editUseLocalUpload ? (
                  <div className="space-y-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-sans">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setEditIsDragging(true); }}
                      onDragLeave={() => setEditIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setEditIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleEditFileRead(file);
                      }}
                      onClick={() => editFileInputRef.current?.click()}
                      className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all rounded-lg ${
                        editIsDragging ? 'border-orange-500 bg-orange-50/40' : 'border-zinc-200 hover:border-zinc-400 bg-white'
                      }`}
                    >
                      <input
                        type="file"
                        ref={editFileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleEditFileRead(file);
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      {isUploadingEditCover ? (
                        <div className="py-2">
                          <Loader2 className="w-5 h-5 mx-auto text-orange-600 animate-spin mb-1" />
                          <p className="text-[10px] font-bold text-orange-850 animate-pulse">
                            {editCoverUploadProgress || 'Uploading Cover...'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
                          <p className="text-[11px] font-bold text-zinc-850 select-none">
                            Drag & Drop or click to browse
                          </p>
                        </>
                      )}
                    </div>

                    {editPostMediaUrl && (
                      <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2 rounded-lg">
                        <img src={editPostMediaUrl} className="w-14 h-9 object-cover rounded" alt="Edit Preview" />
                        <div className="min-w-0 flex-1 font-sans">
                          <p className="text-[9px] text-zinc-400 uppercase leading-none font-bold">Image Loaded</p>
                          <p className="text-[11px] text-zinc-800 font-semibold truncate mt-1">Local Cover Selection</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditPostMediaUrl('')}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 bg-[#F8F7F4]/50 p-2.5 border border-zinc-200 rounded-lg">
                    <p className="text-[10px] font-bold text-zinc-500 font-sans">
                      Select themed cover preset:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {COVER_SUGGESTIONS[editPostCategory]?.map((url, i) => {
                        const isSelected = editPostMediaUrl === url;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEditPostMediaUrl(url)}
                            className={`relative aspect-video rounded overflow-hidden border-2 transition ${
                              isSelected ? 'border-[#FF4F00] scale-102 ring-2 ring-orange-500/20' : 'border-zinc-150 hover:opacity-90'
                            }`}
                          >
                            <img src={url} className="w-full h-full object-cover" alt="stock" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-left">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase block mb-1">Or direct image reference URL</label>
                  <input
                    type="text"
                    value={editPostMediaUrl}
                    onChange={(e) => setEditPostMediaUrl(e.target.value)}
                    className="w-full p-2 rounded border border-black/15 text-[11px] font-sans focus:border-black outline-none bg-white"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">Story Body Content</label>
                <textarea
                  required
                  rows={8}
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  className="w-full p-3 rounded-none border border-black/15 text-xs font-sans focus:border-black outline-none bg-[#F8F7F4]/50 leading-relaxed"
                  placeholder="Draft your thoughts..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition rounded-lg disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 font-sans text-left">
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
      {/* Custom Post Content Policy Reporting Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setReportingPostId(null)}>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 font-sans text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-red-650">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 font-sans">
                Report Controversial Content
              </h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              Help us maintain community guidelines. Specify why you feel this content is controversial or violates policy:
            </p>

            {reportingSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 text-xs font-semibold text-center mt-2 animate-fade-in">
                Thank you! Your report has been submitted to the Administration Panel for situational action.
              </div>
            ) : (
              <div className="space-y-4">
                {reportingError && (
                  <div className="bg-rose-50 text-rose-800 border border-rose-100 rounded-xl p-3 text-xs font-semibold">
                    {reportingError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-450 block">Select Violation Type</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-white border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 rounded-xl outline-none focus:border-orange-650 focus:ring-1 focus:ring-orange-650/30"
                  >
                    <option value="Controversial Topic / Disinformation">Controversial Topic / Disinformation</option>
                    <option value="Hate Speech / Harassment">Hate Speech / Harassment</option>
                    <option value="Spam / Deceptive Advertising">Spam / Deceptive Advertising</option>
                    <option value="Sensitive or Mature Material">Sensitive or Mature Material</option>
                    <option value="Violence or Harmful content">Violence or Harmful content</option>
                    <option value="Intellectual Property / Plagiarism">Intellectual Property / Plagiarism</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-450 block">Proper Remarks (Required)</label>
                  <textarea 
                    rows={3}
                    placeholder="Provide specific details or remarks regarding why this post is controversial..."
                    value={reportRemarks}
                    onChange={(e) => setReportRemarks(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl p-3 text-xs font-semibold text-zinc-700 outline-none focus:border-orange-650 focus:ring-1 focus:ring-orange-650/30 resize-none font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingPostId(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!reportRemarks.trim()) {
                        setReportingError("Please specify proper remarks to complete this report.");
                        return;
                      }
                      try {
                        setReportingError('');
                        await reportPost(reportingPostId, reportReason, reportRemarks.trim());
                        setReportingSuccess(true);
                        setTimeout(() => {
                          setReportingSuccess(false);
                          setReportingPostId(null);
                          setReportRemarks('');
                        }, 2200);
                      } catch (err: any) {
                        setReportingError(err.message || 'An error occurred while submitting the report.');
                      }
                    }}
                    className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-bold transition rounded-xl inline-flex items-center gap-1.5 shadow-sm shadow-red-500/10 cursor-pointer"
                  >
                    <span>Submit Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Workspace Ad Popup Modal */}
      <AnimatePresence>
        {selectedWorkspaceAd && (
          <div 
            id="workspace-ad-modal-overlay"
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setSelectedWorkspaceAd(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 text-white rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(249,115,22,0.25)] max-w-lg w-full border border-orange-500/30 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Premium Glow Accents */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-75" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />

              {/* Header Action Row */}
              <div className="p-5 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-950/40 backdrop-blur-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/25 text-orange-400 rounded-full text-[9.5px] font-black uppercase tracking-wider leading-none">
                  <Megaphone className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                  Verified Workspace Sponsor
                </span>
                <button
                  onClick={() => setSelectedWorkspaceAd(null)}
                  className="p-1 px-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Creative Cover Graphic Screen */}
              <div className="relative aspect-[16/10] w-full bg-zinc-900 border-b border-zinc-800/80 overflow-hidden">
                <img 
                  src={selectedWorkspaceAd.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'} 
                  alt={selectedWorkspaceAd.title} 
                  className="w-full h-full object-cover select-none transition-transform duration-700 hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Glass Stamp overlay */}
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/12 text-[8.5px] font-mono leading-none tracking-widest text-amber-400 uppercase select-none">
                  EXCLUSIVE DEAL
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent flex items-end p-6 md:p-8">
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-orange-400 uppercase bg-orange-950/40 border border-orange-500/20 px-2 py-0.5 rounded-md">CONNECTED ADS PLATFORM</span>
                    <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-tight leading-none mt-2 drop-shadow-md">
                      {selectedWorkspaceAd.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description & Detailed Interactive Content */}
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-zinc-300 text-xs md:text-sm leading-relaxed font-sans font-normal">
                  {selectedWorkspaceAd.description}
                </p>

                {/* Grid of Highlighted Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/50 border border-zinc-800/60 p-3 rounded-2xl">
                    <span className="block text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Campaign Benefit</span>
                    <span className="block text-[11px] font-sans font-bold text-zinc-200 mt-1">Instant Activation Code</span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/60 p-3 rounded-2xl">
                    <span className="block text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Security clearance</span>
                    <span className="block text-[11px] font-sans font-bold text-emerald-400 mt-1">✓ Admin Pre-Cleared</span>
                  </div>
                </div>

                {/* Secure Trust Frame */}
                <div className="p-4 bg-zinc-950 border border-orange-500/15 rounded-2xl flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-950 text-orange-400 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono uppercase tracking-wider text-zinc-200 font-bold">Encrypted Ad Integrity Protection</h5>
                    <p className="text-[9px] text-zinc-400 mt-1 leading-normal">
                      Redirection targets and cryptographic assets pre-cleared by social platform administrators. Pop stats and impressions tracked securely.
                    </p>
                  </div>
                </div>

                {/* Launcher Button CTA to load target URL */}
                <div className="pt-2">
                  <a
                    href={selectedWorkspaceAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="w-full py-4 px-6 bg-gradient-to-r from-[#F97316] via-orange-550 to-amber-500 hover:brightness-110 active:scale-98 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2.5 transition-all text-center select-none cursor-pointer border border-orange-400/20"
                    onClick={() => {
                      trackAdClick(selectedWorkspaceAd.id);
                      setSelectedWorkspaceAd(null);
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                    <span>Redeem Sponsor Benefits</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>

        {/* Right Side: Sticky Interactive Sidebar */}
        <aside className="hidden xl:flex xl:col-span-4 flex-col gap-6 sticky top-8" id="feed-sidebar-aside">
          
          {/* User Profile Glance */}
          {currentUser && (
            <div className="bg-white border border-stone-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={currentUser.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                  />
                  <span className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 px-1 rounded-full text-[8px] font-mono font-bold border-2 border-white leading-none uppercase">
                    active
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-zinc-900 font-sans font-black text-xs uppercase tracking-wider truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-zinc-500 font-mono text-[9.5px] truncate font-medium">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {currentUser.bio && (
                <p className="text-zinc-600 text-xs leading-normal font-sans font-medium line-clamp-2">
                  {currentUser.bio}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-stone-100 text-center">
                <div>
                  <span className="block text-zinc-400 font-mono text-[8.5px] uppercase tracking-wider">Posts</span>
                  <span className="text-xs font-black text-zinc-900 font-sans mt-0.5 block">
                    {posts.filter(p => p.authorId === currentUser.id).length}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-400 font-mono text-[8.5px] uppercase tracking-wider">Following</span>
                  <span className="text-xs font-black text-zinc-900 font-sans mt-0.5 block">
                    {currentUser.followingCount || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-400 font-mono text-[8.5px] uppercase tracking-wider">Followers</span>
                  <span className="text-xs font-black text-zinc-900 font-sans mt-0.5 block">
                    {currentUser.followersCount || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick-select Interests Grid */}
          <div className="bg-white border border-stone-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-orange-600 font-sans flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Trending Interests</span>
            </h3>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  activeCategoryFilter === 'all'
                    ? 'bg-zinc-900 text-white font-extrabold'
                    : 'bg-stone-50 border border-stone-200/60 text-zinc-600 hover:bg-stone-100'
                }`}
              >
                All Topics
              </button>
              {INTEREST_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activeCategoryFilter === cat.id
                      ? 'bg-zinc-900 text-white font-extrabold'
                      : 'bg-stone-50 border border-stone-200/60 text-zinc-600 hover:bg-stone-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Toast Notification for Clipboard feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-850 text-white px-4.5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 text-[10.5px] font-bold uppercase tracking-wider font-sans"
            id="copied-toast-alert"
          >
            <div className="w-5 h-5 bg-orange-600/20 border border-orange-500/30 text-orange-500 rounded-lg flex items-center justify-center animate-pulse shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
