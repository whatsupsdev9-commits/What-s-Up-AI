import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  ShieldCheck, 
  Check, 
  Smartphone, 
  LogIn, 
  LogOut,
  Mail,
  User,
  Zap,
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'windows' | 'apple'>('google');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  // The predefined Owner Google account
  const handleOwnerGoogleLogin = () => {
    onLogin({
      id: 'usr_owner_whatsupsdev9',
      email: 'whatsupsdev9@gmail.com',
      name: "What's Up Studio Owner",
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=whatsupsdev9',
      role: 'owner',
      provider: 'google',
      createdAt: Date.now(),
    });
    onClose();
  };

  const handleCustomLogin = (provider: 'google' | 'windows' | 'apple') => {
    const email = customEmail.trim() || (
      provider === 'google' ? 'whatsupsdev9@gmail.com' :
      provider === 'windows' ? 'user@live.com' : 'appleuser@icloud.com'
    );
    const isOwner = email.toLowerCase() === 'whatsupsdev9@gmail.com';

    onLogin({
      id: `usr_${Date.now()}`,
      email,
      name: customName.trim() || (isOwner ? "What's Up Studio Owner" : email.split('@')[0]),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      role: isOwner ? 'owner' : 'member',
      provider,
      createdAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-[#18191d] border border-[#2e3034] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#211a0c] via-[#1a1c24] to-[#16171b] border-b border-[#2d3034] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center shadow-lg shadow-[#f59e0b]/25">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Account Access</span>
                <span className="text-[10px] bg-[#3a2c0c] text-[#ffd32a] px-2 py-0.2 rounded-full border border-[#6b5015] font-semibold">
                  Secure
                </span>
              </h3>
              <p className="text-[11px] text-[#8e8e93]">Google, Windows & iPhone Authentication</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#26282d] hover:bg-[#32353a] text-[#8e8e93] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#212328] border border-[#343842] flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center font-bold text-base text-black shadow-md">
                    {currentUser.role === 'owner' ? <Crown className="w-6 h-6 text-black fill-black" /> : currentUser.name[0]}
                  </div>
                  {currentUser.role === 'owner' && (
                    <span className="absolute -top-1 -right-1 p-0.5 bg-[#ffd32a] rounded-full text-black" title="Verified Owner">
                      <ShieldCheck className="w-3.5 h-3.5 fill-[#ffd32a]" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-white truncate">{currentUser.name}</p>
                    {currentUser.role === 'owner' ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#3d2e0b] text-[#ffd32a] text-[10px] font-extrabold border border-[#785915] flex items-center gap-1">
                        <Crown className="w-3 h-3 fill-[#ffd32a]" />
                        OWNER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#26282e] text-[#a1a1aa] text-[10px] font-medium border border-[#373a42] capitalize">
                        {currentUser.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8e8e93] truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-[#7ee787] mt-0.5 font-mono capitalize">
                    Connected via {currentUser.provider} Account
                  </p>
                </div>
              </div>

              {currentUser.role === 'owner' && (
                <div className="p-3 bg-[#241c09] border border-[#523e12] rounded-xl text-xs text-[#e5d4a1] space-y-1">
                  <span className="font-bold text-[#ffd32a] flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 fill-[#ffd32a]" />
                    <span>Owner Master Permissions Active</span>
                  </span>
                  <p className="text-[11px] text-[#cfb776]">
                    You have exclusive access to the <strong>Owner Panel</strong> to grant admin privileges and generate secure API key access links/codes.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    onLogin({
                      id: `usr_member_${Date.now()}`,
                      email: 'member@whatsup.studio',
                      name: 'Standard Member',
                      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=member',
                      role: 'member',
                      provider: 'google',
                      createdAt: Date.now(),
                    });
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#20232c] hover:bg-[#2a2e3a] text-[#93c5fd] border border-[#324361] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Switch to Non-Owner User</span>
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#2e1f23] hover:bg-[#3f272c] text-[#ff7675] border border-[#4d2a31] text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          ) : (
            /* Log in buttons */
            <div className="space-y-4">
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                Choose your sign-in method. Logging in with the Owner Google Account (<strong className="text-white">whatsupsdev9@gmail.com</strong>) unlocks the Master Owner & Admin Controls.
              </p>

              {/* Instant Owner Google Account Login */}
              <button
                onClick={handleOwnerGoogleLogin}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#2c220f] to-[#1f190c] hover:from-[#3a2c13] hover:to-[#2b2210] border-2 border-[#ffd32a]/60 hover:border-[#ffd32a] text-white flex items-center justify-between transition-all group shadow-lg shadow-[#ffd32a]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 shrink-0 shadow">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">whatsupsdev9@gmail.com</span>
                      <Crown className="w-3.5 h-3.5 text-[#ffd32a] fill-[#ffd32a]" />
                    </div>
                    <span className="text-[10px] text-[#ffd32a] font-semibold">Sign in as Owner (Full Privileges)</span>
                  </div>
                </div>
                <span className="text-xs text-[#ffd32a] font-bold group-hover:translate-x-1 transition-transform">
                  Enter →
                </span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#2e3034]"></div>
                <span className="flex-shrink mx-3 text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold">Or Sign In With</span>
                <div className="flex-grow border-t border-[#2e3034]"></div>
              </div>

              {/* Provider Buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Google */}
                <button
                  onClick={() => handleCustomLogin('google')}
                  className="p-3 rounded-2xl bg-[#212328] hover:bg-[#2a2d33] border border-[#343842] hover:border-white/40 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>

                {/* Windows / Microsoft */}
                <button
                  onClick={() => handleCustomLogin('windows')}
                  className="p-3 rounded-2xl bg-[#212328] hover:bg-[#2a2d33] border border-[#343842] hover:border-white/40 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                  <span>Windows</span>
                </button>

                {/* iPhone / Apple */}
                <button
                  onClick={() => handleCustomLogin('apple')}
                  className="p-3 rounded-2xl bg-[#212328] hover:bg-[#2a2d33] border border-[#343842] hover:border-white/40 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-white"
                >
                  <Smartphone className="w-5 h-5 text-white" />
                  <span>iPhone</span>
                </button>
              </div>

              {/* Optional Custom Email Input */}
              <div className="pt-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Or enter email (e.g. whatsupsdev9@gmail.com)"
                  className="w-full bg-[#141517] border border-[#2d3034] rounded-xl px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
