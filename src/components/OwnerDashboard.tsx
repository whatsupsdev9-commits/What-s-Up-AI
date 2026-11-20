import React, { useState } from 'react';
import { 
  Crown, 
  ShieldCheck, 
  Key, 
  UserPlus, 
  Link, 
  Copy, 
  Check, 
  Trash2, 
  Lock, 
  Sparkles, 
  AlertTriangle,
  UserCheck,
  Shield,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import { UserProfile, ApiKeyLink } from '../types';

interface OwnerDashboardProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  apiKeyLinks: ApiKeyLink[];
  onGenerateLink: (label: string, days: number) => ApiKeyLink;
  onRevokeLink: (id: string) => void;
  adminUsers: { id: string; email: string; name: string; role: 'admin' | 'member'; addedAt: number }[];
  onAddAdmin: (email: string, name: string) => void;
  onRemoveAdmin: (id: string) => void;
  familyFriendly: boolean;
  onToggleFamilyFriendly: (active: boolean) => void;
  antiCheat: boolean;
  onToggleAntiCheat: (active: boolean) => void;
  exitAiMode: boolean;
  onToggleExitAiMode: (active: boolean) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentUser,
  onOpenAuth,
  apiKeyLinks,
  onGenerateLink,
  onRevokeLink,
  adminUsers,
  onAddAdmin,
  onRemoveAdmin,
  familyFriendly,
  onToggleFamilyFriendly,
  antiCheat,
  onToggleAntiCheat,
  exitAiMode,
  onToggleExitAiMode,
}) => {
  const isOwner = currentUser?.role === 'owner' || currentUser?.email?.toLowerCase() === 'whatsupsdev9@gmail.com';

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkDuration, setLinkDuration] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState<ApiKeyLink | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const label = linkLabel.trim() || 'Game Dev Partner Key';
    const link = onGenerateLink(label, linkDuration);
    setJustGenerated(link);
    setLinkLabel('');
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    onAddAdmin(newAdminEmail.trim(), newAdminName.trim() || newAdminEmail.split('@')[0]);
    setNewAdminEmail('');
    setNewAdminName('');
  };

  // If user is not logged in as the Owner
  if (!isOwner) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 my-8">
        <div className="bg-[#18191d] border border-[#3e3422] rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center mx-auto shadow-lg shadow-[#f59e0b]/20">
            <Lock className="w-8 h-8 text-black" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              <span>Owner Access Restricted</span>
              <Crown className="w-5 h-5 text-[#ffd32a] fill-[#ffd32a]" />
            </h2>
            <p className="text-xs text-[#9ca3af] mt-1.5 max-w-md mx-auto">
              This master panel is exclusively reserved for the Owner account: <strong className="text-white">whatsupsdev9@gmail.com</strong>.
            </p>
          </div>

          <div className="p-4 bg-[#231d10] border border-[#544116] rounded-2xl text-left text-xs text-[#e5d4a1] space-y-1.5 max-w-md mx-auto">
            <p className="font-bold text-[#ffd32a] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#ffd32a]" />
              <span>Owner Privileges:</span>
            </p>
            <p className="text-[11px] text-[#cfb776]">• Grant & manage Admin privileges to other developers</p>
            <p className="text-[11px] text-[#cfb776]">• Generate authorized API Key redemption links and codes</p>
            <p className="text-[11px] text-[#cfb776]">• Toggle master Anti-Cheat, Family-Friendly, and Exit AI settings</p>
          </div>

          <button
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:opacity-95 text-black font-extrabold text-xs transition-all shadow-lg shadow-[#f59e0b]/20 active:scale-95 inline-flex items-center gap-2"
          >
            <Crown className="w-4 h-4 fill-black" />
            <span>Sign In as whatsupsdev9@gmail.com</span>
          </button>
        </div>
      </div>
    );
  }

  // Owner View
  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#291f09] via-[#211b10] to-[#17181c] border border-[#5c4413] p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#ffd32a]/20 text-[#ffd32a] border border-[#ffd32a]/40 shadow-inner">
              <Crown className="w-6 h-6 fill-[#ffd32a]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                  What's Up Studio Owner Control
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#3d2e0b] text-[#ffd32a] text-xs font-bold border border-[#785915] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 fill-[#ffd32a]" />
                  Verified Master
                </span>
              </div>
              <p className="text-xs text-[#a3946e] mt-0.5">
                Logged in as <strong>whatsupsdev9@gmail.com</strong> • Only you can issue API key links & appoint admins.
              </p>
            </div>
          </div>
        </div>

        {/* Global Security Controls */}
        <div className="flex items-center gap-2 bg-[#1b170c] p-2 rounded-2xl border border-[#4d3810] self-start sm:self-auto">
          {/* Family Friendly Toggle */}
          <button
            onClick={() => onToggleFamilyFriendly(!familyFriendly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              familyFriendly
                ? 'bg-[#1b3d2b] text-[#7ee787] border border-[#2b6441] shadow-sm'
                : 'bg-[#252014] text-[#8e8e93] border border-transparent hover:text-white'
            }`}
            title="Toggle Family-Friendly COPPA Mode"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Family-Friendly: {familyFriendly ? 'ON' : 'OFF'}</span>
          </button>

          {/* Anti-Cheat Toggle */}
          <button
            onClick={() => onToggleAntiCheat(!antiCheat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              antiCheat
                ? 'bg-[#2e260e] text-[#ffd32a] border border-[#695116] shadow-sm'
                : 'bg-[#252014] text-[#8e8e93] border border-transparent hover:text-white'
            }`}
            title="Toggle Anti-Cheat Security"
          >
            <Zap className="w-3.5 h-3.5 fill-[#ffd32a]" />
            <span>Anti-Cheat: {antiCheat ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {/* Exit AI Mode Toggle */}
          <button
            onClick={() => onToggleExitAiMode(!exitAiMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              exitAiMode
                ? 'bg-[#3d1822] text-[#ff7675] border border-[#6b2537] shadow-sm'
                : 'bg-[#252014] text-[#8e8e93] border border-transparent hover:text-white'
            }`}
            title="Toggle 'Get Out of AI' Studio Only Mode"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Get Out of AI: {exitAiMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Two Columns: Admin Manager & API Key Link Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: API KEY LINK & CODE GENERATOR (ONLY OWNER) */}
        <div className="bg-[#18191d] border border-[#2e3034] rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#ffd32a]/20 text-[#ffd32a]">
                <Key className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">Generate API Key Link / Code</h3>
                <p className="text-[10px] text-[#8e8e93]">Only you (the Owner) can issue access links</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#3d2e0b] text-[#ffd32a] text-[10px] font-bold border border-[#785915]">
              Owner Protected
            </span>
          </div>

          {/* Generator Form */}
          <form onSubmit={handleCreateLink} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-white">Link Description / Recipient:</label>
              <input
                type="text"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="e.g. Lead Programmer Key or Discord Team Pass"
                className="w-full mt-1 bg-[#131417] border border-[#2c2f35] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffd32a]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-white">Expiration:</label>
                <select
                  value={linkDuration}
                  onChange={(e) => setLinkDuration(Number(e.target.value))}
                  className="w-full mt-1 bg-[#131417] border border-[#2c2f35] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffd32a]"
                >
                  <option value={1}>24 Hours</option>
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={365}>1 Year (Permanent)</option>
                </select>
              </div>

              <div className="flex-1 flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:opacity-95 text-black font-extrabold text-xs transition-all shadow-md shadow-[#f59e0b]/20 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Link className="w-3.5 h-3.5 text-black" />
                  <span>Generate Link & Code</span>
                </button>
              </div>
            </div>
          </form>

          {/* Newly Created Link Toast */}
          {justGenerated && (
            <div className="p-3.5 rounded-2xl bg-[#261f0f] border border-[#5c4515] space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-[#ffd32a]">
                <span>Generated API Access Code:</span>
                <span className="font-mono text-white text-xs">{justGenerated.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={justGenerated.url}
                  className="w-full bg-[#15120a] border border-[#4d3911] rounded-xl px-2.5 py-1.5 text-xs text-[#ffd32a] font-mono select-all"
                />
                <button
                  onClick={() => handleCopy(justGenerated.url, 'new_link')}
                  className="px-3 py-1.5 rounded-xl bg-[#ffd32a] hover:bg-[#ffe066] text-black font-bold text-xs shrink-0 flex items-center gap-1 transition-colors"
                >
                  {copiedId === 'new_link' ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                  <span>{copiedId === 'new_link' ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* List of Active Issued Links */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[#8e8e93] flex items-center justify-between">
              <span>Active Issued Keys & Links ({apiKeyLinks.length})</span>
              <span className="text-[10px] text-[#7ee787]">Encrypted</span>
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {apiKeyLinks.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#141517] border border-[#26282c] text-center text-xs text-[#6b7280]">
                  No active generated links yet. Generate one above!
                </div>
              ) : (
                apiKeyLinks.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#1d1f24] border border-[#2f323a] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white truncate">{item.label}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#8e8e93] font-mono mt-0.5">
                        <span className="text-[#ffd32a]">Code: {item.code}</span>
                        <span>•</span>
                        <span>Expires in {item.expiresInDays}d</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(item.url, item.id)}
                        className="p-1.5 rounded-lg bg-[#2b2e36] hover:bg-[#383c46] text-white transition-colors"
                        title="Copy Key Link"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-[#55efc4]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onRevokeLink(item.id)}
                        className="p-1.5 rounded-lg bg-[#301f23] hover:bg-[#40262b] text-[#ff7675] transition-colors"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: ADMIN MANAGEMENT (GIVE ADMIN PRIVILEGES) */}
        <div className="bg-[#18191d] border border-[#2e3034] rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#388bfd]/20 text-[#388bfd]">
                <UserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">Give & Manage Admin</h3>
                <p className="text-[10px] text-[#8e8e93]">Grant administrative powers to your developers</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#1b263b] text-[#58a6ff] text-[10px] font-bold border border-[#2b3a55]">
              Role Access Control
            </span>
          </div>

          {/* Add Admin Form */}
          <form onSubmit={handleCreateAdmin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-white">Admin Email:</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="developer@gmail.com"
                  className="w-full mt-1 bg-[#131417] border border-[#2c2f35] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#388bfd]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white">Admin Name:</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Lead Dev Alex"
                  className="w-full mt-1 bg-[#131417] border border-[#2c2f35] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#388bfd]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-gradient-to-r from-[#388bfd] to-[#7952e4] hover:opacity-95 text-white font-extrabold text-xs transition-all shadow-md shadow-[#388bfd]/20 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-white" />
              <span>Grant Admin Role</span>
            </button>
          </form>

          {/* Admin List */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[#8e8e93] flex items-center justify-between">
              <span>Studio Administrators ({adminUsers.length + 1})</span>
              <span className="text-[10px] text-[#ffd32a]">Owner Enforced</span>
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Permanent Owner Row */}
              <div className="p-3 rounded-2xl bg-[#29200d] border border-[#574116] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#ffd32a] text-black font-bold flex items-center justify-center">
                    <Crown className="w-4 h-4 fill-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white">whatsupsdev9@gmail.com</p>
                      <span className="text-[10px] bg-[#ffd32a] text-black font-black px-1.5 py-0.2 rounded-full">
                        OWNER
                      </span>
                    </div>
                    <p className="text-[10px] text-[#cfb776]">What's Up Studio Founder & Master</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#ffd32a] font-semibold">Immutable</span>
              </div>

              {/* Added Admins */}
              {adminUsers.map((admin) => (
                <div
                  key={admin.id}
                  className="p-3 rounded-2xl bg-[#1d1f24] border border-[#2f323a] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#388bfd]/20 text-[#388bfd] font-bold flex items-center justify-center">
                      {admin.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white">{admin.name}</p>
                        <span className="text-[9px] bg-[#1e2a42] text-[#70a1ff] font-bold px-1.5 py-0.2 rounded-full border border-[#2c3d61]">
                          ADMIN
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8e8e93]">{admin.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveAdmin(admin.id)}
                    className="p-1.5 rounded-lg bg-[#301f23] hover:bg-[#40262b] text-[#ff7675] transition-colors"
                    title="Revoke Admin Rights"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
