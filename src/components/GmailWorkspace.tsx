import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  Trash2,
  Inbox,
  Star,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Reply,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  fetchGmailProfile,
  getGmailAccessToken,
  GmailMessageSummary,
  gmailLogout,
  googleGmailSignIn,
  initGmailAuth,
  listGmailMessages,
  markGmailMessageRead,
  sendGmailMessage,
  trashGmailMessage,
} from '../services/gmailAuthService';
import {
  requestMicrophonePermission,
  RobustSpeechRecognition,
  speakText,
  stopSpeaking,
} from '../services/voiceService';

interface GmailWorkspaceProps {
  onAskAiAboutEmail?: (prompt: string) => void;
}

type PendingMutation =
  | { type: 'send'; to: string; subject: string; body: string }
  | { type: 'trash'; message: GmailMessageSummary }
  | { type: 'markRead'; message: GmailMessageSummary };

export const GmailWorkspace: React.FC<GmailWorkspaceProps> = ({ onAskAiAboutEmail }) => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getGmailAccessToken());
  const [gmailEmail, setGmailEmail] = useState<string>('');

  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'SENT' | 'STARRED' | 'TRASH'>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Compose Email State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Mandatory Confirmation Dialog for Mutations (Send / Trash / Mark Read)
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [isExecutingMutation, setIsExecutingMutation] = useState(false);

  // Voice / Microphone ("Mic / Mike") State
  const [micStatus, setMicStatus] = useState<'idle' | 'ready' | 'listening' | 'error'>('idle');
  const [dictatingTarget, setDictatingTarget] = useState<'search' | 'subject' | 'body' | null>(null);
  const [isSpeakingEmail, setIsSpeakingEmail] = useState(false);
  const recognitionRef = useRef<RobustSpeechRecognition | null>(null);

  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user, token) => {
        setFirebaseUser(user);
        setAccessToken(token);
        setNeedsAuth(false);
        loadInboxData(token, activeFolder, searchQuery);
      },
      () => {
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => {
      unsubscribe();
      recognitionRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  const loadInboxData = async (
    token: string,
    folder: 'INBOX' | 'SENT' | 'STARRED' | 'TRASH' = activeFolder,
    query: string = searchQuery
  ) => {
    setIsLoadingMessages(true);
    setErrorBanner(null);
    try {
      const [profile, msgs] = await Promise.all([
        fetchGmailProfile(token),
        listGmailMessages(token, { labelId: folder, query, maxResults: 15 }),
      ]);
      setGmailEmail(profile.emailAddress || firebaseUser?.email || '');
      setMessages(msgs);
      if (msgs.length > 0 && (!selectedMessage || !msgs.some((m) => m.id === selectedMessage.id))) {
        setSelectedMessage(msgs[0]);
      } else if (msgs.length === 0) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to load Gmail messages.';
      if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('invalid credentials')) {
        setNeedsAuth(true);
        setAccessToken(null);
      }
      setErrorBanner(msg);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorBanner(null);
    try {
      const result = await googleGmailSignIn();
      setFirebaseUser(result.user);
      setAccessToken(result.accessToken);
      setNeedsAuth(false);
      await loadInboxData(result.accessToken, activeFolder, searchQuery);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Google sign-in was cancelled or blocked.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await gmailLogout();
    setFirebaseUser(null);
    setAccessToken(null);
    setMessages([]);
    setSelectedMessage(null);
    setNeedsAuth(true);
  };

  const handleEnableMicTest = async () => {
    setErrorBanner(null);
    try {
      await requestMicrophonePermission();
      setMicStatus('ready');
      setStatusBanner('Microphone access granted and ready for voice dictation.');
    } catch (err: any) {
      setMicStatus('error');
      setErrorBanner(err?.message || 'Could not access microphone.');
    }
  };

  const startMicDictation = async (target: 'search' | 'subject' | 'body') => {
    if (dictatingTarget === target && micStatus === 'listening') {
      recognitionRef.current?.stop();
      setDictatingTarget(null);
      setMicStatus('ready');
      return;
    }

    recognitionRef.current?.abort();
    setErrorBanner(null);

    const recognizer = new RobustSpeechRecognition({
      onStart: () => {
        setMicStatus('listening');
        setDictatingTarget(target);
      },
      onResult: (text, isFinal) => {
        if (!isFinal) return;
        const clean = text.trim();
        if (!clean) return;
        if (target === 'search') {
          setSearchQuery((prev) => (prev ? `${prev} ${clean}` : clean));
        } else if (target === 'subject') {
          setComposeSubject((prev) => (prev ? `${prev} ${clean}` : clean));
        } else if (target === 'body') {
          setComposeBody((prev) => (prev ? `${prev} ${clean}` : clean));
        }
      },
      onError: (errMsg) => {
        setMicStatus('error');
        setDictatingTarget(null);
        setErrorBanner(errMsg);
      },
      onEnd: () => {
        setMicStatus('ready');
        setDictatingTarget(null);
      },
    });

    recognitionRef.current = recognizer;
    await recognizer.start();
  };

  const handleSpeakSelectedEmail = async () => {
    if (!selectedMessage) return;
    if (isSpeakingEmail) {
      stopSpeaking();
      setIsSpeakingEmail(false);
      return;
    }
    setIsSpeakingEmail(true);
    await speakText(
      `Email from ${selectedMessage.from}. Subject: ${selectedMessage.subject}. ${selectedMessage.bodyText}`,
      () => setIsSpeakingEmail(false),
      () => setIsSpeakingEmail(false)
    );
  };

  const handleFolderChange = (folder: 'INBOX' | 'SENT' | 'STARRED' | 'TRASH') => {
    setActiveFolder(folder);
    if (accessToken) {
      loadInboxData(accessToken, folder, searchQuery);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessToken) {
      loadInboxData(accessToken, activeFolder, searchQuery);
    }
  };

  const handleConfirmSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) {
      setErrorBanner('Recipient email and subject are required before sending.');
      return;
    }
    setPendingMutation({
      type: 'send',
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody,
    });
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation || !accessToken) return;
    setIsExecutingMutation(true);
    setErrorBanner(null);

    try {
      if (pendingMutation.type === 'send') {
        await sendGmailMessage(accessToken, {
          to: pendingMutation.to,
          subject: pendingMutation.subject,
          body: pendingMutation.body,
        });
        setStatusBanner(`Email sent to ${pendingMutation.to}.`);
        setIsComposeOpen(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        await loadInboxData(accessToken, activeFolder, searchQuery);
      } else if (pendingMutation.type === 'trash') {
        await trashGmailMessage(accessToken, pendingMutation.message.id);
        setStatusBanner(`Moved "${pendingMutation.message.subject}" to Trash.`);
        setSelectedMessage(null);
        await loadInboxData(accessToken, activeFolder, searchQuery);
      } else if (pendingMutation.type === 'markRead') {
        await markGmailMessageRead(accessToken, pendingMutation.message.id);
        setStatusBanner(`Marked "${pendingMutation.message.subject}" as read.`);
        await loadInboxData(accessToken, activeFolder, searchQuery);
      }
      setPendingMutation(null);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Gmail operation failed.');
      setPendingMutation(null);
    } finally {
      setIsExecutingMutation(false);
    }
  };

  if (needsAuth || !accessToken) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2a210b] border border-[#664b15] flex items-center justify-center text-[#ffd32a] shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-white">Connect Your Gmail &amp; Microphone</h1>
              <p className="text-xs sm:text-sm text-[#9ca3af] leading-relaxed">
                Sign in with your Google account to read, search, dictate, compose, and send Gmail messages directly inside this workspace. Microphone dictation lets you speak searches and email drafts hands-free.
              </p>
            </div>
          </div>

          {errorBanner && (
            <div className="p-3 rounded-xl bg-[#2c191f] border border-[#6b2537] text-xs text-[#fda4af] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          {statusBanner && (
            <div className="p-3 rounded-xl bg-[#16271f] border border-[#26543d] text-xs text-[#86efac] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusBanner}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Official Sign in with Google button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-3 bg-white hover:bg-[#f7f8f8] active:bg-[#eeeeee] text-[#1f1f1f] border border-[#747775] rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting Google...' : 'Sign in with Google'}</span>
            </button>

            <button
              type="button"
              onClick={handleEnableMicTest}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#22242c] hover:bg-[#2c2f3a] border border-[#343844] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Mic className="w-4 h-4 text-[#ffd32a]" />
              <span>{micStatus === 'ready' ? 'Microphone Enabled' : 'Enable Microphone'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5 space-y-4 text-[#e3e3e3]">
      {/* Top Toolbar */}
      <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2a210b] border border-[#664b15] flex items-center justify-center text-[#ffd32a] shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">Gmail &amp; Voice Mailbox</h1>
            <p className="text-xs text-[#9ca3af] font-mono">
              {gmailEmail || firebaseUser?.email || 'Connected Account'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleEnableMicTest}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              micStatus === 'ready' || micStatus === 'listening'
                ? 'bg-[#17261f] border-[#26543d] text-[#86efac]'
                : 'bg-[#202229] hover:bg-[#2a2d36] border-[#323642] text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#ffd32a]" />
            <span>{micStatus === 'ready' ? 'Mic Ready' : 'Enable Mic'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsComposeOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose Email</span>
          </button>

          <button
            type="button"
            onClick={() => loadInboxData(accessToken, activeFolder, searchQuery)}
            disabled={isLoadingMessages}
            className="px-3 py-2 rounded-xl bg-[#202229] hover:bg-[#2a2d36] border border-[#323642] text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-2 rounded-xl bg-[#261a1e] hover:bg-[#342228] border border-[#4f2833] text-xs font-semibold text-[#fda4af] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Banners */}
      {errorBanner && (
        <div className="bg-[#2c191f] border border-[#6b2537] rounded-xl px-4 py-2.5 text-xs text-[#fda4af] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-[#9ca3af] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {statusBanner && (
        <div className="bg-[#16271f] border border-[#26543d] rounded-xl px-4 py-2.5 text-xs text-[#86efac] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="text-[#9ca3af] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Folder Controls */}
      <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'INBOX', label: 'Inbox', icon: Inbox },
            { id: 'STARRED', label: 'Starred', icon: Star },
            { id: 'SENT', label: 'Sent', icon: Send },
            { id: 'TRASH', label: 'Trash', icon: Trash2 },
          ].map((folder) => {
            const Icon = folder.icon;
            const active = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleFolderChange(folder.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#2a2d36] text-white'
                    : 'text-[#9ca3af] hover:text-white hover:bg-[#202229]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#ffd32a]" />
                <span>{folder.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Gmail or dictate with Mic..."
              className="w-full bg-[#111216] border border-[#2d3038] rounded-xl pl-8 pr-9 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a]"
            />
            <button
              type="button"
              onClick={() => startMicDictation('search')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                dictatingTarget === 'search' && micStatus === 'listening'
                  ? 'bg-[#f43f5e] text-white'
                  : 'text-[#9ca3af] hover:text-[#ffd32a]'
              }`}
              title="Dictate Gmail search with Microphone"
            >
              {dictatingTarget === 'search' && micStatus === 'listening' ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-[#252832] hover:bg-[#313542] text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Split View: Message List & Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left List */}
        <div className="lg:col-span-5 bg-[#17181c] border border-[#2a2c32] rounded-2xl overflow-hidden flex flex-col max-h-[540px]">
          <div className="px-4 py-2.5 border-b border-[#252832] flex items-center justify-between text-xs">
            <span className="font-bold text-white">{activeFolder} Messages</span>
            <span className="font-mono text-[#9ca3af] tabular-nums">{messages.length} loaded</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#23262e]">
            {isLoadingMessages ? (
              <div className="p-6 text-center text-xs text-[#9ca3af]">Loading Gmail messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#9ca3af]">
                No messages found in {activeFolder}.
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left px-4 py-3 transition-colors space-y-1 ${
                      isSelected ? 'bg-[#22252e]' : 'hover:bg-[#1c1e24]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs truncate ${msg.isUnread ? 'font-bold text-white' : 'font-medium text-[#cbd5e1]'}`}>
                        {msg.from.replace(/<[^>]+>/g, '').trim() || msg.from}
                      </span>
                      <span className="text-[10px] font-mono text-[#9ca3af] shrink-0 tabular-nums">
                        {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${msg.isUnread ? 'font-bold text-[#ffd32a]' : 'text-white'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-[11px] text-[#9ca3af] truncate">{msg.snippet}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Reader */}
        <div className="lg:col-span-7 bg-[#17181c] border border-[#2a2c32] rounded-2xl overflow-hidden flex flex-col min-h-[420px] max-h-[540px]">
          {!selectedMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <Mail className="w-8 h-8 text-[#9ca3af]" />
              <p className="text-sm font-bold text-white">Select an Email to Read</p>
              <p className="text-xs text-[#9ca3af]">
                Choose a message from the left list or compose a new email using your keyboard or microphone.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[#252832] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSpeakSelectedEmail}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap ${
                        isSpeakingEmail
                          ? 'bg-[#f43f5e] text-white'
                          : 'bg-[#22252e] hover:bg-[#2d313d] text-white'
                      }`}
                    >
                      {isSpeakingEmail ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#ffd32a]" />}
                      <span>{isSpeakingEmail ? 'Stop' : 'Read Aloud'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setComposeTo(selectedMessage.from);
                        setComposeSubject(
                          selectedMessage.subject.startsWith('Re:')
                            ? selectedMessage.subject
                            : `Re: ${selectedMessage.subject}`
                        );
                        setComposeBody('');
                        setIsComposeOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#22252e] hover:bg-[#2d313d] text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <Reply className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Reply</span>
                    </button>

                    {selectedMessage.isUnread && (
                      <button
                        type="button"
                        onClick={() => setPendingMutation({ type: 'markRead', message: selectedMessage })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#22252e] hover:bg-[#2d313d] text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5 text-[#34d399]" />
                        <span>Mark Read</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPendingMutation({ type: 'trash', message: selectedMessage })}
                      className="px-2.5 py-1.5 rounded-lg bg-[#2c191f] hover:bg-[#3d2129] text-[#fda4af] text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Trash</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9ca3af]">
                  <span>
                    From: <strong className="text-white">{selectedMessage.from}</strong>
                  </span>
                  <span className="font-mono tabular-nums">{selectedMessage.date}</span>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto text-xs sm:text-sm text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {selectedMessage.bodyText || selectedMessage.snippet}
              </div>

              {onAskAiAboutEmail && (
                <div className="px-4 py-2.5 border-t border-[#252832] bg-[#141519] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onAskAiAboutEmail(
                        `Summarize this email from ${selectedMessage.from} (Subject: "${selectedMessage.subject}") and write a helpful reply:\n\n${selectedMessage.bodyText.slice(0, 1500)}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#2a210b] hover:bg-[#3a2e0f] border border-[#664b15] text-[#ffd32a] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI to Summarize &amp; Draft Reply</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compose Email Modal with Microphone Dictation */}
      {isComposeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsComposeOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#18191f] border border-[#2f323d] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#282b34] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-[#ffd32a]" />
                <span>Compose Email (Keyboard or Microphone)</span>
              </h3>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-lg bg-[#24262e] hover:bg-[#30333d] text-[#9ca3af] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSendClick} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full bg-[#111216] border border-[#2d3038] rounded-xl px-3 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                    Subject
                  </label>
                  <button
                    type="button"
                    onClick={() => startMicDictation('subject')}
                    className={`px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold ${
                      dictatingTarget === 'subject' && micStatus === 'listening'
                        ? 'bg-[#f43f5e] text-white'
                        : 'bg-[#22252e] hover:bg-[#2d313d] text-[#ffd32a]'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{dictatingTarget === 'subject' && micStatus === 'listening' ? 'Listening...' : 'Dictate Subject'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full bg-[#111216] border border-[#2d3038] rounded-xl px-3 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={() => startMicDictation('body')}
                    className={`px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold ${
                      dictatingTarget === 'body' && micStatus === 'listening'
                        ? 'bg-[#f43f5e] text-white'
                        : 'bg-[#22252e] hover:bg-[#2d313d] text-[#ffd32a]'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>{dictatingTarget === 'body' && micStatus === 'listening' ? 'Listening...' : 'Dictate Message'}</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write or dictate your message..."
                  className="w-full bg-[#111216] border border-[#2d3038] rounded-xl px-3 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282b34]">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#22252e] hover:bg-[#2c303c] text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review &amp; Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Destructive/Mutating Gmail Operations */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !isExecutingMutation && setPendingMutation(null)}
        >
          <div
            className="w-full max-w-md bg-[#18191f] border border-[#3a3022] rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2a210b] text-[#ffd32a] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {pendingMutation.type === 'send'
                    ? `Send email to ${pendingMutation.to}?`
                    : pendingMutation.type === 'trash'
                    ? 'Move email to Trash?'
                    : 'Mark email as read?'}
                </h3>
                <p className="text-xs text-[#9ca3af] leading-relaxed">
                  {pendingMutation.type === 'send'
                    ? `Subject: "${pendingMutation.subject}". This will send the message from your connected Gmail account.`
                    : pendingMutation.type === 'trash'
                    ? `This will move "${pendingMutation.message.subject}" from ${pendingMutation.message.from} to your Gmail Trash.`
                    : `Remove the unread label from "${pendingMutation.message.subject}" in your Gmail inbox?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282b34]">
              <button
                type="button"
                disabled={isExecutingMutation}
                onClick={() => setPendingMutation(null)}
                className="px-3.5 py-2 rounded-xl bg-[#22252e] hover:bg-[#2c303c] text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExecutingMutation}
                onClick={executeConfirmedMutation}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  pendingMutation.type === 'trash'
                    ? 'bg-[#e11d48] hover:bg-[#be123c] text-white'
                    : 'bg-[#ffd32a] hover:bg-[#fde047] text-black'
                }`}
              >
                <span>
                  {isExecutingMutation
                    ? 'Processing...'
                    : pendingMutation.type === 'send'
                    ? 'Confirm & Send'
                    : pendingMutation.type === 'trash'
                    ? 'Confirm Move to Trash'
                    : 'Confirm Mark Read'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
