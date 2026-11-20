import React from 'react';
import { 
  Zap, 
  MessageSquare, 
  GraduationCap,
  Box, 
  Layout, 
  Image as ImageIcon, 
  Gamepad2, 
  Settings, 
  Plus,
  Crown,
  Lock,
  DoorOpen,
  DoorClosed,
  Shield,
  User,
  Smartphone,
  Mail,
  Mic
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';
import { requestMicrophonePermission } from '../services/voiceService';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  exitAiMode: boolean;
  onToggleExitAiMode: () => void;
  familyFriendly: boolean;
  antiCheat: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onNewChat,
  exitAiMode,
  onToggleExitAiMode,
  familyFriendly,
  antiCheat,
}) => {
  const isOwner = currentUser?.role === 'owner' || currentUser?.email?.toLowerCase() === 'whatsupsdev9@gmail.com';

  return (
    <header className="h-16 border-b border-[#2b2c2f] bg-[#131314]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Brand & Lightning Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] via-[#eab308] to-[#fbbf24] flex items-center justify-center shadow-lg shadow-[#eab308]/25 ring-1 ring-[#fef08a]/30 shrink-0">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1 font-['Plus_Jakarta_Sans']">
                What's Up <span className="bg-gradient-to-r from-[#ffd32a] via-[#f59e0b] to-[#fbbf24] bg-clip-text text-transparent">Studio</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#2a220e] text-[#ffd32a] border border-[#5c4a16] flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-[#ffd32a]" />
                Default AI
              </span>
            </div>
            <div className="text-[11px] text-[#8e8e93] leading-none flex items-center gap-1.5">
              <span>All Games & Characters</span>
              {antiCheat && (
                <>
                  <span className="text-[#6b7280]">•</span>
                  <span className="text-[#ffd32a] flex items-center gap-0.5 font-semibold">
                    <Zap className="w-2.5 h-2.5 fill-[#ffd32a]" /> Anti-Cheat
                  </span>
                </>
              )}
              {familyFriendly && (
                <>
                  <span className="text-[#6b7280]">•</span>
                  <span className="text-[#7ee787] flex items-center gap-0.5 font-semibold">
                    <Shield className="w-2.5 h-2.5" /> Safe Mode
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        {!exitAiMode && (
          <button
            onClick={onNewChat}
            className="ml-2 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#e3e3e3] text-xs font-medium border border-[#333538] transition-all hover:scale-105 active:scale-95"
            title="Start fresh conversation"
          >
            <Plus className="w-3.5 h-3.5 text-[#ffd32a]" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Center: Main Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-[#1e1f20] p-1 rounded-xl border border-[#2e3034] max-w-full overflow-x-auto no-scrollbar">
        {!exitAiMode && (
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-[#2b2d30] text-white shadow-sm font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#25272a]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#ffd32a]" />
            <span>Talk / Chat</span>
          </button>
        )}

        {!exitAiMode && (
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'gmail'
                ? 'bg-[#2a220e] text-[#ffd32a] border border-[#664b15] shadow-sm font-semibold'
                : 'text-[#9ca3af] hover:text-[#ffd32a] hover:bg-[#25272a]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#ffd32a]" />
            <span>Gmail</span>
          </button>
        )}

        {!exitAiMode && (
          <button
            onClick={() => setActiveTab('web-apk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'web-apk'
                ? 'bg-[#2a220e] text-[#ffd32a] border border-[#664b15] shadow-sm font-semibold'
                : 'text-[#9ca3af] hover:text-[#ffd32a] hover:bg-[#25272a]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#ffd32a]" />
            <span>Web APK</span>
          </button>
        )}

        {!exitAiMode && (
          <button
            onClick={() => setActiveTab('school-solver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'school-solver'
                ? 'bg-[#1e293b] text-[#38bdf8] border border-[#0284c7]/40 shadow-sm font-semibold'
                : 'text-[#9ca3af] hover:text-[#38bdf8] hover:bg-[#182333]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>School Answers</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('roblox-hub')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'roblox-hub'
              ? 'bg-[#2b2d30] text-white shadow-sm font-semibold'
              : 'text-[#9ca3af] hover:text-white hover:bg-[#25272a]'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-[#e056fd]" />
          <span>Roblox Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('gui-fixer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'gui-fixer'
              ? 'bg-[#2b2d30] text-white shadow-sm font-semibold'
              : 'text-[#9ca3af] hover:text-white hover:bg-[#25272a]'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-[#00cec9]" />
          <span>GUI Fixer</span>
        </button>

        {!exitAiMode && (
          <button
            onClick={() => setActiveTab('image-studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'image-studio'
                ? 'bg-[#2b2d30] text-white shadow-sm font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#25272a]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#ff7675]" />
            <span>Image Studio</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('multi-engine')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'multi-engine'
              ? 'bg-[#2b2d30] text-white shadow-sm font-semibold'
              : 'text-[#9ca3af] hover:text-white hover:bg-[#25272a]'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-[#fdcb6e]" />
          <span>All Engines</span>
        </button>

        {/* OWNER PANEL TAB */}
        {isOwner && (
          <button
            onClick={() => setActiveTab('owner-panel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'owner-panel'
                ? 'bg-[#3d2e0b] text-[#ffd32a] border border-[#785915] shadow-sm'
                : 'text-[#ffd32a]/80 hover:text-[#ffd32a] hover:bg-[#2a220e]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 fill-[#ffd32a]" />
            <span>Owner Panel</span>
          </button>
        )}
      </nav>

      {/* Right Controls: Mic Quick Enable + Get Out of AI toggle + Account Badge + Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            try {
              await requestMicrophonePermission();
            } catch {}
            setActiveTab('chat');
          }}
          className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#1e1f20] hover:bg-[#282a2c] text-[#ffd32a] border border-[#3a321a] transition-all whitespace-nowrap shrink-0"
          title="Enable Microphone & Talk to AI"
        >
          <Mic className="w-3.5 h-3.5 text-[#ffd32a]" />
          <span className="hidden sm:inline">Mic</span>
        </button>

        {/* GET OUT OF AI TOGGLE BUTTON */}
        <button
          onClick={onToggleExitAiMode}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
            exitAiMode
              ? 'bg-[#3d1822] text-[#ff7675] border border-[#6b2537] animate-pulse'
              : 'bg-[#1e1f20] hover:bg-[#282a2c] text-[#8e8e93] hover:text-white border border-[#2e3034]'
          }`}
          title={exitAiMode ? 'Click to re-enter AI Mode' : 'Get Out of AI setting (Native Studio Only)'}
        >
          {exitAiMode ? <DoorOpen className="w-3.5 h-3.5 text-[#ff7675]" /> : <DoorClosed className="w-3.5 h-3.5 text-[#8e8e93]" />}
          <span className="hidden sm:inline">{exitAiMode ? 'Out of AI (On)' : 'Get Out of AI'}</span>
        </button>

        {/* Account / Owner Badge */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
            isOwner
              ? 'bg-[#291f09] border-[#664b15] text-[#ffd32a] hover:bg-[#382a0d]'
              : currentUser
              ? 'bg-[#1e2330] border-[#2b3a55] text-[#70a1ff] hover:bg-[#242c3f]'
              : 'bg-[#1e1f20] border-[#2e3034] text-[#8e8e93] hover:text-white'
          }`}
          title={isOwner ? 'Owner Account: whatsupsdev9@gmail.com' : currentUser ? `Logged in: ${currentUser.email}` : 'Sign In'}
        >
          {isOwner ? (
            <>
              <Crown className="w-3.5 h-3.5 fill-[#ffd32a]" />
              <span className="hidden sm:inline">Owner</span>
            </>
          ) : currentUser ? (
            <>
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>Log In</span>
            </>
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] text-[#8e8e93] hover:text-white border border-[#2e3034] transition-colors"
          title="Studio & Security Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
