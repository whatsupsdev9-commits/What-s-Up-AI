import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Image as ImageIcon, 
  X, 
  Zap, 
  Box, 
  Layout, 
  Gamepad2,
  Paperclip,
  Sparkles,
  HelpCircle,
  GraduationCap,
  FileSearch,
  DoorOpen,
  ArrowRight,
  Volume2,
  Smartphone
} from 'lucide-react';
import { PromptMode } from '../types';
import { RobustSpeechRecognition } from '../services/voiceService';

interface TalkBarProps {
  onSendMessage: (message: string, attachedImage?: string) => void;
  isLoading: boolean;
  activeMode: PromptMode;
  setActiveMode: (mode: PromptMode) => void;
  exitAiMode?: boolean;
  onExitAiToggle?: () => void;
}

export const TalkBar: React.FC<TalkBarProps> = ({
  onSendMessage,
  isLoading,
  activeMode,
  setActiveMode,
  exitAiMode,
  onExitAiToggle,
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionServiceRef = useRef<RobustSpeechRecognition | null>(null);
  const baseInputRef = useRef<string>('');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input, interimText]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionServiceRef.current) {
        recognitionServiceRef.current.abort();
      }
    };
  }, []);

  const startVoiceDictation = async () => {
    setSpeechError(null);
    baseInputRef.current = input;

    if (!recognitionServiceRef.current) {
      recognitionServiceRef.current = new RobustSpeechRecognition({
        onStart: () => {
          setIsRecording(true);
          setInterimText('');
          setSpeechError(null);
        },
        onResult: (text: string, isFinal: boolean) => {
          if (isFinal) {
            baseInputRef.current = baseInputRef.current
              ? `${baseInputRef.current.trim()} ${text.trim()}`
              : text.trim();
            setInput(baseInputRef.current);
            setInterimText('');
          } else {
            setInterimText(text);
          }
        },
        onError: (err: string) => {
          setSpeechError(err);
          setIsRecording(false);
          setInterimText('');
        },
        onEnd: () => {
          setIsRecording(false);
          setInterimText('');
        }
      });
    }

    const started = await recognitionServiceRef.current.start();
    if (!started) {
      setIsRecording(false);
    }
  };

  const stopVoiceDictation = () => {
    if (recognitionServiceRef.current) {
      recognitionServiceRef.current.stop();
    }
    setIsRecording(false);
    setInterimText('');
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopVoiceDictation();
    } else {
      startVoiceDictation();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setImageFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;

    if (isRecording) {
      stopVoiceDictation();
    }

    let messageToSend = input.trim();
    if (attachedImage && !messageToSend) {
      messageToSend = "Please read the words in this picture, tell me what to do, and if it's a question or test, give me the exact answer!";
    } else if (activeMode === 'web-apk' && !messageToSend.toLowerCase().includes('apk')) {
      messageToSend = `Make a Web APK website: ${messageToSend}`;
    } else if (activeMode === 'image' && !messageToSend.toLowerCase().startsWith('generate image')) {
      messageToSend = `Generate image: ${messageToSend}`;
    } else if (activeMode === 'roblox' && !messageToSend.toLowerCase().includes('roblox')) {
      messageToSend = `[Roblox Studio Luau Request]: ${messageToSend}`;
    } else if (activeMode === 'gui' && !messageToSend.toLowerCase().includes('gui')) {
      messageToSend = `[Roblox GUI Fix/Design Request]: ${messageToSend}`;
    }

    onSendMessage(messageToSend, attachedImage || undefined);
    setInput('');
    removeAttachedImage();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const setSuggestedPrompt = (prompt: string, mode?: PromptMode) => {
    setInput(prompt);
    if (mode) setActiveMode(mode);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // If in "Get Out of AI" Mode
  if (exitAiMode) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 pb-4">
        <div className="p-4 rounded-2xl bg-[#26151b] border-2 border-[#692437] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff7675]/20 text-[#ff7675] flex items-center justify-center shrink-0">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">"Get Out of AI" Mode is Active</p>
              <p className="text-[11px] text-[#ff9f9e]">
                AI prompts and chat interventions are paused so you can focus purely on Roblox Studio and Game Engine tools.
              </p>
            </div>
          </div>

          <button
            onClick={onExitAiToggle}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:opacity-95 text-black font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>Return to What's Up AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Suggestions / Quick action pills above the bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 text-xs">
        {/* Intent Understanding Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b251f] border border-[#234e34] text-[#7ee787] text-[11px] font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7ee787] animate-pulse" />
          <span>🧠 Intent Understanding Active</span>
        </div>

        {/* Zero Wi-Fi / Offline Ready Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#182333] border border-[#243f66] text-[#93c5fd] text-[11px] font-semibold shrink-0" title="The AI works with or without internet. Instant offline game knowledge is always active!">
          <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa]" />
          <span>⚡ Zero-Wi-Fi Ready</span>
        </div>

        <button
          onClick={() => setActiveMode('general')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all shrink-0 ${
            activeMode === 'general'
              ? 'bg-[#2a220e] border-[#ffd32a] text-[#ffd32a] font-medium shadow-sm'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3 fill-[#ffd32a] text-[#ffd32a]" />
          <span>Ask What's Up AI</span>
        </button>

        <button
          onClick={() => setActiveMode('web-apk')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all shrink-0 font-semibold shadow-sm ${
            activeMode === 'web-apk'
              ? 'bg-[#2a210b] border-[#ffd32a] text-[#ffd32a]'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-[#ffd32a]'
          }`}
          title="Build a Website that acts as an APK Generator with randomized APK code"
        >
          <Smartphone className="w-3 h-3 text-[#ffd32a]" />
          <span>Web APK Website</span>
        </button>

        <button
          onClick={() => setActiveMode('school')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all shrink-0 font-semibold shadow-sm ${
            activeMode === 'school'
              ? 'bg-[#172554] border-[#38bdf8] text-[#38bdf8]'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-[#38bdf8]'
          }`}
          title="Instant answers for Math, Science, English, History & Test Questions"
        >
          <GraduationCap className="w-3 h-3 text-[#38bdf8]" />
          <span>🎓 School & Homework Answers</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#4d3b14] bg-[#2a220e] text-[#ffd32a] hover:bg-[#382d12] transition-all shrink-0 font-semibold shadow-sm"
          title="Upload worksheet or quiz picture to read words and get answers"
        >
          <FileSearch className="w-3 h-3 text-[#ffd32a]" />
          <span>📷 Scan Quiz & Get Answer</span>
        </button>

        <button
          onClick={() => setActiveMode('roblox')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all shrink-0 ${
            activeMode === 'roblox'
              ? 'bg-[#3b2752] border-[#a55eea] text-[#d1a5ff] font-medium shadow-sm'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          <Box className="w-3 h-3 text-[#a55eea]" />
          <span>Roblox Studio Scripts</span>
        </button>

        <button
          onClick={() => setActiveMode('image')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all shrink-0 ${
            activeMode === 'image'
              ? 'bg-[#432328] border-[#ff7675] text-[#ff9f9e] font-medium shadow-sm'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          <ImageIcon className="w-3 h-3 text-[#ff7675]" />
          <span>AI Image Generator</span>
        </button>

        <button
          onClick={() => setActiveMode('gui')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all shrink-0 ${
            activeMode === 'gui'
              ? 'bg-[#173c3b] border-[#00cec9] text-[#55efc4] font-medium shadow-sm'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          <Layout className="w-3 h-3 text-[#00cec9]" />
          <span>Fix / Build GUIs</span>
        </button>

        <button
          onClick={() => setActiveMode('multi-engine')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-all shrink-0 ${
            activeMode === 'multi-engine'
              ? 'bg-[#3d3319] border-[#fdcb6e] text-[#ffeaa7] font-medium shadow-sm'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          <Gamepad2 className="w-3 h-3 text-[#fdcb6e]" />
          <span>Unity & Godot Code</span>
        </button>
      </div>

      {/* Main Talk Bar Container */}
      <div className={`relative bg-[#1e1f20] border rounded-2xl transition-all shadow-xl ${
        isRecording 
          ? 'border-[#f43f5e] shadow-[#f43f5e]/20 ring-2 ring-[#f43f5e]/30' 
          : 'border-[#333538] focus-within:border-[#ffd32a] focus-within:ring-2 focus-within:ring-[#ffd32a]/20'
      }`}>
        {/* Attached image preview banner with OCR Solver Highlight */}
        {attachedImage && (
          <div className="p-3 mx-2 mt-2 bg-[#252219] rounded-xl flex items-center justify-between border-2 border-[#ffd32a]/50">
            <div className="flex items-center gap-3">
              <img 
                src={attachedImage} 
                alt="Attached upload" 
                className="w-14 h-14 object-cover rounded-lg border border-[#ffd32a]/40 shadow-sm" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                    {imageFileName || 'Image Attached'}
                  </p>
                  <span className="text-[10px] bg-[#ffd32a] text-black font-extrabold px-1.5 py-0.2 rounded">
                    OCR Scanner Ready
                  </span>
                </div>
                <p className="text-[11px] text-[#ffd32a] font-medium">
                  What's Up AI will read all words in this picture, solve it, and state the answer out loud!
                </p>
              </div>
            </div>
            <button
              onClick={removeAttachedImage}
              className="p-1.5 rounded-lg bg-[#333538] hover:bg-[#404347] text-[#9ca3af] hover:text-white transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Speech Error Banner if permission or browser issue */}
        {speechError && (
          <div className="mx-2 mt-2 p-2.5 rounded-xl bg-[#3d1822] border border-[#6b2537] text-white flex items-center justify-between text-xs animate-in fade-in">
            <span className="text-[#ff9f9e] font-medium flex items-center gap-1.5">
              ⚠️ {speechError}
            </span>
            <button
              onClick={() => setSpeechError(null)}
              className="text-[#8e8e93] hover:text-white px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live speech recording banner with live word recognition */}
        {isRecording && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#f43f5e]/25 via-[#a55eea]/20 to-[#f59e0b]/20 flex items-center justify-between text-xs text-white border-b border-[#f43f5e]/40 rounded-t-2xl">
            <div className="flex items-center gap-2.5 overflow-hidden pr-2">
              <span className="w-3 h-3 rounded-full bg-[#f43f5e] animate-ping shrink-0" />
              <div className="truncate">
                <span className="font-bold text-[#ff9f9e] mr-1.5">Listening:</span>
                <span className="text-white italic">
                  {interimText || 'Speak clearly into your microphone...'}
                </span>
              </div>
            </div>
            <button
              onClick={stopVoiceDictation}
              className="px-2.5 py-1 rounded-lg bg-[#f43f5e] hover:bg-[#e11d48] text-white font-bold text-[11px] shrink-0 transition-colors shadow"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex items-end px-3 py-2.5 gap-2">
          {/* File attachment button for images/pictures */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-[#9ca3af] hover:text-[#ffd32a] hover:bg-[#282a2c] rounded-xl transition-colors mb-0.5"
            title="Attach picture (AI will read words, solve questions, or fix errors)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text input area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your voice... Speak your idea!'
                : attachedImage
                ? 'Ask anything about this picture or leave blank to solve...'
                : activeMode === 'web-apk'
                ? 'Describe your Web APK website (e.g. "Make a Web APK generator website for mobile games")...'
                : activeMode === 'school'
                ? 'Type or paste ANY school/homework question (Math, Science, History, English, Multiple Choice)...'
                : activeMode === 'image'
                ? 'Describe any image you want (e.g. "Roblox neon dragon pet icon 512x512")...'
                : activeMode === 'roblox'
                ? 'Tell What\'s Up AI what script you need (e.g. "pet that follows", "fly command", "anti cheat")...'
                : activeMode === 'gui'
                ? 'Describe your GUI or paste code to fix mobile scaling and clipping...'
                : 'Ask ANY school question, game script, or attach a picture to get the answer...'
            }
            className="w-full bg-transparent text-[#e3e3e3] placeholder-[#6e7175] text-sm focus:outline-none resize-none leading-relaxed py-1.5 max-h-[180px] font-['Plus_Jakarta_Sans']"
          />

          {/* Right Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
            {/* Talk / Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`px-2.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isRecording
                  ? 'bg-[#f43f5e] text-white animate-pulse ring-2 ring-[#f43f5e]/50 shadow-lg shadow-[#f43f5e]/30'
                  : 'text-[#ffd32a] bg-[#25231a] hover:bg-[#322d1b] border border-[#4a3e19]'
              }`}
              title={isRecording ? 'Click to stop microphone dictation' : 'Click to talk with your Microphone'}
            >
              {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
              <span className="text-[11px] font-bold hidden sm:inline">
                {isRecording ? 'Listening' : 'Mic'}
              </span>
            </button>

            {/* Send Button */}
            <button
              type="button"
              disabled={(!input.trim() && !attachedImage) || isLoading}
              onClick={() => handleSubmit()}
              className={`p-2 rounded-xl transition-all ${
                (!input.trim() && !attachedImage) || isLoading
                  ? 'bg-[#25272a] text-[#55585d] cursor-not-allowed'
                  : 'bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] text-black hover:scale-105 active:scale-95 shadow-md shadow-[#f59e0b]/30'
              }`}
              title="Send to What's Up AI"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-black" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Quick Prompt Starters */}
      <div className="flex items-center gap-2 mt-2 px-1 text-[11px] text-[#717478] overflow-x-auto no-scrollbar">
        <span className="font-semibold shrink-0 text-[#8e8e93]">Try asking:</span>
        <button
          onClick={() => setSuggestedPrompt('Make a Blox Fruits devil fruit ability script with dragon fire and cooldowns', 'roblox')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "Blox Fruits Devil Fruit move"
        </button>
        <span>•</span>
        <button
          onClick={() => setSuggestedPrompt('Recreate the DOORS Rush entity chase with light flickering and closet hiding', 'roblox')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "DOORS Rush entity script"
        </button>
        <span>•</span>
        <button
          onClick={() => setSuggestedPrompt('Create a Blade Ball curve deflection and parry timing script', 'roblox')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "Blade Ball deflection script"
        </button>
        <span>•</span>
        <button
          onClick={() => setSuggestedPrompt('Generate an image of a neon cyber dragon pet in Roblox blocky 3D style', 'image')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "See image of neon dragon"
        </button>
        <span>•</span>
        <button
          onClick={() => setSuggestedPrompt('Explain how Elden Ring stamina dodging or Minecraft block breaking works', 'general')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "All Games Knowledge"
        </button>
        <span>•</span>
        <button
          onClick={() => setSuggestedPrompt('Tell me about Kratos vs Goku vs Darth Vader and how to script their signature moves in Roblox Luau', 'general')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "Every Character Knowledge"
        </button>
        <span>•</span>
        <button
          onClick={() => setSuggestedPrompt('Make my Web APK generator website with random APK code', 'web-apk')}
          className="hover:text-[#ffd32a] hover:underline shrink-0"
        >
          "Make Web APK Website"
        </button>
      </div>
    </div>
  );
};
