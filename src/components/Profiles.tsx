/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { ProfileSkeleton } from './SkeletonLoader';
import { compressImage } from '../lib/firebase';
import { optimizeImageUrl } from '../lib/cloudinary';
import { INTEREST_OPTIONS } from '../data/seedData';
import { User, Post } from '../types';
import { 
  MapPin, 
  Globe, 
  Twitter, 
  Github, 
  Instagram,
  Facebook,
  Music,
  Settings, 
  UserPlus, 
  UserCheck, 
  BookOpen, 
  FileText, 
  PenTool, 
  Heart, 
  Trash2, 
  Check, 
  Bookmark, 
  X,
  Smartphone,
  Eye,
  Award,
  MessageSquare,
  Trophy,
  Upload,
  AlertCircle,
  Loader2,
  Bell,
  Cake
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

const AchievementIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case 'PenTool': return <PenTool className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Award': return <Award className={className} />;
    case 'MessageSquare': return <MessageSquare className={className} />;
    case 'Bookmark': return <Bookmark className={className} />;
    case 'Globe': return <Globe className={className} />;
    default: return <Award className={className} />;
  }
};

interface ProfilesProps {
  targetUserId: string | null;     // If null, defaults to viewing currentUser
  onSelectUser: (userId: string) => void;
  onNavigateToChat: (userId: string) => void;
  onOpenAuth: () => void;
}

export const Profiles: React.FC<ProfilesProps> = ({ 
  targetUserId, 
  onSelectUser, 
  onNavigateToChat,
  onOpenAuth
}) => {
  const {
    currentUser,
    users,
    posts,
    followers,
    likes,
    comments,
    updateProfile,
    toggleFollowUser,
    isFollowing,
    getUserFollowersCount,
    deletePost,
    updatePost,
    isPostLiked,
    getPostLikesCount,
    toggleLikePost,
    getUserAchievements,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    loading,
    userMap,
    getUserReaction
  } = useSocialPlatform();

  // Determine active profile to display
  const activeProfile = useMemo(() => {
    if (targetUserId) {
      return userMap[targetUserId] || currentUser;
    }
    return currentUser;
  }, [targetUserId, userMap, currentUser]);

  const isOwnProfile = useMemo(() => {
    if (!activeProfile || !currentUser) return false;
    if (activeProfile.id === currentUser.id) return true;
    if (activeProfile.email && currentUser.email && activeProfile.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return false;
  }, [activeProfile, currentUser]);

  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'liked' | 'bookmarks' | 'achievements' | 'notifications' | 'followers' | 'following'>('published');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Edit fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifyAdAlerts, setNotifyAdAlerts] = useState(true);

  // Drag & drop references for edit profile overlays
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [profileEditError, setProfileEditError] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileReaderAvatar = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProfileEditError('Please select a valid image file configuration.');
      return;
    }
    if (file.size > 10485760) {
      setProfileEditError('Avatar image is too large. Must be under 10MB.');
      return;
    }
    setProfileEditError('');
    setIsSaving(true);
    compressImage(file, 200, 200, 0.75)
      .then((compressedUrl) => {
        setEditProfileImage(compressedUrl);
      })
      .catch((err) => {
        setProfileEditError('Failed to process selected avatar image.');
        console.error(err);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleFileReaderCover = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setProfileEditError('Please select a valid image file configuration.');
      return;
    }
    if (file.size > 10485760) {
      setProfileEditError('Cover backdrop image is too large. Must be under 10MB.');
      return;
    }
    setProfileEditError('');
    setIsSaving(true);
    compressImage(file, 800, 300, 0.75)
      .then((compressedUrl) => {
        setEditCoverImage(compressedUrl);
      })
      .catch((err) => {
        setProfileEditError('Failed to process cover image.');
        console.error(err);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Expanded interactive post reader local modal
  const [readingPost, setReadingPost] = useState<Post | null>(null);
  const [activeReadingImage, setActiveReadingImage] = useState<string | null>(null);

  useEffect(() => {
    if (readingPost) {
      setActiveReadingImage(readingPost.mediaUrl || null);
    } else {
      setActiveReadingImage(null);
    }
  }, [readingPost]);

  // Expanded interactive post editor local modal
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

  // Initialize edit fields
  const handleStartEditing = () => {
    if (!activeProfile) return;
    setEditName(activeProfile.name || '');
    setEditBio(activeProfile.bio || '');
    setEditLocation(activeProfile.location || '');
    setEditProfileImage(activeProfile.profileImage || '');
    setEditCoverImage(activeProfile.coverImage || '');
    setEditTwitter(activeProfile.socialLinks?.twitter || '');
    setEditGithub(activeProfile.socialLinks?.github || '');
    setEditWebsite(activeProfile.socialLinks?.website || '');
    setEditInstagram(activeProfile.socialLinks?.instagram || '');
    setEditFacebook(activeProfile.socialLinks?.facebook || '');
    setEditTiktok(activeProfile.socialLinks?.tiktok || '');
    setEditDob(activeProfile.dob || '');
    setEditInterests(activeProfile.interests || []);
    setNotifyLikes(activeProfile.notificationSettings?.likes !== false);
    setNotifyComments(activeProfile.notificationSettings?.comments !== false);
    setNotifyFollows(activeProfile.notificationSettings?.follows !== false);
    setNotifySystem(activeProfile.notificationSettings?.system !== false);
    setNotifyAdAlerts(activeProfile.notificationSettings?.adAlerts !== false);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileEditError('Display Name is required.');
      return;
    }
    setProfileEditError('');
    setIsSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        profileImage: editProfileImage.trim(),
        coverImage: editCoverImage.trim(),
        dob: editDob,
        interests: editInterests,
        socialLinks: {
          twitter: editTwitter.trim(),
          github: editGithub.trim(),
          website: editWebsite.trim(),
          instagram: editInstagram.trim(),
          facebook: editFacebook.trim(),
          tiktok: editTiktok.trim()
        },
        notificationSettings: {
          likes: notifyLikes,
          comments: notifyComments,
          follows: notifyFollows,
          system: notifySystem,
          adAlerts: notifyAdAlerts
        }
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Save profile failed:', err);
      let errorMsg = 'Failed to save profile changes. Please try again.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errorMsg = `Failed to save: ${parsed.error}`;
          }
        } catch (_) {
          errorMsg = `Failed to save: ${err.message}`;
        }
      }
      setProfileEditError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleInterest = (id: string) => {
    if (editInterests.includes(id)) {
      setEditInterests(editInterests.filter(i => i !== id));
    } else {
      setEditInterests([...editInterests, id]);
    }
  };

  // Compute profile posts metrics
  const profilePosts = useMemo(() => {
    if (!activeProfile) return { published: [], drafts: [], liked: [], bookmarks: [] };

    const authored = posts.filter(p => p.userId === activeProfile.id);
    const published = authored.filter(p => p.status === 'published');
    const drafts = authored.filter(p => p.status === 'draft');

    const liked = posts.filter(p => 
      p.status === 'published' && likes.some(l => l.userId === activeProfile.id && l.postId === p.id)
    );

    const bookmarks = posts.filter(p => 
      p.status === 'published' && (activeProfile.savedPosts || []).includes(p.id)
    );

    return { published, drafts, liked, bookmarks };
  }, [posts, activeProfile, likes]);

  const followMetrics = useMemo(() => {
    if (!activeProfile) return { followers: 0, following: 0 };
    return getUserFollowersCount(activeProfile.id);
  }, [activeProfile, followers, getUserFollowersCount]);

  const followersList = useMemo(() => {
    if (!activeProfile) return [];
    const relations = followers.filter(f => f.followingId === activeProfile.id);
    return relations.map(r => userMap[r.followerId]).filter(Boolean) as User[];
  }, [activeProfile, followers, userMap]);

  const followingList = useMemo(() => {
    if (!activeProfile) return [];
    const relations = followers.filter(f => f.followerId === activeProfile.id);
    return relations.map(r => userMap[r.followingId]).filter(Boolean) as User[];
  }, [activeProfile, followers, userMap]);

  const achievements = useMemo(() => {
    if (!activeProfile) return [];
    return getUserAchievements(activeProfile.id);
  }, [activeProfile, getUserAchievements, posts, comments, followers, users]);

  const earnedAchievementsCount = useMemo(() => {
    return achievements.filter(a => a.isEarned).length;
  }, [achievements]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-md mx-auto h-full border border-zinc-100 bg-white rounded-3xl shadow-sm" id="empty-profile-card">
        <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 rounded-2xl mb-4">
          <Smartphone className="w-6 h-6" />
        </div>
        <h3 className="font-sans font-extrabold text-lg text-zinc-900">Access Restricted</h3>
        <p className="text-zinc-500 text-xs mt-2 leading-relaxed font-sans">
          Please register or quick-switch to one of our demo characters to view detailed profiles, followers counts and authored drafts.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold tracking-wide text-xs rounded-xl transition-all shadow-md shadow-orange-600/15"
        >
          Sign In
        </button>
      </div>
    );
  }

  const followingCurrent = isFollowing(activeProfile.id);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 select-none" id="profile-dashboard-layout">
      
      {/* Top Banner & Profile Header */}
      <section className="bg-white border border-stone-200/45 rounded-[2rem] card-shadow overflow-hidden">
        {/* Cover image area */}
        <div className="h-44 md:h-56 bg-stone-100 relative">
          {activeProfile.coverImage && (
            <img
              src={optimizeImageUrl(activeProfile.coverImage, { width: 1200, height: 250, crop: 'fill' })}
              alt="Cover Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover brightness-95 hover:brightness-100 transition-smooth"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Profile Card Contents */}
        <div className="p-6 md:p-8 relative pt-0 bg-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            {/* Avatar block */}
            <div className="relative">
              <img
                src={optimizeImageUrl(activeProfile.profileImage, { width: 150, height: 150, crop: 'fill' })}
                alt={activeProfile.name}
                referrerPolicy="no-referrer"
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-white shadow-md bg-white transform hover:scale-102 transition-smooth"
              />
            </div>

            {/* Profile CTA buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 justify-end">
              {isOwnProfile ? (
                <button
                  id="edit-profile-trigger-btn"
                  onClick={handleStartEditing}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-sans font-bold text-xs rounded-xl transition-all shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                  Edit Setup
                </button>
              ) : (
                <>
                  {currentUser && (
                    <button
                      id="profile-follow-btn"
                      onClick={() => toggleFollowUser(activeProfile.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 font-sans font-bold text-xs rounded-xl transition-all ${
                        followingCurrent
                          ? 'bg-zinc-150 text-zinc-700 hover:bg-zinc-200 bg-zinc-100'
                          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/15'
                      }`}
                    >
                      {followingCurrent ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                  {currentUser && (
                    <button
                      id="profile-dm-btn"
                      onClick={() => onNavigateToChat(activeProfile.id)}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200/60 text-zinc-700 hover:bg-zinc-100/90 font-bold text-xs rounded-xl transition-all"
                    >
                      Direct Message
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User bios and Info details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3 pt-2">
              <div>
                <h1 className="font-extrabold text-3xl tracking-tight text-zinc-950 leading-none">
                  {activeProfile.name}
                </h1>
                <p className="text-orange-600 text-xs mt-1.5 font-sans font-bold tracking-wide uppercase">{activeProfile.email}</p>
              </div>

              <div className="font-sans text-sm leading-relaxed text-zinc-650 whitespace-pre-line border-l-2 border-zinc-200 pl-4 py-1">
                {activeProfile.bio || 'This user has not established a bio segment yet.'}
              </div>

              {/* Badges block: Social and Location metadata */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-zinc-500 text-[11px] font-medium font-sans">
                {activeProfile.location && (
                  <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{activeProfile.location}</span>
                  </div>
                )}
                {activeProfile.dob && (
                  <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full">
                    <Cake className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>DOB: {new Date(activeProfile.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                {activeProfile.socialLinks?.twitter && (
                  <a
                    href={`https://twitter.com/${activeProfile.socialLinks.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full hover:text-orange-600 hover:bg-orange-50/35 transition"
                  >
                    <Twitter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>@{activeProfile.socialLinks.twitter}</span>
                  </a>
                )}
                {activeProfile.socialLinks?.github && (
                  <a
                    href={`https://github.com/${activeProfile.socialLinks.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full hover:text-orange-600 hover:bg-orange-50/35 transition"
                  >
                    <Github className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{activeProfile.socialLinks.github}</span>
                  </a>
                )}
                {activeProfile.socialLinks?.website && (
                  <a
                    href={`https://${activeProfile.socialLinks.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full hover:text-orange-600 hover:bg-orange-50/35 transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{activeProfile.socialLinks.website}</span>
                  </a>
                )}
                {activeProfile.socialLinks?.instagram && (
                  <a
                    href={activeProfile.socialLinks.instagram.startsWith('http') ? activeProfile.socialLinks.instagram : `https://instagram.com/${activeProfile.socialLinks.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full hover:text-orange-600 hover:bg-orange-50/35 transition"
                  >
                    <Instagram className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>@{activeProfile.socialLinks.instagram.replace(/^@/, '')}</span>
                  </a>
                )}
                {activeProfile.socialLinks?.facebook && (
                  <a
                    href={activeProfile.socialLinks.facebook.startsWith('http') ? activeProfile.socialLinks.facebook : `https://facebook.com/${activeProfile.socialLinks.facebook}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full hover:text-orange-600 hover:bg-orange-50/35 transition"
                  >
                    <Facebook className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{activeProfile.socialLinks.facebook.replace(/https?:\/\/(www\.)?facebook\.com\//, '').replace(/\/$/, '')}</span>
                  </a>
                )}
                {activeProfile.socialLinks?.tiktok && (
                  <a
                    href={activeProfile.socialLinks.tiktok.startsWith('http') ? activeProfile.socialLinks.tiktok : `https://tiktok.com/@${activeProfile.socialLinks.tiktok.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full hover:text-orange-600 hover:bg-orange-50/35 transition"
                  >
                    <Music className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>@{activeProfile.socialLinks.tiktok.replace(/^@/, '')}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick stats and interests widgets */}
            <div className="bg-zinc-50/50 border border-zinc-100 p-5 rounded-2xl flex flex-col justify-between">
              {/* Stats counts rows */}
              <div className="grid grid-cols-4 gap-1 text-center border-b border-zinc-100 pb-3.5 mb-3.5">
                <div>
                  <p className="text-base sm:text-lg font-extrabold text-zinc-800 leading-none">{profilePosts.published.length}</p>
                  <p className="text-[10px] text-zinc-450 mt-1 font-sans">Posts</p>
                </div>
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('followers')}
                    className="hover:opacity-85 transition-all text-center flex flex-col items-center justify-start group"
                  >
                    <p className="text-base sm:text-lg font-extrabold text-zinc-800 leading-none group-hover:text-orange-600 transition-colors">{followMetrics.followers}</p>
                    <p className="text-[10px] text-zinc-450 mt-1 font-sans border-b border-dashed border-zinc-200 group-hover:text-orange-600 group-hover:border-orange-300 transition-all">Followers</p>
                  </button>
                ) : (
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-zinc-800 leading-none">{followMetrics.followers}</p>
                    <p className="text-[10px] text-zinc-450 mt-1 font-sans">Followers</p>
                  </div>
                )}
                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('following')}
                    className="hover:opacity-85 transition-all text-center flex flex-col items-center justify-start group"
                  >
                    <p className="text-base sm:text-lg font-extrabold text-zinc-800 leading-none group-hover:text-orange-600 transition-colors">{followMetrics.following}</p>
                    <p className="text-[10px] text-zinc-450 mt-1 font-sans border-b border-dashed border-zinc-200 group-hover:text-orange-600 group-hover:border-orange-300 transition-all">Following</p>
                  </button>
                ) : (
                  <div>
                    <p className="text-base sm:text-lg font-extrabold text-zinc-800 leading-none">{followMetrics.following}</p>
                    <p className="text-[10px] text-zinc-450 mt-1 font-sans">Following</p>
                  </div>
                )}
                <button 
                  type="button" 
                  id="profile-badges-stat-trigger"
                  onClick={() => setActiveTab('achievements')} 
                  className="hover:opacity-80 transition-all text-center flex flex-col items-center justify-start"
                >
                  <p className="text-base sm:text-lg font-bold text-orange-655 leading-none">🏆 {earnedAchievementsCount}</p>
                  <p className="text-[10px] text-orange-600 font-sans mt-1">Badges</p>
                </button>
              </div>

              {/* Selected topic tags */}
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wide text-zinc-400 mb-2 font-sans">Interests</p>
                <div className="flex flex-wrap gap-1.5_small flex-wrap gap-1">
                  {activeProfile.interests?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-sans font-bold uppercase tracking-wider text-zinc-650 bg-zinc-100 border border-zinc-200/30 px-2.5 py-1 rounded-full capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs list layout */}
      <div className="space-y-6">
        <div className="flex border-b border-zinc-200 pb-0.5 overflow-x-auto whitespace-nowrap scrollbar-hide" id="profile-tabs-links">
          <button
            id="tab-pub-posts"
            onClick={() => setActiveTab('published')}
            className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
              activeTab === 'published'
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Story Articles ({profilePosts.published.length})
          </button>

          <button
            id="tab-achievements"
            onClick={() => setActiveTab('achievements')}
            className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
              activeTab === 'achievements'
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            🏆 Badges ({earnedAchievementsCount}/{achievements.length})
          </button>

          {isOwnProfile && (
            <button
              id="tab-drafts"
              onClick={() => setActiveTab('drafts')}
              className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
                activeTab === 'drafts'
                  ? 'border-orange-600 text-orange-600 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Saved Drafts ({profilePosts.drafts.length})
            </button>
          )}

          <button
            id="tab-liked"
            onClick={() => setActiveTab('liked')}
            className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
              activeTab === 'liked'
                ? 'border-orange-600 text-orange-600 font-extrabold'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Liked ({profilePosts.liked.length})
          </button>

          {isOwnProfile && (
            <button
              id="tab-bookmarks"
              onClick={() => setActiveTab('bookmarks')}
              className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
                activeTab === 'bookmarks'
                  ? 'border-orange-600 text-orange-600 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Bookmarks ({profilePosts.bookmarks.length})
            </button>
          )}

          {isOwnProfile && (
            <button
              id="tab-followers"
              onClick={() => setActiveTab('followers')}
              className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
                activeTab === 'followers'
                  ? 'border-orange-600 text-orange-600 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Followers ({followMetrics.followers})
            </button>
          )}

          {isOwnProfile && (
            <button
              id="tab-following"
              onClick={() => setActiveTab('following')}
              className={`px-5 py-3 font-sans font-bold text-xs tracking-wide uppercase border-b-2 transition-all shrink-0 ${
                activeTab === 'following'
                  ? 'border-orange-600 text-orange-600 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-700'
              }`}
            >
              Following ({followMetrics.following})
            </button>
          )}


        </div>
        <div>
          {activeTab === 'achievements' ? (
            <div className="space-y-6 animate-fade-in" id="achievements-showcase-box">
              <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="font-sans font-extrabold text-lg text-zinc-900 tracking-tight">Gamified Badges & Milestones</h3>
                  <p className="text-zinc-500 text-xs mt-1">Complete platform tasks and engage with other authors to unlock rewards.</p>
                </div>
                <div className="bg-zinc-50 border border-zinc-100 py-3 px-5 rounded-xl text-center flex flex-col items-center shrink-0">
                  <span className="text-[10px] font-sans font-bold uppercase text-zinc-400 tracking-wider">CREATOR LEVEL</span>
                  <span className="text-sm font-extrabold text-orange-600 mt-1 uppercase">
                    {earnedAchievementsCount === achievements.length ? 'Elite Master' : earnedAchievementsCount >= 4 ? 'Pro Scholar' : earnedAchievementsCount >= 2 ? 'Active Thinker' : 'Novice Scribe'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => {
                  const percent = Math.min(100, Math.round((ach.currentValue / ach.targetValue) * 100));
                  return (
                    <div
                      key={ach.id}
                      id={`achievement-card-${ach.id}`}
                      className={`border p-6 rounded-2xl relative overflow-hidden transition-all duration-300 flex items-start gap-4 ${
                        ach.isEarned
                          ? 'bg-gradient-to-br from-white to-zinc-50/40 border-zinc-200 shadow-sm'
                          : 'bg-zinc-50/30 border-zinc-200/50 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Badge visual indicator */}
                      <div className={`w-12 h-12 flex items-center justify-center shrink-0 border border-zinc-200 relative rounded-xl shadow-sm ${
                        ach.isEarned
                          ? `bg-gradient-to-br ${ach.colorClass} text-white`
                          : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        <AchievementIcon name={ach.iconName} className="w-5 h-5" />
                        {ach.isEarned && (
                          <div className="absolute -top-1 -right-1 bg-white border border-zinc-200 w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm">
                            <Check className="w-2.5 h-2.5 text-orange-600" />
                          </div>
                        )}
                      </div>

                      {/* Title & Progress details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-sans font-extrabold text-xs uppercase tracking-wider ${ach.isEarned ? 'text-zinc-800' : 'text-zinc-500'}`}>
                            {ach.title}
                          </h4>
                          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-zinc-650 bg-zinc-100 border border-zinc-200/40 py-0.5 px-2 rounded-full">
                            {ach.isEarned ? 'Unlocked' : 'In Progress'}
                          </span>
                        </div>

                        <p className="text-zinc-650 text-xs font-sans leading-relaxed">
                          {ach.description}
                        </p>

                        {/* Progress bar */}
                        <div className="space-y-1 pt-1.5">
                          <div className="flex items-center justify-between text-[10px] font-sans font-semibold text-zinc-400">
                            <span>Goal: {ach.progressObjective}</span>
                            <span>{ach.currentValue} / {ach.targetValue} ({percent}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${ach.isEarned ? 'bg-orange-55 bg-orange-600' : 'bg-zinc-300'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (activeTab === 'followers' && isOwnProfile) ? (
            <div className="space-y-4 w-full animate-fade-in" id="followers-list-box">
              <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm">
                <h3 className="font-sans font-extrabold text-lg text-zinc-900 tracking-tight">Your Followers</h3>
                <p className="text-zinc-500 text-xs mt-1">These are the people following your profile. Only you can view this list.</p>
              </div>

              {followersList.length === 0 ? (
                <div className="bg-zinc-50 border border-zinc-200/50 p-12 text-center rounded-2xl font-sans text-xs text-zinc-400">
                  No followers yet. Share articles to build an audience!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {followersList.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => onSelectUser(user.id)}
                      className="bg-white border border-zinc-200/60 p-5 rounded-2xl flex items-center justify-between hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-11 h-11 rounded-full object-cover border border-zinc-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center font-extrabold text-orange-600 text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-sans font-extrabold text-sm text-zinc-900 group-hover:text-orange-600 transition truncate">
                            {user.name}
                          </h4>
                          <p className="text-zinc-400 text-[10px] font-mono truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      <span className="text-[10px] font-sans font-bold text-orange-600 bg-orange-50 border border-orange-100/30 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        View Profile
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (activeTab === 'following' && isOwnProfile) ? (
            <div className="space-y-4 w-full animate-fade-in" id="following-list-box">
              <div className="bg-white border border-zinc-200/60 p-6 rounded-2xl shadow-sm">
                <h3 className="font-sans font-extrabold text-lg text-zinc-900 tracking-tight">Users You Follow</h3>
                <p className="text-zinc-500 text-xs mt-1">These are the creators you are currently following. Only you can view this list.</p>
              </div>

              {followingList.length === 0 ? (
                <div className="bg-zinc-50 border border-zinc-200/50 p-12 text-center rounded-2xl font-sans text-xs text-zinc-400">
                  You are not following anyone yet. Explore articles and follow authors you enjoy!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {followingList.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => onSelectUser(user.id)}
                      className="bg-white border border-zinc-200/60 p-5 rounded-2xl flex items-center justify-between hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-11 h-11 rounded-full object-cover border border-zinc-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center font-extrabold text-orange-600 text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-sans font-extrabold text-sm text-zinc-900 group-hover:text-orange-600 transition truncate">
                            {user.name}
                          </h4>
                          <p className="text-zinc-400 text-[10px] font-mono truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-sans font-bold text-orange-600 bg-orange-50 border border-orange-100/30 px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        View Profile
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="profile-posts-grid">
              {(() => {
                const list = profilePosts[activeTab as 'published' | 'drafts' | 'liked' | 'bookmarks'];
                if (!list || list.length === 0) {
                  return (
                    <div className="col-span-full bg-zinc-50 border border-zinc-200/50 p-12 text-center rounded-2xl font-sans text-xs text-zinc-400">
                      No articles inside this tab.
                    </div>
                  );
                }

                return list.map((post) => {
                  const postLikesVal = getPostLikesCount(post.id);
                  const postCommentsVal = comments.filter(c => c.postId === post.id).length;
                  
                  return (
                    <div
                      key={post.id}
                      id={`profile-post-card-${post.id}`}
                      className="bg-white border border-zinc-200/60 p-6 rounded-2xl flex flex-col justify-between hover:border-orange-250 hover:shadow-md hover:shadow-zinc-100 transition-all cursor-pointer group"
                      onClick={() => setReadingPost(post)}
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-sans font-bold text-orange-650 bg-orange-50 border border-orange-100/50 px-2.5 py-0.5 rounded-full">
                            {post.category}
                          </span>
                          {isOwnProfile && post.status === 'draft' && (
                            <span className="text-[10px] font-sans font-semibold text-zinc-500 bg-zinc-100/80 px-2.5 py-0.5 rounded-full">
                              Draft Mode
                            </span>
                          )}
                        </div>

                        <h3 className="font-sans font-extrabold text-base text-zinc-900 group-hover:text-orange-600 transition leading-snug line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-zinc-650 text-xs leading-relaxed font-sans line-clamp-3">
                          {post.content}
                        </p>
                      </div>

                      <div className="pt-4 mt-6 border-t border-zinc-100 flex items-center justify-between text-zinc-500 font-sans text-[11px] font-medium">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 hover:text-zinc-800">
                            <Heart className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{postLikesVal}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hover:text-zinc-800">
                            <PenTool className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{postCommentsVal}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Edit authored posts only */}
                          {post.userId === currentUser?.id && (
                            <button
                              id={`edit-act-btn-${post.id}`}
                              onClick={(e) => {
                                e.stopPropagation(); // Avoid triggering card preview
                                startEditingPost(post);
                              }}
                              className="text-zinc-400 hover:text-orange-600 p-1.5 rounded-lg border border-zinc-150 hover:border-orange-200 transition bg-zinc-50"
                              title="Edit article"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete authored posts only */}
                          {post.userId === currentUser?.id && (
                            <button
                              id={`delete-act-btn-${post.id}`}
                              onClick={(e) => {
                                e.stopPropagation(); // Avoid triggering card preview
                                setPostToDelete(post);
                              }}
                              className="text-zinc-400 hover:text-red-500 p-1.5 rounded-lg border border-zinc-150 hover:border-red-200 transition bg-zinc-50"
                              title="Delete article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <span className="text-[11px] font-sans font-bold text-zinc-400 group-hover:text-orange-600 transition">
                            View Story
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Overlay Sheet Modal */}
      {isEditing && (
        <div id="profile-edit-modal-overlay" className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
          <form 
            onSubmit={handleSaveProfile}
            id="profile-edit-form"
            className="bg-white rounded-3xl max-w-xl w-full border border-zinc-150 shadow-2xl overflow-hidden my-8"
          >
            <div className="p-6 bg-zinc-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider leading-tight">Edit Profile Setup</h3>
                <p className="text-zinc-400 text-[11px] font-sans mt-0.5">Customize picture URLs, location, and interests</p>
              </div>
              <button
                type="button"
                id="close-profile-edit-btn"
                onClick={() => setIsEditing(false)}
                className="p-1 px-3 border border-white/10 hover:bg-white/10 text-white text-[11px] font-sans rounded-xl transition font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-4 max-h-[60vh] overflow-y-auto bg-white">
              {/* Form elements */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-bold text-zinc-500 block">Display Name</label>
                <input
                  type="text"
                  required
                  id="edit-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans font-medium bg-white transition-all text-zinc-805 text-zinc-850"
                />
              </div>

              {profileEditError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-105 flex items-center gap-2" id="profile-edit-error-box">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-sans font-bold">{profileEditError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Avatar Section */}
                <div className="border border-zinc-200 p-5 space-y-3.5 bg-zinc-50 rounded-xl">
                  <span className="text-xs font-bold text-zinc-700 block">Profile Avatar Setup</span>
                  <div className="space-y-1.5">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                      onDragLeave={() => setIsDraggingAvatar(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingAvatar(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileReaderAvatar(file);
                      }}
                      onClick={() => avatarInputRef.current?.click()}
                      className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all rounded-xl ${
                        isDraggingAvatar ? 'border-orange-500 bg-orange-50/40' : 'border-zinc-200 hover:border-zinc-400 bg-white shadow-sm'
                      }`}
                    >
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileReaderAvatar(file);
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1.5" />
                      <span className="text-xs font-bold text-zinc-800 block">Drag & Drop Avatar Image Here</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block font-medium">Or click to browse your desktop files (under 1.0MB)</span>
                    </div>
                  </div>

                  {editProfileImage && (
                    <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2 rounded-xl w-max max-w-full">
                      <img src={editProfileImage} className="w-10 h-10 rounded-full object-cover border border-zinc-200 shadow-sm" alt="Avatar Preview" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-400 uppercase leading-none font-bold">Avatar Thumbnail</p>
                        <p className="text-xs text-zinc-800 font-semibold truncate mt-1">Local Image Configured</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Backdrop Section */}
                <div className="border border-zinc-200 p-5 space-y-3.5 bg-zinc-50 rounded-xl">
                  <span className="text-xs font-bold text-zinc-700 block">Cover Backdrop Setup</span>
                  <div className="space-y-1.5">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                      onDragLeave={() => setIsDraggingCover(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingCover(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileReaderCover(file);
                      }}
                      onClick={() => coverInputRef.current?.click()}
                      className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all rounded-xl ${
                        isDraggingCover ? 'border-orange-500 bg-orange-50/40' : 'border-zinc-200 hover:border-zinc-400 bg-white shadow-sm'
                      }`}
                    >
                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileReaderCover(file);
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                      <Upload className="w-5 h-5 mx-auto text-zinc-400 mb-1.5" />
                      <span className="text-xs font-bold text-zinc-800 block">Drag & Drop Backdrop Image Here</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block font-medium">Or click to browse your desktop files (under 1.0MB)</span>
                    </div>
                  </div>

                  {editCoverImage && (
                    <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2 rounded-xl w-max max-w-full">
                      <img src={editCoverImage} className="w-16 h-10 rounded-lg object-cover border border-zinc-200 shadow-sm" alt="Cover Preview" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-400 uppercase leading-none font-bold">Backdrop Thumbnail</p>
                        <p className="text-xs text-zinc-800 font-semibold truncate mt-1">Local Image Configured</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-bold text-zinc-500 block">Bio Statement</label>
                <textarea
                  rows={3}
                  id="edit-bio-input"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 outline-none rounded-xl bg-white font-sans text-zinc-800 leading-relaxed focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-bold text-zinc-500 block">Location</label>
                <input
                  type="text"
                  id="edit-location-input"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Brooklyn, NY"
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans font-medium bg-white transition-all text-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-bold text-zinc-500 block">Date of Birth</label>
                <input
                  type="date"
                  id="edit-dob-input"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans font-medium bg-white transition-all text-zinc-800"
                />
              </div>

              {/* Social Links cluster */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 space-y-3">
                <p className="text-[11px] font-sans font-bold uppercase text-zinc-400 mb-1">Social Integrations</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-bold text-zinc-500">Twitter Handle</label>
                    <input
                      type="text"
                      id="edit-twitter-input"
                      value={editTwitter}
                      onChange={(e) => setEditTwitter(e.target.value)}
                      placeholder="alice_dev"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans transition text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-bold text-zinc-500">GitHub User</label>
                    <input
                      type="text"
                      id="edit-github-input"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="git_id"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans transition cursor-text text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-bold text-zinc-500">Website URL</label>
                    <input
                      type="text"
                      id="edit-website-input"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      placeholder="mysite.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans transition cursor-text text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-bold text-zinc-500">Instagram Handle</label>
                    <input
                      type="text"
                      id="edit-instagram-input"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      placeholder="instahandle"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans transition cursor-text text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-bold text-zinc-500">Facebook Profile</label>
                    <input
                      type="text"
                      id="edit-facebook-input"
                      value={editFacebook}
                      onChange={(e) => setEditFacebook(e.target.value)}
                      placeholder="fbname"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans transition cursor-text text-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-sans font-bold text-zinc-500">TikTok Handle</label>
                    <input
                      type="text"
                      id="edit-tiktok-input"
                      value={editTiktok}
                      onChange={(e) => setEditTiktok(e.target.value)}
                      placeholder="tiktok_name"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 outline-none rounded-xl focus:border-orange-500 font-sans transition cursor-text text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              {/* Feed interests toggler checklists */}
              <div className="space-y-2">
                <label className="text-[11px] font-sans font-bold text-zinc-500 block">Edit Feed Interests Target</label>
                <div className="grid grid-cols-2 gap-2" id="profile-edit-interests font-sans">
                  {INTEREST_OPTIONS.map((opt) => {
                    const selected = editInterests.includes(opt.id);
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        id={`edit-interest-${opt.id}`}
                        onClick={() => handleToggleInterest(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between text-xs ${
                          selected
                            ? 'border-orange-550 border-orange-500 bg-orange-50/20 text-orange-600 font-bold'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 font-medium'
                        }`}
                      >
                        <span className="font-sans text-[11px] font-semibold">{opt.name}</span>
                        {selected ? (
                          <div className="w-4 h-4 rounded-full bg-orange-650 bg-orange-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 font-bold" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-zinc-200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Native Device Notification Toggles */}
              <div className="space-y-3.5 border-t border-zinc-100 pt-5 mt-5">
                <div>
                  <label className="text-[11px] font-sans font-bold text-zinc-500 uppercase tracking-wider block">Native Push Alerts</label>
                  <p className="text-zinc-400 text-[10px] font-sans">Toggle which events trigger instant native browser & mobile device notification overlays.</p>
                </div>
                
                <div className="space-y-2.5">
                  {[
                    { label: "Story Appreciations & Likes", desc: "Get alerted when someone hearts your posts", val: notifyLikes, set: setNotifyLikes, id: "toggle-notif-likes" },
                    { label: "Comments & Discussions", desc: "Get notified when someone leaves a comment on your blogs", val: notifyComments, set: setNotifyComments, id: "toggle-notif-comments" },
                    { label: "New Subscribers & Followers", desc: "Get notified when someone starts following your creator profile", val: notifyFollows, set: setNotifyFollows, id: "toggle-notif-follows" },
                    { label: "Admin announcements & Polls", desc: "Get urgent broadcast messages, Yes/No system-wide surveys and community updates", val: notifySystem, set: setNotifySystem, id: "toggle-notif-system" },
                    { label: "Sponsor Campaign & Revenue alerts", desc: "Get notified about monetization rewards, clearances, or withdrawal status", val: notifyAdAlerts, set: setNotifyAdAlerts, id: "toggle-notif-adalerts" }
                  ].map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-800 font-sans">{item.label}</p>
                        <p className="text-[10px] text-zinc-500 font-sans leading-tight">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        id={item.id}
                        onClick={() => item.set(!item.val)}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 cursor-pointer ${
                          item.val ? 'bg-orange-600' : 'bg-zinc-200'
                        }`}
                      >
                        <span 
                          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                            item.val ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-150 flex justify-end gap-2 px-6">
              <button
                type="button"
                id="cancel-edit-btn"
                disabled={isSaving}
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-zinc-200 text-zinc-500 font-medium text-xs rounded-xl hover:bg-white transition font-sans disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="submit"
                id="save-profile-btn"
                disabled={isSaving}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/15 transition font-sans magnet-glow disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reader Local Modal Overlay */}
      {readingPost && (
        <div id="reader-local-modal-overlay" className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          {(() => {
            const author = userMap[readingPost.userId];
            if (!author) return null;

            const isLiked = isPostLiked(readingPost.id);
            const likesCount = getPostLikesCount(readingPost.id);
            const commentsList = comments.filter(c => c.postId === readingPost.id);

            return (
              <div id="reader-local-modal-container" className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-150 shadow-2xl overflow-hidden my-8 font-sans">
                <div className="bg-white border-b border-zinc-100 p-4 px-6 flex items-center justify-between">
                  <span className="text-[11px] font-sans font-bold tracking-wide text-orange-600 uppercase bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Authored in #{readingPost.category}
                  </span>
                  <button
                    id="close-reader-inline"
                    onClick={() => setReadingPost(null)}
                    className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-lg text-xs transition"
                  >
                    CLOSE
                  </button>
                </div>

                <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[60vh] border-b border-zinc-100 bg-white">
                  {activeReadingImage && (
                    <div className="space-y-3">
                      <img
                        src={activeReadingImage}
                        alt={readingPost.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-72 md:h-96 object-contain bg-zinc-900 rounded-2xl border border-zinc-100 overflow-hidden shadow-sm"
                      />
                      
                      {/* Render extra photos gallery if present */}
                      {readingPost.mediaUrls && readingPost.mediaUrls.length > 0 && (
                        <div className="space-y-1.5 font-sans text-left">
                          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                            Interactive Gallery ({readingPost.mediaUrls.length + (readingPost.mediaUrl ? 1 : 0)} photos - click to view)
                          </p>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                            {/* Original cover */}
                            {readingPost.mediaUrl && (
                              <button
                                type="button"
                                onClick={() => setActiveReadingImage(readingPost.mediaUrl!)}
                                className={`relative w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                                  activeReadingImage === readingPost.mediaUrl ? 'border-orange-500 scale-[1.05] ring-2 ring-orange-500/10' : 'border-zinc-250'
                                }`}
                              >
                                <img src={readingPost.mediaUrl} className="w-full h-full object-cover" alt="" />
                              </button>
                            )}
                            {/* Extra photos */}
                            {readingPost.mediaUrls.map((photoUrl, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setActiveReadingImage(photoUrl)}
                                className={`relative w-16 h-12 rounded-lg overflow-hidden border shrink-0 transition-all ${
                                  activeReadingImage === photoUrl ? 'border-orange-500 scale-[1.05] ring-2 ring-orange-500/10' : 'border-zinc-250'
                                }`}
                              >
                                <img src={photoUrl} className="w-full h-full object-cover" alt="" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h1 className="font-extrabold text-2xl tracking-tight text-zinc-900 leading-tight">
                    {readingPost.title}
                  </h1>

                  <p className="text-zinc-650 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {readingPost.content}
                  </p>

                  <div className="flex items-center gap-6 text-zinc-505 text-xs py-4 border-t border-zinc-100 font-sans font-medium text-zinc-500">
                    <button
                      id={`reader-modal-like-${readingPost.id}`}
                      onClick={() => toggleLikePost(readingPost.id)}
                      className={`flex items-center gap-1.5 font-bold transition ${isLiked ? 'text-orange-600' : 'hover:text-orange-600 text-zinc-400'}`}
                    >
                      {(() => {
                        const reaction = getUserReaction(readingPost.id);
                        return reaction ? (
                          <span className="text-sm select-none animate-bounce">{reaction}</span>
                        ) : (
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-orange-600 text-orange-600' : ''}`} />
                        );
                      })()}
                      <span>{likesCount} Likes</span>
                    </button>
                    <span className="font-bold text-zinc-400">
                      {commentsList.length} Responses
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 text-center text-xs font-sans font-semibold text-zinc-400">
                  Select characters in the sandbox switcher to test likes or responses.
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Interactive Edit Post modal */}
      {editingPost && (
        <div id="editing-post-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setEditingPost(null)}>
          <div className="bg-white border border-black max-w-lg w-full flex flex-col overflow-hidden text-black shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditingPost(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-zinc-100 rounded-lg transition"
              title="Close modal"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>

            <div className="p-6 border-b border-zinc-100 bg-[#F8F7F4]">
              <h2 className="font-sans font-black text-xs uppercase tracking-widest text-[#FF4F00]">Edit Article Story</h2>
              <p className="text-zinc-500 text-[10px] uppercase font-mono mt-0.5">Author Controls / Live Sandbox Sync</p>
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
                  <div className="space-y-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-sans font-sans">
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
    </div>
  );
};
