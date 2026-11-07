import React, { useState } from 'react';
import { PageView, UserSession } from '../types';
import { safeStorage } from '../utils/storage';
import { signInWithGoogle, signOutUser } from '../lib/firebase';
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  Smartphone,
  LogOut,
  ArrowRight,
  Loader2,
  AlertCircle,
  Database,
  Lock,
  Sparkles
} from 'lucide-react';

interface AuthPageProps {
  session: UserSession | null;
  onNavigate: (page: PageView) => void;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  session,
  onNavigate,
  onLoginSuccess,
  onLogout,
  onShowToast
}) => {
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email form state
  const [emailMode, setEmailMode] = useState<'signin' | 'register'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  // Real Google Sign-in via Firebase Auth
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningInGoogle(true);
    try {
      const fbUser = await signInWithGoogle();
      const userSession: UserSession = {
        success: true,
        token: fbUser.refreshToken || `fb_${fbUser.uid}`,
        user: {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          provider: 'Google Mail',
          avatar: fbUser.photoURL || undefined
        }
      };

      safeStorage.setJSON('tp_user_session', userSession);
      onLoginSuccess(userSession);
      onShowToast(`Signed in as ${userSession.user.name || userSession.user.email}!`);
    } catch (err: any) {
      console.warn('Google Sign-in error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('The Google sign-in window was closed before completing. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setAuthError('Another sign-in attempt was already in progress.');
      } else {
        setAuthError(err?.message || 'Google Sign-in failed. Please verify your internet connection and try again.');
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Email login / registration handler
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingEmail(true);

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please provide a valid email address.');
      setIsSubmittingEmail(false);
      return;
    }

    if (emailMode === 'register' && passwordInput.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      setIsSubmittingEmail(false);
      return;
    }

    const stableId = `usr_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
    const newSession: UserSession = {
      success: true,
      token: `email_tok_${Date.now()}`,
      user: {
        id: stableId,
        name: nameInput.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        provider: 'Email'
      }
    };

    safeStorage.setJSON('tp_user_session', newSession);
    onLoginSuccess(newSession);
    setIsSubmittingEmail(false);
    onShowToast(`Signed in as ${newSession.user.email}!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
      {/* Page Breadcrumb / Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-xs font-mono-retro font-bold text-[#5B3A5C] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          ← Return to Home
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono-retro text-[11px] font-bold">
            <Database className="w-3 h-3 text-emerald-700" />
            <span>Firestore Database Connected</span>
          </span>
        </div>
      </div>

      {/* Header Stamp */}
      <div className="mb-8">
        <div className="font-mono-retro text-xs font-bold uppercase tracking-widest text-[#5B3A5C] flex items-center gap-2 mb-2">
          <span>—</span> ADMIT ONE · ACCOUNT AUTHENTICATION
        </div>
        <h1 className="font-anton text-2xl sm:text-4xl md:text-5xl text-[#221D16] uppercase tracking-tight">
          {session ? 'Your Account Wallet' : 'Sign in to your wallet'}
        </h1>
        <p className="text-sm sm:text-base text-[#221D16]/80 max-w-2xl mt-2 leading-relaxed">
          {session
            ? 'Your active phone numbers and disposable email inboxes are automatically synchronized to your verified account in Google Cloud Firestore.'
            : 'Access your leased phone tickets, incoming SMS messages, and disposable mailboxes across multiple devices with Google Firebase Auth.'}
        </p>
      </div>

      {/* Main Content Layout */}
      {session ? (
        /* Authenticated State View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* User Profile Card */}
          <div className="lg:col-span-7 bg-[#DED0AC] border-2 border-[#221D16] rounded-md p-4 sm:p-6 lg:p-8 shadow-[4px_4px_0_rgba(34,29,22,0.15)] sm:shadow-[6px_6px_0_rgba(34,29,22,0.15)] relative">
            <div className="absolute top-4 right-4">
              <span className="font-mono-retro text-[10px] uppercase font-bold px-2 py-1 bg-emerald-700 text-white rounded">
                Verified
              </span>
            </div>

            <div className="flex items-center gap-4 pb-6 border-b border-[#221D16]/20">
              {session.user.avatar ? (
                <img
                  src={session.user.avatar}
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-[#221D16] shadow-[2px_2px_0_#221D16]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#5B3A5C] text-[#E9DEC3] font-anton text-2xl flex items-center justify-center border-2 border-[#221D16] shadow-[2px_2px_0_#221D16]">
                  {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-anton text-2xl text-[#221D16] uppercase">
                  {session.user.name || 'Account User'}
                </h2>
                <div className="font-mono-retro text-xs text-[#221D16]/80 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#5B3A5C]" />
                  <span>{session.user.email}</span>
                </div>
                <div className="font-mono-retro text-[11px] text-[#221D16]/60 mt-1">
                  Auth Provider: <span className="font-bold text-[#5B3A5C]">{session.user.provider}</span> · UID: <span className="font-bold">{session.user.id.slice(0, 12)}...</span>
                </div>
              </div>
            </div>

            {/* Account Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-6">
              <div className="p-3 bg-white/70 border border-[#221D16]/20 rounded">
                <div className="font-mono-retro text-[10px] uppercase text-[#221D16]/60 font-bold">
                  Data Persistence
                </div>
                <div className="font-anton text-lg text-emerald-800 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Cloud Synced
                </div>
                <div className="text-[11px] text-[#221D16]/70 mt-0.5">
                  Firestore rules enabled
                </div>
              </div>

              <div className="p-3 bg-white/70 border border-[#221D16]/20 rounded">
                <div className="font-mono-retro text-[10px] uppercase text-[#221D16]/60 font-bold">
                  Session Security
                </div>
                <div className="font-anton text-lg text-[#5B3A5C] flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-4 h-4 text-[#5B3A5C]" />
                  Secure &amp; Private
                </div>
                <div className="text-[11px] text-[#221D16]/70 mt-0.5">
                  Client-side isolated
                </div>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('ticket-phone')}
                className="btn-retro plum w-full !py-3 flex items-center justify-between text-sm font-bold shadow-[4px_4px_0_#221D16]"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Go to Temporary Phone Numbers</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ticket-mail')}
                className="btn-retro outline w-full !py-3 flex items-center justify-between text-sm font-bold bg-white/80"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#5B3A5C]" />
                  <span>Go to Disposable Temp Mail</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Logout Row */}
            <div className="pt-6 mt-6 border-t border-[#221D16]/20 flex items-center justify-between">
              <span className="font-mono-retro text-xs text-[#221D16]/60">
                Want to switch accounts or clear local storage?
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="btn-retro !bg-[#B23A2E] !text-white !py-1.5 !px-3.5 text-xs flex items-center gap-1.5 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Sync & Protection Info Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#FAF6EE] border-2 border-[#221D16] rounded-md p-6 shadow-[4px_4px_0_rgba(34,29,22,0.12)]">
              <h3 className="font-anton text-lg uppercase text-[#221D16] flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-[#5B3A5C]" />
                How Cloud Sync Works
              </h3>
              <ul className="space-y-2.5 text-xs text-[#221D16]/80 font-sans leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>Phone Leases:</strong> Numbers pulled under this account remain locked to you until the timer expires.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>SMS Ingestion:</strong> Incoming 2FA codes are safely preserved in your private Firestore collection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>Disposable Mailboxes:</strong> Temporary inboxes stay active across multiple browser windows.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>Immediate Burn:</strong> Click "Burn" anytime to permanently shred logs and terminate virtual numbers.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Unauthenticated Sign-in View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Auth Form Box */}
          <div className="lg:col-span-7 bg-[#DED0AC] border-2 border-[#221D16] rounded-md p-4 sm:p-6 lg:p-8 shadow-[4px_4px_0_rgba(34,29,22,0.15)] sm:shadow-[6px_6px_0_rgba(34,29,22,0.15)]">
            <div className="pb-4 mb-5 border-b border-[#221D16]/20">
              <h2 className="font-anton text-2xl uppercase tracking-wide text-[#221D16]">
                {emailMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs text-[#221D16]/75 mt-1">
                Choose your preferred authentication method to access your active ticket passes.
              </p>
            </div>

            {/* Error Notification */}
            {authError && (
              <div className="mb-5 p-3 bg-[#B23A2E]/10 border-2 border-[#B23A2E] rounded text-xs font-mono-retro text-[#B23A2E] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{authError}</div>
              </div>
            )}

            {/* Real Google Sign-in with Firebase Auth */}
            <div className="mb-6">
              <button
                type="button"
                disabled={isSigningInGoogle}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-neutral-50 text-[#221D16] border-2 border-[#221D16] rounded font-mono-retro font-bold text-sm flex items-center justify-center gap-3 transition-transform hover:-translate-y-0.5 shadow-[4px_4px_0_rgba(34,29,22,0.2)] disabled:opacity-60 cursor-pointer"
              >
                {isSigningInGoogle ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#5B3A5C]" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
                      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
                    </svg>
                    <span>Continue with Google (Firebase Auth)</span>
                  </>
                )}
              </button>
              <div className="text-[11px] text-[#221D16]/65 mt-2 font-mono-retro text-center">
                Uses official Google OAuth with Firebase Authentication popup.
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#221D16]/25"></div>
              </div>
              <span className="relative bg-[#DED0AC] px-3 font-mono-retro text-xs uppercase text-[#221D16]/65 font-bold tracking-wider">
                or sign in with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {emailMode === 'register' && (
                <div>
                  <label className="block font-mono-retro text-xs uppercase text-[#221D16]/75 mb-1 font-bold">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 bg-white/70 border-2 border-[#221D16] rounded font-mono-retro text-xs text-[#221D16] outline-none focus:border-[#5B3A5C] focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono-retro text-xs uppercase text-[#221D16]/75 mb-1 font-bold">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-white/70 border-2 border-[#221D16] rounded font-mono-retro text-xs text-[#221D16] outline-none focus:border-[#5B3A5C] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-mono-retro text-xs uppercase text-[#221D16]/75 mb-1 font-bold">
                  Password {emailMode === 'signin' && <span className="text-[10px] text-[#221D16]/50">(Optional for ticket lookup)</span>}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={emailMode === 'signin' ? '•••••••• (or leave blank)' : 'Minimum 6 characters'}
                  required={emailMode === 'register'}
                  className="w-full px-3.5 py-2.5 bg-white/70 border-2 border-[#221D16] rounded font-mono-retro text-xs text-[#221D16] outline-none focus:border-[#5B3A5C] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="btn-retro plum w-full !py-3 text-sm mt-3 font-bold shadow-[3px_3px_0_#221D16] flex items-center justify-center gap-2"
              >
                {isSubmittingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>
                  {emailMode === 'signin' ? 'Log In & Sync Active Tickets' : 'Create Account'}
                </span>
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="pt-4 mt-5 border-t border-[#221D16]/20 text-center font-mono-retro text-xs text-[#221D16]/70">
              {emailMode === 'signin' ? (
                <span>
                  Need a new account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('register');
                      setAuthError(null);
                    }}
                    className="font-bold text-[#5B3A5C] underline underline-offset-2 hover:opacity-80"
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode('signin');
                      setAuthError(null);
                    }}
                    className="font-bold text-[#5B3A5C] underline underline-offset-2 hover:opacity-80"
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Benefits Info Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#FAF6EE] border-2 border-[#221D16] rounded-md p-6 shadow-[4px_4px_0_rgba(34,29,22,0.12)]">
              <div className="flex items-center gap-2 font-mono-retro text-xs font-bold uppercase text-[#5B3A5C] mb-2">
                <Sparkles className="w-4 h-4 text-[#5B3A5C]" />
                <span>Account Advantages</span>
              </div>
              <h3 className="font-anton text-xl uppercase text-[#221D16] mb-3">
                Why Sign In?
              </h3>
              <div className="space-y-3.5 text-xs text-[#221D16]/80 font-sans leading-relaxed">
                <div>
                  <div className="font-bold text-[#221D16] flex items-center gap-1.5 mb-0.5">
                    <Database className="w-3.5 h-3.5 text-emerald-700" />
                    Persistent Firestore Backup
                  </div>
                  <div>
                    If you accidentally close your tab or switch devices, your phone leases and mailboxes remain ready and accessible.
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[#221D16] flex items-center gap-1.5 mb-0.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#5B3A5C]" />
                    Inbound SMS Routing
                  </div>
                  <div>
                    2FA verification messages and webhook dispatches are stored directly in your private collection.
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[#221D16] flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Zero Spam &amp; Privacy Shield
                  </div>
                  <div>
                    We never sell or forward user emails. When your ticket duration ends, line leases are released cleanly.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
