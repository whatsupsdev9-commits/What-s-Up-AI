import React, { useState } from 'react';
import { 
  Box, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Layers, 
  Tag, 
  Send, 
  Code, 
  ChevronRight,
  Zap,
  Layout,
  FolderTree
} from 'lucide-react';
import { ROBLOX_TEMPLATES } from '../data/robloxScripts';
import { RobloxTemplate } from '../types';

interface RobloxStudioHubProps {
  onLoadScriptToChat: (scriptName: string, promptText: string) => void;
  onOpenGuiPreview: (code: string) => void;
}

export const RobloxStudioHub: React.FC<RobloxStudioHubProps> = ({
  onLoadScriptToChat,
  onOpenGuiPreview,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTemplate, setActiveTemplate] = useState<RobloxTemplate>(ROBLOX_TEMPLATES[0]);
  const [copied, setCopied] = useState(false);

  const categories = ['All', 'Backend & Data', 'GUI & HUD', 'Combat & Weapons', 'Systems & Mechanics', 'Admin & Utility'];

  const filtered = ROBLOX_TEMPLATES.filter((tpl) => {
    const matchesSearch = 
      tpl.title.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description.toLowerCase().includes(search.toLowerCase()) ||
      tpl.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTemplate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeTemplate.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTemplate.id}.luau`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#1f1e2c] via-[#211a2f] to-[#171e2e] border border-[#3b3452] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#a55eea]/20 text-[#a55eea] border border-[#a55eea]/40">
              <Box className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Roblox Studio Script Vault (All Roblox Games Knowledge)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#3b2752] text-[#d1a5ff] text-xs font-semibold border border-[#5d3b84]">
              All Games & New Releases
            </span>
          </div>
          <p className="text-xs text-[#a0a0a8] mt-1.5 max-w-2xl leading-relaxed">
            Battle-tested Luau scripts and mechanics from <strong>all Roblox games in existence</strong>: Blox Fruits Devil Fruits, DOORS Rush entities, Blade Ball deflection, Pet Simulator 99, Fisch, Sol's RNG, and new games!
          </p>
        </div>

        <button
          onClick={() => onLoadScriptToChat('Custom Roblox Game Script', 'Can you write a custom Roblox Studio script for my game with safe pcall and modern Luau?')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#a55eea] to-[#f59e0b] hover:opacity-95 text-white text-xs font-bold transition-transform active:scale-95 shadow-lg shadow-[#f59e0b]/20 self-start md:self-auto shrink-0"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Ask What's Up AI for Custom Script</span>
        </button>
      </div>

      {/* Explorer Placement Quick Guide */}
      <div className="bg-[#18191d] border border-[#2b2d32] p-4 rounded-xl flex items-center gap-3 overflow-x-auto text-xs text-[#9ca3af]">
        <span className="font-bold text-white shrink-0 flex items-center gap-1.5">
          <FolderTree className="w-4 h-4 text-[#a55eea]" />
          <span>Roblox Studio Placements:</span>
        </span>
        <span className="bg-[#24262c] px-2 py-1 rounded text-[#e0a82e] border border-[#3c3622] shrink-0 font-mono">
          ServerScriptService (Backend)
        </span>
        <span className="bg-[#24262c] px-2 py-1 rounded text-[#58a6ff] border border-[#23354f] shrink-0 font-mono">
          StarterPlayerScripts (Client Controls)
        </span>
        <span className="bg-[#24262c] px-2 py-1 rounded text-[#00cec9] border border-[#1b3f3e] shrink-0 font-mono">
          StarterGui (UI & HUD)
        </span>
        <span className="bg-[#24262c] px-2 py-1 rounded text-[#e879f9] border border-[#44234b] shrink-0 font-mono">
          ReplicatedStorage (RemoteEvents)
        </span>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripts by title, tag, or mechanic..."
            className="w-full bg-[#1e1f20] border border-[#2e3034] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#717478] focus:outline-none focus:border-[#a55eea]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#3b2752] border-[#a55eea] text-[#d1a5ff] font-semibold'
                  : 'bg-[#1e1f20] border-[#2e3034] text-[#8e8e93] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Script List on Left, Active Script Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Script Cards (4 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[680px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8e8e93] bg-[#1e1f20] rounded-xl border border-[#2e3034]">
              No scripts match your search. Try another keyword!
            </div>
          ) : (
            filtered.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setActiveTemplate(tpl)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeTemplate.id === tpl.id
                    ? 'bg-[#252033] border-[#a55eea] shadow-lg shadow-[#a55eea]/10'
                    : 'bg-[#1e1f20] border-[#2e3034] hover:border-[#3e424b]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">{tpl.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161719] text-[#a55eea] border border-[#3b2752]">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#8e8e93] line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px]">
                  <span className="font-mono text-[#e0a82e] truncate max-w-[200px]">{tpl.location}</span>
                  <span className="text-[#a55eea] flex items-center gap-0.5">
                    View Code <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Code Viewer & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-[#161719] border border-[#2e3034] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header Bar */}
          <div className="bg-[#202124] p-4 border-b border-[#2d3034] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-white">{activeTemplate.title}</h3>
              <p className="text-xs text-[#e0a82e] font-mono mt-0.5 flex items-center gap-1">
                <Box className="w-3.5 h-3.5" />
                <span>Placement: {activeTemplate.location}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTemplate.category === 'GUI & HUD' && (
                <button
                  onClick={() => onOpenGuiPreview(activeTemplate.code)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00cec9]/20 hover:bg-[#00cec9]/30 text-[#00cec9] text-xs font-semibold transition-colors border border-[#00cec9]/40"
                  title="Simulate in GUI Visualizer"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Preview GUI</span>
                </button>
              )}

              <button
                onClick={handleDownload}
                className="p-1.5 rounded-lg bg-[#2b2d30] hover:bg-[#34373c] text-white text-xs transition-colors"
                title="Download .luau script"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b2d30] hover:bg-[#34373c] text-white text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#55efc4]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => onLoadScriptToChat(activeTemplate.title, `Can you explain how this "${activeTemplate.title}" works line-by-line and show how to extend it for my game?\n\n\`\`\`lua\n${activeTemplate.code}\n\`\`\``)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#a55eea] hover:bg-[#b86bff] text-white text-xs font-bold transition-all shadow"
                title="Discuss with What's Up AI"
              >
                <Send className="w-3 h-3" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          {/* Description & Tags */}
          <div className="px-4 py-2.5 bg-[#1b1c1f] border-b border-[#2d3034] text-xs text-[#9ca3af] flex items-center justify-between">
            <span>{activeTemplate.description}</span>
            <div className="flex items-center gap-1 shrink-0">
              {activeTemplate.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-[#252830] text-[10px] text-[#70a1ff]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Code Body */}
          <div className="p-4 font-mono text-xs overflow-x-auto text-[#d4d4d4] leading-relaxed max-h-[520px] select-text">
            <pre className="tab-4">
              <code>{activeTemplate.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
