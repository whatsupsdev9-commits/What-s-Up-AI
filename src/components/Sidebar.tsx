import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Box, 
  Layout, 
  Image as ImageIcon, 
  Gamepad2, 
  Settings, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  User,
  Zap,
  Lock,
  Smartphone,
  GraduationCap,
  Mail
} from 'lucide-react';
import { ActiveTab, ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  setActiveTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenSettings,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-[#17181a] border-r border-[#27282b] flex flex-col transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-16 lg:translate-x-0'
        }`}
      >
        {/* Top Header & Collapse Toggle */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-[#232427]">
          {isOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center shadow-md shadow-[#f59e0b]/30">
                <Zap className="w-4 h-4 text-black fill-black" />
              </div>
              <span className="font-bold text-sm text-white">What's Up Studio</span>
            </div>
          ) : (
            <div className="mx-auto">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center shadow-md shadow-[#f59e0b]/30">
                <Zap className="w-4 h-4 text-black fill-black" />
              </div>
            </div>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-[#8e8e93] hover:text-white hover:bg-[#25262a] transition-colors"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              setActiveTab('chat');
            }}
            className={`w-full flex items-center gap-2.5 py-2.5 rounded-full bg-[#1f2023] hover:bg-[#28292d] text-white border border-[#2e3034] text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${
              isOpen ? 'px-4 justify-start' : 'px-0 justify-center'
            }`}
            title="Start New Chat"
          >
            <Plus className="w-4 h-4 text-[#388bfd]" />
            {isOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* Feature Fast Links */}
        <div className="px-2 py-2 space-y-1 border-b border-[#232427]">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-[#25272a] text-white font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2023]'
            }`}
            title="What's Up AI Talk Bar & Chat"
          >
            <MessageSquare className="w-4 h-4 text-[#388bfd] shrink-0" />
            {isOpen && <span>AI Talk & Chat</span>}
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'gmail'
                ? 'bg-[#25272a] text-[#ffd32a] font-semibold'
                : 'text-[#9ca3af] hover:text-[#ffd32a] hover:bg-[#1e2023]'
            }`}
            title="Gmail & Voice Mailbox"
          >
            <Mail className="w-4 h-4 text-[#ffd32a] shrink-0" />
            {isOpen && <span>Gmail Mailbox</span>}
          </button>

          <button
            onClick={() => setActiveTab('web-apk')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'web-apk'
                ? 'bg-[#25272a] text-[#ffd32a] font-semibold'
                : 'text-[#9ca3af] hover:text-[#ffd32a] hover:bg-[#1e2023]'
            }`}
            title="Web APK Website & Random Code Generator"
          >
            <Smartphone className="w-4 h-4 text-[#ffd32a] shrink-0" />
            {isOpen && <span>Web APK Generator</span>}
          </button>

          <button
            onClick={() => setActiveTab('school-solver')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'school-solver'
                ? 'bg-[#25272a] text-[#38bdf8] font-semibold'
                : 'text-[#9ca3af] hover:text-[#38bdf8] hover:bg-[#1e2023]'
            }`}
            title="School & Homework Answers"
          >
            <GraduationCap className="w-4 h-4 text-[#38bdf8] shrink-0" />
            {isOpen && <span>School Answers</span>}
          </button>

          <button
            onClick={() => setActiveTab('roblox-hub')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'roblox-hub'
                ? 'bg-[#25272a] text-white font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2023]'
            }`}
            title="Roblox Studio Scripts"
          >
            <Box className="w-4 h-4 text-[#a55eea] shrink-0" />
            {isOpen && <span>Roblox Studio</span>}
          </button>

          <button
            onClick={() => setActiveTab('gui-fixer')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'gui-fixer'
                ? 'bg-[#25272a] text-white font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2023]'
            }`}
            title="Roblox GUI Fixer & Tester"
          >
            <Layout className="w-4 h-4 text-[#00cec9] shrink-0" />
            {isOpen && <span>GUI Studio & Fixer</span>}
          </button>

          <button
            onClick={() => setActiveTab('image-studio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'image-studio'
                ? 'bg-[#25272a] text-white font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2023]'
            }`}
            title="Image Generator"
          >
            <ImageIcon className="w-4 h-4 text-[#ff7675] shrink-0" />
            {isOpen && <span>Image Generator</span>}
          </button>

          <button
            onClick={() => setActiveTab('multi-engine')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeTab === 'multi-engine'
                ? 'bg-[#25272a] text-white font-semibold'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2023]'
            }`}
            title="Unity & Godot Engines"
          >
            <Gamepad2 className="w-4 h-4 text-[#fdcb6e] shrink-0" />
            {isOpen && <span>All Game Engines</span>}
          </button>
        </div>

        {/* Recent Conversations */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider px-2">
              Recent Chats
            </span>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id);
                  setActiveTab('chat');
                }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                  activeSessionId === s.id && activeTab === 'chat'
                    ? 'bg-[#25272a] text-white font-medium'
                    : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2023]'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{s.title || 'Conversation'}</span>
                </div>

                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#ff7675] transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isOpen && <div className="flex-1" />}

        {/* Bottom User Profile & Settings */}
        <div className="p-3 border-t border-[#232427] space-y-1.5">
          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center gap-2.5 py-2 rounded-xl text-xs text-[#9ca3af] hover:text-white hover:bg-[#202225] transition-colors ${
              isOpen ? 'px-3' : 'justify-center'
            }`}
            title="Settings & Key"
          >
            <Settings className="w-4 h-4 text-[#8e8e93]" />
            {isOpen && <span>API Key & Engine</span>}
          </button>

          {isOpen ? (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#1b1c1e] rounded-xl border border-[#2b2d30]">
              <div className="w-7 h-7 rounded-full bg-[#388bfd]/20 text-[#388bfd] flex items-center justify-center font-bold text-xs">
                W
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-semibold text-white truncate">whatsupsdev9@gmail.com</p>
                <p className="text-[10px] text-[#7ee787] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7ee787]" />
                  Active Plan
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-7 h-7 rounded-full bg-[#388bfd]/20 text-[#388bfd] flex items-center justify-center font-bold text-xs" title="whatsupsdev9@gmail.com">
                W
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
