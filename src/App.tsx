import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TalkBar } from './components/TalkBar';
import { ChatMessage } from './components/ChatMessage';
import { RobloxStudioHub } from './components/RobloxStudioHub';
import { RobloxGuiVisualizer } from './components/RobloxGuiVisualizer';
import { ImageStudio } from './components/ImageStudio';
import { GameEngineHub } from './components/GameEngineHub';
import { SchoolSolver } from './components/SchoolSolver';
import { WebApkGenerator } from './components/WebApkGenerator';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { GmailWorkspace } from './components/GmailWorkspace';
import { 
  ChatMessage as ChatMessageType, 
  ChatSession, 
  ActiveTab, 
  PromptMode, 
  GeneratedImage,
  UserProfile,
  ApiKeyLink,
  WebApkBuild,
  CreditPackage
} from './types';
import { sendChatMessage } from './services/api';
import {
  addUserApkCredits,
  consumeUserApkCredit,
  getUserApkCredits,
  isOwnerAccount
} from './services/webApkEngine';
import { 
  Zap, 
  Box, 
  Layout, 
  Image as ImageIcon, 
  Gamepad2, 
  Mic, 
  ArrowRight,
  ShieldCheck,
  Code,
  Crown,
  DoorOpen,
  FileSearch,
  Lock
} from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'gemini_chat_sessions_v1';
const STORAGE_KEY_USER = 'wus_user_profile_v1';
const STORAGE_KEY_LINKS = 'wus_apikey_links_v1';
const STORAGE_KEY_ADMINS = 'wus_admin_users_v1';
const STORAGE_KEY_SETTINGS = 'wus_studio_settings_v1';
const STORAGE_KEY_WEB_APK_BUILDS = 'wus_web_apk_builds_v1';

const DEFAULT_OWNER_PROFILE: UserProfile = {
  id: 'usr_owner_whatsupsdev9',
  email: 'whatsupsdev9@gmail.com',
  name: "What's Up Studio Owner",
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=whatsupsdev9',
  role: 'owner',
  provider: 'google',
  createdAt: Date.now(),
};

const INITIAL_WELCOME_MESSAGE: ChatMessageType = {
  id: 'msg_welcome',
  role: 'assistant',
  content: `### Ready to Answer & Build

Ask any question directly — powered by **Gemini 4** reasoning with **GPT** conversational fluency, **Base44** full-stack app & Web APK building, and **Roblox / Unity / Godot / Unreal** game engineering.

- **Direct Answers**: Math, school homework, science, coding, and image/screenshot reading answered on the very first line.
- **Game & Character Mastery**: Every Roblox & video game mechanic and character from games, movies, and anime.
- **Base44 & Web APK Studio**: Ask for a website, full-stack app, or **Web APK** to generate live apps and randomized APK builds.`,
  timestamp: Date.now(),
  model: "gemini-4-hydrogen",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [activeMode, setActiveMode] = useState<PromptMode>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [guiInitialCode, setGuiInitialCode] = useState<string | undefined>(undefined);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<GeneratedImage | null>(null);

  // User Profile State (Defaults to Owner whatsupsdev9@gmail.com)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved user', e);
    }
    return DEFAULT_OWNER_PROFILE;
  });

  // App Toggles (Family Friendly, Anti Cheat, Exit AI Mode)
  const [familyFriendly, setFamilyFriendly] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).familyFriendly ?? true;
    } catch {}
    return true;
  });

  const [antiCheat, setAntiCheat] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).antiCheat ?? true;
    } catch {}
    return true;
  });

  const [exitAiMode, setExitAiMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).exitAiMode ?? false;
    } catch {}
    return false;
  });

  // API Key Links Issued by Owner
  const [apiKeyLinks, setApiKeyLinks] = useState<ApiKeyLink[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LINKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'link_master_seed',
        code: 'WUS-AUTH-FFF9-WA8L',
        url: `${window.location.origin}/?key_auth=WUS-AUTH-FFF9-WA8L`,
        createdAt: Date.now() - 86400000,
        expiresInDays: 30,
        label: 'Lead Developer Master Link',
        createdBy: 'whatsupsdev9@gmail.com',
        status: 'active',
      }
    ];
  });

  // Admins List
  const [adminUsers, setAdminUsers] = useState<{ id: string; email: string; name: string; role: 'admin' | 'member'; addedAt: number }[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMINS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'adm_1',
        email: 'studio.admin@whatsup.dev',
        name: 'Alex (Senior Luau Dev)',
        role: 'admin',
        addedAt: Date.now() - 172800000,
      }
    ];
  });

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved sessions', e);
    }
    return [
      {
        id: 'session_default',
        title: 'New Conversation',
        messages: [INITIAL_WELCOME_MESSAGE],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0]?.id || 'session_default');
  const [isLoading, setIsLoading] = useState(false);

  // Web APK Builds & Credits (Owner = Unlimited, Non-Owner = Paid)
  const [apkCredits, setApkCredits] = useState<number>(() => getUserApkCredits(currentUser));
  const [webApkBuilds, setWebApkBuilds] = useState<WebApkBuild[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WEB_APK_BUILDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeWebApkBuild, setActiveWebApkBuild] = useState<WebApkBuild | null>(
    () => webApkBuilds[0] || null
  );

  const isOwner = isOwnerAccount(currentUser);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setApkCredits(getUserApkCredits(currentUser));
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEB_APK_BUILDS, JSON.stringify(webApkBuilds));
    } catch {}
  }, [webApkBuilds]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(apiKeyLinks));
  }, [apiKeyLinks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ familyFriendly, antiCheat, exitAiMode }));
  }, [familyFriendly, antiCheat, exitAiMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to persist sessions', e);
    }
  }, [sessions]);

  // Current active session
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat' && !exitAiMode) {
      scrollToBottom();
    }
  }, [currentSession?.messages, activeTab, exitAiMode]);

  // Start a new chat session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      messages: [INITIAL_WELCOME_MESSAGE],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');
  };

  // Delete chat session
  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      setActiveSessionId(updated[0].id);
    }
  };

  // Clear chat history in active session
  const handleClearHistory = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [INITIAL_WELCOME_MESSAGE], updatedAt: Date.now() }
          : s
      )
    );
  };

  // Owner Link Generator
  const handleGenerateLink = (label: string, days: number): ApiKeyLink => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const code = `WUS-${randomHex}-${randomNum}`;
    const newLink: ApiKeyLink = {
      id: `link_${Date.now()}`,
      code,
      url: `${window.location.origin}/?api_access_code=${code}`,
      createdAt: Date.now(),
      expiresInDays: days,
      label,
      createdBy: currentUser.email,
      status: 'active',
    };

    setApiKeyLinks((prev) => [newLink, ...prev]);
    return newLink;
  };

  const handleRevokeLink = (id: string) => {
    setApiKeyLinks((prev) => prev.filter((l) => l.id !== id));
  };

  // Owner Admin Management
  const handleAddAdmin = (email: string, name: string) => {
    const newAdmin = {
      id: `adm_${Date.now()}`,
      email,
      name,
      role: 'admin' as const,
      addedAt: Date.now(),
    };
    setAdminUsers((prev) => [...prev, newAdmin]);
  };

  const handleRemoveAdmin = (id: string) => {
    setAdminUsers((prev) => prev.filter((a) => a.id !== id));
  };

  // Send message through Gemini / Hybrid Engine
  const handleSendMessage = async (text: string, attachedImage?: string) => {
    if (!text.trim() && !attachedImage) return;

    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachedImage,
    };

    const isFirstUserMessage = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const sessionTitle = isFirstUserMessage 
      ? text.slice(0, 32) + (text.length > 32 ? '...' : '') 
      : currentSession.title;

    const updatedMessages = [...currentSession.messages, userMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: sessionTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachedImage: m.attachedImage,
      }));

      const response = await sendChatMessage(apiMessages, {
        mode: activeMode,
        familyFriendly,
        antiCheatActive: antiCheat,
        currentUser,
        apkCredits: isOwner ? 999999 : apkCredits,
      });

      if (response.webApkData) {
        if (!isOwner && apkCredits >= 1) {
          const { remaining } = consumeUserApkCredit(currentUser);
          setApkCredits(remaining);
        }
        setWebApkBuilds((prev) => [response.webApkData!, ...prev]);
        setActiveWebApkBuild(response.webApkData);
      }

      const assistantMessage: ChatMessageType = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        model: response.model,
        generatedImages: response.generatedImages,
        detectedScripts: response.codeSnippets,
        webApkData: response.webApkData,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } catch (err: any) {
      console.error('Failed to get What\'s Up AI response', err);
      const errorMessage: ChatMessageType = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `I encountered an unexpected issue connecting to the AI engine: ${err.message || 'Network error'}. Please verify your network or check settings.`,
        timestamp: Date.now(),
        model: 'Default Hybrid AI',
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMessage], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenGuiVisualizer = (code?: string) => {
    if (code) setGuiInitialCode(code);
    setActiveTab('gui-fixer');
  };

  const handlePromptFromSubcomponent = (prompt: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt);
  };

  const handleExitAiToggle = () => {
    const next = !exitAiMode;
    setExitAiMode(next);
    if (next && activeTab === 'chat') {
      setActiveTab('roblox-hub');
    } else if (!next) {
      setActiveTab('chat');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-['Plus_Jakarta_Sans']">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Global App Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewChat={handleNewChat}
          exitAiMode={exitAiMode}
          onToggleExitAiMode={handleExitAiToggle}
          familyFriendly={familyFriendly}
          antiCheat={antiCheat}
        />

        {/* Tab 1: Gemini Chat & Talk Bar */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="max-w-4xl mx-auto py-4">
                {currentSession.messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onOpenGuiVisualizer={handleOpenGuiVisualizer}
                    onSelectImage={(img) => setSelectedLightboxImage(img)}
                    onAskFollowup={(followup) => handleSendMessage(followup)}
                    isOwner={isOwner}
                    apkCredits={apkCredits}
                    onOpenWebApk={(build) => {
                      if (isOwner) {
                        setApkCredits(Number.POSITIVE_INFINITY);
                      }
                      setActiveWebApkBuild(build);
                      setWebApkBuilds((prev) =>
                        prev.some((b) => b.id === build.id) ? prev : [build, ...prev]
                      );
                      setActiveTab('web-apk');
                    }}
                  />
                ))}

                {/* Loading state indicator */}
                {isLoading && (
                  <div className="py-4 px-6 max-w-4xl mx-auto flex items-center gap-3 text-xs text-[#8e8e93]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center animate-pulse shadow-md shadow-[#f59e0b]/30">
                      <Zap className="w-4 h-4 text-black fill-black" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ffd32a] animate-ping" />
                      <span className="font-medium text-white">What's Up AI is reading your intent & solving...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Bottom Floating Talk Bar */}
            <div className="shrink-0 bg-gradient-to-t from-[#131314] via-[#131314]/95 to-transparent pt-3 z-20">
              <TalkBar
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                exitAiMode={exitAiMode}
                onExitAiToggle={handleExitAiToggle}
              />
            </div>
          </div>
        )}

        {/* Tab: Gmail Workspace & Voice Mailbox */}
        {activeTab === 'gmail' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <GmailWorkspace onAskAiAboutEmail={handlePromptFromSubcomponent} />
          </div>
        )}

        {/* Tab: Web APK Website & Random APK Generator */}
        {activeTab === 'web-apk' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <WebApkGenerator
              currentUser={currentUser}
              credits={apkCredits}
              onUnlockOwnerCredits={() => setApkCredits(Number.POSITIVE_INFINITY)}
              onPurchaseCredits={(pkg: CreditPackage, paymentMethod: string) => {
                const updated = addUserApkCredits(currentUser, pkg.credits, {
                  packageId: pkg.id,
                  amountUsd: pkg.priceUsd,
                  method: paymentMethod,
                });
                setApkCredits(updated);
              }}
              onConsumeCredit={() => {
                const res = consumeUserApkCredit(currentUser);
                setApkCredits(res.remaining);
                return res.allowed;
              }}
              onOpenAuth={() => setIsAuthOpen(true)}
              builds={webApkBuilds}
              activeBuild={activeWebApkBuild}
              onAddBuild={(build) => {
                setWebApkBuilds((prev) => [build, ...prev]);
                setActiveWebApkBuild(build);
              }}
              onSelectBuild={(build) => setActiveWebApkBuild(build)}
            />
          </div>
        )}

        {/* Tab: School & Homework Solver */}
        {activeTab === 'school-solver' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <SchoolSolver
              onAskAi={(q, img) => {
                setActiveTab('chat');
                handleSendMessage(q, img);
              }}
            />
          </div>
        )}

        {/* Tab 2: Roblox Studio Hub */}
        {activeTab === 'roblox-hub' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <RobloxStudioHub
              onLoadScriptToChat={(title, prompt) => {
                setActiveTab('chat');
                handleSendMessage(prompt);
              }}
              onOpenGuiPreview={handleOpenGuiVisualizer}
            />
          </div>
        )}

        {/* Tab 3: Roblox GUI Visualizer & Auto Fixer ("fix all guis") */}
        {activeTab === 'gui-fixer' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <RobloxGuiVisualizer
              initialCode={guiInitialCode}
              onSendToChat={handlePromptFromSubcomponent}
            />
          </div>
        )}

        {/* Tab 4: AI Image Studio ("give you images, anything you want") */}
        {activeTab === 'image-studio' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <ImageStudio onInsertToChat={(img) => setSelectedLightboxImage(img)} />
          </div>
        )}

        {/* Tab 5: Multi-Game Engine Coder */}
        {activeTab === 'multi-engine' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <GameEngineHub onAskGemini={handlePromptFromSubcomponent} />
          </div>
        )}

        {/* Tab 6: OWNER DASHBOARD */}
        {activeTab === 'owner-panel' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
            <OwnerDashboard
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              apiKeyLinks={apiKeyLinks}
              onGenerateLink={handleGenerateLink}
              onRevokeLink={handleRevokeLink}
              adminUsers={adminUsers}
              onAddAdmin={handleAddAdmin}
              onRemoveAdmin={handleRemoveAdmin}
              familyFriendly={familyFriendly}
              onToggleFamilyFriendly={setFamilyFriendly}
              antiCheat={antiCheat}
              onToggleAntiCheat={setAntiCheat}
              exitAiMode={exitAiMode}
              onToggleExitAiMode={setExitAiMode}
            />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={handleClearHistory}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        familyFriendly={familyFriendly}
        onToggleFamilyFriendly={setFamilyFriendly}
        antiCheat={antiCheat}
        onToggleAntiCheat={setAntiCheat}
        exitAiMode={exitAiMode}
        onToggleExitAiMode={setExitAiMode}
      />

      {/* Auth Modal (Google, Windows, iPhone) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
        onLogout={() =>
          setCurrentUser({
            id: 'usr_guest',
            email: 'guest@whatsup.studio',
            name: 'Guest User',
            role: 'member',
            provider: 'google',
            createdAt: Date.now(),
          })
        }
      />

      {/* Lightbox for full size image inspection (See the images) */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div
            className="max-w-5xl w-full max-h-[95vh] bg-[#1a1b1e] border-2 border-[#ffd32a]/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#202124] border-b border-[#2d3034] flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="p-1 rounded-lg bg-[#ffd32a]/20 text-[#ffd32a]">
                  <Zap className="w-4 h-4 fill-[#ffd32a]" />
                </span>
                <span className="font-bold text-sm text-white truncate max-w-sm sm:max-w-lg">
                  {selectedLightboxImage.prompt}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedLightboxImage.url}
                  download="whatsup_image.png"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#ffd32a] hover:bg-[#ffe066] text-black font-extrabold text-xs transition-colors flex items-center gap-1 shadow"
                >
                  <span>Download High-Res</span>
                </a>
                <button
                  onClick={() => setSelectedLightboxImage(null)}
                  className="px-3 py-1.5 rounded-xl bg-[#2e3138] hover:bg-[#3d414a] text-white font-semibold text-xs transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="p-3 bg-black flex-1 flex items-center justify-center overflow-auto min-h-[300px] max-h-[82vh]">
              <img
                src={selectedLightboxImage.url}
                alt={selectedLightboxImage.prompt}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
