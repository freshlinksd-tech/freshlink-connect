/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { compressImage } from '../lib/imageUtils';
import { INTEREST_OPTIONS } from '../data/seedData';
import { 
  Check, 
  Sparkles, 
  AlertCircle, 
  MapPin, 
  User, 
  BookOpen, 
  Briefcase, 
  Compass, 
  Cpu, 
  Dumbbell, 
  Camera, 
  Utensils,
  Upload,
  Phone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Cake,
  Loader2,
  LogIn,
  Mail
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
];

const INTEREST_ICONS: Record<string, React.ComponentType<any>> = {
  technology: Cpu,
  travel: Compass,
  fitness: Dumbbell,
  photography: Camera,
  food: Utensils,
  business: Briefcase
};

export const OnboardingSetup: React.FC = () => {
  const { currentUser, updateProfile, login, loginWithGoogle } = useSocialPlatform();
  
  if (!currentUser) return null;

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || 'Earth');
  const [dob, setDob] = useState(currentUser.dob || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser.interests && currentUser.interests.length > 0 ? currentUser.interests : ['technology']
  );
  const [profileImage, setProfileImage] = useState(currentUser.profileImage || AVATAR_PRESETS[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      if (!loginEmail.trim()) {
        setLoginError('Please provide your account email address.');
        return;
      }
      const success = await login(loginEmail.trim());
      if (!success) {
        setLoginError('No account found under this email address. Please make sure the email is correct, or register as a new user.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [docType, setDocType] = useState<'pan' | 'docId'>('pan');
  const [docValue, setDocValue] = useState(currentUser.panNumber || currentUser.officialDocId || '');
  const [idPhoto, setIdPhoto] = useState(currentUser.idPhoto || '');
  const [idPhotoName, setIdPhotoName] = useState('');
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const [isIdDragging, setIsIdDragging] = useState(false);

  const handleIdPhotoRead = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select/drop a valid ID document image file.');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setError('ID photo file size is too large. Image upload is capped at 1.5MB.');
      return;
    }
    setError('');
    setIdPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setIdPhoto(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileRead = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select/drop a valid image file.');
      return;
    }
    if (file.size > 10485760) {
      setError('Selected image is too large. Image size should be under 10MB.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    compressImage(file, 200, 200, 0.75)
      .then((compressedUrl) => {
        setProfileImage(compressedUrl);
      })
      .catch((err) => {
        setError('Failed to process/compress selected profile image.');
        console.error(err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== id));
      }
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a screen display name');
      return;
    }

    if (selectedInterests.length === 0) {
      setError('Please select at least one hub interest category');
      return;
    }

    const parsedPhone = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim() || parsedPhone.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits) for identity verification.');
      return;
    }

    if (!docValue.trim()) {
      setError(
        docType === 'pan'
          ? 'PAN card number is required for identity verification.'
          : 'Official Document identification number is required for identity verification.'
      );
      return;
    }

    if (!idPhoto) {
      setError('A photo of your physical ID document is required for identity verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        name,
        bio: bio.trim() || 'A creator exploring the FreshLink connection platform.',
        location: location.trim() || 'Earth',
        interests: selectedInterests,
        profileImage,
        phoneNumber: phoneNumber.trim(),
        panNumber: docType === 'pan' ? docValue.trim().toUpperCase() : '',
        officialDocId: docType === 'docId' ? docValue.trim() : '',
        idPhoto: idPhoto,
        dob: dob,
        hasVerifiedDetails: true,
        isApprovedByAdmin: true, // auto-approve on upload per user side configuration
        hasSetupAccount: true
      });
    } catch (err) {
      console.error('Onboarding update failed:', err);
      setError('Failed to setup profile attributes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none overflow-y-auto" id="onboarding-overlay">
      <div 
        id="onboarding-setup-card" 
        className="bg-white border border-zinc-150 max-w-2xl w-full my-8 shadow-2xl rounded-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Sleek Onboarding Entry Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-6 md:p-8 relative border-b border-zinc-800 shrink-0">
          <div className="absolute top-6 right-6 shrink-0 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono tracking-widest text-[9px] uppercase font-bold px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoginMode ? 'Access Portal' : 'Profile Assembly'}</span>
          </div>

          <h2 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight leading-none mb-2 text-white">
            {isLoginMode ? 'Welcome Back to FreshLink' : 'Finish Setting Up Your Account'}
          </h2>
          <p className="text-zinc-400 text-xs tracking-wide">
            {isLoginMode ? 'Sign in to access your registered channels and features' : 'Your interest-first journey on FreshLink begins here'}
          </p>
        </div>

        {isLoginMode ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="text-center mb-2">
              <p className="text-xs text-stone-500">
                Need to create a new profile?{' '}
                <button
                  type="button"
                  onClick={() => setIsLoginMode(false)}
                  className="text-orange-500 hover:text-orange-600 font-bold underline cursor-pointer font-sans"
                >
                  Onboard Custom Account Instead
                </button>
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2" id="onboarding-login-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-sans font-bold">{loginError}</span>
              </div>
            )}

            {/* Quick 1-click authentication for fresh.linksd@gmail.com */}
            <div className="bg-orange-50/70 border border-orange-100 p-5 rounded-2xl text-left" id="admin-quick-login-card">
              <h3 className="font-sans font-bold text-xs text-zinc-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>Super Admin Session Detected</span>
              </h3>
              <p className="text-stone-650 text-[11px] leading-relaxed mb-4 font-medium">
                We detected you have an active Super Admin profile with the email <strong className="text-stone-900">fresh.linksd@gmail.com</strong>.
                Click the direct login button below to bypass onboarding and access your administrative cockpit instantly.
              </p>
              <button
                type="button"
                onClick={async () => {
                  setLoginEmail('fresh.linksd@gmail.com');
                  setLoginError('');
                  setIsSubmitting(true);
                  try {
                    const success = await login('fresh.linksd@gmail.com');
                    if (!success) {
                      setLoginError('Could not log in as Super Admin. Please ensure Firebase database is fully connected.');
                    }
                  } catch (err: any) {
                    setLoginError(err.message || 'Login failed.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="w-full py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogIn className="w-4 h-4 text-orange-400" />
                )}
                <span>Direct Admin Login as fresh.linksd@gmail.com</span>
              </button>
            </div>

            {/* Standard Email input field */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-zinc-650 block">Or Sign In with another email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="yourname@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold bg-zinc-50 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Access Registered Account</span>
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="text-center mb-2">
              <p className="text-xs text-stone-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsLoginMode(true)}
                  className="text-orange-500 hover:text-orange-600 font-bold underline cursor-pointer font-sans"
                >
                  Sign In to Registered Profile
                </button>
              </p>
            </div>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2" id="onboarding-error-box">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-sans font-bold">{error}</span>
            </div>
          )}

          {/* User Name & Bio Input Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 block">Pick Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    id="onboard-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Springs"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold bg-zinc-50 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    id="onboard-location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="San Francisco, CA"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold bg-zinc-50 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 block">Date of Birth</label>
                <div className="relative">
                  <Cake className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="date"
                    id="onboard-dob-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold bg-zinc-50 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Custom Bio Textbox */}
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold text-zinc-600 block">Short Creator Bio</label>
              <textarea
                id="onboard-bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                 placeholder="Software dev, hiker, coffee drinker. Share your vibes and articles on FreshLink."
                className="w-full h-full min-h-[96px] md:min-h-0 md:flex-1 p-3.5 rounded-xl border border-zinc-200 text-xs bg-zinc-50 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-950 resize-none leading-relaxed"
                maxLength={400}
              />
            </div>
          </div>

          {/* Customize Profile Image with Presets and Drag Drop Local Storage Support */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-zinc-700 block">
              Profile Image Options
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visual Presets */}
              <div className="space-y-3 bg-zinc-50 p-4 border border-zinc-100 rounded-xl">
                <span className="text-[11px] font-bold text-zinc-500 block leading-normal">Option 1: Quick Presets</span>
                <div className="flex flex-wrap gap-2.5">
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = profileImage === preset;
                    return (
                      <button
                        type="button"
                        key={preset}
                        id={`onboard-avatar-${idx}`}
                        onClick={() => setProfileImage(preset)}
                        className={`relative p-0.5 rounded-full border transition-all duration-300 ${
                          isSelected ? 'border-orange-500 scale-105 shadow-md bg-orange-50' : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <img
                          src={preset}
                          alt={`Avatar preset ${idx + 1}`}
                          className="w-12 h-12 object-cover rounded-full"
                        />
                        {isSelected && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 border border-white flex items-center justify-center rounded-full text-white">
                            <Check className="w-2.5 h-2.5 font-bold" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Local storage upload click & drag-and-drop */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-500 block leading-normal">Option 2: Upload from Desktop</span>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all rounded-xl min-h-[110px] ${
                    isDragging 
                      ? 'border-orange-500 bg-orange-50/40' 
                      : 'border-zinc-200 hover:border-zinc-400 bg-zinc-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
                  <p className="text-xs font-bold text-zinc-855 select-none">
                    Drag & Drop Photo Here
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Or click to browse storage (under 1MB)
                  </p>
                </div>

                {profileImage && (
                  <div className="flex items-center gap-2.5 bg-zinc-100/40 border border-zinc-200/40 p-2 rounded-xl">
                    <img src={profileImage} className="w-9 h-9 object-cover rounded-full border border-zinc-200" alt="New Thumbnail" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-zinc-400 uppercase leading-none font-bold">Selected preview</p>
                      <p className="text-xs text-zinc-800 font-semibold truncate mt-1">
                        {profileImage.startsWith('data:') ? 'Local Desktop Image' : 'Selected Preset Avatar'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pick Hub Interests Grid */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-zinc-750 block">
                Select Hub Interests <span className="text-orange-500">*</span>
              </label>
              <p className="text-zinc-500 text-xs mt-0.5">
                We use these coordinates to curate your personalized dashboard reading list
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" id="onboard-interests-coordinate-pool">
              {INTEREST_OPTIONS.map((opt) => {
                const isSelected = selectedInterests.includes(opt.id);
                const Icon = INTEREST_ICONS[opt.id] || Cpu;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    id={`onboard-interest-opt-${opt.id}`}
                    onClick={() => toggleInterest(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-[100px] min-h-[100px] ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 text-zinc-900 font-extrabold shadow-sm'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650 font-semibold'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-zinc-400'}`} />
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 font-bold" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-200 shrink-0" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-xs mt-2 text-zinc-800 leading-none">{opt.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-1 leading-none">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identity Verification Section */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <div>
              <label className="text-xs font-bold text-zinc-950 block uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-orange-500" />
                <span>Identity Verification & Security clearance <span className="text-orange-500">*</span></span>
              </label>
              <p className="text-zinc-500 text-xs mt-0.5">
                FreshLink requires identity registration to authorize article publishing and unlock Creator Partner Program monetization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact phone number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    id="verify-phone-onboard"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold bg-zinc-50 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-900"
                  />
                </div>
              </div>

              {/* ID Identification Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                  {docType === 'pan' ? 'PAN Card Identification' : 'Any Optional ID / College or School ID'}
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    id="verify-doc-onboard"
                    value={docValue}
                    onChange={(e) => setDocValue(e.target.value)}
                    placeholder={docType === 'pan' ? 'ABCDE1234F' : 'Any ID / College or School ID Number'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold bg-zinc-55 focus:border-orange-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-900 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Document Selection buttons & Upload area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                  Select Document Type
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDocType('pan'); }}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all border ${
                      docType === 'pan'
                        ? 'bg-orange-600 border-orange-600 text-white font-extrabold shadow-sm'
                        : 'bg-zinc-55 border-zinc-200 text-zinc-550 hover:bg-zinc-100'
                    }`}
                  >
                    PAN Card
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDocType('docId'); }}
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all border ${
                      docType === 'docId'
                        ? 'bg-orange-600 border-orange-600 text-white font-extrabold shadow-sm'
                        : 'bg-zinc-55 border-zinc-200 text-zinc-550 hover:bg-zinc-100'
                    }`}
                  >
                    Optional ID / College / School ID
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">
                  Physical ID Document Image File
                </span>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsIdDragging(true); }}
                  onDragLeave={() => setIsIdDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsIdDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleIdPhotoRead(file); }}
                  onClick={() => idFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                    isIdDragging 
                      ? 'border-orange-500 bg-orange-50/40' 
                      : idPhoto 
                        ? 'border-emerald-500 bg-emerald-50/10' 
                        : 'border-zinc-200 hover:border-orange-450 bg-zinc-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={idFileInputRef}
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleIdPhotoRead(file); }}
                    accept="image/*"
                    className="hidden"
                  />
                  {idPhoto ? (
                    <div className="flex items-center gap-2 text-emerald-600 justify-center">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate max-w-[180px]">Attached: {idPhotoName || 'id_document.png'}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-4.5 h-4.5 text-zinc-400 mb-1" />
                      <p className="text-[11px] font-bold text-zinc-755">Drag & Drop of physical ID card, or select</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {idPhoto && (
              <div className="bg-zinc-50 p-2 border border-zinc-150 rounded-xl max-w-xs">
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-1">ID File Attachment Preview</span>
                <div className="h-20 overflow-hidden rounded-lg border border-zinc-200">
                  <img src={idPhoto} alt="Govt ID preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Heavy high contrast action button */}
          <button
            type="submit"
            id="onboard-finish-account-btn"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 mt-4 hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <span>Assembling Profile...</span>
            ) : (
              <>
                <BookOpen className="w-4 h-4 shrink-0" />
                 <span>Assemble Profile & Discover FreshLink</span>
              </>
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};
