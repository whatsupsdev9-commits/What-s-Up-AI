import React, { useState } from 'react';
import { 
  Zap, 
  User, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Box, 
  Layout, 
  Image as ImageIcon,
  ArrowRight,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  FileText,
  Smartphone,
  Crown,
  Lock,
  Globe
} from 'lucide-react';
import { ChatMessage as ChatMessageType, GeneratedImage, WebApkBuild } from '../types';
import { speakText, stopSpeaking } from '../services/voiceService';
import { downloadWebApkFile, downloadWebsiteHtmlFile } from '../services/webApkEngine';

interface ChatMessageProps {
  message: ChatMessageType;
  onOpenGuiVisualizer?: (guiCode?: string) => void;
  onSelectImage?: (img: GeneratedImage) => void;
  onAskFollowup?: (prompt: string) => void;
  onOpenWebApk?: (build: WebApkBuild) => void;
  isOwner?: boolean;
  apkCredits?: number;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onOpenGuiVisualizer,
  onSelectImage,
  onAskFollowup,
  onOpenWebApk,
  isOwner = false,
  apkCredits = 0,
}) => {
  const isUser = message.role === 'user';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-To-Speech: Speak the answer out loud for the user with high quality voice
  const handleSpeakAnswer = async (textToSpeak: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    await speakText(
      textToSpeak,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const downloadScriptFile = (code: string, language: string, title?: string) => {
    let extension = '.lua';
    if (language === 'luau' || language === 'lua') extension = '.luau';
    else if (language === 'csharp' || language === 'c#') extension = '.cs';
    else if (language === 'gdscript') extension = '.gd';
    else if (language === 'cpp' || language === 'c++') extension = '.cpp';
    else if (language === 'json') extension = '.json';

    const filename = `${(title || 'Script').replace(/[^a-zA-Z0-9_]/g, '_')}${extension}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to extract Direct Answer if present
  const extractDirectAnswer = (text: string) => {
    const match = text.match(/(?:🎯\s*)?DIRECT ANSWER:\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : null;
  };

  const directAnswer = !isUser ? extractDirectAnswer(message.content) : null;

  // Helper to render markdown content with syntax highlighted code blocks
  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```(lua|luau|csharp|c#|gdscript|cpp|c\+\+|json|typescript|ts|javascript|js)?\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      // Push preceding text
      if (matchIndex > lastIndex) {
        const textChunk = content.substring(lastIndex, matchIndex);
        elements.push(
          <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed space-y-2">
            {renderMarkdownText(textChunk)}
          </div>
        );
      }

      blockIndex++;
      const lang = (match[1] || 'lua').toLowerCase();
      const code = match[2].trim();
      const blockId = `block_${message.id}_${blockIndex}`;

      // Detect location
      const locMatch = code.match(/--\s*\[Location:\s*(.*?)\]/) || code.match(/\/\/\s*\[Location:\s*(.*?)\]/);
      const location = locMatch ? locMatch[1].trim() : undefined;

      const isRoblox = lang === 'lua' || lang === 'luau' || code.includes('game:GetService') || code.includes('Instance.new');
      const isGuiCode = code.includes('ScreenGui') || code.includes('Frame') || code.includes('TextButton') || code.includes('UDim2');

      elements.push(
        <div key={blockId} className="my-4 rounded-xl overflow-hidden border border-[#333538] bg-[#161719] shadow-lg">
          {/* Code block header bar */}
          <div className="bg-[#202124] px-4 py-2 border-b border-[#2d3034] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono uppercase font-semibold text-[#ffd32a] bg-[#2a220e] px-2 py-0.5 rounded border border-[#5c4a16]">
                {lang}
              </span>
              {location && (
                <span className="flex items-center gap-1 text-[#e0a82e] bg-[#2a2415] px-2 py-0.5 rounded font-mono border border-[#483c1d]">
                  <Box className="w-3 h-3 text-[#e0a82e]" />
                  <span>{location}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {isGuiCode && onOpenGuiVisualizer && (
                <button
                  onClick={() => onOpenGuiVisualizer(code)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00cec9]/20 hover:bg-[#00cec9]/30 text-[#00cec9] font-medium transition-colors border border-[#00cec9]/40"
                  title="Test & Preview in Roblox GUI Visualizer"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Preview GUI</span>
                </button>
              )}

              <button
                onClick={() => downloadScriptFile(code, lang, location || `Roblox_Script_${blockIndex}`)}
                className="p-1.5 rounded hover:bg-[#2c2e33] text-[#9ca3af] hover:text-white transition-colors"
                title="Download script file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => copyToClipboard(code, blockId)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#2a2c30] hover:bg-[#34373c] text-[#e3e3e3] transition-colors"
                title="Copy script code"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#55efc4]" />
                    <span className="text-[#55efc4]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Studio Explorer visual hint */}
          {isRoblox && location && (
            <div className="px-4 py-1.5 bg-[#191a1d] border-b border-[#26282c] flex items-center gap-2 text-[11px] text-[#9ca3af]">
              <span className="text-[#e3e3e3] font-semibold">Roblox Studio Explorer:</span>
              <span className="font-mono text-[#ffd32a]">{location}</span>
              <span className="text-[#6b7280]">• Place here for scripts to execute properly</span>
            </div>
          )}

          {/* Actual Code Display */}
          <div className="p-4 font-mono text-xs overflow-x-auto text-[#d4d4d4] leading-relaxed select-text">
            <pre className="tab-4">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      );

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < content.length) {
      elements.push(
        <div key={`text_${lastIndex}`} className="whitespace-pre-wrap leading-relaxed space-y-2 mt-2">
          {renderMarkdownText(content.substring(lastIndex))}
        </div>
      );
    }

    return elements;
  };

  // Basic markdown header/bold renderer
  const renderMarkdownText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-white mt-3 mb-1 flex items-center gap-2">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-extrabold text-white mt-4 mb-2">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-[#d4d4d8] my-0.5">
            {line.substring(2)}
          </li>
        );
      }

      // Format bold text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-sm text-[#d4d4d8] my-1">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="font-mono bg-[#282a2c] text-[#ffd32a] px-1.5 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`py-5 px-4 sm:px-6 transition-colors ${isUser ? 'bg-[#18191b]/50' : 'bg-transparent'}`}>
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[#2e3034] flex items-center justify-center text-white border border-[#3e4247]">
              <User className="w-4 h-4 text-[#9ca3af]" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center text-black shadow-md shadow-[#f59e0b]/30">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header row: Author + Timestamp + Speak Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white">
                {isUser ? 'You' : "What's Up AI"}
              </span>
              {!isUser && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2a220e] text-[#ffd32a] border border-[#5c4a16] font-medium flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-[#ffd32a]" />
                  {message.model === 'local-offline-engine' ? 'Local Offline Mind' : 'Gemini • GPT • Base44'}
                </span>
              )}
              <span className="text-[11px] text-[#6b7280]">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Read Aloud / Speak Answer Button */}
            {!isUser && (
              <button
                onClick={() => handleSpeakAnswer(message.content)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  isSpeaking
                    ? 'bg-[#f43f5e] text-white animate-pulse'
                    : 'bg-[#212328] hover:bg-[#2b2e35] text-[#d4d4d8] hover:text-white border border-[#343842]'
                }`}
                title={isSpeaking ? 'Stop voice reading' : 'Read answer out loud (Speech)'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#ffd32a]" />}
                <span className="text-[11px]">{isSpeaking ? 'Stop Audio' : 'Say Answer'}</span>
              </button>
            )}
          </div>

          {/* User Attached Image (Multimodal / OCR) */}
          {message.attachedImage && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between max-w-xs sm:max-w-md">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#ffd32a]">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Visual Image Scanner Input</span>
                </span>
                <span className="text-[10px] text-[#8e8e93]">Click image to expand</span>
              </div>
              <div 
                className="relative group cursor-pointer max-w-xs sm:max-w-md"
                onClick={() => onSelectImage?.({
                  id: 'attached_' + message.id,
                  url: message.attachedImage!,
                  prompt: 'Attached Image Input',
                  aspectRatio: 'Original',
                  width: 1024,
                  height: 1024,
                  timestamp: message.timestamp
                })}
              >
                <img
                  src={message.attachedImage}
                  alt="Uploaded picture"
                  className="max-w-full max-h-80 rounded-2xl object-contain border-2 border-[#383a42] group-hover:border-[#ffd32a] bg-black/60 shadow-lg transition-all"
                />
                <div className="absolute bottom-2 right-2 p-1.5 bg-black/75 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white flex items-center gap-1 text-[10px] font-bold">
                  <Maximize2 className="w-3 h-3 text-[#ffd32a]" />
                  <span>View Fullsize</span>
                </div>
              </div>
            </div>
          )}

          {/* Highlighted Direct Answer Banner (if detected) */}
          {directAnswer && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#2c220f] via-[#211a0c] to-[#18191d] border-2 border-[#ffd32a] text-white shadow-lg space-y-1 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#ffd32a] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 fill-[#ffd32a]" />
                  <span>Direct Answer</span>
                </span>
                <button
                  onClick={() => handleSpeakAnswer(directAnswer)}
                  className="text-[10px] text-[#ffd32a] hover:underline font-semibold flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  Speak Answer
                </button>
              </div>
              <p className="text-sm font-bold text-white leading-relaxed">{directAnswer}</p>
            </div>
          )}

          {/* Main text & code rendering */}
          <div className="text-sm">
            {renderFormattedContent(message.content)}
          </div>

          {/* Inline Generated Images */}
          {message.generatedImages && message.generatedImages.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#26282c] space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ff7675]">
                <ImageIcon className="w-4 h-4" />
                <span>Generated Artwork & Assets ({message.generatedImages.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {message.generatedImages.map((img) => (
                  <div 
                    key={img.id} 
                    className="group relative rounded-xl overflow-hidden border border-[#333538] bg-[#161719] shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-64 object-cover cursor-pointer"
                      onClick={() => onSelectImage?.(img)}
                    />
                    <div className="p-3 bg-[#1e1f20] border-t border-[#2b2d30] flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-white font-medium truncate">{img.sourceTitle || img.prompt}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#8e8e93]">
                          {img.source === 'photo' ? (
                            <span className="text-[#60a5fa] font-bold">📸 Real Photo</span>
                          ) : (
                            <span className="text-[#34d399] font-bold">✨ Ultra-Realistic</span>
                          )}
                          <span>• {img.aspectRatio}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onSelectImage?.(img)}
                          className="p-1.5 rounded-lg bg-[#2a2c30] hover:bg-[#34373c] text-white transition-colors"
                          title="View Fullscreen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={img.url}
                          download={`ai_image_${img.id}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-[#2a2c30] hover:bg-[#34373c] text-white transition-colors"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline Web APK Website & Generator Card */}
          {message.webApkData && (
            <div className="mt-4 rounded-2xl border border-[#323640] bg-[#16181d] overflow-hidden shadow-lg">
              <div className="px-4 py-3 bg-[#1d1f26] border-b border-[#2b2e38] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] text-black flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{message.webApkData.appName}</p>
                    <p className="text-[11px] font-mono text-[#ffd32a] tabular-nums">
                      {message.webApkData.randomBuildCode} • {message.webApkData.packageName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <button
                      onClick={() => onOpenWebApk?.(message.webApkData!)}
                      className="px-3 py-1.5 rounded-lg bg-[#2a210b] hover:bg-[#3a2e0f] border border-[#785915] text-[#ffd32a] text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap tabular-nums"
                    >
                      <Crown className="w-3.5 h-3.5 fill-[#ffd32a]" />
                      <span>Owner: Unlimited Credits (∞)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenWebApk?.(message.webApkData!)}
                      className="px-3 py-1.5 rounded-lg bg-[#2b1a20] hover:bg-[#3b222a] border border-[#6b2537] text-[#fda4af] text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap tabular-nums"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{apkCredits > 0 ? `${apkCredits} Credits Ready` : 'Pay for Credits to Export APK'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#0e1015] border-b border-[#2b2e38]">
                <iframe
                  title={message.webApkData.appName}
                  srcDoc={message.webApkData.websiteHtml}
                  sandbox="allow-scripts allow-downloads allow-forms"
                  className="w-full h-72 border-0"
                />
              </div>

              <div className="px-4 py-2.5 bg-[#191b21] flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-[11px] text-[#9ca3af] font-mono tabular-nums">
                  v{message.webApkData.versionName} (code {message.webApkData.versionCode}) • Key: {message.webApkData.keystoreAlias}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadWebsiteHtmlFile(message.webApkData!)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#242730] hover:bg-[#2f333f] text-white text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Website HTML</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isOwner && apkCredits < 1) {
                        onOpenWebApk?.(message.webApkData!);
                      } else {
                        downloadWebApkFile(message.webApkData!);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#ffd32a] hover:bg-[#fde047] text-black text-[11px] font-bold flex items-center gap-1 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{!isOwner && apkCredits < 1 ? 'Unlock .APK' : 'Download .APK'}</span>
                  </button>
                  <button
                    onClick={() => onOpenWebApk?.(message.webApkData!)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#252832] hover:bg-[#323642] text-[#ffd32a] text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Open APK Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Follow-up chips for assistant replies */}
          {!isUser && onAskFollowup && (
            <div className="flex items-center gap-2 pt-2 flex-wrap text-xs text-[#8e8e93]">
              <span className="text-[11px]">Next:</span>
              <button
                onClick={() => onAskFollowup('Can you add sounds and animations to this script?')}
                className="px-2 py-0.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#9ca3af] hover:text-white border border-[#333538] transition-colors"
              >
                + Add sounds & animations
              </button>
              <button
                onClick={() => onAskFollowup('Explain how to test this in Roblox Studio step-by-step')}
                className="px-2 py-0.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#9ca3af] hover:text-white border border-[#333538] transition-colors"
              >
                + Step-by-step testing guide
              </button>
              <button
                onClick={() => onAskFollowup('Convert this script to Unity C# or Godot')}
                className="px-2 py-0.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#9ca3af] hover:text-white border border-[#333538] transition-colors"
              >
                + Convert to Unity / Godot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
