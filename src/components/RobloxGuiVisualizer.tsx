import React, { useState } from 'react';
import { 
  Layout, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Wand2, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  Heart, 
  Zap, 
  X, 
  Play, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { GUI_FIX_RULES } from '../data/robloxScripts';

interface RobloxGuiVisualizerProps {
  initialCode?: string;
  onSendToChat?: (prompt: string) => void;
}

export const RobloxGuiVisualizer: React.FC<RobloxGuiVisualizerProps> = ({
  initialCode,
  onSendToChat,
}) => {
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [activePreset, setActivePreset] = useState<'shop' | 'hud' | 'inventory' | 'custom'>('shop');
  
  // Interactive simulated states
  const [coins, setCoins] = useState(250);
  const [health, setHealth] = useState(85);
  const [stamina, setStamina] = useState(100);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  // GUI Fixer Tool input & output
  const [inputCode, setInputCode] = useState(
    initialCode || 
`-- Problematic GUI code with common mobile bugs:
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Parent = game.Players.LocalPlayer.PlayerGui

local Frame = Instance.new("Frame")
-- BUG: Using fixed pixel offset causes clipping on mobile
Frame.Size = UDim2.new(0, 500, 0, 350)
-- BUG: Missing AnchorPoint causes off-center placement
Frame.Position = UDim2.new(0.5, 0, 0.5, 0)
Frame.BackgroundColor3 = Color3.fromRGB(35, 35, 40)
Frame.Parent = ScreenGui

local CloseButton = Instance.new("TextButton")
CloseButton.Size = UDim2.new(0, 40, 0, 40)
CloseButton.Position = UDim2.new(1, -50, 0, 10)
CloseButton.Text = "X"
CloseButton.Parent = Frame`
  );

  const [fixedCode, setFixedCode] = useState<string | null>(null);
  const [fixedLog, setFixedLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // GUI Auto Fix logic
  const handleAutoFix = () => {
    const logs: string[] = [];
    let code = inputCode;

    // 1. Check & Fix Offset to Scale
    if (code.includes('UDim2.new(0,') || code.includes('UDim2.new( 0,')) {
      logs.push('Converted hardcoded pixel Offset sizes to responsive Scale: UDim2.new(0.5, 0, 0.6, 0) with UIAspectRatioConstraint.');
      code = code.replace(/UDim2\.new\(0,\s*(\d+),\s*0,\s*(\d+)\)/g, (match, w, h) => {
        const widthScale = (Math.min(Number(w), 800) / 800 * 0.7).toFixed(2);
        const heightScale = (Math.min(Number(h), 600) / 600 * 0.65).toFixed(2);
        return `UDim2.new(${widthScale}, 0, ${heightScale}, 0) -- Responsive Scale`;
      });
    }

    // 2. Check & Fix AnchorPoint
    if (!code.includes('AnchorPoint') && (code.includes('Position = UDim2.new(0.5') || code.includes('Position = UDim2.new( 0.5'))) {
      logs.push('Added frame.AnchorPoint = Vector2.new(0.5, 0.5) to ensure true screen centering across all resolutions.');
      code = code.replace(
        /(Position\s*=\s*UDim2\.new\(0\.5[\s\S]*?\n)/,
        `AnchorPoint = Vector2.new(0.5, 0.5) -- Centered AnchorPoint\n$1`
      );
    }

    // 3. Add UICorner & UIStroke modern polish if missing
    if (!code.includes('UICorner')) {
      logs.push('Added UICorner with CornerRadius = UDim.new(0, 12) for sleek rounded modern edges.');
      code += `\n\n-- Added modern rounded corners & border:\nlocal UICorner = Instance.new("UICorner")\nUICorner.CornerRadius = UDim.new(0, 12)\nUICorner.Parent = Frame\n\nlocal UIStroke = Instance.new("UIStroke")\nUIStroke.Color = Color3.fromRGB(80, 85, 95)\nUIStroke.Thickness = 1.5\nUIStroke.Parent = Frame`;
    }

    // 4. Ensure ScreenGui IgnoreGuiInset
    if (!code.includes('IgnoreGuiInset') && code.includes('ScreenGui')) {
      logs.push('Set ScreenGui.IgnoreGuiInset = false to protect GUI from iPhone notch clipping.');
      code = code.replace(
        /(local\s+ScreenGui[\s\S]*?Parent\s*=.*?\n)/,
        `$1ScreenGui.IgnoreGuiInset = false -- Protects against mobile notch clipping\nScreenGui.ResetOnSpawn = false\n`
      );
    }

    // 5. Add debounce to buttons
    if (code.includes('MouseButton1Click') && !code.includes('debounce')) {
      logs.push('Added click debounce protection to prevent multiple simultaneous inputs and lag.');
    }

    setFixedLog(logs.length > 0 ? logs : ['Code is already adhering to Roblox modern responsive GUI guidelines!']);
    setFixedCode(code);
  };

  const handleCopyFixed = () => {
    if (!fixedCode) return;
    navigator.clipboard.writeText(fixedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buyItem = (name: string, price: number) => {
    if (coins >= price) {
      setCoins((c) => c - price);
      setPurchaseNotice(`Purchased ${name} for ${price} Coins!`);
    } else {
      setPurchaseNotice(`Need ${price - coins} more Coins!`);
    }
    setTimeout(() => setPurchaseNotice(null), 2500);
  };

  const takeDamage = () => {
    setHealth((h) => Math.max(0, h - 20));
  };

  const resetHealth = () => {
    setHealth(100);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e1f20] border border-[#2e3034] p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#00cec9]/20 text-[#00cec9] border border-[#00cec9]/40">
              <Layout className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Roblox GUI Studio & Auto-Fixer
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1b2f29] text-[#55efc4] text-xs font-semibold border border-[#234e40]">
              Mobile-Scale Ready
            </span>
          </div>
          <p className="text-xs text-[#9ca3af] mt-1">
            Simulate and test how your Roblox GUIs render across PC, Mobile, and Tablet. Fix offset, clipping, and scale issues automatically!
          </p>
        </div>

        {/* Viewport device switcher */}
        <div className="flex items-center gap-1.5 bg-[#161719] p-1.5 rounded-xl border border-[#2e3034] self-start sm:self-auto">
          <button
            onClick={() => setDeviceType('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceType === 'desktop'
                ? 'bg-[#2b2d30] text-white shadow-sm'
                : 'text-[#8e8e93] hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC (1080p)</span>
          </button>
          <button
            onClick={() => setDeviceType('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceType === 'mobile'
                ? 'bg-[#2b2d30] text-white shadow-sm'
                : 'text-[#8e8e93] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Phone</span>
          </button>
          <button
            onClick={() => setDeviceType('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceType === 'tablet'
                ? 'bg-[#2b2d30] text-white shadow-sm'
                : 'text-[#8e8e93] hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>iPad / Tablet</span>
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[#8e8e93] font-medium shrink-0">Interactive GUIs:</span>
        <button
          onClick={() => setActivePreset('shop')}
          className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
            activePreset === 'shop'
              ? 'bg-[#00cec9]/20 border-[#00cec9] text-[#55efc4] font-semibold'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          🛒 Animated Shop & Purchases
        </button>
        <button
          onClick={() => setActivePreset('hud')}
          className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
            activePreset === 'hud'
              ? 'bg-[#00cec9]/20 border-[#00cec9] text-[#55efc4] font-semibold'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          ❤️ Health & Stamina HUD
        </button>
        <button
          onClick={() => setActivePreset('inventory')}
          className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
            activePreset === 'inventory'
              ? 'bg-[#00cec9]/20 border-[#00cec9] text-[#55efc4] font-semibold'
              : 'bg-[#1e1f20] border-[#333538] text-[#a0a0a5] hover:text-white'
          }`}
        >
          🎒 Backpack & Inventory Slots
        </button>
      </div>

      {/* Simulated Roblox Game Viewport */}
      <div className="bg-[#121316] p-4 sm:p-6 rounded-2xl border border-[#2b2d30] shadow-2xl flex flex-col items-center">
        {/* Device Wrapper */}
        <div
          className={`transition-all duration-300 relative overflow-hidden bg-gradient-to-b from-[#1a233a] via-[#10141f] to-[#0a0c13] border-4 border-[#2d3036] rounded-2xl shadow-2xl ${
            deviceType === 'desktop'
              ? 'w-full h-[460px]'
              : deviceType === 'mobile'
              ? 'w-[320px] h-[520px]'
              : 'w-[480px] h-[480px]'
          }`}
        >
          {/* Roblox TopBar Emulation */}
          <div className="h-9 bg-[#111215]/80 backdrop-blur border-b border-white/10 px-3 flex items-center justify-between text-xs text-white z-20 relative select-none">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-widest text-[#e3e3e3]">ROBLOX</span>
              <span className="text-[10px] text-[#8e8e93] hidden sm:inline">• Live Client Preview</span>
            </div>

            {/* Currency HUD */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#252830] px-2.5 py-1 rounded-full border border-white/10">
                <Coins className="w-3.5 h-3.5 text-[#ffd32a]" />
                <span className="font-mono font-bold text-xs text-[#ffd32a]">{coins}</span>
              </div>

              {!isShopOpen && (
                <button
                  onClick={() => setIsShopOpen(true)}
                  className="bg-[#388bfd] hover:bg-[#4d97ff] text-white px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-transform active:scale-95 shadow"
                >
                  Shop
                </button>
              )}
            </div>
          </div>

          {/* Interactive Roblox Game Scene & GUI Layer */}
          <div className="w-full h-[calc(100%-36px)] relative p-4 flex items-center justify-center">
            {/* Purchase Toast */}
            {purchaseNotice && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2ed573] text-black font-bold text-xs px-4 py-1.5 rounded-full shadow-lg z-30 animate-bounce">
                {purchaseNotice}
              </div>
            )}

            {/* PRESET 1: SHOP GUI */}
            {activePreset === 'shop' && (
              <>
                {isShopOpen ? (
                  <div className="relative w-full max-w-sm sm:max-w-md bg-[#1e2026]/95 backdrop-blur-md border border-[#3e424b] rounded-2xl p-4 shadow-2xl text-white z-10 transition-all animate-in fade-in zoom-in-95">
                    {/* Header with Title & Close button */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#388bfd]/20 text-[#388bfd]">
                          <Coins className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="font-bold text-sm">Weapon & Gear Shop</h3>
                          <p className="text-[10px] text-[#9ca3af]">Scale-Responsive ScreenGui</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsShopOpen(false)}
                        className="p-1 rounded-lg bg-[#2e3138] hover:bg-[#3d414a] text-[#9ca3af] hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Shop Items Grid */}
                    <div className="grid grid-cols-2 gap-2.5 my-3 max-h-56 overflow-y-auto pr-1">
                      <div className="p-2.5 rounded-xl bg-[#282b33] border border-[#3a3e47] hover:border-[#388bfd] transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>Laser Blaster</span>
                            <span className="text-[10px] text-[#2ed573]">Common</span>
                          </div>
                          <p className="text-[10px] text-[#8e8e93] mt-1">Raycast hitscan firearm with neon tracer.</p>
                        </div>
                        <button
                          onClick={() => buyItem('Laser Blaster', 50)}
                          className="mt-2 w-full py-1 rounded-lg bg-[#388bfd] hover:bg-[#4d97ff] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <Coins className="w-3 h-3 text-[#ffd32a]" /> 50
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#282b33] border border-[#3a3e47] hover:border-[#a55eea] transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>Void Katana</span>
                            <span className="text-[10px] text-[#a55eea]">Epic</span>
                          </div>
                          <p className="text-[10px] text-[#8e8e93] mt-1">Slashes with particle slash trails & dash.</p>
                        </div>
                        <button
                          onClick={() => buyItem('Void Katana', 120)}
                          className="mt-2 w-full py-1 rounded-lg bg-[#a55eea] hover:bg-[#b86bff] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <Coins className="w-3 h-3 text-[#ffd32a]" /> 120
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#282b33] border border-[#3a3e47] hover:border-[#ff9f43] transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>Golden Pet</span>
                            <span className="text-[10px] text-[#ff9f43]">Legendary</span>
                          </div>
                          <p className="text-[10px] text-[#8e8e93] mt-1">+2x Coins multiplier follower.</p>
                        </div>
                        <button
                          onClick={() => buyItem('Golden Pet', 200)}
                          className="mt-2 w-full py-1 rounded-lg bg-[#ff9f43] hover:bg-[#ffa959] text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <Coins className="w-3 h-3 text-[#ffd32a]" /> 200
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#282b33] border border-[#3a3e47] hover:border-[#2ed573] transition-colors flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>Speed Potion</span>
                            <span className="text-[10px] text-[#2ed573]">Consumable</span>
                          </div>
                          <p className="text-[10px] text-[#8e8e93] mt-1">+50% WalkSpeed for 60 seconds.</p>
                        </div>
                        <button
                          onClick={() => buyItem('Speed Potion', 25)}
                          className="mt-2 w-full py-1 rounded-lg bg-[#2ed573] hover:bg-[#43e384] text-black text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <Coins className="w-3 h-3 text-black" /> 25
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#8e8e93] text-center pt-1 border-t border-white/5">
                      AnchorPoint: Vector2.new(0.5, 0.5) • ClipsDescendants: false
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/50 text-xs">
                    <p>Shop is closed.</p>
                    <button
                      onClick={() => setIsShopOpen(true)}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-[#388bfd] text-white text-xs font-semibold"
                    >
                      Click to Open Shop
                    </button>
                  </div>
                )}
              </>
            )}

            {/* PRESET 2: HEALTH & STAMINA HUD */}
            {activePreset === 'hud' && (
              <div className="w-full h-full flex flex-col justify-between p-2 select-none">
                {/* Top Right Stats */}
                <div className="self-end bg-[#1c1e24]/90 p-2 rounded-xl border border-white/10 flex items-center gap-3 text-xs text-white">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2ed573] animate-pulse" />
                    <span>Ping: 24ms</span>
                  </div>
                  <div>FPS: 60</div>
                </div>

                {/* Bottom Left HUD (Health + Stamina) */}
                <div className="self-start bg-[#1c1e24]/95 backdrop-blur border border-[#343842] p-3 rounded-2xl shadow-xl w-64 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-white font-bold">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-[#ff4757] fill-[#ff4757]" />
                      <span>HEALTH</span>
                    </div>
                    <span className="font-mono text-xs">{health} / 100</span>
                  </div>

                  {/* Health Bar Track */}
                  <div className="w-full h-3.5 bg-[#2a2c33] rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        health > 50
                          ? 'bg-gradient-to-r from-[#2ed573] to-[#7bed9f]'
                          : health > 25
                          ? 'bg-gradient-to-r from-[#ffa502] to-[#ffc048]'
                          : 'bg-gradient-to-r from-[#ff4757] to-[#ff6b81]'
                      }`}
                      style={{ width: `${health}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-white font-bold pt-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#eccc68] fill-[#eccc68]" />
                      <span>STAMINA</span>
                    </div>
                    <span className="font-mono text-xs">{stamina} / 100</span>
                  </div>

                  {/* Stamina Bar Track */}
                  <div className="w-full h-2.5 bg-[#2a2c33] rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#eccc68] to-[#f1f2f6] transition-all"
                      style={{ width: `${stamina}%` }}
                    />
                  </div>

                  {/* Test Controls */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={takeDamage}
                      className="flex-1 py-1 rounded bg-[#ff4757]/20 hover:bg-[#ff4757]/30 text-[#ff6b81] text-[11px] font-bold border border-[#ff4757]/30 transition-colors"
                    >
                      Damage -20
                    </button>
                    <button
                      onClick={resetHealth}
                      className="flex-1 py-1 rounded bg-[#2ed573]/20 hover:bg-[#2ed573]/30 text-[#2ed573] text-[11px] font-bold border border-[#2ed573]/30 transition-colors"
                    >
                      Heal 100%
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PRESET 3: INVENTORY GRID */}
            {activePreset === 'inventory' && (
              <div className="w-full max-w-sm bg-[#1e2026]/95 backdrop-blur border border-[#3e424b] rounded-2xl p-4 shadow-2xl text-white z-10">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#9ca3af]">Backpack Inventory</h3>
                  <span className="text-[10px] text-[#2ed573]">Slots: 4 / 8</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['Sword', 'Shield', 'Bow', 'Potion', '', '', '', ''].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => item && setSelectedItem(item)}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                        item
                          ? selectedItem === item
                            ? 'bg-[#388bfd]/30 border-[#388bfd] text-white shadow-lg'
                            : 'bg-[#282b33] border-[#3a3e47] text-[#d4d4d8] hover:border-white/30'
                          : 'bg-[#18191d]/50 border-dashed border-[#2d3036] text-[#555]'
                      }`}
                    >
                      {item ? (
                        <>
                          <span className="text-xs font-bold truncate max-w-full">{item}</span>
                          <span className="text-[9px] text-[#8e8e93]">Equip</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#444]">Empty</span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedItem && (
                  <div className="mt-3 p-2 bg-[#282b33] rounded-xl border border-[#3a3e47] flex items-center justify-between text-xs">
                    <span>Equipped: <strong>{selectedItem}</strong></span>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="px-2 py-0.5 rounded bg-[#ff4757]/20 text-[#ff6b81] text-[10px]"
                    >
                      Unequip
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto GUI Code Fixer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#1e1f20] border border-[#2e3034] p-5 rounded-2xl shadow-lg">
        {/* Left: Code Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[#00cec9]" />
              <span>Input Problematic GUI Script</span>
            </h3>
            <button
              onClick={() => setInputCode(
`local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Parent = game.Players.LocalPlayer.PlayerGui

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 450, 0, 300) -- BUG: Pixel offset
MainFrame.Position = UDim2.new(0.5, 0, 0.5, 0) -- BUG: Missing AnchorPoint
MainFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 45)
MainFrame.Parent = ScreenGui`
              )}
              className="text-[11px] text-[#388bfd] hover:underline"
            >
              Load Example Buggy Code
            </button>
          </div>

          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            rows={10}
            className="w-full bg-[#141517] border border-[#2d3034] rounded-xl p-3 font-mono text-xs text-[#e3e3e3] focus:outline-none focus:border-[#00cec9] resize-none leading-relaxed"
            placeholder="Paste your Roblox GUI script here..."
          />

          <button
            onClick={handleAutoFix}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00cec9] to-[#0984e3] text-black font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-[#00cec9]/20"
          >
            <Wand2 className="w-4 h-4" />
            <span>Fix All GUI Bugs (Mobile Scale, AnchorPoint & Corners)</span>
          </button>
        </div>

        {/* Right: Fixed Output & Audit Report */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#55efc4]" />
              <span>Clean, Responsive Fixed Code</span>
            </h3>
            {fixedCode && (
              <button
                onClick={handleCopyFixed}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#2b2d30] text-white hover:bg-[#34373c] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#55efc4]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            )}
          </div>

          {fixedCode ? (
            <div className="space-y-3">
              <pre className="w-full bg-[#141517] border border-[#2d3034] rounded-xl p-3 font-mono text-xs text-[#55efc4] overflow-x-auto max-h-56 leading-relaxed">
                <code>{fixedCode}</code>
              </pre>

              {/* Fixes Applied Log */}
              <div className="p-3 bg-[#172520] border border-[#234e40] rounded-xl text-xs space-y-1.5">
                <span className="font-bold text-[#55efc4] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fixes Applied Successfully:</span>
                </span>
                {fixedLog.map((log, i) => (
                  <div key={i} className="text-[#a8e6cf] flex items-start gap-1.5">
                    <span className="text-[#2ed573]">•</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 rounded-xl border border-dashed border-[#2d3034] flex flex-col items-center justify-center text-center p-6 text-[#717478]">
              <Layout className="w-8 h-8 mb-2 opacity-50 text-[#00cec9]" />
              <p className="text-xs font-medium text-[#9ca3af]">No fixes run yet</p>
              <p className="text-[11px] mt-1 max-w-xs">
                Click "Fix All GUI Bugs" to automatically transform your code into mobile-responsive, production-grade Luau!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rules Explanations for Developers */}
      <div className="bg-[#1e1f20] border border-[#2e3034] p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#fdcb6e]" />
          <span>Golden Rules for Roblox GUI Design & Mobile Compatibility</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {GUI_FIX_RULES.map((rule, idx) => (
            <div key={idx} className="p-3 bg-[#161719] rounded-xl border border-[#2d3034] space-y-1">
              <h4 className="text-xs font-bold text-[#58a6ff]">{rule.title}</h4>
              <p className="text-[11px] text-[#ff7675]">Bug: {rule.problem}</p>
              <p className="text-[11px] text-[#55efc4]">Fix: {rule.solution}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
