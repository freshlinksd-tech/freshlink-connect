/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';
import { 
  ShieldAlert, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Lock 
} from 'lucide-react';

export const VerificationSetup: React.FC = () => {
  const { currentUser, updateProfile, logout } = useSocialPlatform();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [docType, setDocType] = useState<'pan' | 'docId'>('pan');
  const [docValue, setDocValue] = useState('');
  const [idPhoto, setIdPhoto] = useState('');
  const [idPhotoName, setIdPhotoName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, or JPEG) for your ID photo.');
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

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedPhone = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim() || parsedPhone.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    if (!docValue.trim()) {
      setError(
        docType === 'pan'
          ? 'PAN card number is required.'
          : 'Official Document identification number is required.'
      );
      return;
    }

    if (!idPhoto) {
      setError('A photo of your physical ID document is required for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        phoneNumber: phoneNumber.trim(),
        panNumber: docType === 'pan' ? docValue.trim().toUpperCase() : '',
        officialDocId: docType === 'docId' ? docValue.trim() : '',
        idPhoto: idPhoto,
        hasVerifiedDetails: true,
        isApprovedByAdmin: false // defaults to false, waiting for admin approval
      });
    } catch (err: any) {
      console.error('Verification details setup error:', err);
      setError('An error occurred during verification submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the Review Pending clearance state if they successfully compiled details but wait for admin clearance
  if (currentUser.hasVerifiedDetails === true && currentUser.isApprovedByAdmin !== true) {
    return (
      <div 
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto font-sans" 
        id="verification-pending-screen"
      >
        <div className="bg-white border border-zinc-100 max-w-md w-full shadow-2xl rounded-3xl overflow-hidden flex flex-col p-8 text-center select-none">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-100 text-amber-600 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <h2 className="font-sans font-black text-xl uppercase tracking-tighter text-zinc-900 leading-none">
            Review in Progress
          </h2>
          <p className="text-zinc-550 text-[11px] font-semibold tracking-wide uppercase mt-1 text-amber-600 bg-amber-50/70 inline-block px-3 py-1 rounded-full mx-auto">
            Security Clearance Level: Pending
          </p>

          <p className="text-zinc-500 text-xs mt-4 leading-relaxed font-medium">
            Thank you for uploading your details. The Nexus administrative panel has received your government ID document file and verification request. Your account is currently in queue for review. 
            <strong className="block mt-2 text-zinc-700">Verification will be processed in 3-4 hours by the Administrator. Only the administrator can verify and approve.</strong>
          </p>

          <div className="mt-6 border border-zinc-150/80 rounded-2xl p-4 bg-[#F8F7F4]/60 space-y-2 text-left text-[11px] font-medium text-zinc-700">
            <div className="flex justify-between border-b border-zinc-100 pb-1.5">
              <span className="text-zinc-400">Applicant:</span>
              <span className="font-bold">{currentUser.name}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-1.5">
              <span className="text-zinc-400">Phone Code:</span>
              <span className="font-bold">{currentUser.phoneNumber}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-1.5">
              <span className="text-zinc-400">ID Reference:</span>
              <span className="font-bold font-mono">
                {currentUser.panNumber ? `PAN: ${currentUser.panNumber}` : `ID: ${currentUser.officialDocId}`}
              </span>
            </div>
            {currentUser.idPhoto && (
              <div className="pt-2">
                <span className="text-zinc-400 block mb-1">Uploaded Document File:</span>
                <div className="h-28 overflow-hidden rounded-xl border border-zinc-200">
                  <img src={currentUser.idPhoto} alt="Govt ID preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2.5">
            <button 
              onClick={logout}
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:text-zinc-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Switch Account / Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none overflow-y-auto font-sans" 
      id="verification-setup-blocking-screen"
    >
      <div 
        id="verification-setup-card" 
        className="bg-white border border-zinc-100 max-w-lg w-full shadow-2xl rounded-3xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Verification Header Section */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 text-center relative border-b border-zinc-800">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10 shadow-inner">
            <ShieldAlert className="w-6 h-6 text-orange-500 animate-pulse" />
          </div>
          <h2 className="font-sans font-black text-lg uppercase tracking-tighter text-white">
            Security Clearance Request
          </h2>
          <p className="text-zinc-400 text-[11px] mt-1 font-medium max-w-xs mx-auto leading-relaxed">
            Nexus requires a verified contact number, tax document identity, and photo ID upload to authorize publishing access.
          </p>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2 font-semibold" id="verification-error-display">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {currentUser.clearanceRemarks && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 space-y-1 font-sans">
              <span className="font-extrabold uppercase text-[9px] tracking-wider text-red-800 block">🛑 Previous Application Denied by Admin</span>
              <p className="font-medium text-[11px] leading-normal">{currentUser.clearanceRemarks}</p>
              <p className="text-[10px] text-red-550 font-semibold pt-1">Please review the reason above and submit updated, accurate details below.</p>
            </div>
          )}

          <div className="bg-[#F8F7F4]/60 border border-zinc-200/50 p-3 rounded-xl">
            <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-[#1A1A1A]/40 block mb-0.5">Account Profile</span>
            <div className="flex items-center gap-3 mt-1">
              <img 
                src={currentUser.profileImage} 
                alt={currentUser.name} 
                className="w-8 h-8 object-cover rounded-full border border-zinc-200 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-800 truncate leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-zinc-400 mt-1 truncate leading-none">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Phone input field */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#1A1A1A]/40 block">
              Contact Phone Number <span className="text-orange-500 font-bold">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="tel"
                required
                id="verify-phone-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-bold text-zinc-800 outline-none transition-all"
              />
            </div>
          </div>

          {/* Document selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#1A1A1A]/40 block">
              Identity Verification Document <span className="text-orange-500 font-bold">*</span>
            </label>
            
            <div className="flex gap-2 mb-1.5">
              <button
                type="button"
                id="doc-toggle-pan"
                onClick={() => { setDocType('pan'); setDocValue(''); }}
                className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-xl transition-all border ${
                  docType === 'pan' 
                    ? 'bg-orange-600 border-orange-600 text-white font-extrabold shadow-md' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                }`}
              >
                PAN Card
              </button>
              <button
                type="button"
                id="doc-toggle-docId"
                onClick={() => { setDocType('docId'); setDocValue(''); }}
                className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-xl transition-all border ${
                  docType === 'docId' 
                    ? 'bg-orange-600 border-orange-600 text-white font-extrabold shadow-md' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                }`}
              >
                Official ID
              </button>
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                id="verify-doc-input"
                value={docValue}
                onChange={(e) => setDocValue(e.target.value)}
                placeholder={docType === 'pan' ? 'Enter 10-char PAN Num (e.g. ABCDE1234F)' : 'Enter Passport or Government ID Number'}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-150 focus:border-orange-500 bg-white text-xs font-bold text-zinc-800 outline-none transition-all uppercase"
              />
            </div>
          </div>

          {/* Upload Photo of ID Section */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#1A1A1A]/40 block">
              Upload Physical ID Photo <span className="text-orange-500 font-bold">*</span>
            </label>

            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-orange-500 bg-orange-50/40' 
                  : idPhoto 
                    ? 'border-emerald-550/40 bg-emerald-50/10' 
                    : 'border-zinc-200 hover:border-orange-400 bg-zinc-50/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
                accept="image/*"
                className="hidden" 
              />
              {idPhoto ? (
                <div className="flex flex-col items-center">
                  <div className="w-full h-32 overflow-hidden rounded-lg mb-2 relative">
                    <img src={idPhoto} alt="Verification ID preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold bg-black/60 px-2.5 py-1 rounded-md">
                        Tap to change
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ID Attached: {idPhotoName || 'uploaded_document.png'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <Upload className="w-7 h-7 text-zinc-400 mb-2" />
                  <p className="text-xs font-bold text-zinc-700">Drag & drop photo of ID, or click to browse</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-1">Supports PNG, JPG, JPEG (Max 1.5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              id="verify-submit-activation-btn"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting Clearance...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Submit for Admin Clearance</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer actions - simple log out / switch account */}
        <div id="verify-footer" className="bg-zinc-50/50 p-3 border-t border-zinc-100 flex items-center justify-between text-xs mt-auto">
          <span className="text-zinc-400 text-[10px]">Want to use another account?</span>
          <button 
            onClick={logout}
            className="text-red-650 hover:bg-red-50 py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition uppercase text-[10px] tracking-widest cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
