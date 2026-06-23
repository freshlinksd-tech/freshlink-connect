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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  ExternalLink,
  ShieldAlert,
  Lock,
  Coins
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
    editComment,
    deleteComment,
    updateProfile,
    reportPost,
    postReports,
    ads,
    trackAdClick
  } = useSocialPlatform();

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Controversial Topic / Disinformation');
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportingError, setReportingError] = useState('');
  const [reportingSuccess, setReportingSuccess] = useState(false);

  const [useAlgorithm, setUseAlgorithm] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedWorkspaceAd, setSelectedWorkspaceAd] = useState<AdBanner | null>(null);
  const [activeDetailsImage, setActiveDetailsImage] = useState<string | null>(null);
  const [detailsViewMode, setDetailsViewMode] = useState<'image' | 'video'>('image');

  const handlePurchaseSubscription = async (creatorId: string, price: number) => {
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
      const updatedSubscribed = [...(currentUser.subscribedCreators || []), creatorId];
      await updateProfile({
        walletBalance: currentBalance - price,
        subscribedCreators: updatedSubscribed
      });

      const creator = users.find(u => u.id === creatorId);
      if (creator) {
        const creatorBalance = creator.walletBalance || 0;
        await updateDoc(doc(db, 'users', creatorId), {
          walletBalance: creatorBalance + price
        });
      }

      alert(`Congratulations! You have subscribed to this creator successfully. Content unlocked!`);
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

      const creator = users.find(u => u.id === creatorId);
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
    } else {
      setActiveDetailsImage(null);
      setDetailsViewMode('image');
    }
  }, [selectedPost]);

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

  const handleEditFileRead = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setEditUploadError('Please select or drop a valid cover image file.');
      return;
    }
    if (file.size > 1572864) {
      setEditUploadError('Local cover image is too heavy. Please use an image under 1.5MB.');
      return;
    }
    setEditUploadError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setEditPostMediaUrl(e.target.result);
      }
    };
    reader.readAsDataURL(file);
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
        const author = users.find(u => u.id === p.userId);
        if (author && author.location) {
          locSet.add(author.location);
        }
      }
    });
    return Array.from(locSet).sort();
  }, [posts, users]);

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
        const author = users.find(u => u.id === p.userId);
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

  }, [posts, users, isBookmarksOnly, activeCategoryFilter, selectedLocation, searchQuery, useAlgorithm, currentUser, followers, likes, comments, postReports]);

  const handleShare = (postId: string) => {
    setCopiedPostId(postId);
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
    setTimeout(() => {
      setCopiedPostId(null);
    }, 2000);
  };

  const handleCreateComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    await addComment(postId, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto px-4 py-8 select-none">
      
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" id="categories-filter-bar">
        <button
          id="category-tab-all"
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-full ${
            activeCategoryFilter === 'all'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/15'
              : 'bg-white border border-zinc-205/85 hover:border-zinc-300 text-zinc-650 hover:bg-zinc-50'
          }`}
        >
          All Topics
        </button>
        {INTEREST_OPTIONS.map((cat) => (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => setActiveCategoryFilter(cat.id)}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-full ${
              activeCategoryFilter === cat.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/15'
                : 'bg-white border border-zinc-205/85 hover:border-zinc-300 text-zinc-650 hover:bg-zinc-50'
            }`}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Active Ad Banner / Poster inside the top white space */}
      {(() => {
        const activeAd = ads.find(a => a.active && (a.placement || 'workspace') === 'workspace');
        if (!activeAd) return null;
        return (
          <div 
            id={`ad-banner-${activeAd.id}`}
            className="bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200/60 rounded-3xl p-5 md:p-6 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-sm overflow-hidden relative group cursor-pointer transition hover:border-amber-300"
            onClick={() => {
              setSelectedWorkspaceAd(activeAd);
            }}
          >
            {/* Subtle Tag */}
            <div className="absolute top-3 right-4 bg-zinc-900/90 text-white font-mono uppercase text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-widest shadow-sm flex items-center gap-1 z-10">
              <Megaphone className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span>SPONSORED AD</span>
            </div>

            {/* Ad Poster Image Column */}
            {activeAd.imageUrl && (
              <div className="w-full md:w-42 h-24 md:h-20 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 bg-white relative">
                <img 
                  referrerPolicy="no-referrer"
                  src={activeAd.imageUrl} 
                  alt={activeAd.title}
                  className="w-full h-full object-cover transition duration-505 group-hover:scale-105" 
                />
              </div>
            )}

            {/* Text details column */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-sans font-bold text-base md:text-lg text-zinc-900 tracking-tight leading-tight group-hover:text-orange-650 transition">
                {activeAd.title}
              </h3>
              <p className="font-sans text-xs text-zinc-550 mt-1 leading-relaxed">
                {activeAd.description}
              </p>
              <div className="flex items-center gap-1 text-orange-600 font-mono text-[10px] font-semibold mt-2">
                <span>View Sponsor Deal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Blogs / Posts Container */}
      <div className="space-y-8" id="feed-post-list">
        {rankedPosts.length > 0 ? (
          rankedPosts.map((post) => {
            const author = users.find(u => u.id === post.userId);
            if (!author) return null;

            const isLiked = isPostLiked(post.id);
            const likesCount = getPostLikesCount(post.id);
            const commentsCount = comments.filter(c => c.postId === post.id).length;
            const authorIsMe = currentUser?.id === post.userId;
            const authorIsFollowed = isFollowing(post.userId);

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
              <article
                key={post.id}
                id={`post-card-${post.id}`}
                className="bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Author Info row */}
                <div className="p-5 flex items-center justify-between border-b border-zinc-100/60 bg-white">
                  <div className="flex items-center gap-3">
                    <button
                      id={`post-${post.id}-author-avatar`}
                      onClick={() => onSelectUser(author.id)}
                      className="shrink-0 relative focus:outline-none"
                    >
                      <img
                        src={author.profileImage}
                        alt={author.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-zinc-100 shadow-inner"
                      />
                    </button>
                    <div>
                      <button
                        id={`post-${post.id}-author-name`}
                        onClick={() => onSelectUser(author.id)}
                        className="font-semibold text-xs text-zinc-900 hover:text-orange-650 block text-left transition-all"
                      >
                        {author.name}
                      </button>
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-sans uppercase mt-0.5 font-medium">
                        {author.location && (
                          <div className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-zinc-450" />
                            <span>{author.location.split(',')[0]}</span>
                          </div>
                        )}
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow actions button */}
                  {!authorIsMe && currentUser && (
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
                    className="cursor-pointer p-4 pb-0"
                  >
                    <MultiPhotosLayout 
                      images={[post.mediaUrl, ...post.mediaUrls].filter(Boolean) as string[]} 
                    />
                  </div>
                ) : post.mediaUrl ? (
                  <div 
                    id={`post-${post.id}-cover`}
                    onClick={() => setSelectedPost(post)}
                    className="cursor-pointer overflow-hidden aspect-video relative bg-zinc-50 border-b border-zinc-100 group"
                  >
                    <img
                      src={post.mediaUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-750 group-hover:scale-[1.012]"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-zinc-850 py-1.5 px-3 text-[10px] tracking-wider rounded-full font-bold shadow-sm border border-zinc-200/10">
                      #{post.category}
                    </div>
                    {post.videoUrl && (
                      <div className="absolute bottom-4 right-4 bg-orange-600 text-white flex items-center gap-1 py-1.5 px-3 text-[9px] tracking-wider uppercase rounded-full font-extrabold shadow-md border border-orange-500/20">
                        <Video className="w-3 h-3 text-white animate-pulse" />
                        <span>Has Video</span>
                      </div>
                    )}
                  </div>
                ) : post.videoUrl ? (
                  <div 
                    id={`post-${post.id}-video-cover`}
                    onClick={() => setSelectedPost(post)}
                    className="cursor-pointer overflow-hidden aspect-[3/4] max-h-[440px] relative bg-black border-b border-zinc-100 flex items-center justify-center group"
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
                ) : null}

                {/* Card Title & Content Summary */}
                <div className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {!post.mediaUrl && (
                      <span className="bg-orange-50 text-orange-600 font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">
                        #{post.category}
                      </span>
                    )}
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
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-sans uppercase">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{post.readingTime} min read</span>
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
                  <div className="flex items-center gap-6">
                    {/* Likes integration */}
                    <button
                      id={`like-btn-${post.id}`}
                      onClick={() => toggleLikePost(post.id)}
                      className={`flex items-center gap-1.5 font-semibold transition-all focus:outline-none ${
                        isLiked
                          ? 'text-orange-600 scale-102 font-bold'
                          : 'hover:text-zinc-850'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-orange-600 stroke-orange-600' : ''}`} />
                      <span>{likesCount}</span>
                    </button>

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
                    {!authorIsMe && currentUser && (
                      <button
                        id={`chat-shortcut-btn-${post.id}`}
                        onClick={() => onNavigateToChat(author.id)}
                        className="text-zinc-400 hover:text-zinc-800 p-2 hover:bg-zinc-100/60 bg-zinc-50 rounded-xl transition-all border border-zinc-100/50"
                        title={`Send direct Message to ${author.name.split(' ')[0]}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

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

      {/* Expanded Article Modal / Reader View */}
      {selectedPost && (
        <div 
          id="article-reader-overlay"
          className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        >
          {(() => {
            const author = users.find(u => u.id === selectedPost.userId);
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
                        <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-150 overflow-hidden shadow-sm relative">
                          <img
                            src={activeDetailsImage}
                            alt={selectedPost.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
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
                                <img src={selectedPost.mediaUrl} className="w-full h-full object-cover" alt="Main cover" />
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
                                <img src={photoUrl} className="w-full h-full object-cover" alt={`Companion ${idx + 1}`} />
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[7px] text-white py-0.5 text-center font-bold">Image #{idx + 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
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
                    const authorUser = users.find(u => u.id === selectedPost.userId);
                    const authorName = authorUser ? authorUser.name : 'Creator Member';
                    const premiumPrice = authorUser?.monthlySubscriptionPrice || 4.99;

                    const hasAccess = 
                      !selectedPost.isPremium || 
                      (currentUser && (
                        selectedPost.userId === currentUser.id || 
                        currentUser.isAdmin || 
                        currentUser.role === 'admin' || 
                        currentUser.subscribedCreators?.includes(selectedPost.userId)
                      ));

                    if (!hasAccess) {
                      return (
                        <div className="space-y-6 py-4">
                          {/* Blurry content preview */}
                          <div className="relative select-none">
                            <p className="text-zinc-450 text-sm font-sans blur-[4.5px] opacity-40 pointer-events-none whitespace-pre-wrap leading-relaxed line-clamp-4">
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
                              {/* Option A: Monthly subscription */}
                              <button
                                onClick={() => handlePurchaseSubscription(selectedPost.userId, premiumPrice)}
                                className="w-full py-2.5 bg-zinc-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-zinc-950/10 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span>Subscribe for ${premiumPrice.toFixed(2)}/mo</span>
                              </button>

                              {/* Option B: Unlock single coin tips */}
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

                    return (
                      <p className="text-zinc-800 text-sm md:text-base font-sans leading-relaxed whitespace-pre-wrap">
                        {selectedPost.content}
                      </p>
                    );
                  })()}

                  {/* Likes / Save triggers inside reader */}
                  <div className="flex items-center justify-between border-t border-b border-zinc-100 py-4">
                    <div className="flex items-center gap-6 text-zinc-650 text-xs font-bold font-sans uppercase">
                      <button
                        id={`reader-like-btn-${selectedPost.id}`}
                        onClick={() => toggleLikePost(selectedPost.id)}
                        className={`flex items-center gap-2 transition-all ${isLiked ? 'text-orange-600 font-extrabold' : 'hover:text-zinc-900'}`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-orange-600 stroke-orange-600' : ''}`} />
                        <span>{likesCount} Likes</span>
                      </button>

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
                          const commentator = users.find(u => u.id === com.userId);
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
                      <Upload className="w-4 h-4 mx-auto text-zinc-400 mb-1" />
                      <p className="text-[11px] font-bold text-zinc-850 select-none">
                        Drag & Drop or click to browse
                      </p>
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
            className="fixed inset-0 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => setSelectedWorkspaceAd(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-zinc-150 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section with Badge */}
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                  Partner Workspace Campaign
                </span>
                <button
                  onClick={() => setSelectedWorkspaceAd(null)}
                  className="p-1 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Campaign Poster Graphic Image */}
              <div className="relative aspect-video w-full bg-zinc-900 border-b border-zinc-100 overflow-hidden">
                <img 
                  src={selectedWorkspaceAd.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'} 
                  alt={selectedWorkspaceAd.title} 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex items-end p-6">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#F97316] uppercase">CONNECTED ADS NETWORK</span>
                    <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-tight leading-tight mt-1">
                      {selectedWorkspaceAd.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description & Interactive Controls */}
              <div className="p-6 md:p-8 space-y-5">
                <p className="text-zinc-650 text-xs md:text-sm leading-relaxed font-sans font-medium">
                  {selectedWorkspaceAd.description}
                </p>

                {/* Secure Trust Badge */}
                <div className="p-3.5 bg-zinc-50 rounded-2xl flex items-start gap-2.5 border border-zinc-150">
                  <div className="w-5 h-5 bg-orange-100 text-orange-700 rounded-md flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[10.5px] font-mono uppercase tracking-wider text-zinc-700 font-bold">Workspace Campaign Integrity</h5>
                    <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-snug">
                      Redirection destination targets and digital assets pre-cleared by administrators. Click the action button to redeem partner benefits.
                    </p>
                  </div>
                </div>

                {/* Direct launch / redirection CTA */}
                <div className="pt-2">
                  <a
                    href={selectedWorkspaceAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all text-center select-none cursor-pointer"
                    onClick={() => {
                      trackAdClick(selectedWorkspaceAd.id);
                      setSelectedWorkspaceAd(null);
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Redeem Campaign Benefit</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
