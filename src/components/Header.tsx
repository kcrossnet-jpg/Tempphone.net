import React from 'react';
import { PageView, UserSession } from '../types';
import { LogOut, User, Menu, X, Smartphone, Mail } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  session: UserSession | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  session,
  onLogout,
  onOpenAuth
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleNav = (page: PageView) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#E9DEC3]/95 backdrop-blur-sm border-b border-[#221D16]/20">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-1.5 font-anton text-xl sm:text-2xl md:text-3xl tracking-wide text-[#221D16] hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-ping-fast absolute inline-flex h-full w-full rounded-full bg-[#B23A2E] opacity-75"></span>
            <span className="animate-dot-fast relative inline-flex rounded-full h-2 w-2 bg-[#B23A2E] shadow-[0_0_8px_rgba(178,58,46,0.9)]"></span>
          </span>
          <span>TEMPPHONE</span>
        </button>

        {/* Desktop & Tablet Links */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-5 text-xs lg:text-sm font-semibold text-[#221D16]">
          <button
            onClick={() => handleNav('ticket-phone')}
            className={`flex items-center gap-1.5 hover:opacity-100 transition-opacity ${
              currentPage === 'ticket-phone' ? 'text-[#5B3A5C] font-bold' : 'opacity-75'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#5B3A5C]" />
            Phone
          </button>
          <button
            onClick={() => handleNav('ticket-mail')}
            className={`flex items-center gap-1.5 hover:opacity-100 transition-opacity ${
              currentPage === 'ticket-mail' ? 'text-[#5B3A5C] font-bold' : 'opacity-75'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#5B3A5C]" />
            Temp Mail
          </button>

          {/* User Profile or Login */}
          {session ? (
            <div className="flex items-center gap-1.5 lg:gap-2 pl-2 border-l border-[#221D16]/20">
              <button
                type="button"
                onClick={() => handleNav('login')}
                className="font-mono-retro text-[11px] lg:text-xs font-bold bg-[#5B3A5C]/10 hover:bg-[#5B3A5C]/20 text-[#5B3A5C] border border-[#5B3A5C]/25 px-2 lg:px-2.5 py-1 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Account Wallet"
              >
                {session.user.avatar ? (
                  <img
                    src={session.user.avatar}
                    alt={session.user.name || 'User'}
                    className="w-4 h-4 rounded-full border border-[#5B3A5C]/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-3 h-3" />
                )}
                <span className="max-w-[100px] lg:max-w-[130px] truncate">{session.user.name || session.user.email}</span>
              </button>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 text-[#B23A2E] hover:bg-[#B23A2E]/10 rounded border border-[#B23A2E]/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNav('login')}
              className={`btn-retro outline !py-1.5 !px-3 text-xs ${
                currentPage === 'login' ? '!bg-[#5B3A5C] !text-[#E9DEC3]' : ''
              }`}
            >
              Log in
            </button>
          )}

          <button
            onClick={() => handleNav('ticket-phone')}
            className="btn-retro plum flex items-center gap-1.5 !py-1.5 !px-3 text-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Pull a ticket</span>
            <span className="lg:hidden">Pull ticket</span>
          </button>
          <PWAInstallButton />
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => handleNav('ticket-phone')}
            className="btn-retro plum !py-2 !px-3 text-xs"
          >
            Pull ticket
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#221D16] border border-[#221D16] rounded cursor-pointer transition-colors hover:bg-black/5"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#DED0AC] border-b-2 border-[#221D16] px-4 sm:px-6 py-4 flex flex-col gap-3 font-mono-retro text-sm">
          <button
            onClick={() => handleNav('ticket-phone')}
            className="text-left py-2 font-bold hover:text-[#5B3A5C]"
          >
            📞 Phone Numbers
          </button>
          <button
            onClick={() => handleNav('ticket-mail')}
            className="text-left py-2 font-bold hover:text-[#5B3A5C]"
          >
            ✉️ Disposable Temp Mail
          </button>
          <div className="pt-2 border-t border-[#221D16]/20 flex justify-between items-center">
            {session ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs truncate max-w-[200px]">
                  👤 {session.user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs text-[#B23A2E] font-bold border border-[#B23A2E] px-2 py-1 rounded"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('login')}
                className="btn-retro outline w-full"
              >
                Log in or Create Account
              </button>
            )}
          </div>
          <div className="pt-2 border-t border-[#221D16]/20">
            <PWAInstallButton />
          </div>
        </div>
      )}
    </header>
  );
};
