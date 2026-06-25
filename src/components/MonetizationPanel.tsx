/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';

export const MonetizationPanel: React.FC = () => {
  const { currentUser, posts, comments, likes, withdrawals, requestWithdrawal, ads, createOrUpdateAd } = useSocialPlatform();
  
  // Local state for payouts
  const [activeSubTab, setActiveSubTab] = useState<'payout' | 'advertise'>('payout');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutGateway, setPayoutGateway] = useState<'eSewa' | 'Khalti' | 'Bank Transfer'>('eSewa');
  const [destinationDetails, setDestinationDetails] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for eSewa advertising portal
  const [adStep, setAdStep] = useState<1 | 2>(1);
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adPlacement, setAdPlacement] = useState<'workspace' | 'bubble'>('workspace');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adDurationTier, setAdDurationTier] = useState<'7' | '15' | '30'>('7');
  const [scheduledDate, setScheduledDate] = useState('');
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState('');
  const [adSuccess, setAdSuccess] = useState('');
  const [adError, setAdError] = useState('');
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

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

  // Calculate maximum comments on any single post
  const matchCommentsCountList = useMemo(() => {
    return userPosts.map(p => comments.filter(c => c.postId === p.id).length);
  }, [userPosts, comments]);

  const maxCommentsOnSinglePost = useMemo(() => {
    return matchCommentsCountList.length > 0 ? Math.max(...matchCommentsCountList) : 0;
  }, [matchCommentsCountList]);

  // Calculate maximum likes on any single post
  const matchLikesCountList = useMemo(() => {
    return userPosts.map(p => likes.filter(l => l.postId === p.id).length);
  }, [userPosts, likes]);

  const maxLikesOnSinglePost = useMemo(() => {
    return matchLikesCountList.length > 0 ? Math.max(...matchLikesCountList) : 0;
  }, [matchLikesCountList]);

  // Calculate total likes on all of user's posts
  const totalLikesAllPosts = useMemo(() => {
    return likes.filter(l => userPostIds.includes(l.postId)).length;
  }, [likes, userPostIds]);

  // 2. Define criteria statuses
  const isAccountVerified = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.isAdmin === true || (currentUser?.hasVerifiedDetails === true && currentUser?.isApprovedByAdmin === true);
  const hasMetPosts = postsCount >= 5;
  const hasMetComments = maxCommentsOnSinglePost >= 50;
  const hasMetLikes = maxLikesOnSinglePost >= 1000;

  const genuinelyEligible = hasMetPosts && hasMetComments && hasMetLikes;
  const isMonetizationActive = isAccountVerified && genuinelyEligible;

  // 3. Earning metrics
  const EARNING_RATE_NPR = 0.25; // 0.25 Nepalese Rupees per like
  const totalAccruedNpr = totalLikesAllPosts * EARNING_RATE_NPR;

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

  // Available Cash balance is total accrued minus approved and pending
  const availableNprBalance = Math.max(0, totalAccruedNpr - approvedWithdrawalsSum - pendingWithdrawalsSum);

  const handleWithdrawalRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isMonetizationActive) {
      setErrorMsg('Withdrawals can only be initiated once monetization criteria are fully resolved and active.');
      return;
    }

    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please specify a positive numerical sum to transfer.');
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
      // Create request on Firebase firestore
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
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white p-8 md:p-12 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-12 translate-y-2 pointer-events-none">
          <Sparkles className="w-96 h-96" />
        </div>
        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 inline-block px-3 py-1 rounded-full mb-3 border border-white/10">
              FRESHLINK CREATOR PARTNER PROGRAM
            </div>
            <h1 className="font-sans font-black text-3xl md:text-4xl tracking-tighter uppercase leading-none">
              Monetization Hub
            </h1>
            <p className="text-zinc-100 text-xs font-semibold leading-relaxed max-w-lg mt-2 opacity-90">
              Earn steady residual rewards from high-quality blog postings. Verify your account parameters, track real engagement metrics, and clear withdraw balances to Nepalese accounts.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2.5 shrink-0">
            {/* Realtime Status Pill */}
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner border font-bold text-xs uppercase tracking-wider ${
              isMonetizationActive
                ? 'bg-emerald-500/20 text-emerald-250 border-emerald-500/30'
                : 'bg-zinc-950/20 text-zinc-300 border-white/10'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isMonetizationActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>{isMonetizationActive ? 'Monetization: ACTIVE' : 'Monetization: LOCK'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Toggle */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 flex gap-6">
          <button
            onClick={() => setActiveSubTab('payout')}
            className={`py-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'payout'
                ? 'border-orange-650 text-orange-650'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
            id="subtab-payout-btn"
          >
            💰 Creator Revenue Payout
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

      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
        {activeSubTab === 'payout' ? (
          <>
            {/* Partner Program Conditions Information Widget */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-5 md:p-6 border border-amber-250/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-amber-900 flex items-center gap-2 uppercase tracking-wider">
              <Sparkles className="w-5 h-5 text-amber-600 animate-bounce" />
              Creator Partner Program Conditions
            </h3>
            <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-2xl">
              FreshLink shares ad revenues with passionate writers who foster vibrant local conversations. To check your status and initiate real payout transfers, you must meet the engagement requirements below.
            </p>
          </div>
          <div className="shrink-0 bg-white/80 backdrop-blur-md border border-amber-200/60 px-4 py-2.5 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest block">Accumulation Rate</span>
            <span className="text-sm font-black text-orange-600">Rs. 0.25 <span className="text-[9.5px] font-normal text-zinc-500 font-sans tracking-normal">per post Like</span></span>
          </div>
        </div>

        {/* Requirements Progression Matrix */}
        <div className="bg-white border border-zinc-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-5 text-left">
          <div>
            <h2 className="font-sans font-black text-base uppercase tracking-tight text-zinc-900">
              Account Verification & Eligibility Matrix
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">
              To activate partner status and authorize transfers, creators must clear these strict political-engagement bounds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1: Account Verification */}
            <div className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
              isAccountVerified ? 'bg-emerald-50/40 border-emerald-250' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wide">1. ID Verification</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Approved citizen or PAN document</p>
                </div>
                {isAccountVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-zinc-300 shrink-0" />
                )}
              </div>
              <div className="mt-5">
                <div className="flex justify-between items-end text-[10px] font-bold text-zinc-400 mb-1">
                  <span>Verification Status</span>
                  <span className={isAccountVerified ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-bold'}>
                    {isAccountVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden animate-pulse">
                  <div className={`h-full transition-all duration-350 ${isAccountVerified ? 'bg-emerald-650' : 'bg-amber-600'}`} style={{ width: isAccountVerified ? '100%' : '20%' }} />
                </div>
              </div>
            </div>

            {/* Step 2: Post Volume */}
            <div className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
              hasMetPosts ? 'bg-emerald-50/40 border-emerald-250' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wide">2. Post Volume</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Publish at least 5 articles on FreshLink</p>
                </div>
                {hasMetPosts ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-zinc-300 shrink-0" />
                )}
              </div>
              <div className="mt-5">
                <div className="flex justify-between items-end text-[10px] font-bold text-zinc-400 mb-1">
                  <span>Progress Ratio</span>
                  <span className={hasMetPosts ? 'text-emerald-700' : 'text-zinc-600'}>{postsCount} / 5</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-350 ${hasMetPosts ? 'bg-emerald-650' : 'bg-amber-600'}`} style={{ width: `${Math.min(100, (postsCount / 5) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Step 3: Peak Comments */}
            <div className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
              hasMetComments ? 'bg-emerald-50/40 border-emerald-250' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wide">3. Peak Comments</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Receive 50 comments on any single post</p>
                </div>
                {hasMetComments ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-zinc-300 shrink-0" />
                )}
              </div>
              <div className="mt-5">
                <div className="flex justify-between items-end text-[10px] font-bold text-zinc-400 mb-1">
                  <span>Peak Comments on Post</span>
                  <span className={hasMetComments ? 'text-emerald-700' : 'text-zinc-600'}>{maxCommentsOnSinglePost} / 50</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-350 ${hasMetComments ? 'bg-emerald-650' : 'bg-amber-600'}`} style={{ width: `${Math.min(100, (maxCommentsOnSinglePost / 50) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Step 4: Peak Likes Quota */}
            <div className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
              hasMetLikes ? 'bg-emerald-50/40 border-emerald-250' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wide">4. Peak Likes Quota</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">At least 1k likes on any single post</p>
                </div>
                {hasMetLikes ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-zinc-300 shrink-0" />
                )}
              </div>
              <div className="mt-5">
                <div className="flex justify-between items-end text-[10px] font-bold text-zinc-400 mb-1">
                  <span>Peak Likes on Post</span>
                  <span className={hasMetLikes ? 'text-emerald-700' : 'text-zinc-600'}>{maxLikesOnSinglePost.toLocaleString()} / 1,000</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                  <div className={`h-full transition-all duration-350 ${hasMetLikes ? 'bg-emerald-650' : 'bg-amber-600'}`} style={{ width: `${Math.min(100, (maxLikesOnSinglePost / 1000) * 100)}%` }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-805 text-xs rounded-2xl border border-emerald-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Real-time Creator Wallet Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          
          <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 font-mono">Gross Engagement Likes</span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none">{totalLikesAllPosts.toLocaleString()}</p>
            <p className="text-[10px] text-zinc-405 font-semibold mt-1.5 leading-none">All posts combined likes</p>
          </div>

          <div className="bg-white border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 font-mono">Monetization Rate</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Rs. 0.25</p>
            <p className="text-[10px] text-zinc-405 font-semibold mt-1.5 leading-none">Nepali Rupees per Like</p>
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
                <p className="text-[10.5px] text-zinc-400 max-w-sm mt-1 leading-normal font-medium">
                  Withdrawal features are gated and only active for verified partners with at least 5 stories, 50 comments on a single post, and at least 1k likes on a single post.
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
          </>
        ) : (
          <AdPortal 
            currentUser={currentUser} 
            ads={ads} 
            createOrUpdateAd={createOrUpdateAd} 
          />
        )}
      </div>
    </div>
  );
};
