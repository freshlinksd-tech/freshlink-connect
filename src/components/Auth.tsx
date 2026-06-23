/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { INTEREST_OPTIONS } from '../data/seedData';
import { FreshLinkLogo } from './FreshLinkLogo';
import { motion } from 'motion/react';
import { Check, Mail, User, Shield, AlertCircle, Compass, X, Phone, CreditCard, Upload } from 'lucide-react';

interface AuthProps {
  onClose: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onClose }) => {
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

  // Document photo upload inputs for Auth signup
  const [idPhoto, setIdPhoto] = useState('');
  const [idPhotoName, setIdPhotoName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRefForAuthSignup = useRef<HTMLInputElement>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail) return;

    try {
      const success = await login(loginEmail);
      if (success) {
        onClose();
      } else {
        setLoginError('Email not found. Try one of our demo emails or register below.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Access prohibited.');
    }
  };

  const handleFileChangeForAuth = (file: File) => {
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

  const onDragOverForAuth = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeaveForAuth = () => {
    setIsDragging(false);
  };

  const onDropForAuth = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChangeForAuth(file);
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

    // Check email uniqueness
    const alreadyExists = users.some(u => u.email.toLowerCase() === signupEmail.toLowerCase());
    if (alreadyExists) {
      setSignupError('Email already registered. Try logging in!');
      return;
    }

    // Phone / Document Validations
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 10) {
      setSignupError('Please provide a valid phone number (at least 10 digits)');
      return;
    }

    if (!docValue.trim()) {
      setSignupError(docType === 'pan' ? 'Please provide a valid PAN number' : 'Please provide a valid Official Document ID');
      return;
    }

    if (!idPhoto) {
      setSignupError('Identity Document upload is mandatory. Please select or drag-and-drop your physical ID photo.');
      return;
    }

    const regLocked = localStorage.getItem('nexus_registration_locked') === 'true';
    if (regLocked) {
      setSignupError('Policy Restriction: New public registrations are locked by system administrators.');
      return;
    }

    const extraDetails = {
      phoneNumber: phoneNumber.trim(),
      panNumber: docType === 'pan' ? docValue.trim().toUpperCase() : '',
      officialDocId: docType === 'docId' ? docValue.trim() : '',
      idPhoto: idPhoto,
      hasVerifiedDetails: true,
      isApprovedByAdmin: false
    };

    await register(name, signupEmail, selectedInterests, extraDetails);
    onClose();
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
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div 
        id="auth-modal-card"
        className="bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in duration-200"
      >
        {/* Quick Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white z-10 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header decoration banner */}
        <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 p-8 text-white text-center select-none relative">
          <div className="absolute top-6 left-6">
            <span className="text-[10px] font-mono tracking-widest text-[#F1F5F9]/40 uppercase font-black">FRESHLINK CONNECT</span>
          </div>
          <div className="flex items-center justify-center mx-auto mb-3">
            <FreshLinkLogo className="w-12 h-12 shadow-md shadow-orange-600/20" />
          </div>
          <h2 className="font-sans font-black text-2xl uppercase tracking-tighter">
            Access FRESHLINK CONNECT
          </h2>
          <p className="text-zinc-400 text-xs mt-1 font-medium max-w-xs mx-auto leading-relaxed">
            Connect and discover articles across shared interest horizons.
          </p>
        </div>

        {/* Content scrolling safe area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* Real Auth via Google Sign-In */}
          <button
            type="button"
            id="google-signin-btn"
            onClick={async () => {
              const success = await loginWithGoogle();
              if (success) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-sans font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-100"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono uppercase text-zinc-400 tracking-widest font-black">Or Use Direct Email</span>
            <div className="flex-grow border-t border-zinc-100"></div>
          </div>

          {/* Core Register & Sign Up section */}
          {isSignUp ? (
            <form onSubmit={handleSignupSubmit} className="space-y-4" id="signup-form">
              <div className="pb-1">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-zinc-800">Create Profile</h3>
                <p className="text-zinc-400 text-[10px] mt-0.5">Setup a creator profile instantly</p>
              </div>
              
              {signupError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100" id="signup-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-sans font-semibold">{signupError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    id="signup-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Springs"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-bold text-zinc-850 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    id="signup-email-input"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="alice@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-semibold text-zinc-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block">Phone Number <span className="text-orange-500 font-bold">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="tel"
                    required
                    id="signup-phone-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-semibold text-zinc-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block">Identity Document <span className="text-orange-500 font-bold">*</span></label>
                <div className="flex gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => { setDocType('pan'); setDocValue(''); }}
                    className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all border ${
                      docType === 'pan' ? 'bg-orange-605 bg-orange-600 text-white border-orange-600' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                    }`}
                  >
                    PAN Number
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDocType('docId'); setDocValue(''); }}
                    className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg transition-all border ${
                      docType === 'docId' ? 'bg-orange-605 bg-orange-600 text-white border-orange-600' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
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
                    id="signup-doc-input"
                    value={docValue}
                    onChange={(e) => setDocValue(e.target.value)}
                    placeholder={docType === 'pan' ? 'e.g. ABCDE1234F' : 'e.g. Passport/National ID No.'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-semibold text-zinc-805 outline-none transition-all uppercase"
                  />
                </div>
              </div>

              {/* Secure Physical ID Document Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Upload Physical ID Photo <span className="text-orange-500 font-bold">*</span>
                </label>
                <div 
                  onDragOver={onDragOverForAuth}
                  onDragLeave={onDragLeaveForAuth}
                  onDrop={onDropForAuth}
                  onClick={() => fileInputRefForAuthSignup.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-orange-500 bg-orange-50/40' 
                      : idPhoto 
                        ? 'border-emerald-500/40 bg-emerald-50/10' 
                        : 'border-zinc-200 hover:border-orange-400 bg-zinc-50/50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRefForAuthSignup}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChangeForAuth(file);
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
                      <p className="text-[8px] text-zinc-400 font-semibold mt-0.5">PNG, JPG (Max 1.5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interests checklist setup */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 block">
                  Select Interests <span className="text-orange-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 bg-zinc-50 rounded-2xl" id="interest-selection-pool">
                  {INTEREST_OPTIONS.map((opt) => {
                    const isSelected = selectedInterests.includes(opt.id);
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        id={`interest-opt-${opt.id}`}
                        onClick={() => toggleInterest(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/10 text-zinc-900 font-bold'
                            : 'border-transparent bg-white hover:bg-zinc-100 text-zinc-650'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-bold tracking-tight text-[11px]">{opt.name}</span>
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 font-black" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-zinc-200 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                id="signup-submit-btn"
                className="w-full py-3 bg-black hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-sm hover:shadow cursor-pointer mt-2"
              >
                Assemble Profile
              </button>

              <p className="text-center text-xs text-zinc-500 pt-2 font-medium">
                Already registered?{' '}
                <button
                  type="button"
                  id="switch-to-login"
                  onClick={() => setIsSignUp(false)}
                  className="text-orange-600 font-bold uppercase tracking-wider hover:underline"
                >
                  Log In
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
              <div className="pb-1">
                <h3 className="font-sans font-black text-sm uppercase tracking-wider text-zinc-850">Welcome Back</h3>
                <p className="text-zinc-400 text-[10px] mt-0.5">Please access with your registered email</p>
              </div>

              {/* Dev Access Shortcut */}
              <div className="p-3 bg-amber-500/[0.04] border border-amber-200/50 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-mono font-black text-amber-800 uppercase tracking-widest leading-none">🔒 Root Administrator Clear</span>
                <button
                  type="button"
                  id="root-admin-bypass-btn"
                  onClick={async () => {
                    setLoginEmail('fresh.linksd@gmail.com');
                    try {
                      const success = await login('fresh.linksd@gmail.com');
                      if (success) {
                        onClose();
                      } else {
                        setLoginError('Could not auto-seed root administrator contact. Please retry.');
                      }
                    } catch (e: any) {
                      setLoginError(e?.message || 'Access Denied.');
                    }
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-sans font-extrabold uppercase tracking-widest text-[9px] rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer border border-amber-600/20"
                >
                  👑 Access as fresh.linksd@gmail.com (Super Admin)
                </button>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-150" id="login-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-sans font-semibold">{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    id="login-email-input"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. alice@nexus.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-semibold text-zinc-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Password Key</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
                  <input
                    type="password"
                    disabled
                    placeholder="•••••••• (Password lock bypassed)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-100 text-xs bg-zinc-50 text-zinc-400 cursor-not-allowed font-medium outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                className="w-full py-3 bg-black hover:bg-orange-600 text-white font-sans font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-sm hover:shadow cursor-pointer mt-2"
              >
                Access Account
              </button>

              <p className="text-center text-xs text-zinc-500 pt-2 font-medium">
                New creator?{' '}
                <button
                  type="button"
                  id="switch-to-signup"
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
  );
};
