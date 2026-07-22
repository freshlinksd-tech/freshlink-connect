/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { INTEREST_OPTIONS } from '../data/seedData';
import { 
  Plus, 
  Trash2, 
  Eye, 
  FileText, 
  Globe, 
  Bookmark, 
  Check, 
  X,
  Sparkles,
  Crown,
  Link,
  ChevronRight,
  ArrowUpRight,
  Clock,
  Upload,
  Loader2,
  Video,
  Play,
  ShieldAlert,
  BarChart2,
  Vote,
  Crop
} from 'lucide-react';
import { censorText, scanPostSafety } from '../lib/security';
import { MultiPhotosLayout } from './MultiPhotosLayout';
import { uploadToCloudinary } from '../lib/cloudinary';

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
  photography: [
    'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80'
  ],
  food: [
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

const VIDEO_SUGGESTIONS = [
  { name: 'Rainy Cafe ☕', url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-pouring-espresso-in-a-cup-23267-large.mp4' },
  { name: 'Neon City 🎆', url: 'https://assets.mixkit.co/videos/preview/mixkit-tokyo-street-neon-lights-at-night-23381-large.mp4' },
  { name: 'Cozy Coding 💻', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-40439-large.mp4' }
];

interface CreatePostProps {
  onSuccess: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onSuccess }) => {
  const { createPost, currentUser, drafts = [], saveDraft, deleteDraft } = useSocialPlatform();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('technology');
  const [tagsString, setTagsString] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // States for unified photos selection
  const [multiplePhotos, setMultiplePhotos] = useState<string[]>([]);
  const unifiedInputRef = useRef<HTMLInputElement>(null);

  // States for Video upload
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileError, setVideoFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [imageRatio, setImageRatio] = useState<'auto' | '16/9' | '4/3' | '1/1'>('auto');

  // Poll attachment states
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Auto-save & Local Draft states
  const [showDraftRestored, setShowDraftRestored] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [activeFirestoreDraftId, setActiveFirestoreDraftId] = useState<string | null>(null);

  const loadSavedDraft = (draft: any) => {
    setActiveFirestoreDraftId(draft.id);
    setTitle(draft.title || '');
    setContent(draft.content || '');
    setCategory(draft.category || 'technology');
    setTagsString(draft.tagsString || '');
    setMultiplePhotos(draft.multiplePhotos || []);
    setVideoUrl(draft.videoUrl || '');
    setIsPremium(draft.isPremium || false);
    setImageRatio(draft.imageRatio || 'auto');
    setHasPoll(draft.hasPoll || false);
    setPollQuestion(draft.pollQuestion || '');
    setPollOptions(draft.pollOptions || ['', '']);
  };

  const handleSaveToFirestoreDrafts = async () => {
    if (!currentUser) return;
    if (!title.trim() && !content.trim()) {
      alert("Please add a title or some content first to save a draft!");
      return;
    }
    const draftId = activeFirestoreDraftId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDraft = {
      id: draftId,
      userId: currentUser.id,
      title: title.trim(),
      content: content.trim(),
      category,
      tagsString,
      multiplePhotos,
      videoUrl: videoUrl.trim(),
      isPremium,
      imageRatio,
      hasPoll,
      pollQuestion,
      pollOptions,
      updatedAt: new Date().toISOString()
    };
    try {
      await saveDraft(newDraft);
      setActiveFirestoreDraftId(draftId);
      alert("Draft successfully saved to Firestore! 📁");
    } catch (err) {
      console.error("Failed to save draft to Firestore:", err);
      alert("Failed to save draft.");
    }
  };

  // Load draft on mount
  useEffect(() => {
    if (!currentUser) return;
    const savedDraft = localStorage.getItem(`freshlink_draft_${currentUser.id}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.tagsString) setTagsString(parsed.tagsString);
        if (parsed.multiplePhotos) setMultiplePhotos(parsed.multiplePhotos);
        if (parsed.videoUrl) setVideoUrl(parsed.videoUrl);
        if (parsed.isPremium !== undefined) setIsPremium(parsed.isPremium);
        if (parsed.imageRatio) setImageRatio(parsed.imageRatio);
        if (parsed.hasPoll !== undefined) setHasPoll(parsed.hasPoll);
        if (parsed.pollQuestion) setPollQuestion(parsed.pollQuestion);
        if (parsed.pollOptions) setPollOptions(parsed.pollOptions);
        
        if (parsed.title || parsed.content || parsed.videoUrl || (parsed.multiplePhotos && parsed.multiplePhotos.length > 0)) {
          setShowDraftRestored(true);
        }
      } catch (err) {
        console.error("Failed to parse saved draft:", err);
      }
    }
  }, [currentUser]);

  // Save draft whenever important fields change
  useEffect(() => {
    if (!currentUser) return;
    
    // If everything is completely empty, remove draft
    if (title.trim() === '' && content.trim() === '' && multiplePhotos.length === 0 && !videoUrl && !hasPoll) {
      localStorage.removeItem(`freshlink_draft_${currentUser.id}`);
      return;
    }

    setIsSavingDraft(true);
    const timer = setTimeout(() => {
      const draftData = {
        title,
        content,
        category,
        tagsString,
        multiplePhotos,
        videoUrl,
        isPremium,
        imageRatio,
        hasPoll,
        pollQuestion,
        pollOptions
      };

      localStorage.setItem(`freshlink_draft_${currentUser.id}`, JSON.stringify(draftData));
      setIsSavingDraft(false);
    }, 400); // short debounce to minimize direct writing latency

    return () => clearTimeout(timer);
  }, [title, content, category, tagsString, multiplePhotos, videoUrl, isPremium, imageRatio, hasPoll, pollQuestion, pollOptions, currentUser]);

  const clearDraftLocalStorage = () => {
    if (currentUser) {
      localStorage.removeItem(`freshlink_draft_${currentUser.id}`);
    }
  };

  // Cloudinary uploading progress states
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState('');

  const handleVideoFileRead = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setVideoFileError('Please select a valid video file (e.g., MP4, WebM).');
      return;
    }

    if (file.size > 800 * 1024) {
      setVideoFileError(`This video file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Direct local video uploads are strictly limited to 800KB to ensure smooth database operation and avoid size limits. Please select a smaller video or paste a direct online video URL under the stream address input! 🍿`);
      return;
    }

    // Creating transient video element to review exact playtime duration
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    videoElement.src = objectUrl;

    const finalizeFile = async () => {
      setVideoFileError('');
      setIsUploadingMedia(true);
      setMediaUploadProgress('Initializing video upload...');
      try {
        const url = await uploadToCloudinary(file, (progress) => {
          setMediaUploadProgress(`Uploading video... ${progress}%`);
        });
        setVideoUrl(url);
      } catch (err: any) {
        console.error("Cloudinary upload failed:", err);
        setVideoFileError(`Cloudinary upload failed: ${err.message || err}`);
      } finally {
        setIsUploadingMedia(false);
        setMediaUploadProgress('');
      }
    };

    videoElement.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl); // Clean up resource url
      const duration = videoElement.duration;
      
      if (duration > 60) {
        setVideoFileError(`Selected video is too long (${Math.round(duration)} seconds). All video uploads are strictly capped at 60 seconds.`);
        setVideoUrl('');
        return;
      }
      finalizeFile();
    };

    videoElement.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fail-soft: allow loading the video since it meets the size constraint
      finalizeFile();
    };
  };

  const handleUnifiedFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    const images: File[] = [];
    let video: File | null = null;

    setUploadError('');
    setVideoFileError('');

    fileList.forEach(file => {
      if (file.type.startsWith('image/')) {
        images.push(file);
      } else if (file.type.startsWith('video/')) {
        if (!video) {
          video = file;
        } else {
          setVideoFileError('Only one video can be attached at a time.');
        }
      } else {
        setUploadError('Invalid file type. Only images and videos are supported.');
      }
    });

    if (images.length > 0) {
      const validImages = images.filter(file => {
        if (file.size > 1572864) {
          setUploadError('One or more of your photos exceeds the 1.5MB limit.');
          return false;
        }
        return true;
      });

      if (validImages.length > 0) {
        setIsUploadingMedia(true);
        setMediaUploadProgress(`Preparing ${validImages.length} photo(s)...`);
        
        try {
          const uploadedUrls = await Promise.all(
            validImages.map(async (file, idx) => {
              const url = await uploadToCloudinary(file, (progress) => {
                if (validImages.length === 1) {
                  setMediaUploadProgress(`Uploading photo... ${progress}%`);
                } else {
                  setMediaUploadProgress(`Uploading photo ${idx + 1}/${validImages.length}... ${progress}%`);
                }
              });
              return url;
            })
          );
          setMultiplePhotos(prev => [...prev, ...uploadedUrls]);
        } catch (err: any) {
          console.error("Image upload failed:", err);
          setUploadError(`Failed to upload photo(s): ${err.message || err}`);
        } finally {
          setIsUploadingMedia(false);
          setMediaUploadProgress('');
        }
      }
    }

    if (video) {
      handleVideoFileRead(video);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setSubmitError('');

    // Pre-publish safety scan for nudity and explicit keywords
    const safetyCheck = scanPostSafety(
      title,
      content,
      category,
      tagsString.split(',').map(t => t.trim()),
      '',
      multiplePhotos,
      videoUrl
    );

    if (!safetyCheck.isSafe) {
      setSubmitError(safetyCheck.reason || 'Content moderation alert: Sexual, graphic, or unsafe material detected. Creation aborted.');
      // Scroll to the error alert segment
      setTimeout(() => {
        document.getElementById('create-post-header')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    try {
      setIsSubmitting(true);
      const tags = tagsString
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(t => t.length > 0);

      // Apply safe text filter to sanitize remaining text content
      const cleanTitle = censorText(title.trim());
      const cleanContent = censorText(content.trim());

      let pollData = undefined;
      if (hasPoll) {
        const cleanQuestion = censorText(pollQuestion.trim() || title.trim());
        const cleanOptions = pollOptions
          .map(opt => censorText(opt.trim()))
          .filter(Boolean);
        if (cleanOptions.length >= 2) {
          pollData = {
            question: cleanQuestion,
            options: cleanOptions,
            votes: {}
          };
        }
      }

      await createPost(
        cleanTitle,
        cleanContent,
        category,
        tags,
        '',
        status,
        multiplePhotos,
        videoUrl.trim() || undefined,
        isPremium,
        pollData,
        imageRatio
      );

      // Reset Form
      setTitle('');
      setContent('');
      setTagsString('');
      setUploadError('');
      setIsPreview(false);
      setMultiplePhotos([]);
      setVideoUrl('');
      setVideoFileError('');
      setSubmitError('');
      setHasPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setImageRatio('auto');
      clearDraftLocalStorage();

      onSuccess(); // Redirects to Home Feed tab
    } catch (err) {
      console.error("Error creating post:", err);
      setSubmitError('System error occurred when updating database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-sm mx-auto h-full" id="unauth-create-cover">
        <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-700 mb-4 shadow-sm">
          <FileText className="w-6 h-6 text-zinc-500" />
        </div>
        <h3 className="font-sans font-bold text-lg text-zinc-800 tracking-tight">Authenticated Writing Area</h3>
        <p className="text-zinc-550 text-xs mt-2 leading-relaxed">
          Please select one of the Sandbox accounts below or login to compile, draft, and publish custom blogs on the home feeds.
        </p>
      </div>
    );
  }

  const tagsArr = tagsString.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 select-none" id="create-post-container">
      {/* Tab toggle block: Write vs Preview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-200/60 pb-6" id="create-post-header">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">CREATIVE ZONE</p>
          <h2 className="font-sans font-extrabold text-3xl tracking-tight text-zinc-900 leading-none mt-1">
            Write Article
          </h2>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-xl">
          <button
            type="button"
            id="write-tab-btn"
            onClick={() => setIsPreview(false)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isPreview
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Compose
          </button>
          <button
            type="button"
            id="preview-tab-btn"
            onClick={() => {
              if (title.trim() && content.trim()) {
                setIsPreview(true);
              }
            }}
            disabled={!title.trim() || !content.trim()}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              isPreview
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-855'
            }`}
            title={(!title.trim() || !content.trim()) ? "Add title & content first to preview!" : "Live feed representation"}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Feed Card
          </button>
        </div>
      </div>

      {showDraftRestored && (
        <div className="mb-6 bg-amber-50 border border-amber-200/60 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-800 text-xs animate-in fade-in duration-200 shadow-xs" id="draft-restored-banner">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 bg-amber-100 rounded-lg text-amber-700 text-sm leading-none shrink-0">💾</span>
            <div>
              <p className="font-extrabold text-amber-950 font-sans">Draft Restored from Auto-Save!</p>
              <p className="text-[10px] text-amber-850 mt-0.5 leading-normal font-medium font-sans">We found unsaved changes in your browser's local storage and restored them automatically.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setContent('');
                setTagsString('');
                setMultiplePhotos([]);
                setVideoUrl('');
                setHasPoll(false);
                setPollQuestion('');
                setPollOptions(['', '']);
                setImageRatio('auto');
                setShowDraftRestored(false);
                clearDraftLocalStorage();
              }}
              className="px-3.5 py-2 bg-amber-200/60 hover:bg-amber-250 text-amber-950 font-sans font-black uppercase tracking-widest text-[8.5px] rounded-lg transition-all cursor-pointer border border-amber-300/40"
            >
              Clear & Start Fresh
            </button>
            <button
              type="button"
              onClick={() => setShowDraftRestored(false)}
              className="text-amber-500 hover:text-amber-700 p-1 rounded-lg hover:bg-amber-100/50 transition-colors"
              title="Keep draft"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-red-800 text-xs animate-fadeIn transition-all shadow-sm" id="create-post-submit-error">
          <ShieldAlert className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold uppercase tracking-wider text-[10px] text-red-700 font-sans">Safety & Compliance Policy Block</p>
            <p className="text-red-750 leading-relaxed font-semibold font-sans">{submitError}</p>
          </div>
        </div>
      )}

      {isPreview ? (
        /* Real Preview rendering card matching Feed.tsx styling */
        <div className="space-y-6" id="post-live-preview-box">
          <p className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Live theme representation preview
          </p>
          
          <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden max-w-xl mx-auto shadow-xl">
            <div className="p-6 flex items-center justify-between border-b border-zinc-100 font-sans">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                />
                <div>
                  <p className="font-sans font-bold text-xs text-zinc-800">{currentUser.name}</p>
                  <p className="text-zinc-400 text-[10px] mt-0.5">{currentUser.location || "Earth"} • Just now</p>
                </div>
              </div>
              <span className="text-[9px] bg-zinc-100 text-zinc-650 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">Preview</span>
            </div>

            {videoUrl ? (
              <div className="bg-zinc-950 p-4 border-b border-zinc-200/50 flex flex-col items-center">
                <div className="aspect-[9/16] w-[180px] bg-black rounded-2xl overflow-hidden relative border border-zinc-850 shadow-lg">
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-orange-600 text-white rounded-full p-1.5 shadow z-10">
                    <Video className="w-3 h-3 animate-pulse" />
                  </div>
                </div>
                <span className="text-[8.5px] font-black tracking-widest text-zinc-500 mt-2 uppercase">
                  🎬 Feed Reel Preview
                </span>
              </div>
            ) : multiplePhotos.length > 0 ? (
              <div className="border-b border-zinc-100 w-full">
                <MultiPhotosLayout images={multiplePhotos} imageRatio={imageRatio} />
              </div>
            ) : null}

            <div className="p-6 font-sans">
              <div className="mb-3">
                <span className="bg-orange-500/5 border border-orange-500/10 text-orange-600 font-bold uppercase text-[9px] tracking-widest px-2.5 py-1 rounded-full">
                  #{category}
                </span>
              </div>

              <h3 className="font-sans font-extrabold text-2xl tracking-tight text-zinc-900 leading-tight">
                {title || 'Untitled Article'}
              </h3>

              <p className="text-zinc-600 text-xs leading-relaxed mt-4 line-clamp-3 whitespace-pre-line">
                {content || 'Article contents appear here...'}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  className="text-zinc-850 hover:text-orange-600 text-xs font-semibold inline-flex items-center gap-1"
                >
                  Read full article
                  <ArrowUpRight className="w-3.5 h-3.5 text-orange-600" />
                </button>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                  <Clock className="w-3.5 h-3.5 text-zinc-405" />
                  <span>3 min read</span>
                </div>
              </div>

              {tagsArr.length > 0 && (
                <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap gap-1.5">
                  {tagsArr.map(tag => (
                    <span key={tag} className="text-[10px] font-medium text-zinc-600 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border-t border-zinc-100 p-4 px-6 flex items-center justify-between text-zinc-500 text-xs font-sans">
              <span className="font-bold text-[10px] uppercase tracking-wider">Feeds Card layout sandbox</span>
              <span className="font-semibold text-[10.5px] uppercase tracking-wider text-orange-600">Ready to Publish</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-zinc-200">
            <button
              id="back-compose-btn"
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsPreview(false)}
              className="px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-700 font-semibold text-xs hover:bg-zinc-50 transition disabled:opacity-50"
            >
              Modify Content
            </button>
            <button
              id="publish-preview-btn"
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, 'published')}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-orange-500/10 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publish to Feed</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3">
            {/* Regular Edit Form with Bold Typography Style */}
            <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-6" id="edit-editor-form">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-600 block">
              Choose Topic Category <span className="text-orange-600 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5" id="create-post-categories">
              {INTEREST_OPTIONS.map((opt) => {
                const isSelected = category === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    id={`create-category-tab-${opt.id}`}
                    onClick={() => setCategory(opt.id)}
                    className={`py-3 px-2 border rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-505/5 text-orange-600 font-semibold'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-550'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-650 block">
              Story Title <span className="text-orange-600 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              id="create-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Why custom tooling is the new standard"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none text-sm font-semibold text-zinc-805 bg-white transition-all shadow-sm"
            />
          </div>





          {/* Unified Photos & Video Attachment Section */}
          <div className="space-y-4 bg-zinc-50 border border-zinc-200/85 p-5 rounded-2xl animate-fadeIn" id="unified-media-attachments-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-zinc-200/60">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5 font-sans">
                  <Upload className="w-4 h-4 text-orange-600" />
                  Photos & Video Attachments
                </label>
                <div className="text-[10px] text-zinc-500 font-medium font-sans mt-0.5">
                  Attach multiple images (under 1.5MB each) and/or a video (MP4/WebM capped under 60s) to this article.
                </div>
              </div>
              {(multiplePhotos.length > 0 || videoUrl) && (
                <button
                  type="button"
                  id="clear-all-attachments-btn"
                  onClick={() => {
                    setMultiplePhotos([]);
                    setVideoUrl('');
                    setVideoFileError('');
                    setUploadError('');
                  }}
                  className="px-2.5 py-1 text-red-650 hover:bg-red-50 hover:text-red-700 font-bold uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer font-sans"
                >
                  Clear All Media
                </button>
              )}
            </div>

            {uploadError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold font-sans">
                {uploadError}
              </div>
            )}

            {videoFileError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-bold font-sans">
                {videoFileError}
              </div>
            )}

            {isUploadingMedia && (
              <div className="p-4 bg-orange-50 border border-orange-200/50 rounded-xl flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 text-orange-600 animate-spin shrink-0" />
                <span className="text-xs font-bold text-orange-850 font-sans">{mediaUploadProgress || 'Uploading media to Cloudinary...'}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: File Upload Dropzone (Supports photos and videos) */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) handleUnifiedFiles(files);
                }}
                onClick={() => unifiedInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all rounded-xl flex flex-col justify-center items-center min-h-[140px] ${
                  isDragging ? 'border-orange-500 bg-orange-50/40' : 'border-zinc-305 hover:border-zinc-400 bg-white shadow-sm'
                }`}
              >
                <input
                  type="file"
                  ref={unifiedInputRef}
                  onChange={(e) => {
                    if (e.target.files) handleUnifiedFiles(e.target.files);
                  }}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
                <div className="flex gap-2.5 mb-2">
                  <Upload className="w-5 h-5 text-zinc-400" />
                  <Video className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-xs font-bold text-zinc-850 select-none font-sans">
                  Drag & Drop Photos or Video Here
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 select-none font-medium font-sans">
                  Or click to browse your local device files
                </p>
              </div>

              {/* Option B: Direct stream link */}
              <div className="border border-zinc-205 p-4.5 rounded-xl bg-white flex flex-col justify-center min-h-[140px]">
                <p className="text-[10px] text-zinc-505 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-sans">
                  <Link className="w-3.5 h-3.5 text-zinc-450" />
                  Direct Video Web Stream URL
                </p>
                <p className="text-[9px] text-zinc-400 font-medium mb-2.5 leading-none font-sans">
                  Or link a direct online stream video address
                </p>
                <div className="relative">
                  <input
                    type="url"
                    id="video-url-direct-input"
                    placeholder="https://example.com/assets/video.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 outline-none focus:border-orange-500 bg-zinc-50/50 transition text-zinc-800 font-sans"
                  />
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="absolute right-2 top-1.5 text-[9px] text-red-550 font-bold hover:underline font-sans"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-100">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1 font-sans">
                    Quick Sample streaming Videos:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {VIDEO_SUGGESTIONS.map((v, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setVideoUrl(v.url)}
                        className={`text-[9px] px-2.5 py-1 rounded-full border transition font-bold ${
                          videoUrl === v.url 
                            ? 'bg-orange-650 border-orange-655 text-white font-extrabold' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Media List Previews */}
            {(multiplePhotos.length > 0 || videoUrl) && (
              <div className="pt-4 border-t border-zinc-200/50 space-y-4 font-sans font-sans">
                {/* Photo Previews */}
                {multiplePhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-450 font-sans">
                      Attached Story Photos ({multiplePhotos.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-0.5 animate-fadeIn">
                      {multiplePhotos.map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-white group">
                          <img src={photo} className="w-full h-full object-cover" alt={`Story gallery ${i + 1}`} />
                          <button
                            type="button"
                            id={`remove-photo-btn-${i}`}
                            onClick={() => setMultiplePhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-700 text-white rounded-full transition-all shadow cursor-pointer shadow-red-500/10"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[8px] font-bold rounded">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Dynamic Image Display Aspect Ratio Selector */}
                    <div className="space-y-3 bg-stone-50 border border-stone-200/60 p-4 rounded-2xl animate-fadeIn mt-4" id="image-aspect-ratio-composer">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-800">
                        <Crop className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>Display Aspect Ratio Selection</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium font-sans">
                        Control how your cover or gallery images are presented. This adjusts the display container size automatically without harsh cropping!
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {(['auto', '16/9', '4/3', '1/1'] as const).map((ratio) => {
                          const labels = {
                            'auto': 'Original (Auto)',
                            '16/9': '16:9 Landscape',
                            '4/3': '4:3 Standard',
                            '1/1': '1:1 Square'
                          };
                          const previewStyles = {
                            'auto': 'h-6 w-8 border border-dashed border-zinc-400 bg-zinc-100 rounded-sm',
                            '16/9': 'h-4 w-8 bg-zinc-400 rounded-sm',
                            '4/3': 'h-6 w-8 bg-zinc-400 rounded-sm',
                            '1/1': 'h-6 w-6 bg-zinc-400 rounded-sm'
                          };
                          return (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setImageRatio(ratio)}
                              className={`p-2.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                imageRatio === ratio
                                  ? 'border-orange-500 bg-orange-50/10 text-orange-700 shadow-xs'
                                  : 'border-zinc-200 bg-white text-zinc-650 hover:border-zinc-400 hover:text-black'
                              }`}
                            >
                              <div className={`flex items-center justify-center ${previewStyles[ratio]}`} />
                              <span className="leading-none text-center">{labels[ratio]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                 {/* Video Playback Preview (Reels Studio Simulator) */}
                 {videoUrl && (
                   <div className="space-y-3 bg-zinc-900 text-white p-5 rounded-3xl border border-zinc-800 shadow-xl max-w-sm mx-auto">
                     <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-sans flex items-center gap-1.5">
                         <Play className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                         FRESHLINK REEL STUDIO
                       </p>
                       <button
                         type="button"
                         onClick={() => setVideoUrl('')}
                         className="text-[9px] text-rose-450 hover:text-rose-400 uppercase font-black tracking-widest bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition-colors"
                       >
                         Remove Reel
                       </button>
                     </div>
                     
                     {/* Immersive Vertical Smartphone Reel Simulator */}
                     <div className="aspect-[9/16] w-full max-w-[240px] mx-auto bg-black rounded-2xl overflow-hidden border-4 border-zinc-800 relative shadow-2xl animate-fadeIn group">
                       <video
                         src={videoUrl}
                         controls={false}
                         autoPlay
                         loop
                         muted
                         playsInline
                         id="preview-reel-video"
                         className="w-full h-full object-cover"
                         onClick={(e) => {
                           const v = e.currentTarget;
                           if (v.paused) v.play(); else v.pause();
                         }}
                       />

                       {/* Reels Left Side Gradient Underlay */}
                       <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 pt-10 flex flex-col justify-end pointer-events-none select-none">
                         <div className="flex items-center gap-1.5 mb-1">
                           <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center font-bold text-[8px] border border-white/20 text-white">
                             {currentUser.name.slice(0, 1).toUpperCase()}
                           </div>
                           <span className="text-[9.5px] font-black text-white tracking-wide truncate">
                             @{currentUser.name.toLowerCase().replace(/\s+/g, '')}
                           </span>
                           <span className="text-[8px] bg-orange-600 text-white font-black px-1.5 py-0.2 rounded uppercase scale-90">
                             REEL
                           </span>
                         </div>
                         <p className="text-[8px] text-zinc-300 line-clamp-2 leading-relaxed font-sans">
                           {title ? title : 'Drafting new social reel contributions... 🍿'}
                         </p>
                       </div>

                       {/* Reels Right Column Icons Hud Simulation */}
                       <div className="absolute right-2 bottom-6 flex flex-col gap-3.5 items-center justify-center text-white z-10 select-none pointer-events-none opacity-80">
                         <div className="flex flex-col items-center">
                           <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                             <span className="text-zinc-100 text-[10px] font-bold">❤️</span>
                           </div>
                           <span className="text-[7.5px] font-mono font-bold mt-0.5">Likes</span>
                         </div>
                         <div className="flex flex-col items-center">
                           <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                             <span className="text-zinc-100 text-[10px] font-bold">💬</span>
                           </div>
                           <span className="text-[7.5px] font-mono font-bold mt-0.5">Reply</span>
                         </div>
                         <div className="flex flex-col items-center">
                           <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                             <span className="text-zinc-100 text-[10px] font-bold">⚡</span>
                           </div>
                           <span className="text-[7.5px] font-mono font-bold mt-0.5">Tip</span>
                         </div>
                       </div>

                       {/* Interactive Pause/Play Toast Overlay indicator */}
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-black/50 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/15 text-[8.5px] font-mono tracking-widest text-zinc-200">
                           💡 Click Video to Play or Pause
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>



          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-650 block">
                Main Article Content <span className="text-orange-600 font-bold">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("create-content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = textarea.value;
                      const selected = text.substring(start, end) || "This special section is for Premium Members & Elite Creators.";
                      const replacement = `[premium]${selected}[/premium]`;
                      setContent(text.substring(0, start) + replacement + text.substring(end));
                    } else {
                      setContent(prev => prev + "\n[premium]This special section is for Premium Members & Elite Creators.[/premium]\n");
                    }
                  }}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>+ Premium Part</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.getElementById("create-content-textarea") as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = textarea.value;
                      const selected = text.substring(start, end) || "This high-value exclusive analysis is reserved strictly for Elite Creators.";
                      const replacement = `[elite]${selected}[/elite]`;
                      setContent(text.substring(0, start) + replacement + text.substring(end));
                    } else {
                      setContent(prev => prev + "\n[elite]This high-value exclusive analysis is reserved strictly for Elite Creators.[/elite]\n");
                    }
                  }}
                  className="px-2 py-1 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Crown className="w-3 h-3 text-violet-500" />
                  <span>+ Elite Part</span>
                </button>
              </div>
            </div>
            <textarea
              required
              rows={8}
              id="create-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article copy here... support separation and layout."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none text-sm leading-relaxed text-zinc-800 bg-white transition-all resize-y shadow-sm"
            />
            <p className="text-[10px] text-zinc-500 leading-normal font-sans">
              💡 Use the buttons to enclose parts of your post with <strong>[premium]...[/premium]</strong> or <strong>[elite]...[/elite]</strong> tags. These segments will render as beautiful blurred blocks with payment/subscription gates for non-subscribers!
            </p>
          </div>

          {/* Interactive Poll Composer Section */}
          <div className="space-y-4 bg-zinc-50 border border-zinc-200/80 p-5 rounded-2xl animate-fadeIn" id="create-post-poll-section">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5 font-sans">
                  <BarChart2 className="w-4 h-4 text-orange-600" />
                  Attach Poll Questionnaire
                </label>
                <div className="text-[10px] text-zinc-500 font-medium font-sans mt-0.5">
                  Engage your audience with an interactive multi-choice poll.
                </div>
              </div>
              <button
                type="button"
                id="toggle-poll-btn"
                onClick={() => setHasPoll(!hasPoll)}
                className={`w-11 h-6 rounded-full transition-all outline-none ${
                  hasPoll ? 'bg-orange-600' : 'bg-zinc-200'
                } relative flex items-center px-0.5`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute ${
                  hasPoll ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            {hasPoll && (
              <div className="space-y-3.5 pt-3 border-t border-zinc-200/60 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Poll Question (Optional - defaults to article title)
                  </label>
                  <input
                    type="text"
                    id="poll-question-input"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="e.g. Which tool do you prefer for production?"
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 focus:border-orange-500 focus:outline-none bg-white transition text-zinc-850"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Poll Options (Min 2, Max 5)
                  </label>
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 w-5">#{idx + 1}</span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 focus:border-orange-500 focus:outline-none bg-white transition text-zinc-800"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPollOptions(pollOptions.filter((_, i) => i !== idx));
                            }}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-widest transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Poll Option
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-650 block">
              Hashtag Tags <span className="text-zinc-400 font-medium normal-case tracking-normal">(Separated by commas)</span>
            </label>
            <input
              type="text"
              id="create-tags-input"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="Compilers, AI, tech, design"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:outline-none text-xs font-semibold text-zinc-800 bg-white transition-all shadow-sm"
            />
          </div>

          {/* Options: Premium Paywall lock */}
          {currentUser && currentUser.isMonetizationEnabled === true && (
            <div className="space-y-3 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-200/50 p-4 rounded-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-650" />
                    Lock Story to Premium Members
                  </label>
                  <p className="text-[10px] text-amber-700/80 font-medium leading-normal mt-0.5 max-w-sm">
                    Only active subscribers to your feed (at ${currentUser.monthlySubscriptionPrice || '4.99'}/mo) or yourself can read the full body content of this article.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPremium(!isPremium)}
                  className={`w-11 h-6 rounded-full transition-all outline-none ${
                    isPremium ? 'bg-amber-600' : 'bg-zinc-200'
                  } relative flex items-center px-0.5`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute ${
                    isPremium ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {/* Form Actions: Publish to feed vs save draft */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-150">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />
                  <span className="text-orange-600 font-bold">Auto-saving draft...</span>
                </>
              ) : (title.trim() || content.trim() || multiplePhotos.length > 0 || videoUrl) ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping shrink-0" />
                  <span className="text-zinc-500">Draft auto-saved</span>
                </>
              ) : (
                <span>Saved drafts list inside user "Profile" sections.</span>
              )}
            </span>

            <div className="flex gap-2 w-full sm:w-auto font-sans">
              <button
                type="button"
                id="save-draft-btn"
                disabled={isSubmitting}
                onClick={handleSaveToFirestoreDrafts}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-205 rounded-xl text-zinc-700 font-bold text-xs transition disabled:opacity-50 cursor-pointer focus:outline-none"
              >
                {isSubmitting ? 'Saving...' : 'Save to Cloud Drafts'}
              </button>
              <button
                type="submit"
                id="publish-submit-btn"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Publish Story</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
          </div>

          {/* Firestore Saved Drafts list sidebar */}
          <div className="space-y-6" id="saved-drafts-side-panel">
            <div className="bg-white border border-stone-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-orange-600 font-sans flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Cloud Saved Drafts</span>
              </h3>
              <p className="text-[10px] text-zinc-550 font-medium font-sans leading-normal">
                Save your progress to Firestore to retrieve your content across multiple devices or pick up work later.
              </p>

              <button
                type="button"
                id="save-current-firestore-draft-btn"
                onClick={handleSaveToFirestoreDrafts}
                className="w-full py-2.5 px-4 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-205 font-bold text-[11px] uppercase tracking-wider rounded-xl transition shadow-xs focus:outline-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                💾 Save Current Draft
              </button>

              <div className="border-t border-zinc-100 pt-4 mt-2 space-y-3">
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Your Cloud Drafts ({drafts.filter((d: any) => d.userId === currentUser.id).length})</h4>
                {drafts.filter((d: any) => d.userId === currentUser.id).length === 0 ? (
                  <p className="text-[10px] text-zinc-400 italic">No drafts saved in cloud yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                    {drafts.filter((d: any) => d.userId === currentUser.id).map((d: any) => (
                      <div 
                        key={d.id} 
                        className={`p-3 rounded-2xl border transition-all text-left space-y-2 group relative ${
                          activeFirestoreDraftId === d.id
                            ? 'bg-orange-50/50 border-orange-200'
                            : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100/50 hover:border-zinc-250'
                        }`}
                      >
                        <div className="pr-1 font-sans">
                          <p className="text-xs font-extrabold text-zinc-800 line-clamp-1">{d.title || "(Untitled Draft)"}</p>
                          <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">{new Date(d.updatedAt).toLocaleDateString()} at {new Date(d.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <p className="text-[10px] text-zinc-550 line-clamp-2 leading-relaxed font-sans">{d.content || "(No content)"}</p>
                        
                        <div className="flex gap-2 pt-1 font-sans">
                          <button
                            type="button"
                            onClick={() => loadSavedDraft(d)}
                            className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer focus:outline-none"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this draft?")) {
                                await deleteDraft(d.id);
                                if (activeFirestoreDraftId === d.id) {
                                  setActiveFirestoreDraftId(null);
                                }
                              }
                            }}
                            className="px-2.5 py-1 hover:bg-red-50 text-red-550 hover:text-red-600 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ml-auto focus:outline-none"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
