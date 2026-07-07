/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { AdPortal } from './AdPortal';
import { 
  Sparkles, 
  DollarSign, 
  Coins, 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  RefreshCw, 
  ShieldCheck, 
  Gift, 
  AlertCircle, 
  FileText,
  Check,
  XCircle,
  Megaphone,
  QrCode,
  Calendar,
  Upload,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Tv,
  Image as ImageIcon,
  HelpCircle,
  Trophy,
  Star,
  Award,
  BookOpen,
  ThumbsUp,
  Crown,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface Tier {
  name: string;
  level: number;
  minPosts: number;
  minComments: number;
  minLikes: number;
  ratePerLike: number;
  description: string;
  badge: string;
}

const CREATOR_TIERS: Tier[] = [
  {
    name: 'Apprentice Scribe',
    level: 1,
    minPosts: 0,
    minComments: 0,
    minLikes: 0,
    ratePerLike: 0.50,
    description: 'Begin your writing journey. Publish articles and foster initial conversations.',
    badge: '📜 Apprentice Scribe'
  },
  {
    name: 'Vanguard Storyteller',
    level: 2,
    minPosts: 5,
    minComments: 10,
    minLikes: 100,
    ratePerLike: 0.75,
    description: 'Steady posts and growing engagement. Start earning real shared revenue!',
    badge: '🛡️ Vanguard Storyteller'
  },
  {
    name: 'Elite Thought Leader',
    level: 3,
    minPosts: 15,
    minComments: 80,
    minLikes: 800,
    ratePerLike: 0.85,
    description: 'An authoritative voice driving active discussions across tags.',
    badge: '💎 Elite Thought Leader'
  },
  {
    name: 'FreshLink Sovereign',
    level: 4,
    minPosts: 30,
    minComments: 250,
    minLikes: 3000,
    ratePerLike: 0.90,
    description: 'A pillar of local journalism with a vast network of organic interaction.',
    badge: '👑 FreshLink Sovereign'
  }
];

export const MonetizationPanel: React.FC = () => {
  const { 
    currentUser, 
    posts, 
    comments, 
    likes, 
    withdrawals, 
    requestWithdrawal, 
    ads, 
    createOrUpdateAd, 
    deleteAd,
    updateProfile,
    addNotification
  } = useSocialPlatform();
  
  // Local state for payouts
  const [activeSubTab, setActiveSubTab] = useState<'payout' | 'advertise'>('payout');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutGateway, setPayoutGateway] = useState<'eSewa' | 'Khalti' | 'Bank Transfer'>('eSewa');
  const [destinationDetails, setDestinationDetails] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quiz Local State
  const [showWrongAnswersInfo, setShowWrongAnswersInfo] = useState<boolean>(false);

  // Target Payout Goal States with localStorage persistence keyed by current user id
  const [payoutGoal, setPayoutGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`freshlink_payout_goal_${currentUser?.id || 'guest'}`);
      return saved ? Number(saved) : 500;
    } catch {
      return 500;
    }
  });

  const [triggeredMilestones, setTriggeredMilestones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`freshlink_milestones_${currentUser?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  


  // Automatically write changes to localStorage
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`freshlink_payout_goal_${currentUser.id}`, String(payoutGoal));
    }
  }, [payoutGoal, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`freshlink_milestones_${currentUser.id}`, JSON.stringify(triggeredMilestones));
    }
  }, [triggeredMilestones, currentUser?.id]);
  
  // Dashboard Interactive Tab
  const [dashboardTab, setDashboardTab] = useState<'growth' | 'engagement' | 'simulator'>('growth');
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);
  
  // Income Simulator slider state
  const [simulateLikes, setSimulateLikes] = useState<number>(1000);
  const [simulateTierId, setSimulateTierId] = useState<number>(1); // Index 0-3

  const QUIZ_QUESTIONS = [
    {
      id: 1,
      question: "What is the best way to grow your readership and influence on FreshLink?",
      options: [
        { key: 'A', text: "Posting sensationalist clickbait headlines and copy-pasting other blogs." },
        { key: 'B', text: "Writing high-quality, authentic local stories with rich real-world images." },
        { key: 'C', text: "Spamming comments on other writers' profiles to force mutual follow-backs." }
      ],
      correctKey: 'B',
      explanation: "FreshLink values high-quality, authentic, localized journalism. Clickbait and comment spam violates community terms and reduces reading retention."
    },
    {
      id: 2,
      question: "Which of the following activities is strictly prohibited and leads to immediate account suspension?",
      options: [
        { key: 'A', text: "Drafting multiple travel recipes or reviews in the Food category." },
        { key: 'B', text: "Setting up automated bots or sybil fake accounts to inflate comment and reaction counts." },
        { key: 'C', text: "Leaving tags empty on newly published stories." }
      ],
      correctKey: 'B',
      explanation: "Sybil attacks, fake engagement circles, and artificial inflation of statistics are zero-tolerance infractions and lead to swift account and wallet suspension."
    },
    {
      id: 3,
      question: "How does the FreshLink Revenue system determine your available withdrawable balance?",
      options: [
        { key: 'A', text: "It is calculated dynamically based on real engagement likes/reactions multiplied by your active Creator Tier rate, excluding payouts in transit." },
        { key: 'B', text: "It is a flat monthly salary randomly awarded by automated computer scripts." },
        { key: 'C', text: "It is directly linked to the number of clicks you register on your own articles." }
      ],
      correctKey: 'A',
      explanation: "Withdrawable NPR balances are computed dynamically from your posts' real reactions according to your earned Creator Tier rate + any active booster, subtracting completed/pending payouts."
    }
  ];

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-[#F8F7F4] h-full flex flex-col items-center justify-center font-sans">
        <Lock className="w-12 h-12 text-zinc-300 mb-2" />
        <p className="text-sm font-bold text-zinc-600">Please authenticate to view Monetization Hub</p>
      </div>
    );
  }

  // 1. Calculate user-specific metrics dynamically based on actual database values
  const userPosts = useMemo(() => {
    return posts.filter(p => p.userId === currentUser.id);
  }, [posts, currentUser.id]);

  const userPostIds = useMemo(() => {
    return userPosts.map(p => p.id);
  }, [userPosts]);

  const postsCount = userPosts.length;

  // Calculate comments received on their posts
  const totalCommentsCount = useMemo(() => {
    return comments.filter(c => userPostIds.includes(c.postId)).length;
  }, [comments, userPostIds]);

  // Calculate total likes and emoji reactions on all of user's posts
  const totalLikesAllPosts = useMemo(() => {
    return likes.filter(l => userPostIds.includes(l.postId)).length;
  }, [likes, userPostIds]);

  // 2. Determine Creator Tiers & Progression
  const currentTier = useMemo(() => {
    let active = CREATOR_TIERS[0];
    for (const tier of CREATOR_TIERS) {
      if (
        postsCount >= tier.minPosts &&
        totalCommentsCount >= tier.minComments &&
        totalLikesAllPosts >= tier.minLikes
      ) {
        active = tier;
      }
    }
    return active;
  }, [postsCount, totalCommentsCount, totalLikesAllPosts]);

  const nextTier = useMemo(() => {
    const nextIdx = CREATOR_TIERS.findIndex(t => t.level === currentTier.level) + 1;
    if (nextIdx < CREATOR_TIERS.length) {
      return CREATOR_TIERS[nextIdx];
    }
    return null;
  }, [currentTier]);

  // Unique categories count for quests
  const uniqueCategoriesCount = useMemo(() => {
    const cats = new Set(userPosts.map(p => p.category).filter(Boolean));
    return cats.size;
  }, [userPosts]);

  // Eligibility triggers - Level 1 can also earn now!
  const isAccountVerified = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.isAdmin === true || (currentUser?.hasVerifiedDetails === true && currentUser?.isApprovedByAdmin === true);
  const isEligibleToEarn = currentTier.level >= 1;
  const isMonetizationActive = isAccountVerified && isEligibleToEarn;

  // Find the post with the highest likes
  const topPost = useMemo(() => {
    let maxLikes = 0;
    let post = null;
    userPosts.forEach(p => {
      const postLikes = likes.filter(l => l.postId === p.id).length;
      if (postLikes > maxLikes) {
        maxLikes = postLikes;
        post = p;
      }
    });
    return { post, likes: maxLikes };
  }, [userPosts, likes]);

  // Active earning rate calculation
  const activeEarningRate = currentTier.ratePerLike;

  // Earnings based on the highest-liked post
  const totalAccruedNpr = topPost.likes * activeEarningRate;

  // Fetch past withdrawals for the logged in user
  const userWithdrawals = useMemo(() => {
    return withdrawals.filter(w => w.userId === currentUser.id);
  }, [withdrawals, currentUser.id]);

  const approvedWithdrawalsSum = useMemo(() => {
    return userWithdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amountNpr, 0);
  }, [userWithdrawals]);

  const pendingWithdrawalsSum = useMemo(() => {
    return userWithdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amountNpr, 0);
  }, [userWithdrawals]);

  const chartData = useMemo(() => {
    let cumulative = 0;
    const sortedPosts = [...userPosts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // If user has no posts, generate nice simulated starter milestone projection data points to keep the screen highly engaging
    if (sortedPosts.length === 0) {
      return [
        { name: 'Start', title: 'Zero State', likes: 0, comments: 0, earnings: 0, cumulativeEarnings: 0, date: 'Day 0' },
        { name: 'Milestone 1', title: 'First Article', likes: 25, comments: 4, earnings: 25 * activeEarningRate, cumulativeEarnings: 25 * activeEarningRate, date: 'Week 1' },
        { name: 'Milestone 2', title: 'Fostering Chats', likes: 120, comments: 18, earnings: 95 * activeEarningRate, cumulativeEarnings: 120 * activeEarningRate, date: 'Week 2' },
        { name: 'Milestone 3', title: 'Active Blogger', likes: 340, comments: 45, earnings: 220 * activeEarningRate, cumulativeEarnings: 340 * activeEarningRate, date: 'Week 3' },
        { name: 'Milestone 4', title: 'Viral Insight', likes: 850, comments: 120, earnings: 510 * activeEarningRate, cumulativeEarnings: 850 * activeEarningRate, date: 'Week 4' },
      ].map(pt => ({
        ...pt,
        earnings: Number(pt.earnings.toFixed(2)),
        cumulativeEarnings: Number(pt.cumulativeEarnings.toFixed(2))
      }));
    }

    return sortedPosts.map((post, idx) => {
      const postLikes = likes.filter(l => l.postId === post.id).length;
      const postComments = comments.filter(c => c.postId === post.id).length;
      const postEarnings = postLikes * activeEarningRate;
      cumulative += postEarnings;

      return {
        name: `Post ${idx + 1}`,
        title: post.title.slice(0, 15) + '...',
        likes: postLikes,
        comments: postComments,
        earnings: Number(postEarnings.toFixed(2)),
        cumulativeEarnings: Number(cumulative.toFixed(2)),
        date: new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  }, [userPosts, likes, comments, activeEarningRate]);

  // Available Cash balance is total accrued minus approved and pending
  const availableNprBalance = Math.max(0, totalAccruedNpr - approvedWithdrawalsSum - pendingWithdrawalsSum);

  // Trigger push notifications when hitting 50%, 75%, and 100% of threshold
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const percentage = payoutGoal > 0 ? (availableNprBalance / payoutGoal) * 100 : 0;
    const isOver50 = percentage >= 50;
    const isOver75 = percentage >= 75;
    const isOver100 = percentage >= 100;
    
    const id50 = `notified_50_${payoutGoal}_${currentUser.id}`;
    const id75 = `notified_75_${payoutGoal}_${currentUser.id}`;
    const id100 = `notified_100_${payoutGoal}_${currentUser.id}`;
    
    if (isOver100 && !triggeredMilestones[id100]) {
      setTriggeredMilestones(prev => ({ ...prev, [id100]: true }));
      addNotification(
        currentUser.id,
        'system',
        `🎉 Payout Goal Reached! You have completed 100% of your Rs. ${payoutGoal} threshold milestone! Click standard payout request below to withdraw your earnings.`,
        undefined
      );
    } else if (isOver75 && !isOver100 && !triggeredMilestones[id75]) {
      setTriggeredMilestones(prev => ({ ...prev, [id75]: true }));
      addNotification(
        currentUser.id,
        'system',
        `🚀 Milestone Alert! You have hit 75% of your payout milestone goal (Rs. ${payoutGoal}). Almost there! Keep crafting content.`,
        undefined
      );
    } else if (isOver50 && !isOver75 && !triggeredMilestones[id50]) {
      setTriggeredMilestones(prev => ({ ...prev, [id50]: true }));
      addNotification(
        currentUser.id,
        'system',
        `📈 Halfway Mark! You have hit 50% of your payout milestone goal (Rs. ${payoutGoal}). You are growing extremely fast!`,
        undefined
      );
    }
  }, [availableNprBalance, payoutGoal, currentUser?.id, triggeredMilestones, addNotification]);

  const handleWithdrawalRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isMonetizationActive) {
      setErrorMsg('Withdrawals can only be initiated once monetization criteria (ID Verification & Tier 2 Storyteller) are fully resolved and active.');
      return;
    }

    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      setErrorMsg('Minimum withdrawal amount is Rs. 50.');
      return;
    }

    if (topPost.likes < 50) {
      setErrorMsg('Minimum of 50 likes on your top post required to unlock withdrawals.');
      return;
    }

    if (amount > availableNprBalance) {
      setErrorMsg(`Clearance Error: Requested amount Rs. ${amount} exceeds your withdrawable balance of Rs. ${availableNprBalance.toFixed(2)}.`);
      return;
    }

    if (!destinationDetails.trim()) {
      setErrorMsg('Please specify bank account details or virtual wallet account tags.');
      return;
    }

    setIsSubmitting(true);
    try {
      const routingString = `${payoutGateway.toUpperCase()} Gateway [${destinationDetails}]`;
      await requestWithdrawal(amount, payoutGateway, routingString);

      setSuccessMsg(`Withdrawal request of Rs. ${amount.toLocaleString()} NPR has been successfully submitted to the admin clearance queue.`);
      setWithdrawAmount('');
      setDestinationDetails('');
    } catch (err) {
      setErrorMsg('Database operation failed. Unable to register transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="h-full bg-zinc-50 overflow-y-auto" id="monetization-canvas">
      {/* Top Banner section */}
      <div className="bg-gradient-to-r from-stone-900 via-orange-900 to-amber-900 text-white p-8 md:p-12 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-12 translate-y-2 pointer-events-none">
          <Sparkles className="w-96 h-96" />
        </div>
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-200 inline-block px-3 py-1 rounded-full mb-3 border border-orange-500/10">
              🛡️ CREATOR MILESTONES & LEVEL HUB
            </div>
            <h1 className="font-sans font-black text-3xl md:text-4xl tracking-tighter uppercase leading-none">
              Monetization Hub
            </h1>
            <p className="text-stone-200 text-xs font-semibold leading-relaxed max-w-lg mt-2 opacity-90">
              Experience the gamified creator journey. Verify your identification card, climb the Creator Tiers, complete policy challenges, and withdraw balances seamlessly into localized Nepalese wallets.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2.5 shrink-0">
            {/* Realtime Status Pill */}
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner border font-bold text-xs uppercase tracking-wider ${
              isMonetizationActive
                ? 'bg-emerald-500/20 text-emerald-250 border-emerald-500/30'
                : 'bg-zinc-900/40 text-zinc-300 border-white/10'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isMonetizationActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{isMonetizationActive ? `Monetization ACTIVE: Level ${currentTier.level}` : 'MONETIZATION LOCKED'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Toggle */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 flex gap-6">
          <button
            onClick={() => setActiveSubTab('payout')}
            className={`py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'payout'
                ? 'border-orange-650 text-orange-650'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
            id="subtab-payout-btn"
          >
            🏆 Tiers & Creator Payout
          </button>
          <button
            onClick={() => setActiveSubTab('advertise')}
            className={`py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'advertise'
                ? 'border-orange-650 text-orange-650'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
            id="subtab-advertise-btn"
          >
            📢 eSewa Ad Promotion Portal
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {activeSubTab === 'payout' ? (
          <div>
            {/* Top Performance Section */}
            <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs text-left space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                  <TrendingUp className="w-5.5 h-5.5 text-orange-500" />
                  TOP PERFORMANCE
                </h2>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold cursor-help" onClick={() => setShowPayoutInfo(true)}>
                  <HelpCircle className="w-4 h-4" />
                  <span>How it works</span>
                </div>
              </div>
              {topPost.post ? (() => {
                const isLocked = topPost.likes < 50;
                const progress = Math.min((topPost.likes / 50) * 100, 100);
                const payout = topPost.likes * activeEarningRate;
                const isReadyToWithdraw = !isLocked && payout >= 25;
                return (
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-zinc-800">{topPost.post.title}</p>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${isLocked ? 'bg-zinc-200 text-zinc-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isLocked ? <Lock className="w-3 h-3"/> : <Unlock className="w-3 h-3"/>}
                        {isLocked ? 'Locked' : 'Unlocked'}
                      </div>
                    </div>
                    <div className="text-2xl font-black text-orange-650">
                      Rs. {payout.toFixed(2)}
                      <span className="text-sm font-normal text-zinc-500 ml-1">potential payout</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>{topPost.likes} / 50 likes</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                        <div className={`${isLocked ? 'bg-zinc-400' : 'bg-emerald-500'} h-full`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className={`mt-2 p-3 rounded-xl border ${isReadyToWithdraw ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-100 border-zinc-200'}`}>
                      <p className={`text-xs font-bold ${isReadyToWithdraw ? 'text-emerald-700' : 'text-zinc-500'}`}>
                        {isReadyToWithdraw ? '✅ Ready to Withdraw' : 'Withdrawal Eligibility Pending'}
                      </p>
                    </div>
                    <p className="text-[10px] text-zinc-400 italic">
                      Revenue = (Top Post Likes: {topPost.likes}) x (Tier Multiplier: {activeEarningRate.toFixed(2)}). Threshold: 50 likes & Rs. 25 minimum payout.
                    </p>
                  </div>
                );
              })() : (
                <p className="text-sm text-zinc-400">No posts published yet.</p>
              )}
            </div>

            {showPayoutInfo && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayoutInfo(false)}>
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-black text-zinc-900">How Payouts Work</h3>
                  <p className="text-sm text-zinc-600">
                    Earnings are calculated based on your top-performing post's total likes.
                  </p>
                  <div className="bg-zinc-100 p-4 rounded-2xl text-xs text-zinc-700 space-y-2">
                    <p>• <strong>50 Likes Threshold:</strong> You must reach at least 50 likes on your top post to unlock the ability to request a withdrawal.</p>
                    <p>• <strong>Rs. 25 Minimum:</strong> Your potential payout must be at least Rs. 25 to be eligible for withdrawal.</p>
                  </div>
                  <button 
                    className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm"
                    onClick={() => setShowPayoutInfo(false)}
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}

            {/* Gamified Creator Tiers Section */}
            <div className="bg-white border border-stone-200 p-6 md:p-8 rounded-3xl shadow-xs text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
                <div>
                  <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    <Trophy className="w-5.5 h-5.5 text-amber-500" />
                    CLIMB THE CREATOR TIERS
                  </h2>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Unlock progressively higher shared revenue rates as you generate articles and attract reactions on FreshLink.
                  </p>
                </div>
                <div className="bg-amber-50 text-amber-900 font-bold border border-amber-200/60 px-4 py-2 rounded-2xl flex items-center gap-2 self-start md:self-auto shrink-0">
                  <Star className="w-4.5 h-4.5 text-amber-600 fill-amber-600 shrink-0" />
                  <span className="text-xs">Active Tier: <strong className="font-black text-amber-950 font-sans">{currentTier.name}</strong></span>
                </div>
              </div>

              {/* Tiers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {CREATOR_TIERS.map((tier) => {
                  const isCurrent = currentTier.level === tier.level;
                  const isUnlocked = currentTier.level >= tier.level;
                  const earnedRate = tier.ratePerLike;

                  return (
                    <div
                      key={tier.name}
                      className={`p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-gradient-to-b from-amber-50/50 to-orange-50/20 border-amber-350 shadow-md ring-2 ring-amber-500/10'
                          : isUnlocked
                          ? 'bg-stone-50/50 border-stone-200 opacity-90'
                          : 'bg-zinc-50/40 border-zinc-150/80 opacity-60'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-2.5 left-4 bg-amber-600 text-white font-black text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full shadow-sm">
                          Active Tier
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Level {tier.level}</span>
                          {isUnlocked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-zinc-300 shrink-0" />
                          )}
                        </div>
                        <h4 className="text-sm font-black text-stone-900 uppercase tracking-tight font-sans">{tier.name}</h4>
                        <p className="text-[10.5px] text-zinc-400 font-medium leading-relaxed">{tier.description}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-stone-100 space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] font-bold text-zinc-405 uppercase tracking-wider">Earn Rate</span>
                          <span className="text-xs font-black text-orange-600">
                            Rs. {earnedRate.toFixed(2)}
                            <span className="text-[9px] text-zinc-400 font-normal">/react</span>
                          </span>
                        </div>

                        {/* Requirements List */}
                        <div className="space-y-1.5 text-[10px] font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-505">Posts Volume:</span>
                            <span className={`font-bold ${postsCount >= tier.minPosts ? 'text-emerald-700' : 'text-zinc-500'}`}>
                              {postsCount} / {tier.minPosts}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-505">Comments Recd:</span>
                            <span className={`font-bold ${totalCommentsCount >= tier.minComments ? 'text-emerald-700' : 'text-zinc-500'}`}>
                              {totalCommentsCount} / {tier.minComments}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-505">Reaction Likes:</span>
                            <span className={`font-bold ${totalLikesAllPosts >= tier.minLikes ? 'text-emerald-700' : 'text-zinc-500'}`}>
                              {totalLikesAllPosts} / {tier.minLikes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Tier Progression Gauge */}
              {nextTier && (
                <div className="bg-stone-50 border border-stone-200/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <span className="text-[9px] font-black text-orange-650 uppercase tracking-widest block">Progression Tracker</span>
                    <p className="text-xs font-bold text-stone-800">
                      Climb to <strong className="font-extrabold uppercase text-amber-900">{nextTier.name} (Level {nextTier.level})</strong> for an increased baseline rate of <strong>Rs. {nextTier.ratePerLike.toFixed(2)}/react</strong>!
                    </p>
                  </div>
                  
                  {/* Aggregated Progress Slider */}
                  <div className="w-full sm:max-w-md space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-400 font-semibold font-mono">
                      <span>Goal Progress</span>
                      <span>
                        {Math.round(
                          (Math.min(1, postsCount / (nextTier.minPosts || 1)) +
                            Math.min(1, totalCommentsCount / (nextTier.minComments || 1)) +
                            Math.min(1, totalLikesAllPosts / (nextTier.minLikes || 1))) *
                            (100 / 3)
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden relative">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" 
                        initial={{ width: '0%' }}
                        animate={{ 
                          width: `${Math.round(
                            (Math.min(1, postsCount / (nextTier.minPosts || 1)) +
                              Math.min(1, totalCommentsCount / (nextTier.minComments || 1)) +
                              Math.min(1, totalLikesAllPosts / (nextTier.minLikes || 1))) *
                              (100 / 3)
                          )}%` 
                        }}
                        transition={{ type: 'spring', stiffness: 45, damping: 15 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive "Sage Creator Policy Quiz" Challenge */}
            <div className="bg-gradient-to-br from-stone-900 via-zinc-900 to-amber-950 text-white rounded-[2rem] border border-amber-500/20 shadow-xl p-6 md:p-8 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-12 translate-y-12">
                <HelpCircle className="w-80 h-80 text-amber-500" />
              </div>
              
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-805 text-xs rounded-2xl border border-emerald-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn text-left">
                <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Real-time Creator Wallet Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
              
              <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 font-mono">Gross Engagement Likes</span>
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 animate-pulse">
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none">{totalLikesAllPosts.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-405 font-semibold mt-1.5 leading-none">All posts reactions combined</p>
              </div>

              <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 font-mono">Active Earning Rate</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Rs. {activeEarningRate.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-405 font-semibold mt-1.5 leading-none">Nepali Rupees per React</p>
              </div>

              <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 font-mono">Accrued Revenue</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs uppercase font-sans">
                    रु
                  </div>
                </div>
                <p className="text-2xl font-black text-[#EA580C] tracking-tight leading-none">Rs. {totalAccruedNpr.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                <p className="text-[10px] text-zinc-405 font-semibold mt-1.5 leading-none">NPR accumulated lifetime</p>
              </div>

              <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 font-mono">Withdrawable Net</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-650 tracking-tight leading-none">Rs. {availableNprBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                <p className="text-[10px] text-zinc-405 font-semibold mt-1.5 leading-none">Excluding payouts in transit</p>
              </div>

            </div>

            {/* 🏆 VIBRANT ENGAGING EARNINGS GOAL & PAYOUT TARGET */}
            <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-3xl shadow-sm text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="font-sans font-black text-sm uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-650 animate-bounce" />
                    My Earnings Payout Milestone Goal
                  </h3>
                  <p className="text-zinc-400 text-xs">
                    Set your custom target threshold to gamify your withdrawal milestones. Maximize engagement to reach your goals.
                  </p>
                </div>
                
                {/* Target Selectors */}
                <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 p-1 rounded-2xl self-start md:self-auto">
                  {[200, 500, 1000, 2500, 5000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPayoutGoal(val)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer ${
                        payoutGoal === val
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      Rs. {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Slider Display */}
              {(() => {
                const goalProgress = payoutGoal > 0 ? Math.min(100, (availableNprBalance / payoutGoal) * 100) : 0;
                const isGoalReached = availableNprBalance >= payoutGoal;
                const remainingNpr = Math.max(0, payoutGoal - availableNprBalance);

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-orange-650 tracking-wider">Goal Progress Status</span>
                        <h4 className="text-sm font-bold text-zinc-800">
                          {isGoalReached ? (
                            <span className="text-emerald-700 flex items-center gap-1.5 font-black uppercase tracking-tight font-sans">
                              🎉 Congratulations! Payout Target Milestone Reached!
                            </span>
                          ) : (
                            <span>
                              Keep pushing! You need <strong className="font-black text-orange-600">Rs. {remainingNpr.toFixed(2)}</strong> more to unlock clearance.
                            </span>
                          )}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-zinc-900 font-mono">{goalProgress.toFixed(1)}%</span>
                        <span className="text-xs text-zinc-400 block font-bold">of Rs. {payoutGoal.toLocaleString()} goal</span>
                      </div>
                    </div>

                    {/* Highly animated multi-color progress bar */}
                    <div className="relative w-full bg-zinc-100 h-4 rounded-full overflow-hidden border border-zinc-200/50 p-0.5 shadow-inner">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          isGoalReached 
                            ? 'from-emerald-500 via-teal-500 to-green-500 shadow-lg' 
                            : 'from-amber-500 via-orange-500 to-red-500'
                        } relative`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${goalProgress}%` }}
                        transition={{ type: 'spring', stiffness: 45, damping: 15 }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:15px_15px] animate-pulse opacity-40" />
                      </motion.div>
                    </div>

                    {/* Milestones timeline badges */}
                    <div className="grid grid-cols-5 text-[9px] font-mono font-bold text-zinc-400 pt-1 text-center relative select-none">
                      <div className="text-left font-sans">
                        <span className={availableNprBalance >= payoutGoal * 0.0 ? 'text-zinc-800' : ''}>🏁 Start</span>
                      </div>
                      <div className="font-sans">
                        <span className={availableNprBalance >= payoutGoal * 0.25 ? 'text-orange-700' : ''}>🥉 25%</span>
                      </div>
                      <div className="font-sans">
                        <span className={availableNprBalance >= payoutGoal * 0.5 ? 'text-amber-700' : ''}>🥈 50%</span>
                      </div>
                      <div className="font-sans">
                        <span className={availableNprBalance >= payoutGoal * 0.75 ? 'text-indigo-700' : ''}>🥇 75%</span>
                      </div>
                      <div className="text-right font-sans">
                        <span className={availableNprBalance >= payoutGoal ? 'text-emerald-700 font-black' : ''}>👑 Payout</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 📊 GAMIFIED FINANCIAL GROWTH ANALYTICS DASHBOARD */}
            <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-3xl shadow-sm text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
                <div>
                  <h3 className="font-sans font-black text-sm uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Creator Earnings & Growth Analytics
                  </h3>
                  <p className="text-zinc-400 text-xs">
                    Monitor your post-by-post performance metrics and project future earnings across creator tiers.
                  </p>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex gap-1.5 bg-zinc-50 border border-zinc-200 p-1 rounded-2xl self-start md:self-auto">
                  <button
                    onClick={() => setDashboardTab('growth')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1 ${
                      dashboardTab === 'growth' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    📈 Growth Trend
                  </button>
                  <button
                    onClick={() => setDashboardTab('engagement')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1 ${
                      dashboardTab === 'engagement' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    📊 Engagement
                  </button>
                  <button
                    onClick={() => setDashboardTab('simulator')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer flex items-center gap-1 ${
                      dashboardTab === 'simulator' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    🎯 Tier Simulator
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={dashboardTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="min-h-[280px]"
                >
                  {dashboardTab === 'growth' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-150/80">
                        <div className="text-xs">
                          <span className="text-[10px] font-black uppercase text-zinc-400 block leading-none font-sans">Cumulative Accumulation</span>
                          <span className="font-extrabold text-zinc-800 font-sans font-sans">Rupees growth Journey</span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-[10px] font-black uppercase text-zinc-400 block leading-none font-sans font-sans font-sans">Status</span>
                          <span className="text-emerald-700 font-extrabold font-mono">100% Calculated & Audited</span>
                        </div>
                      </div>

                      {/* Area Chart */}
                      <div className="h-[240px] w-full" id="earnings-growth-trend-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#EA580C" stopOpacity={0.00}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
                            <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} fontWeight="bold" />
                            <YAxis stroke="#A3A3A3" fontSize={10} fontWeight="bold" unit=" रु" />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-xl text-left text-xs shadow-xl space-y-1 font-sans">
                                      <p className="font-black uppercase tracking-wider text-orange-400 text-[10px]">{data.date}</p>
                                      <p className="font-extrabold text-white truncate max-w-xs">{data.title}</p>
                                      <div className="border-t border-zinc-800 pt-1 mt-1 space-y-0.5 text-[10.5px]">
                                        <p className="text-zinc-300">Likes: <strong className="text-white font-mono">{data.likes}</strong></p>
                                        <p className="text-zinc-300">This Post: <strong className="text-white font-mono">Rs. {data.earnings}</strong></p>
                                        <p className="text-orange-350 font-bold">Cumulative: <strong className="text-white font-mono">Rs. {data.cumulativeEarnings}</strong></p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area type="monotone" dataKey="cumulativeEarnings" stroke="#EA580C" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {dashboardTab === 'engagement' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-150/80">
                        <div className="text-xs font-sans">
                          <span className="text-[10px] font-black uppercase text-zinc-400 block leading-none font-sans">Engagement Metrics</span>
                          <span className="font-extrabold text-zinc-800">Likes & Comments Breakdown per Post</span>
                        </div>
                        <div className="text-right text-xs font-sans">
                          <span className="text-[10px] font-black uppercase text-zinc-400 block leading-none font-sans">Scope</span>
                          <span className="text-indigo-650 font-extrabold font-mono font-sans">Actual User Reactions</span>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="h-[240px] w-full" id="engagement-analytics-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F1" />
                            <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} fontWeight="bold" />
                            <YAxis stroke="#A3A3A3" fontSize={10} fontWeight="bold" />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-xl text-left text-xs shadow-xl space-y-1 font-sans font-sans">
                                      <p className="font-black uppercase tracking-wider text-indigo-400 text-[10px]">{data.date}</p>
                                      <p className="font-extrabold text-white truncate max-w-xs">{data.title}</p>
                                      <div className="border-t border-zinc-800 pt-1 mt-1 space-y-0.5 text-[10.5px] font-mono">
                                        <p className="text-orange-355">Likes: <strong className="text-white">{data.likes}</strong></p>
                                        <p className="text-indigo-355">Comments: <strong className="text-white">{data.comments}</strong></p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Bar dataKey="likes" fill="#EA580C" radius={[4, 4, 0, 0]} name="Likes received" />
                            <Bar dataKey="comments" fill="#6366F1" radius={[4, 4, 0, 0]} name="Comments received" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {dashboardTab === 'simulator' && (
                    <div className="space-y-6 bg-zinc-50 p-6 rounded-3xl border border-zinc-150/80 text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-650 tracking-widest block font-sans">Interactive Earnings Estimator</span>
                        <h4 className="text-sm font-black text-zinc-900 uppercase font-sans">Simulate Your Earning Growth Potential</h4>
                        <p className="text-zinc-400 text-[10.5px] font-sans font-sans">
                          Slide the controller to set your estimated target reactions and select a tier level to see what you will make with our audited 40% rate hike!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Simulation controls */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-700 font-sans">
                              <span>Target Likes / Reacts</span>
                              <span className="font-mono text-orange-600 font-extrabold text-sm">{simulateLikes.toLocaleString()}</span>
                            </div>
                            <input
                              type="range"
                              min={100}
                              max={10000}
                              step={100}
                              value={simulateLikes}
                              onChange={(e) => setSimulateLikes(Number(e.target.value))}
                              className="w-full accent-orange-600 cursor-pointer h-2 bg-zinc-200 rounded-lg appearance-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block font-sans">Select Creator Level</label>
                            <div className="grid grid-cols-2 gap-2">
                              {CREATOR_TIERS.map((tier, idx) => (
                                <button
                                  key={tier.name}
                                  type="button"
                                  onClick={() => setSimulateTierId(idx)}
                                  className={`p-2.5 text-left rounded-xl border text-[10.5px] font-black uppercase transition-all cursor-pointer ${
                                    simulateTierId === idx
                                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                                      : 'bg-white border-zinc-200 text-zinc-550 hover:bg-zinc-100'
                                  }`}
                                >
                                  Level {tier.level} • {tier.name.slice(0, 10)}...
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Simulation outcome metrics */}
                        {(() => {
                          const simTier = CREATOR_TIERS[simulateTierId];
                          const simBaseRate = simTier.ratePerLike;
                          const simBoosterRate = simBaseRate;
                          const projectedNpr = simulateLikes * simBoosterRate;

                          return (
                            <div className="bg-zinc-900 text-white p-5 rounded-2xl flex flex-col justify-between border border-zinc-800 shadow-lg font-sans">
                              <div>
                                <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider block">Estimated projections</span>
                                <h4 className="text-xs font-bold text-zinc-300 mt-0.5">{simTier.name} (Level {simTier.level})</h4>
                                <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 border-b border-zinc-800 pb-2">
                                  <span>Earning rate:</span>
                                  <span className="font-mono text-white font-sans">Rs. {simBoosterRate.toFixed(2)}/like</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 font-sans">
                                  <span>Simulated Reactions:</span>
                                  <span className="font-mono text-white">{simulateLikes.toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="pt-4 border-t border-zinc-800 mt-4 font-sans">
                                <span className="text-[9px] font-black uppercase text-zinc-450 block leading-none">Projected NPR Revenue</span>
                                <span className="text-3xl font-mono font-black text-orange-500 block mt-1">Rs. {projectedNpr.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                <span className="text-[9px] text-zinc-450 mt-1 block">Includes active boosters</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
              
              {/* Left Panel: Request Payout */}
              <div className="md:col-span-7 bg-white border border-zinc-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
                <div>
                  <h2 className="font-sans font-black text-lg uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    Transfer Revenue
                  </h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Withdraw cleared funds directly into your localized Nepalese bank routing ID or wallet app.
                  </p>
                </div>

                {isMonetizationActive ? (
                  <form onSubmit={handleWithdrawalRequestSubmit} className="space-y-4">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">
                        Choose Payout Channel Gateway
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {['eSewa', 'Khalti', 'Bank Transfer'].map((channel) => (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => setPayoutGateway(channel as any)}
                            className={`py-3 text-xs font-bold rounded-xl transition border text-center ${
                              payoutGateway === channel 
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100'
                            }`}
                          >
                            {channel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">
                        Transfer Sum (NPR Nepalese Rupees)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">Rs.</div>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={`e.g. ${Math.min(500, Number(availableNprBalance.toFixed(1)))}`}
                          className="w-full pl-9 pr-4 py-2.5 text-xs font-bold bg-[#F8F7F4] focus:bg-white border-zinc-200 rounded-xl outline-none"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold px-1">
                        <span>Target Transfer Cap: Rs. {availableNprBalance.toFixed(2)}</span>
                        <button 
                          type="button" 
                          onClick={() => setWithdrawAmount(availableNprBalance.toFixed(2))}
                          className="text-indigo-650 hover:underline font-bold"
                        >
                          Max Out
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A]/40 block">
                        {payoutGateway === 'Bank Transfer' ? 'Bank Name, Account Name & Account Number' : `${payoutGateway} Account ID / Mobile Registered Number`}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={destinationDetails}
                        onChange={(e) => setDestinationDetails(e.target.value)}
                        placeholder={
                          payoutGateway === 'Bank Transfer'
                            ? "Nabil Bank Ltd\nAccount Holder: Clara Bhattarai\nAccount Number: 0210017500125"
                            : `Enter your registerd ${payoutGateway} phone or address tag. e.g. 9841XXXXXX`
                        }
                        className="w-full px-3.5 py-3 text-xs font-bold bg-[#F8F7F4] focus:bg-white rounded-xl outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-[#EA580C] hover:bg-orange-650 disabled:bg-zinc-200 text-white font-sans font-black uppercase text-[10.5px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4.5 h-4.5" />
                      <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Withdrawal Claim'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-zinc-400">
                    <Lock className="w-8 h-8 mb-2" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">Withdraw Form Locked</h4>
                    <p className="text-[10.5px] text-zinc-405 max-w-sm mt-1 leading-normal font-medium">
                      {!isAccountVerified ? (
                        "Withdrawal features are gated and locked because your identification document is currently unverified. Please submit your citizenship documents in Admin Panel."
                      ) : (
                        `Withdrawal features require you to reach at least level 2 ("Vanguard Storyteller") to qualify for payouts. Write more stories, attract reactions, and make comments to grow!`
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel: Transaction Ledgers */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    Transfer History Logs
                  </h3>

                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {userWithdrawals.length === 0 ? (
                      <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed text-zinc-400">
                        <p className="text-[10.5px] font-bold">No transfers registered yet.</p>
                      </div>
                    ) : (
                      [...userWithdrawals].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((tx) => (
                        <div key={tx.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl space-y-2 animate-in fade-in duration-100">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <div>
                              <p className="font-extrabold text-zinc-800 uppercase tracking-wide leading-none">{tx.paymentMethod}</p>
                              <p className="text-[9.5px] text-zinc-400 mt-1">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="font-mono font-black text-indigo-750">
                              Rs. {tx.amountNpr.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-150/50">
                            <span className={`text-[9.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              tx.status === 'pending'
                                ? 'text-indigo-700 bg-indigo-50 border border-indigo-100'
                                : tx.status === 'approved'
                                ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                                : 'text-red-700 bg-red-50 border border-red-100'
                            }`}>
                              {tx.status}
                            </span>
                            <span className="text-[9px] text-zinc-400 italic shrink-0 max-w-44 truncate">{tx.details}</span>
                          </div>
                          {tx.remarks && (
                            <div className="p-2 bg-red-50/50 border border-red-100/60 rounded-xl text-[9.5px] text-red-750 font-sans leading-tight mt-1 animate-in fade-in duration-75">
                              <span className="font-black uppercase text-[8px] block tracking-wider text-red-800 mb-0.5">Admin Remarks</span>
                              {tx.remarks}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <AdPortal 
            currentUser={currentUser} 
            ads={ads} 
            createOrUpdateAd={createOrUpdateAd} 
            deleteAd={deleteAd}
          />
        )
      }
      </div>
    </div>
  );
};
