/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { INTEREST_OPTIONS } from '../data/seedData';
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
  CreditCard
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { register, login, loginWithGoogle, users } = useSocialPlatform();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sign up form state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['technology']);
  const [signupError, setSignupError] = useState('');

  // Secure identity verification inputs
  const [phoneNumber, setPhoneNumber] = useState('');
  const [docType, setDocType] = useState<'pan' | 'docId'>('pan');
  const [docValue, setDocValue] = useState('');

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

    const regLocked = localStorage.getItem('nexus_registration_locked') === 'true';
    if (regLocked) {
      setSignupError('Lock Warning: New registrations are locked by system administrators.');
      return;
    }

    const extraDetails = {
      phoneNumber: phoneNumber.trim(),
      panNumber: docType === 'pan' ? docValue.trim().toUpperCase() : '',
      officialDocId: docType === 'docId' ? docValue.trim() : '',
      hasVerifiedDetails: true
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
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] flex flex-col lg:flex-row relative select-none font-sans" id="nexus-landing-page">
      
      {/* Decorative High-Contrast Left Column */}
      <section className="flex-1 bg-zinc-950 text-white p-8 md:p-16 lg:p-24 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle retro matrix dots decoration background */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        {/* Header Branding */}
        <div className="z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-black text-xl rounded-2xl shadow-lg shadow-orange-600/20">
            N
          </div>
          <div>
            <span className="font-sans font-black text-2xl tracking-tighter text-white uppercase">
              NEXUS<span className="font-normal text-orange-500">.</span>
            </span>
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 font-bold">Interest-driven blogging network</p>
          </div>
        </div>

        {/* Core Slogan & Scribe introduction */}
        <div className="z-10 my-16 lg:my-0 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] uppercase font-mono tracking-widest text-orange-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Platform V2 is now Live</span>
          </div>
          
          <h1 className="font-sans font-black text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-tighter leading-[0.95]">
            Where great <br />
            <span className="text-orange-500 font-serif lowercase italic font-normal">minds</span> find their <br />
            <span className="underline decoration-orange-500 decoration-wavy underline-offset-8">audience</span>
          </h1>

          <p className="text-zinc-400 font-sans text-sm md:text-base leading-relaxed font-normal">
            Nexus coordinates content recommendations by analyzing tag categorization, chosen categories, and your personal interests. Build followers, chat seamlessly, and earn dynamic badges for platform milestone achievements.
          </p>

          {/* Real benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
              <Compass className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-sans font-bold uppercase text-white tracking-wider">Interest Match</dt>
                <dd className="text-[11px] text-zinc-400 mt-1">Get articles aligned to your tech, travel, fitness or photo choices.</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
              <Award className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-sans font-bold uppercase text-white tracking-wider">Unlock Badges</dt>
                <dd className="text-[11px] text-zinc-400 mt-1">Earn live medals for milestones like writing feeds, follows, and comments.</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
              <MessageSquare className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-sans font-bold uppercase text-white tracking-wider">Creator Chats</dt>
                <dd className="text-[11px] text-zinc-400 mt-1">Connect instantly inside private, high-fidelity chatrooms.</dd>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
              <Bookmark className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs font-sans font-bold uppercase text-white tracking-wider">Drafts Persistence</dt>
                <dd className="text-[11px] text-zinc-400 mt-1">Store offline or write draft layouts before publishing to the main feed.</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Aesthetic footer */}
        <div className="z-10 flex flex-wrap gap-4 items-center text-[10px] font-mono uppercase tracking-wider text-zinc-600 pt-16 lg:pt-0">
          <span>© {new Date().getFullYear()} NEXUS NETWORKS</span>
          <span>•</span>
          <span>SECURED CLOUD ENGINE INSTANT LOCK</span>
        </div>
      </section>

      {/* Interactive Right Column: Forms and Sign-In */}
      <section className="w-full lg:w-[480px] shrink-0 bg-white p-8 md:p-12 lg:p-16 flex flex-col justify-center border-l border-zinc-100 overflow-y-auto max-h-screen lg:max-h-none">
        
        {/* Real Auth via Google Sign-In */}
        <button
          type="button"
          id="land-google-signin-btn"
          onClick={async () => {
            await loginWithGoogle();
          }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 text-zinc-800 font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all cursor-pointer mb-4 shadow-sm"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-zinc-100"></div>
          <span className="flex-shrink mx-4 text-[9px] font-mono uppercase text-zinc-450 tracking-widest font-black">Or Use Direct Email</span>
          <div className="flex-grow border-t border-zinc-100"></div>
        </div>

        {/* Authenticate Forms box */}
        <div className="space-y-4">
          {isSignUp ? (
            <form onSubmit={handleSignupSubmit} className="space-y-4" id="land-signup-form">
              <div>
                <h2 className="font-sans font-black text-xl uppercase tracking-tighter text-zinc-900 leading-tight">Create a Creator Profile</h2>
                <p className="text-zinc-400 text-[10px] mt-0.5 leading-snug">Become part of the Nexus interests feed network.</p>
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs font-bold bg-white focus:border-orange-500 focus:outline-none transition-all text-zinc-800"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs text-zinc-800 font-sans outline-none bg-white focus:border-orange-500 transition-all"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs text-zinc-805 font-sans outline-none bg-white focus:border-orange-500 transition-all"
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
                      docType === 'pan' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-zinc-500 border-zinc-200'
                    }`}
                  >
                    PAN Number
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDocType('docId'); setDocValue(''); }}
                    className={`flex-1 py-1 text-center text-[9px] font-bold rounded-lg transition-all border ${
                      docType === 'docId' ? 'bg-orange-600 text-white border-orange-605' : 'bg-white text-zinc-500 border-zinc-200'
                    }`}
                  >
                    Official ID
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
                    placeholder={docType === 'pan' ? 'e.g. ABCDE1234F' : 'e.g. Passport/National ID No.'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs text-zinc-800 font-sans outline-none bg-white focus:border-orange-500 transition-all uppercase"
                  />
                </div>
              </div>

              {/* Interests checklists */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Select Interests <span className="text-orange-500 font-bold">*</span>
                </label>
                
                <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 border border-zinc-100 bg-zinc-50 rounded-2xl" id="land-interest-selection">
                  {INTEREST_OPTIONS.map((opt) => {
                    const isSelected = selectedInterests.includes(opt.id);
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        id={`land-interest-opt-${opt.id}`}
                        onClick={() => toggleInterest(opt.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10 text-zinc-850 font-bold shadow-sm'
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
                className="w-full py-3.5 bg-black hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Assemble Profile
                <ArrowRight className="w-3.5 h-3.5" />
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
                <h2 className="font-sans font-black text-xl uppercase tracking-tighter text-zinc-900 leading-tight">Welcome Back</h2>
                <p className="text-zinc-400 text-[10px] mt-0.5 leading-snug">Authenticate to read, publish drafts, and track badges.</p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-150 flex items-center gap-2 shadow-sm" id="land-login-error">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs text-zinc-800 font-sans outline-none bg-white focus:border-orange-500 transition-all animate-flicker-short"
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 text-xs bg-zinc-50 text-zinc-400 cursor-not-allowed uppercase font-mono outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="land-login-submit-btn"
                className="w-full py-3.5 bg-black hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Access Account
                <ArrowRight className="w-3.5 h-3.5" />
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
      </section>

    </div>
  );
};
