import React from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Trash2, 
  Cpu, 
  Mic, 
  Check, 
  Zap, 
  Globe, 
  Bot, 
  Layers,
  Crown,
  Shield,
  DoorOpen,
  DoorClosed,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { getStoredApiKey, regenerateOwnApiKey } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  familyFriendly: boolean;
  onToggleFamilyFriendly: (active: boolean) => void;
  antiCheat: boolean;
  onToggleAntiCheat: (active: boolean) => void;
  exitAiMode: boolean;
  onToggleExitAiMode: (active: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearHistory,
  currentUser,
  onOpenAuth,
  familyFriendly,
  onToggleFamilyFriendly,
  antiCheat,
  onToggleAntiCheat,
  exitAiMode,
  onToggleExitAiMode,
}) => {
  const [selfApiKey, setSelfApiKey] = React.useState(() => getStoredApiKey());
  const [isRotatingKey, setIsRotatingKey] = React.useState(false);

  if (!isOpen) return null;

  const isOwner = currentUser?.role === 'owner' || currentUser?.email?.toLowerCase() === 'whatsupsdev9@gmail.com';

  const handleRotateSelfKey = async () => {
    setIsRotatingKey(true);
    try {
      const next = await regenerateOwnApiKey();
      setSelfApiKey(next);
    } finally {
      setIsRotatingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-[#18191d] border border-[#2e3034] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#202124] border-b border-[#2d3034] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40">
              <Zap className="w-4 h-4 fill-[#f59e0b]" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">What's Up Studio Master Settings</h3>
              <p className="text-[10px] text-[#8e8e93]">Hybrid Engine & Security Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#2b2d30] hover:bg-[#383a3e] text-[#8e8e93] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-[#e3e3e3] overflow-y-auto">
          {/* USER & OWNER STATUS */}
          <div className="p-3.5 bg-[#212328] rounded-2xl border border-[#343842] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] text-black font-bold flex items-center justify-center">
                {isOwner ? <Crown className="w-4 h-4 fill-black" /> : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">{currentUser?.email || 'Guest User'}</span>
                  {isOwner && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#3d2e0b] text-[#ffd32a] text-[9px] font-black border border-[#785915]">
                      OWNER
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#8e8e93]">
                  {isOwner ? 'Full Master Privileges (Admin & API Code Issuer)' : 'Standard Studio Access'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-2.5 py-1 rounded-xl bg-[#2e3138] hover:bg-[#3d414a] text-white text-[11px] font-semibold transition-colors"
            >
              {currentUser ? 'Switch' : 'Sign In'}
            </button>
          </div>

          {/* GET OUT OF AI SETTING */}
          <div className="p-3.5 bg-[#24171d] rounded-2xl border border-[#542131] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#ff7675]/20 text-[#ff7675]">
                  <DoorOpen className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-xs">"Get Out of AI" Mode</h4>
                  <p className="text-[10px] text-[#ff9f9e]">Exit AI mode to use the studio as a native developer tool</p>
                </div>
              </div>

              <button
                onClick={() => onToggleExitAiMode(!exitAiMode)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  exitAiMode ? 'bg-[#ff7675]' : 'bg-[#333538]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    exitAiMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-[#e0a2b0] leading-relaxed">
              When enabled, What's Up AI chat prompts are paused, turning the studio into a clean, distraction-free environment for inspecting Roblox scripts and designing GUIs manually.
            </p>
          </div>

          {/* FAMILY-FRIENDLY MODE (COPPA/KID SAFE) */}
          <div className="p-3.5 bg-[#17241d] rounded-2xl border border-[#274d39] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#2ed573]/20 text-[#2ed573]">
                  <Shield className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-xs">Family-Friendly Mode (Kid Safe)</h4>
                  <p className="text-[10px] text-[#a3e8be]">Filters mature themes, profanity, and extreme violence</p>
                </div>
              </div>

              <button
                onClick={() => onToggleFamilyFriendly(!familyFriendly)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  familyFriendly ? 'bg-[#2ed573]' : 'bg-[#333538]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    familyFriendly ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-[#a8dfc1] leading-relaxed">
              Enforces wholesome, family-friendly Roblox gameplay concepts, cartoon visual aesthetics, and blocks all inappropriate content.
            </p>
          </div>

          {/* ANTI-CHEAT SYSTEM */}
          <div className="p-3.5 bg-[#26200d] rounded-2xl border border-[#594717] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-[#ffd32a]/20 text-[#ffd32a]">
                  <Zap className="w-4 h-4 fill-[#ffd32a]" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-xs">Anti-Cheat Defense System</h4>
                  <p className="text-[10px] text-[#ffd32a]">Monitors for speed-hacks, noclip, and remote flooding</p>
                </div>
              </div>

              <button
                onClick={() => onToggleAntiCheat(!antiCheat)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  antiCheat ? 'bg-[#ffd32a]' : 'bg-[#333538]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    antiCheat ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-[#e0cf9b] leading-relaxed">
              Enforces server-authoritative validations across all generated scripts and blocks prompt exploits.
            </p>
          </div>

          {/* Autonomous Self-Generated AI Key */}
          <div className="p-3.5 bg-[#17181c] rounded-2xl border border-[#2b2d32] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Lock className="w-4 h-4 text-[#ffd32a]" />
                <span>AI Self-Created Studio Key (Gemini 4 Mind)</span>
              </div>
              <button
                type="button"
                onClick={handleRotateSelfKey}
                disabled={isRotatingKey}
                className="px-2.5 py-1 rounded-lg bg-[#2a220e] hover:bg-[#3a2e12] text-[#ffd32a] text-[10px] font-bold border border-[#5c4a16] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isRotatingKey ? 'animate-spin' : ''}`} />
                <span>Create New Key</span>
              </button>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#111215] border border-[#262930] font-mono text-[11px] text-[#ffd32a] tabular-nums select-all">
              {selfApiKey}
            </div>
            <p className="text-[11px] text-[#8e8e93]">
              Powered by Gemini 4 intelligence with adaptive GPT, Base44 web-builder, and multi-engine game dev modes. Keys are created automatically by the AI.
            </p>
          </div>

          {/* Reset History */}
          <div className="pt-2 border-t border-[#26282c] flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Reset Chat History</p>
              <p className="text-[10px] text-[#8e8e93]">Clear saved messages in this session</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear current chat conversation?')) {
                  onClearHistory();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2e1f23] hover:bg-[#3f272c] text-[#ff7675] border border-[#4d2a31] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#202124] border-t border-[#2d3034] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#8e8e93]">What's Up Studio v2.5</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-extrabold text-xs shadow-md"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
