/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { INTEREST_OPTIONS } from '../data/seedData';
import { FreshLinkLogo } from './FreshLinkLogo';
import { motion } from 'motion/react';
import { 
  Check, 
  Mail, 
  User as UserIcon, 
  Shield, 
  AlertCircle, 
  Compass, 
  Sparkles, 
  BookOpen, 
  Award,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Bookmark,
  Phone,
  CreditCard,
  Upload,
  Laptop,
  Plane,
  Dumbbell,
  Utensils
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { register, login, loginWithGoogle, users } = useSocialPlatform();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Google sign in states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google authentication error:", err);
      if (err?.message === 'IFRAME_POPUP_BLOCKED') {
        setGoogleError('IFRAME_POPUP_BLOCKED');
      } else {
        setGoogleError(err?.message || 'Google authentication failed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Sign up form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['technology']);
  const [signupError, setSignupError] = useState('');

  // Secure identity verification inputs
  const [phoneNumber, setPhoneNumber] = useState('');
  const [docType, setDocType] = useState<'pan' | 'docId'>('pan');
  const [docValue, setDocValue] = useState('');
  
  // Document photo upload inputs for account creation
  const [idPhoto, setIdPhoto] = useState('');
  const [idPhotoName, setIdPhotoName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRefForSignup = useRef<HTMLInputElement>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail) return;

    try {
      const success = await login(loginEmail);
      if (!success) {
        setLoginError('Email not registered. Use a test account or sign up below!');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Access prohibited.');
    }
  };

  const handleFileChangeForSignup = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSignupError('Please upload a valid image file (PNG, JPG, or JPEG) for your ID photo.');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      setSignupError('ID photo file size is too large. Image upload is capped at 1.5MB.');
      return;
    }

    setSignupError('');
    setIdPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setIdPhoto(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOverForSignup = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeaveForSignup = () => {
    setIsDragging(false);
  };

  const onDropForSignup = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChangeForSignup(file);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!name.trim()) {
      setSignupError('Name is required');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please provide a valid email address');
      return;
    }
    if (selectedInterests.length === 0) {
      setSignupError('Please select at least one interest');
      return;
    }

    const alreadyExists = users.some(u => u.email.toLowerCase() === signupEmail.toLowerCase());
    if (alreadyExists) {
      setSignupError('Email already registered. Try logging in above!');
      return;
    }

    // Phone & Document verification
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 10) {
      setSignupError('Please provide a valid phone number (at least 10 digits)');
      return;
    }

    if (!docValue.trim()) {
      setSignupError(docType === 'pan' ? 'Please provide a valid PAN number' : 'Please provide a valid Official Document ID');
      return;
    }

    if (!idPhoto) {
      setSignupError('Identity Document upload is mandatory. Please drag-and-drop or select your physical ID photo.');
      return;
    }

    const regLocked = localStorage.getItem('nexus_registration_locked') === 'true';
    if (regLocked) {
      setSignupError('Lock Warning: New registrations are locked by system administrators.');
      return;
    }

    const extraDetails = {
      phoneNumber: phoneNumber.trim(),
      panNumber: docType === 'pan' ? docValue.trim().toUpperCase() : '',
      officialDocId: docType === 'docId' ? docValue.trim() : '',
      idPhoto: idPhoto,
      hasVerifiedDetails: true,
      isApprovedByAdmin: true
    };

    await register(name, signupEmail, selectedInterests, extraDetails);
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

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 relative select-none font-sans overflow-y-auto" id="nexus-landing-page">
      
      {/* Absolute Low-Opacity Background Typography Watermarks */}
      <div className="absolute top-[18%] left-10 text-[11rem] md:text-[14rem] font-black tracking-tighter text-stone-200/20 pointer-events-none select-none font-display uppercase leading-none hidden lg:block">
        CONNECT
      </div>
      <div className="absolute top-[55%] right-10 text-[11rem] md:text-[14rem] font-black tracking-tighter text-stone-200/20 pointer-events-none select-none font-display uppercase leading-none hidden lg:block">
        CREATORS
      </div>

      {/* Main Content Area: Spacious Hero and Bento Screenshot Showcases (Symmetrical wide on Desktop) */}
      <div className="w-full max-w-7xl mx-auto p-6 md:p-10 lg:p-12 flex flex-col gap-y-12 relative z-10">
        
        {/* Transparent Premium Top Header */}
        <header className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between pb-6 border-b border-stone-200/30">
          <div className="flex items-center gap-4">
            <FreshLinkLogo className="w-12 h-12 text-orange-500 transform hover:scale-105 transition-smooth" />
            <div>
              <span className="font-display font-black text-2xl tracking-tighter text-zinc-950 uppercase block">
                FRESHLINK <span className="text-orange-500">CONNECT</span>
              </span>
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-extrabold">Interest-Driven Connection Network</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className={`flex items-center gap-2 px-4 py-2 border border-stone-200 hover:border-orange-400 bg-white hover:bg-stone-50 rounded-xl text-[10px] font-sans uppercase tracking-widest font-bold text-zinc-800 transition-smooth cursor-pointer shadow-xs ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Sign in instantly with Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>{isGoogleLoading ? 'Signing in...' : 'Google Sign-In'}</span>
            </button>

            <button
              onClick={() => {
                setIsSignUp(false);
                setTimeout(() => {
                  document.getElementById('land-google-signin-btn')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-sans uppercase tracking-widest font-bold transition-smooth cursor-pointer shadow-xs"
            >
              Sign In / Join
            </button>
          </div>
        </header>

        {/* Symmetrical Hero & Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-4">
          
          {/* Left Column: Hero Content & Notice */}
          <div className="lg:col-span-7 flex flex-col gap-y-8">
            {/* Top Banner Notice - Clean & Modern */}
            <div className="p-3.5 bg-orange-500/5 rounded-2xl border border-orange-500/10 flex items-center justify-between text-[11px] font-sans font-semibold text-zinc-800 relative">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
                <span>Discover Nepal's premier interest-driven digital creator hub.</span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md font-bold">LIVE HUB</span>
            </div>

            {/* 1. Large Visual Dominant Hero Section with Extra White Space */}
            <div className="space-y-6 text-left">
              <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-zinc-950 uppercase tracking-tighter leading-[1.0] transition-smooth">
                Where great <span className="text-orange-500 font-display lowercase font-black tracking-tighter">minds</span> find their <span className="underline decoration-orange-500/40 decoration-wavy underline-offset-10">audience</span>
              </h1>

              <p className="text-zinc-500 font-sans text-xs md:text-sm leading-relaxed font-medium max-w-2xl">
                FreshLink Connect coordinates content recommendations by analyzing tag categorization, chosen categories, and your personal interests. Build followers, chat seamlessly, and earn dynamic badges for platform milestone achievements.
              </p>

              <div className="pt-6 border-t border-stone-200/60 grid grid-cols-3 gap-6 max-w-xl">
                <div>
                  <span className="block font-display font-black text-2xl text-orange-500 leading-none">100%</span>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mt-1.5 font-bold">Privacy Secured</span>
                </div>
                <div>
                  <span className="block font-display font-black text-2xl text-zinc-900 leading-none">Nepal</span>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mt-1.5 font-bold">Creator Network</span>
                </div>
                <div>
                  <span className="block font-display font-black text-2xl text-zinc-900 leading-none">Zero</span>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block mt-1.5 font-bold">Database Lag</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Login and Signup directly on the first fold */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white border border-stone-200/45 rounded-[2.5rem] p-8 md:p-10 shadow-md hover:shadow-lg transition-smooth">
              
              {/* Real Auth via Google Sign-In */}
              <button
                type="button"
                id="land-google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className={`w-full flex items-center justify-center gap-3 py-3.5 border border-zinc-200/80 hover:border-zinc-400 hover:bg-stone-50 text-zinc-850 font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-smooth cursor-pointer shadow-xs ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span className="font-sans font-extrabold tracking-widest">{isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>

              {/* Instant 1-Click Demo Account Shortcuts */}
              <div className="mt-3.5 mb-2 bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase text-amber-900 tracking-wider">⚡ 1-Click Instant Demo Login</span>
                  <span className="text-[8.5px] text-amber-700 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded">Pre-verified</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => login('fresh.linksd@gmail.com')}
                    className="p-2 bg-white hover:bg-amber-100/50 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="block text-[10px] font-extrabold text-amber-950 group-hover:text-orange-600">👑 Super Admin</span>
                    <span className="block text-[8px] font-mono text-zinc-400 truncate">fresh.linksd@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => login('alice@nexus.com')}
                    className="p-2 bg-white hover:bg-amber-100/50 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="block text-[10px] font-extrabold text-zinc-800 group-hover:text-orange-600">👩‍💻 Alice Devon</span>
                    <span className="block text-[8px] font-mono text-zinc-400 truncate">alice@nexus.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => login('bob@nexus.com')}
                    className="p-2 bg-white hover:bg-amber-100/50 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="block text-[10px] font-extrabold text-zinc-800 group-hover:text-orange-600">📷 Bob Matthews</span>
                    <span className="block text-[8px] font-mono text-zinc-400 truncate">bob@nexus.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => login('charlie@nexus.com')}
                    className="p-2 bg-white hover:bg-amber-100/50 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="block text-[10px] font-extrabold text-zinc-800 group-hover:text-orange-600">🏋️ Charlie Flex</span>
                    <span className="block text-[8px] font-mono text-zinc-400 truncate">charlie@nexus.com</span>
                  </button>
                </div>
              </div>

              {/* Helpful Browser Iframe Note */}
              <div className="mb-4 text-[9.5px] text-zinc-400 font-sans leading-normal text-center select-none">
                ℹ️ Running inside AI Studio? Popups are restricted by browsers inside preview frames. Click any demo shortcut above or <button type="button" onClick={() => window.open(window.location.href, '_blank')} className="text-orange-500 hover:underline font-bold">Open in New Tab ↗</button>
              </div>

              {googleError && (
                <div className="mb-4 animate-in fade-in duration-200">
                  <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-800 space-y-3 leading-relaxed text-left">
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-extrabold block text-[11px] text-amber-950 uppercase tracking-wider font-mono">Sign-In Iframe Issue</strong>
                        <span className="text-[10.5px] block text-amber-850 mt-1 leading-normal font-sans font-medium">
                          Google Popup authentication is blocked by default inside iframe containers due to browser cross-origin cookie security.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-amber-200/50">
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white font-sans font-black uppercase tracking-widest text-[8.5px] rounded-lg transition-all shrink-0 cursor-pointer shadow-sm"
                      >
                        Open App in New Tab ↗
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleError(null)}
                        className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-sans font-black uppercase tracking-widest text-[8.5px] rounded-lg transition-all cursor-pointer border border-zinc-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative flex py-2 items-center mb-6">
                <div className="flex-grow border-t border-stone-100"></div>
                <span className="flex-shrink mx-4 text-[9px] font-mono uppercase text-zinc-400 tracking-widest font-extrabold">Or Use Direct Email</span>
                <div className="flex-grow border-t border-stone-100"></div>
              </div>

              {/* Authenticate Forms box */}
              <div className="space-y-4">
                {isSignUp ? (
                  <form onSubmit={handleSignupSubmit} className="space-y-4" id="land-signup-form">
                    <div>
                      <h2 className="font-display font-black text-xl uppercase tracking-tighter text-zinc-950 leading-tight">Create Creator Profile</h2>
                      <p className="text-zinc-400 text-[10px] mt-1 leading-snug">Become part of the FreshLink Connect interests feed network.</p>
                    </div>
                    
                    {signupError && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2 animate-bounce-short" id="land-signup-error">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-sans font-semibold">{signupError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Pick Display Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          id="land-signup-name-input"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alice Springs"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold bg-stone-50/40 focus:bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Your Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          id="land-signup-email-input"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="alice@domain.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 font-sans outline-none bg-stone-50/40 focus:bg-white focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Phone Number <span className="text-orange-500 font-bold">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="tel"
                          required
                          id="land-signup-phone-input"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 font-sans outline-none bg-stone-50/40 focus:bg-white focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Identity Document <span className="text-orange-500 font-bold">*</span></label>
                      <div className="flex gap-2 mb-1.5">
                        <button
                          type="button"
                          onClick={() => { setDocType('pan'); setDocValue(''); }}
                          className={`flex-1 py-1 text-center text-[9px] font-bold rounded-lg transition-all border ${
                            docType === 'pan' ? 'bg-orange-600 text-white border-orange-600 font-black' : 'bg-white text-zinc-500 border-zinc-200'
                          }`}
                        >
                          PAN Number
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDocType('docId'); setDocValue(''); }}
                          className={`flex-1 py-1 text-center text-[9px] font-bold rounded-lg transition-all border ${
                            docType === 'docId' ? 'bg-orange-600 text-white border-orange-600 font-black' : 'bg-white text-zinc-500 border-zinc-200'
                          }`}
                        >
                          Optional ID / College / School ID
                        </button>
                      </div>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          id="land-signup-doc-input"
                          value={docValue}
                          onChange={(e) => setDocValue(e.target.value)}
                          placeholder={docType === 'pan' ? 'e.g. ABCDE1234F' : 'e.g. College/School/Optional ID No.'}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 font-sans outline-none bg-stone-50/40 focus:bg-white focus:border-orange-500 transition-all uppercase"
                        />
                      </div>
                    </div>

                    {/* Secure Physical ID Document Upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                        Upload Physical ID Photo <span className="text-orange-500 font-bold">*</span>
                      </label>
                      <div 
                        onDragOver={onDragOverForSignup}
                        onDragLeave={onDragLeaveForSignup}
                        onDrop={onDropForSignup}
                        onClick={() => fileInputRefForSignup.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-smooth ${
                          isDragging 
                            ? 'border-orange-500 bg-orange-50/40' 
                            : idPhoto 
                              ? 'border-emerald-500/40 bg-emerald-50/10' 
                              : 'border-zinc-200 hover:border-orange-400 bg-zinc-50/50'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRefForSignup}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileChangeForSignup(file);
                          }}
                          accept="image/*"
                          className="hidden" 
                        />
                        {idPhoto ? (
                          <div className="flex flex-col items-center">
                            <div className="w-full h-24 overflow-hidden rounded-lg mb-1.5 relative">
                              <img src={idPhoto} alt="Verification ID preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-[9px] text-white font-bold bg-black/60 px-2 py-0.5 rounded">
                                  Tap to reset
                                </span>
                              </div>
                            </div>
                            <span className="text-[9.5px] text-emerald-600 font-bold max-w-full truncate">
                              ✓ Attached: {idPhotoName || 'identity_doc.png'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-1">
                            <Upload className="w-6 h-6 text-zinc-400 mb-1" />
                            <p className="text-[10px] font-bold text-zinc-700">Drag ID photo or click to browse</p>
                            <p className="text-[8px] text-zinc-400 font-semibold mt-0.5 font-mono">PNG, JPG (Max 1.5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interests checklists */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                        Select Interests <span className="text-orange-500 font-bold">*</span>
                      </label>
                      
                      <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 border border-zinc-150 bg-stone-50/50 rounded-2xl" id="land-interest-selection">
                        {INTEREST_OPTIONS.map((opt) => {
                          const isSelected = selectedInterests.includes(opt.id);
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              id={`land-interest-opt-${opt.id}`}
                              onClick={() => toggleInterest(opt.id)}
                              className={`p-2.5 rounded-xl border text-left transition-smooth cursor-pointer ${
                                isSelected
                                  ? 'border-orange-500 bg-orange-500/10 text-zinc-850 font-bold shadow-xs'
                                  : 'border-transparent bg-white hover:bg-zinc-100 text-zinc-500 font-medium'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-sans text-[10px]">{opt.name}</span>
                                {isSelected ? (
                                  <div className="w-3.5 h-3.5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-2 h-2 font-black" />
                                  </div>
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-zinc-200 shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="land-signup-submit-btn"
                      className="w-full py-3.5 bg-zinc-950 hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-smooth shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Assemble Profile
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </button>

                    <p className="text-center text-xs text-zinc-400 pt-2 font-medium">
                      Already registered?{' '}
                      <button
                        type="button"
                        id="land-switch-to-login"
                        onClick={() => setIsSignUp(false)}
                        className="text-orange-600 font-bold uppercase tracking-wider hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="space-y-4" id="land-login-form">
                    <div>
                      <h2 className="font-display font-black text-xl uppercase tracking-tighter text-zinc-950 leading-tight">Welcome Back</h2>
                      <p className="text-zinc-400 text-[10px] mt-1 leading-snug">Authenticate to read, publish drafts, and track badges.</p>
                    </div>

                    {loginError && (
                      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-150 flex items-center gap-2 shadow-sm animate-flicker-short" id="land-login-error">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-sans font-semibold">{loginError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Your Registered Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          id="land-login-email-input"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="e.g. alice@nexus.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-805 font-sans outline-none bg-stone-50/40 focus:bg-white focus:border-orange-500 transition-all animate-flicker-short"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Passphrase Lock</label>
                      <div className="relative">
                        <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="password"
                          disabled
                          placeholder="•••••••• (Bypassed for sandbox)"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs bg-stone-50/40 text-zinc-400 cursor-not-allowed uppercase font-mono outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="land-login-submit-btn"
                      className="w-full py-3.5 bg-zinc-950 hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-smooth shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Access Account
                      <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </button>

                    <p className="text-center text-xs text-zinc-400 pt-2 font-medium">
                      New creator?{' '}
                      <button
                        type="button"
                        id="land-switch-to-signup"
                        onClick={() => setIsSignUp(true)}
                        className="text-orange-600 font-bold uppercase tracking-wider hover:underline"
                      >
                        Create Account
                      </button>
                    </p>
                  </form>
                )}



              </div>

            </div>
          </div>

        </div>

        {/* 2. Bento-Style Live Feature Preview Grid (Showcasing real platform content and screenshots) */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-orange-500 font-black">
              LIVE PREVIEWS & CAPABILITIES
            </span>
            <h3 className="font-display font-black text-xl text-zinc-950 uppercase tracking-tight">
              An experience crafted for engagement
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Bento Card 1: Instagram-style visual feed post preview */}
            <div className="bg-white border border-stone-200/45 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-smooth cursor-default flex flex-col justify-between h-[360px] relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" 
                      alt="Alice Creator" 
                      className="w-8 h-8 rounded-full object-cover border border-stone-100" 
                    />
                    <div>
                      <h4 className="text-[11px] font-black text-zinc-900 leading-none">Alice Springs</h4>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Gourmet Writer</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-stone-100 text-zinc-600 px-2.5 py-1 rounded-full font-black uppercase">
                    #Gourmet
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-600 leading-relaxed font-medium line-clamp-2">
                  My experimental slow-fermented honey lavender sourdough is finally out of the oven! 🍞✨ The crumb structure is absolutely perfect.
                </p>
              </div>

              {/* Real platform photo representation */}
              <div className="my-2.5 rounded-2xl overflow-hidden h-36 relative border border-stone-200/30">
                <img 
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80" 
                  alt="Sourdough" 
                  className="w-full h-full object-cover group-hover:scale-102 transition-smooth" 
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] text-zinc-500 font-bold">
                <span className="flex items-center gap-1 hover:text-orange-500 transition-smooth">❤️ 1,240 likes</span>
                <span className="flex items-center gap-1 hover:text-orange-500 transition-smooth">💬 84 comments</span>
              </div>
            </div>

            {/* Bento Card 2: LinkedIn-style creator stats & verified overlap */}
            <div className="bg-white border border-stone-200/45 rounded-[2rem] p-6 shadow-xs hover:shadow-md transition-smooth cursor-default flex flex-col justify-between h-[360px] relative overflow-hidden group">
              <div className="relative">
                {/* Simulated cover header */}
                <div className="h-20 bg-gradient-to-tr from-amber-500/20 to-orange-500/10 rounded-2xl overflow-hidden border border-stone-200/20 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80" 
                    alt="Cover" 
                    className="w-full h-full object-cover group-hover:scale-102 transition-smooth brightness-90" 
                  />
                  <div className="absolute top-2.5 right-2.5 bg-zinc-950 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                    Verified Creator
                  </div>
                </div>

                {/* Overlapping Profile Photo */}
                <div className="absolute left-4 top-10">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" 
                    alt="Bob Traveler" 
                    className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-md" 
                  />
                </div>
              </div>

              <div className="pt-8">
                <h4 className="text-xs font-black text-zinc-900 leading-none">Bob Traveler</h4>
                <p className="text-[10px] text-zinc-400 font-bold mt-1">Wanderlust photojournalist exploring Patagonia.</p>
              </div>

              {/* Verified analytics numbers */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold">Total Platform Followers</span>
                  <span className="text-zinc-900 font-black font-mono">3,842 Creators</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold">Residual Creator Earnings</span>
                  <span className="text-emerald-600 font-black font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-150">Rs. 1,65,000</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-zinc-500 font-bold">Weekly Performance Scale</span>
                  <span className="text-orange-600 font-black font-mono bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">+142% Growth</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Warm, premium Nepalese Creator Hubs map & stats */}
            <div className="bg-gradient-to-br from-amber-500/[0.03] via-stone-50 to-orange-500/[0.04] border border-orange-200/45 rounded-[2rem] p-6 md:p-8 shadow-xs hover:shadow-sm cursor-default md:col-span-2 relative overflow-hidden group transition-smooth hover:scale-[1.005]">
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/10 transition-smooth" />
              
              <div className="relative space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[8.5px] font-mono tracking-widest uppercase text-orange-600 font-extrabold block mb-0.5">
                      LOCAL NEPAL DIRECTORY & HUBS
                    </span>
                    <h4 className="font-display font-black text-lg uppercase tracking-tight text-zinc-900">
                      Explore Regional Nepal Creator Hubs
                    </h4>
                  </div>
                  <span className="text-[9px] bg-orange-100 text-orange-700 font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                    7 Active Hubs
                  </span>
                </div>

                <p className="text-[10.5px] text-zinc-500 font-medium max-w-3xl leading-relaxed">
                  Discover curated networks matching your exact location interests. From tech-driven spaces in Kathmandu to scenic storyboards in Pokhara and cultural chronicles in Lalitpur, find local creators instantly.
                </p>

                {/* Nepal Hub Pinned Pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="px-3.5 py-1.5 bg-white border border-stone-200/50 rounded-xl text-[10px] font-bold text-zinc-800 hover:border-orange-300 transition-smooth flex items-center gap-2 shadow-xs">
                    <Laptop className="w-3.5 h-3.5 text-orange-500" />
                    <span>Kathmandu Tech</span>
                    <span className="text-[8.5px] text-orange-600 font-mono font-bold bg-orange-50 px-1.5 py-0.5 rounded-md">8.4K Scribes</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-white border border-stone-200/50 rounded-xl text-[10px] font-bold text-zinc-800 hover:border-orange-300 transition-smooth flex items-center gap-2 shadow-xs">
                    <Plane className="w-3.5 h-3.5 text-orange-500" />
                    <span>Pokhara Nomads</span>
                    <span className="text-[8.5px] text-orange-600 font-mono font-bold bg-orange-50 px-1.5 py-0.5 rounded-md">4.9K Explorers</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-white border border-stone-200/50 rounded-xl text-[10px] font-bold text-zinc-800 hover:border-orange-300 transition-smooth flex items-center gap-2 shadow-xs">
                    <Utensils className="w-3.5 h-3.5 text-orange-500" />
                    <span>Himalayan Gourmet</span>
                    <span className="text-[8.5px] text-orange-600 font-mono font-bold bg-orange-50 px-1.5 py-0.5 rounded-md">3.2K Foodies</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-white border border-stone-200/50 rounded-xl text-[10px] font-bold text-zinc-800 hover:border-orange-300 transition-smooth flex items-center gap-2 shadow-xs">
                    <Dumbbell className="w-3.5 h-3.5 text-orange-500" />
                    <span>Lalitpur Arts</span>
                    <span className="text-[8.5px] text-orange-600 font-mono font-bold bg-orange-50 px-1.5 py-0.5 rounded-md">2.5K Creators</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Under the hood & Professional Quota Optimization Section */}
        <div className="mt-16 space-y-8 border-t border-stone-200/40 pt-16 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono tracking-widest uppercase text-orange-600 font-extrabold">
              ENGINEERED FOR EFFICIENCY & SCALE
            </span>
            <h3 className="font-display font-black text-xl text-zinc-950 uppercase tracking-tight">
              Blazing Fast Performance, Zero Resource Waste
            </h3>
            <p className="text-xs text-zinc-500 font-medium max-w-3xl">
              FreshLink Connect uses an advanced real-time subscription model designed to minimize server resources. Our hybrid architecture keeps Firebase quota costs low while delivering instant creator-to-fan connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200/45 rounded-[1.5rem] p-6 hover:shadow-sm transition-smooth">
              <span className="text-[10px] font-mono uppercase text-orange-600 font-bold block mb-1">CAPABILITY 01</span>
              <h5 className="font-display font-black text-xs text-zinc-900 uppercase tracking-tight mb-2">Smart Offline Caching</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                The platform caches feeds, posts, and message logs inside local storage. This minimizes consecutive database queries, making pages load instantly while completely avoiding unnecessary Firestore read operations.
              </p>
            </div>

            <div className="bg-white border border-stone-200/45 rounded-[1.5rem] p-6 hover:shadow-sm transition-smooth">
              <span className="text-[10px] font-mono uppercase text-orange-600 font-bold block mb-1">CAPABILITY 02</span>
              <h5 className="font-display font-black text-xs text-zinc-900 uppercase tracking-tight mb-2">Verified Identity Logs</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                Our secure document registration flow prevents robot accounts and spam, ensuring every single creator profile in the system has been manually reviewed and verified by a platform administrator.
              </p>
            </div>

            <div className="bg-white border border-stone-200/45 rounded-[1.5rem] p-6 hover:shadow-sm transition-smooth">
              <span className="text-[10px] font-mono uppercase text-orange-600 font-bold block mb-1">CAPABILITY 03</span>
              <h5 className="font-display font-black text-xs text-zinc-900 uppercase tracking-tight mb-2">Optimized Live Sync</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                We use selective Firebase subscription loops that automatically pause when creators are inactive. This ensures you only sync content you are actively interacting with, keeping bandwidth usage low.
              </p>
            </div>

            <div className="bg-white border border-stone-200/45 rounded-[1.5rem] p-6 hover:shadow-sm transition-smooth">
              <span className="text-[10px] font-mono uppercase text-orange-600 font-bold block mb-1">CAPABILITY 04</span>
              <h5 className="font-display font-black text-xs text-zinc-900 uppercase tracking-tight mb-2">Nepal Creator Eco-Scale</h5>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                A localized distribution hub that clusters creator notifications and alerts. By bundling multiple live network transactions, the system protects processing speed and maintains reliable up-time.
              </p>
            </div>
          </div>
        </div>

        {/* Spacious, Beautiful Aesthetic footer */}
        <footer className="mt-24 pt-8 border-t border-stone-200/40 flex flex-wrap gap-4 items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400 relative z-10">
          <span>DISCOVER • CONNECT • CREATE</span>
          <span>NEPAL HUB</span>
        </footer>
      </div>
    </div>
  );
};
