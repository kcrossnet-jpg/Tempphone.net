import React, { useState, useEffect } from 'react';
import { PageView, UserSession } from './types';
import { safeStorage } from './utils/storage';
import { onAuthUserChanged, signOutUser } from './lib/firebase';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { TicketPhone } from './components/TicketPhone';
import { TicketMail } from './components/TicketMail';
import { AuthPage } from './components/AuthPage';
import { AuthModal } from './components/AuthModal';
import { PrivacyRetentionPage } from './components/PrivacyRetentionPage';
import { Toast, ToastData } from './components/Toast';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [session, setSession] = useState<UserSession | null>(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastData = {
      id: String(Date.now()),
      message,
      type
    };
    setToast(newToast);
  };

  const closeToast = () => {
    setToast(null);
  };

  // Safe startup initialization & Firebase Auth observer
  useEffect(() => {
    // 1. Check local storage session first
    try {
      const savedSession = safeStorage.getJSON<UserSession | null>('tp_user_session', null);
      if (savedSession?.user?.email) {
        setSession(savedSession);
      }
    } catch (err) {
      console.warn('Storage initialisation handled safely:', err);
    }

    // 2. Subscribe to Firebase Auth state
    const unsubscribe = onAuthUserChanged((fbUser) => {
      if (fbUser) {
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
        setSession(userSession);
        safeStorage.setJSON('tp_user_session', userSession);
      } else {
        // Only clear if the current session was explicitly signed in via Google Auth
        const currentSaved = safeStorage.getJSON<UserSession | null>('tp_user_session', null);
        if (currentSaved?.user?.provider === 'Google Mail') {
          setSession(null);
          safeStorage.removeItem('tp_user_session');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Hash route synchronization
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#ticket' || hash === '#phone') {
        setCurrentPage('ticket-phone');
      } else if (hash === '#mail') {
        setCurrentPage('ticket-mail');
      } else if (hash === '#login' || hash === '#auth') {
        setCurrentPage('login');
      } else if (hash === '#privacy' || hash === '#retention' || hash === '#privacy-retention') {
        setCurrentPage('privacy-retention');
      } else {
        setCurrentPage('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (page: PageView) => {
    setCurrentPage(page);
    if (page === 'ticket-phone') {
      window.location.hash = '#phone';
    } else if (page === 'ticket-mail') {
      window.location.hash = '#mail';
    } else if (page === 'login') {
      window.location.hash = '#login';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'privacy-retention') {
      window.location.hash = '#privacy';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'home') {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    const currentUserId = session?.user?.id;
    try {
      await signOutUser();
    } catch (err) {
      console.warn('Signout deferred:', err);
    }

    // Completely clear all user session and ticket keys from local storage
    safeStorage.removeItem('tp_user_session');
    safeStorage.removeItem('tp_active_phone_tickets');
    safeStorage.removeItem('tp_active_mail_tickets');
    safeStorage.removeItem('tp_active_mail_ticket');
    safeStorage.removeItem('tp_ticket_messages');
    safeStorage.removeItem('tp_mail_inbox');
    safeStorage.removeItem('tp_mail_outbox');
    safeStorage.removeItem('tp_payment_receipts');

    if (currentUserId) {
      safeStorage.removeItem(`tp_active_phone_tickets_${currentUserId}`);
      safeStorage.removeItem(`tp_active_mail_tickets_${currentUserId}`);
      safeStorage.removeItem(`tp_active_mail_ticket_${currentUserId}`);
      safeStorage.removeItem(`tp_ticket_messages_${currentUserId}`);
    }

    setSession(null);
    showToast('Logged out. Active tickets and local session credentials cleared from browser.');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-[#E9DEC3] text-[#221D16] font-body selection:bg-[#5B3A5C] selection:text-[#E9DEC3]">
      <Header
        currentPage={currentPage}
        onNavigate={navigateTo}
        session={session}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={navigateTo} />}
        {currentPage === 'login' && (
          <AuthPage
            session={session}
            onNavigate={navigateTo}
            onLoginSuccess={(newSession) => {
              setSession(newSession);
              showToast(`Welcome back, ${newSession.user.name || newSession.user.email}!`);
              navigateTo('ticket-phone');
            }}
            onLogout={handleLogout}
            onShowToast={showToast}
          />
        )}
        {currentPage === 'ticket-phone' && (
          <TicketPhone
            session={session}
            onShowToast={showToast}
            onNavigate={navigateTo}
            onOpenAuth={() => navigateTo('login')}
          />
        )}
        {currentPage === 'ticket-mail' && (
          <TicketMail
            session={session}
            onShowToast={showToast}
            onNavigate={navigateTo}
            onOpenAuth={() => navigateTo('login')}
          />
        )}
        {currentPage === 'privacy-retention' && (
          <PrivacyRetentionPage
            onNavigate={navigateTo}
            onShowToast={showToast}
            session={session}
          />
        )}
      </main>

      <Footer
        onNavigate={navigateTo}
        onOpenAuth={() => navigateTo('login')}
      />

      {/* Modals & Overlays */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={navigateTo}
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          showToast(`Welcome back, ${newSession.user.name || newSession.user.email}!`);
          navigateTo('ticket-phone');
        }}
      />

      {/* Global Toast */}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
