/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, AdBanner } from '../types';
import { 
  Megaphone, 
  QrCode, 
  Calendar, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink, 
  Tv, 
  Check, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface AdPortalProps {
  currentUser: User;
  ads: AdBanner[];
  createOrUpdateAd: (ad: any) => Promise<void>;
  deleteAd?: (adId: string) => Promise<void>;
}

export const AdPortal: React.FC<AdPortalProps> = ({ currentUser, ads, createOrUpdateAd, deleteAd }) => {
  // Local state
  const [submissionMode, setSubmissionMode] = useState<'single' | 'triple'>('single');
  const [activeAdTab, setActiveAdTab] = useState<0 | 1 | 2>(0);

  // Ad 1 state (using the same variable names for seamless backward-compatibility)
  const [adName, setAdName] = useState(() => localStorage.getItem('adName') || '');
  const [adPurpose, setAdPurpose] = useState(() => localStorage.getItem('adPurpose') || '');
  const [adContact, setAdContact] = useState(() => localStorage.getItem('adContact') || '');
  const [adContent, setAdContent] = useState(() => localStorage.getItem('adContent') || '');
  const [adLocation, setAdLocation] = useState(() => localStorage.getItem('adLocation') || '');
  const [adEmail, setAdEmail] = useState(() => localStorage.getItem('adEmail') || '');
  const [adImageUrl, setAdImageUrl] = useState(() => localStorage.getItem('adImageUrl') || '');

  // Ad 2 state
  const [adName2, setAdName2] = useState(() => localStorage.getItem('adName2') || '');
  const [adPurpose2, setAdPurpose2] = useState(() => localStorage.getItem('adPurpose2') || '');
  const [adContact2, setAdContact2] = useState(() => localStorage.getItem('adContact2') || '');
  const [adContent2, setAdContent2] = useState(() => localStorage.getItem('adContent2') || '');
  const [adLocation2, setAdLocation2] = useState(() => localStorage.getItem('adLocation2') || '');
  const [adEmail2, setAdEmail2] = useState(() => localStorage.getItem('adEmail2') || '');
  const [adImageUrl2, setAdImageUrl2] = useState(() => localStorage.getItem('adImageUrl2') || '');

  // Ad 3 state
  const [adName3, setAdName3] = useState(() => localStorage.getItem('adName3') || '');
  const [adPurpose3, setAdPurpose3] = useState(() => localStorage.getItem('adPurpose3') || '');
  const [adContact3, setAdContact3] = useState(() => localStorage.getItem('adContact3') || '');
  const [adContent3, setAdContent3] = useState(() => localStorage.getItem('adContent3') || '');
  const [adLocation3, setAdLocation3] = useState(() => localStorage.getItem('adLocation3') || '');
  const [adEmail3, setAdEmail3] = useState(() => localStorage.getItem('adEmail3') || '');
  const [adImageUrl3, setAdImageUrl3] = useState(() => localStorage.getItem('adImageUrl3') || '');

  const [scheduledDate, setScheduledDate] = useState(() => localStorage.getItem('scheduledDate') || '');
  const [adSuccess, setAdSuccess] = useState('');
  const [adError, setAdError] = useState('');
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

  // Sync state to localStorage
  React.useEffect(() => {
    localStorage.setItem('adName', adName);
    localStorage.setItem('adPurpose', adPurpose);
    localStorage.setItem('adContact', adContact);
    localStorage.setItem('adContent', adContent);
    localStorage.setItem('adLocation', adLocation);
    localStorage.setItem('adEmail', adEmail);
    localStorage.setItem('adImageUrl', adImageUrl);

    localStorage.setItem('adName2', adName2);
    localStorage.setItem('adPurpose2', adPurpose2);
    localStorage.setItem('adContact2', adContact2);
    localStorage.setItem('adContent2', adContent2);
    localStorage.setItem('adLocation2', adLocation2);
    localStorage.setItem('adEmail2', adEmail2);
    localStorage.setItem('adImageUrl2', adImageUrl2);

    localStorage.setItem('adName3', adName3);
    localStorage.setItem('adPurpose3', adPurpose3);
    localStorage.setItem('adContact3', adContact3);
    localStorage.setItem('adContent3', adContent3);
    localStorage.setItem('adLocation3', adLocation3);
    localStorage.setItem('adEmail3', adEmail3);
    localStorage.setItem('adImageUrl3', adImageUrl3);

    localStorage.setItem('scheduledDate', scheduledDate);
  }, [
    adName, adPurpose, adContact, adContent, adLocation, adEmail, adImageUrl,
    adName2, adPurpose2, adContact2, adContent2, adLocation2, adEmail2, adImageUrl2,
    adName3, adPurpose3, adContact3, adContent3, adLocation3, adEmail3, adImageUrl3,
    scheduledDate
  ]);

  const myAdRequests = useMemo(() => {
    if (!currentUser || !ads) return [];
    return ads.filter(a => a.userId === currentUser.id);
  }, [ads, currentUser]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tabIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setAdError(`File too large. Please upload an image under 1.5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        if (tabIndex === 0) setAdImageUrl(resultStr);
        else if (tabIndex === 1) setAdImageUrl2(resultStr);
        else setAdImageUrl3(resultStr);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdError('');
    setAdSuccess('');

    if (!scheduledDate) {
      setAdError("Validation failed: Please specify a target launch schedule date.");
      return;
    }

    setIsAdSubmitting(true);
    try {
      if (submissionMode === 'single') {
        if (!adName.trim() || !adPurpose.trim() || !adContact.trim() || !adContent.trim() || !adLocation.trim() || !adEmail.trim() || !adImageUrl) {
          setAdError("Validation failed: Please complete all campaign fields for Ad #1.");
          setIsAdSubmitting(false);
          return;
        }
        const adId = `ad_req_${Date.now()}`;
        await createOrUpdateAd({
          id: adId,
          userId: currentUser.id,
          name: adName.trim(),
          purpose: adPurpose.trim(),
          contact: adContact.trim(),
          content: adContent.trim(),
          location: adLocation.trim(),
          email: adEmail.trim(),
          imageUrl: adImageUrl,
          active: false,
          status: 'pending',
          scheduledDate: scheduledDate,
          createdAt: new Date().toISOString()
        });

        setAdSuccess(`Success! Your campaign "${adName}" has been submitted for review.`);
        
        // Clear form 1
        setAdName('');
        setAdPurpose('');
        setAdContact('');
        setAdContent('');
        setAdLocation('');
        setAdEmail('');
        setAdImageUrl('');
      } else {
        // Validate all 3 ads
        if (!adName.trim() || !adPurpose.trim() || !adContact.trim() || !adContent.trim() || !adLocation.trim() || !adEmail.trim() || !adImageUrl ||
            !adName2.trim() || !adPurpose2.trim() || !adContact2.trim() || !adContent2.trim() || !adLocation2.trim() || !adEmail2.trim() || !adImageUrl2 ||
            !adName3.trim() || !adPurpose3.trim() || !adContact3.trim() || !adContent3.trim() || !adLocation3.trim() || !adEmail3.trim() || !adImageUrl3) {
          setAdError("Validation failed: Please complete all fields and upload images for all 3 Ads in the Triple Package.");
          setIsAdSubmitting(false);
          return;
        }

        const now = Date.now();
        
        // Save Ad 1
        await createOrUpdateAd({
          id: `ad_req_${now}_1`,
          userId: currentUser.id,
          name: adName.trim(),
          purpose: adPurpose.trim(),
          contact: adContact.trim(),
          content: adContent.trim(),
          location: adLocation.trim(),
          email: adEmail.trim(),
          imageUrl: adImageUrl,
          active: false,
          status: 'pending',
          scheduledDate: scheduledDate,
          createdAt: new Date().toISOString()
        });

        // Save Ad 2
        await createOrUpdateAd({
          id: `ad_req_${now}_2`,
          userId: currentUser.id,
          name: adName2.trim(),
          purpose: adPurpose2.trim(),
          contact: adContact2.trim(),
          content: adContent2.trim(),
          location: adLocation2.trim(),
          email: adEmail2.trim(),
          imageUrl: adImageUrl2,
          active: false,
          status: 'pending',
          scheduledDate: scheduledDate,
          createdAt: new Date().toISOString()
        });

        // Save Ad 3
        await createOrUpdateAd({
          id: `ad_req_${now}_3`,
          userId: currentUser.id,
          name: adName3.trim(),
          purpose: adPurpose3.trim(),
          contact: adContact3.trim(),
          content: adContent3.trim(),
          location: adLocation3.trim(),
          email: adEmail3.trim(),
          imageUrl: adImageUrl3,
          active: false,
          status: 'pending',
          scheduledDate: scheduledDate,
          createdAt: new Date().toISOString()
        });

        setAdSuccess(`Success! All 3 of your campaigns have been successfully queued and submitted for manual review.`);
        
        // Clear all forms
        setAdName(''); setAdPurpose(''); setAdContact(''); setAdContent(''); setAdLocation(''); setAdEmail(''); setAdImageUrl('');
        setAdName2(''); setAdPurpose2(''); setAdContact2(''); setAdContent2(''); setAdLocation2(''); setAdEmail2(''); setAdImageUrl2('');
        setAdName3(''); setAdPurpose3(''); setAdContact3(''); setAdContent3(''); setAdLocation3(''); setAdEmail3(''); setAdImageUrl3('');
        setActiveAdTab(0);
      }
      setScheduledDate('');
    } catch (err) {
      setAdError("Database clearance failed: unable to submit ad request.");
    } finally {
      setIsAdSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-200" id="ad-promotion-portal-section">
      
      {/* Info and Intro Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 md:p-6 border border-emerald-200/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2 uppercase tracking-wider">
            <Megaphone className="w-5 h-5 text-emerald-600 animate-pulse" />
            Advertise on FreshLink Connect
          </h3>
          <p className="text-xs text-emerald-800 font-medium leading-relaxed max-w-2xl">
            Reach our active creator community directly. Put up a prominent <strong>Workspace Feed Banner</strong>. Submit your details below, and our administration team will review your proposal and get in touch manually to schedule activation.
          </p>
        </div>
        <div className="shrink-0 bg-white/80 backdrop-blur-md border border-emerald-200/60 px-4 py-2.5 rounded-2xl text-right">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block">Review Duration</span>
          <span className="text-sm font-black text-emerald-600">Manual review <span className="text-[9.5px] font-normal text-zinc-500 font-sans tracking-normal">within 24 hours</span></span>
        </div>
      </div>

      {adSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{adSuccess}</span>
        </div>
      )}

      {adError && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-150 flex items-center gap-2.5 font-bold shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          <span>{adError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Campaign Composition Desk (Left Form) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          
          {/* Form Progress Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">
                Campaign Submission
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">
                Complete the details below to request a new ad campaign.
              </p>
            </div>
          </div>

          {/* Campaign Mode Selector */}
          <div className="bg-zinc-100 p-1 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSubmissionMode('single')}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                submissionMode === 'single'
                  ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/40'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Single Ad Campaign
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmissionMode('triple');
                setActiveAdTab(0);
              }}
              className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                submissionMode === 'triple'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Triple Ad Campaign (3 Ads Package) ✨
            </button>
          </div>

          {/* Tab Selector inside Triple Campaign Mode */}
          {submissionMode === 'triple' && (
            <div className="bg-zinc-50 p-2 rounded-2xl border border-zinc-200/60 flex items-center gap-1.5 flex-wrap">
              {[0, 1, 2].map((idx) => {
                const img = idx === 0 ? adImageUrl : idx === 1 ? adImageUrl2 : adImageUrl3;
                const name = idx === 0 ? adName : idx === 1 ? adName2 : adName3;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveAdTab(idx as 0 | 1 | 2)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                      activeAdTab === idx
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    <span>Ad Campaign #{idx + 1}</span>
                    {img && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />}
                    {name.trim() && <span className="text-[8px] lowercase opacity-60">({name.trim().slice(0, 6)}...)</span>}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => {
                  if (!adName || !adPurpose || !adContact || !adLocation || !adEmail) {
                    setAdError("Please fill out Ad #1 details first before copying.");
                    return;
                  }
                  setAdName2(adName);
                  setAdPurpose2(adPurpose);
                  setAdContact2(adContact);
                  setAdLocation2(adLocation);
                  setAdEmail2(adEmail);
                  
                  setAdName3(adName);
                  setAdPurpose3(adPurpose);
                  setAdContact3(adContact);
                  setAdLocation3(adLocation);
                  setAdEmail3(adEmail);

                  setAdSuccess("Successfully duplicated Ad #1 details to Ad #2 and Ad #3! You can now adjust their contents and upload images.");
                  setTimeout(() => setAdSuccess(''), 4500);
                }}
                className="ml-auto text-[8.5px] font-mono font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 transition-all cursor-pointer"
                title="Copy name, purpose, contact, location, and email from Ad 1 to all slots"
              >
                ⚡ Copy Ad #1 Info to All
              </button>
            </div>
          )}

            <form onSubmit={handleAdSubmit} className="space-y-5">
              
              {/* Campaign Details */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Campaign Name {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                  </label>
                  {submissionMode === 'triple' && (
                    <span className="text-[8.5px] font-mono text-emerald-600 font-bold uppercase">Editing Tab {activeAdTab + 1} of 3</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={
                    submissionMode === 'single'
                      ? adName
                      : activeAdTab === 0
                      ? adName
                      : activeAdTab === 1
                      ? adName2
                      : adName3
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (submissionMode === 'single') setAdName(val);
                    else if (activeAdTab === 0) setAdName(val);
                    else if (activeAdTab === 1) setAdName2(val);
                    else setAdName3(val);
                  }}
                  placeholder={activeAdTab === 0 ? "e.g. Nepal Tourism" : activeAdTab === 1 ? "e.g. Pokhara Adventure Travel" : "e.g. Chitwan Wild Safari"}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-bold text-zinc-850 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Campaign Purpose {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                </label>
                <input
                  type="text"
                  required
                  value={
                    submissionMode === 'single'
                      ? adPurpose
                      : activeAdTab === 0
                      ? adPurpose
                      : activeAdTab === 1
                      ? adPurpose2
                      : adPurpose3
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (submissionMode === 'single') setAdPurpose(val);
                    else if (activeAdTab === 0) setAdPurpose(val);
                    else if (activeAdTab === 1) setAdPurpose2(val);
                    else setAdPurpose3(val);
                  }}
                  placeholder="e.g. Brand Awareness / Product Promotion"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-bold text-zinc-850 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Contact Phone {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                </label>
                <input
                  type="text"
                  required
                  value={
                    submissionMode === 'single'
                      ? adContact
                      : activeAdTab === 0
                      ? adContact
                      : activeAdTab === 1
                      ? adContact2
                      : adContact3
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (submissionMode === 'single') setAdContact(val);
                    else if (activeAdTab === 0) setAdContact(val);
                    else if (activeAdTab === 1) setAdContact2(val);
                    else setAdContact3(val);
                  }}
                  placeholder="e.g. +977-98xxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-bold text-zinc-850 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Campaign Description {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                </label>
                <textarea
                  required
                  rows={3}
                  value={
                    submissionMode === 'single'
                      ? adContent
                      : activeAdTab === 0
                      ? adContent
                      : activeAdTab === 1
                      ? adContent2
                      : adContent3
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (submissionMode === 'single') setAdContent(val);
                    else if (activeAdTab === 0) setAdContent(val);
                    else if (activeAdTab === 1) setAdContent2(val);
                    else setAdContent3(val);
                  }}
                  placeholder="e.g. Get 20% discount on flight tickets. Limitless exploration awaits..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-medium text-zinc-800 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Location {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                </label>
                <input
                  type="text"
                  required
                  value={
                    submissionMode === 'single'
                      ? adLocation
                      : activeAdTab === 0
                      ? adLocation
                      : activeAdTab === 1
                      ? adLocation2
                      : adLocation3
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (submissionMode === 'single') setAdLocation(val);
                    else if (activeAdTab === 0) setAdLocation(val);
                    else if (activeAdTab === 1) setAdLocation2(val);
                    else setAdLocation3(val);
                  }}
                  placeholder="e.g. Kathmandu, Nepal"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-bold text-zinc-850 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Contact Email {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                </label>
                <input
                  type="email"
                  required
                  value={
                    submissionMode === 'single'
                      ? adEmail
                      : activeAdTab === 0
                      ? adEmail
                      : activeAdTab === 1
                      ? adEmail2
                      : adEmail3
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (submissionMode === 'single') setAdEmail(val);
                    else if (activeAdTab === 0) setAdEmail(val);
                    else if (activeAdTab === 1) setAdEmail2(val);
                    else setAdEmail3(val);
                  }}
                  placeholder="e.g. marketing@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F8F7F4] focus:bg-white border border-zinc-200 text-xs font-bold text-zinc-850 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Schedule Go Live Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Target Scheduled Launch Date {submissionMode === 'triple' && '(Applies to all 3 Ads)'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-[#F8F7F4] focus:bg-white border border-zinc-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                  <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Banner Image file or URL selection */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Ad Banner Image Asset {submissionMode === 'triple' && `(Ad #${activeAdTab + 1})`}
                  </label>
                  <span className="text-[8.5px] font-mono text-zinc-400 uppercase">JPEG / PNG Under 1.5MB</span>
                </div>
                <div className="grid grid-cols-1 gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-150">
                  <div className="relative border border-dashed border-zinc-250 hover:bg-zinc-100/50 rounded-xl transition overflow-hidden h-24 flex flex-col items-center justify-center p-3 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, submissionMode === 'single' ? 0 : activeAdTab)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-[9.5px] font-black text-zinc-700">Choose local image for Ad #{submissionMode === 'single' ? 1 : activeAdTab + 1}</span>
                    <span className="text-[8.5px] text-zinc-400">or drag and drop</span>
                  </div>
                  {(submissionMode === 'single' ? adImageUrl : activeAdTab === 0 ? adImageUrl : activeAdTab === 1 ? adImageUrl2 : adImageUrl3) && (
                    <div className="text-[9px] text-zinc-500 font-mono text-center flex items-center justify-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Image asset successfully loaded
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdSubmitting}
                className="w-full py-3 bg-[#60bb46] hover:bg-[#4fa037] disabled:bg-zinc-200 text-white font-sans font-black uppercase text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  {isAdSubmitting 
                    ? 'Submitting campaign packages...' 
                    : submissionMode === 'single'
                    ? 'Submit Campaign for Review' 
                    : 'Submit 3 Ads Package at Once'}
                </span>
              </button>
            </form>

        </div>

        {/* My Ad Campaigns Archive (Right List) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm space-y-3.5 text-left">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              {submissionMode === 'single' ? 'Campaign Preview' : 'Interactive Triple Campaigns Previews'}
            </h3>
            
            {submissionMode === 'single' ? (
              (adName || adContent || adImageUrl) ? (
                <div className="bg-zinc-50/50 border border-zinc-150 rounded-2xl p-4 flex flex-col items-center gap-3.5">
                  {adImageUrl && (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-zinc-200">
                      <img src={adImageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="w-full text-left">
                    <h4 className="text-xs font-black text-zinc-900 mt-1 truncate">{adName || 'Your Campaign Name'}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{adContent || 'Your campaign content details...'}</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 border border-dashed border-zinc-200 rounded-2xl text-center text-[10px] text-zinc-400 font-bold">
                  Design features in Form to view real-time feed placement.
                </div>
              )
            ) : (
              // Triple Mode Stacked Previews
              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => {
                  const img = idx === 0 ? adImageUrl : idx === 1 ? adImageUrl2 : adImageUrl3;
                  const name = idx === 0 ? adName : idx === 1 ? adName2 : adName3;
                  const content = idx === 0 ? adContent : idx === 1 ? adContent2 : adContent3;

                  return (
                    <div 
                      key={idx} 
                      onClick={() => setActiveAdTab(idx as 0 | 1 | 2)}
                      className={`p-3 bg-zinc-50/50 border rounded-2xl flex flex-col gap-2 cursor-pointer transition-all ${
                        activeAdTab === idx 
                          ? 'border-emerald-500 bg-emerald-50/15 ring-1 ring-emerald-500/30' 
                          : 'border-zinc-150 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[8.5px] font-mono font-black uppercase text-zinc-400">Ad Slot #{idx + 1}</span>
                        {activeAdTab === idx ? (
                          <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-md font-mono uppercase font-black">editing now</span>
                        ) : (
                          <span className="text-[8px] text-zinc-400 font-mono">click to edit</span>
                        )}
                      </div>
                      
                      {img ? (
                        <div className="w-full h-16 rounded-lg overflow-hidden border border-zinc-200 bg-white">
                          <img src={img} alt={`Ad ${idx+1} preview`} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-16 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center bg-zinc-100/30 text-[9px] text-zinc-400 font-mono">
                          No image loaded for Ad #{idx + 1}
                        </div>
                      )}
                      
                      <div className="w-full text-left">
                        <h4 className="text-xs font-black text-zinc-900 truncate">{name || `Campaign Title #${idx + 1}`}</h4>
                        <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1 leading-relaxed">
                          {content || `Enter ad content or copy info using the yellow spark trigger...`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My actual submitted requests */}
          <div className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-zinc-500" />
              My Ad Campaign Ledger
            </h3>

            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {myAdRequests.length === 0 ? (
                <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed text-zinc-400">
                  <p className="text-[10.5px] font-bold">No ad campaigns requested yet.</p>
                  <p className="text-[9px] text-zinc-400 mt-1">Submit your first promotion on the left!</p>
                </div>
              ) : (
                [...myAdRequests].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((campaign) => (
                  <div key={campaign.id} className="p-3 bg-zinc-50 border border-zinc-150 rounded-xl space-y-2.5 text-left">
                    <div className="flex gap-2.5 items-start">
                      {campaign.imageUrl && (
                        <div className="w-12 h-10 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-white">
                          <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[11px] font-black text-zinc-850 truncate leading-tight">{campaign.name}</h4>
                        <p className="text-[9.5px] text-zinc-400 mt-0.5 font-mono">
                          Scheduled: <span className="text-zinc-650 font-bold">{campaign.scheduledDate || 'Not set'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-zinc-150/50 pt-2 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                      </div>

                      <span className={`text-[8.5px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        campaign.status === 'published'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                          : campaign.status === 'approved'
                          ? 'text-indigo-700 bg-indigo-50 border-indigo-100'
                          : campaign.status === 'rejected'
                          ? 'text-red-700 bg-red-50 border-red-100'
                          : 'text-amber-700 bg-amber-50 border-amber-100'
                      }`}>
                        {campaign.status || 'pending'}
                      </span>
                    </div>

                    {campaign.status === 'published' && (
                      <div className="text-[9px] font-mono text-zinc-400 bg-emerald-50/30 border border-emerald-150/40 p-1.5 rounded-lg text-center font-bold">
                        Clicks: <span className="text-zinc-800 font-extrabold">{campaign.clickCount || 0}</span>
                      </div>
                    )}

                    {/* Action controls for testing & managing */}
                    <div className="flex gap-2.5 pt-2 border-t border-zinc-150/30">
                      {campaign.status !== 'published' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await createOrUpdateAd({
                              ...campaign,
                              status: 'published',
                              active: true
                            });
                            setAdSuccess(`Published campaign "${campaign.title}" successfully!`);
                          }}
                          className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-black uppercase text-[9px] tracking-wider rounded-lg transition text-center cursor-pointer"
                        >
                          Publish Ad
                        </button>
                      )}
                      {campaign.status === 'published' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await createOrUpdateAd({
                              ...campaign,
                              active: !campaign.active
                            });
                          }}
                          className={`flex-1 py-1 px-2.5 font-sans font-black uppercase text-[9px] tracking-wider rounded-lg transition text-center cursor-pointer ${
                            campaign.active 
                              ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' 
                              : 'bg-emerald-650 hover:bg-emerald-750 text-white'
                          }`}
                        >
                          {campaign.active ? 'Pause' : 'Resume'}
                        </button>
                      )}
                      {deleteAd && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete campaign "${campaign.title}"?`)) {
                              await deleteAd(campaign.id);
                            }
                          }}
                          className="py-1 px-2.5 bg-red-50 hover:bg-red-150 text-red-700 border border-red-200 font-sans font-black uppercase text-[9px] tracking-wider rounded-lg transition text-center cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
