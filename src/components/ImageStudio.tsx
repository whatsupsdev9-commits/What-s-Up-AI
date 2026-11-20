import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Maximize2, 
  RefreshCw, 
  Wand2, 
  Ratio, 
  Palette,
  ExternalLink,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { generateImageApi } from '../services/api';
import { GeneratedImage } from '../types';

interface ImageStudioProps {
  onInsertToChat?: (img: GeneratedImage) => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({ onInsertToChat }) => {
  const [prompt, setPrompt] = useState('Photorealistic 8k portrait of Darth Vader with battle-damaged helmet, ultra-detailed cinematic lighting');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [style, setStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState(false);

  const presets = [
    { label: 'Real Character / Person Photo', prompt: 'Darth Vader headshot portrait, authentic high-res photograph', ratio: '1:1' as const, style: 'photo' },
    { label: 'Ultra-Realistic Portrait', prompt: 'Ultra-realistic 8k portrait of Albert Einstein smiling in his Princeton study, master photography, natural lighting', ratio: '1:1' as const, style: 'realistic' },
    { label: 'Roblox Game Icon', prompt: 'Roblox game icon, cute 3D anime adventurer holding a glowing magic sword, bold colorful lighting, 3D style', ratio: '1:1' as const, style: 'roblox' },
    { label: 'Cinematic Movie Shot', prompt: 'Cinematic crossover of Darth Vader wielding red lightsaber facing Spider-Man on neon skyscraper rooftops, photorealistic 8k render', ratio: '16:9' as const, style: 'realistic' },
    { label: 'Anime Epic Battle', prompt: 'Goku Super Saiyan and Gojo Satoru epic clash in glowing neon anime battle arena, vibrant volumetric lighting, 8k render', ratio: '16:9' as const, style: 'concept-art' },
    { label: 'Pixel Boss Monster', prompt: '16-bit retro pixel art giant mechanical dragon breathing blue fire, retro game boss sprite', ratio: '1:1' as const, style: 'pixel-art' },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep('Analyzing character and verifying visual details...');

    // Progress step simulation to give realistic feedback while rendering
    const stepTimer1 = setTimeout(() => {
      setGenerationStep('Searching character headshots & looking up highest-resolution reference...');
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setGenerationStep('Refining skin textures, natural lighting, and photorealistic depth...');
    }, 2800);

    try {
      const img = await generateImageApi({
        prompt: finalPrompt,
        aspectRatio,
        style,
        mode: style === 'photo' ? 'photo' : 'realistic',
      });

      setCurrentImage(img);
      setGallery((prev) => [img, ...prev]);
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPreset = (p: typeof presets[0]) => {
    setPrompt(p.prompt);
    setAspectRatio(p.ratio);
    setStyle(p.style);
    handleGenerate(p.prompt);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2c1a24] via-[#211928] to-[#1a1c2e] border border-[#4d2d42] p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#ff7675]/20 text-[#ff7675] border border-[#ff7675]/40">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Image Studio & Game Asset Generator
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#3d1e28] text-[#ff9f9e] text-xs font-semibold border border-[#642b3b]">
              Anything You Want
            </span>
          </div>
          <p className="text-xs text-[#a0a0a8] mt-1.5 max-w-2xl leading-relaxed">
            Generate high-resolution game icons, Roblox thumbnails, gamepass badges, character concept art, and weapons instantly.
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-[#8e8e93]">Quick Game Asset Presets:</span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] text-[#d4d4d8] hover:text-white border border-[#333538] transition-all shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-[#ff7675]" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generator Controls Card */}
      <div className="bg-[#1e1f20] border border-[#2e3034] p-5 rounded-2xl shadow-lg space-y-4">
        {/* Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white flex items-center justify-between">
            <span>Image Prompt:</span>
            <span className="text-[10px] text-[#8e8e93]">Describe anything you want to create</span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your scene, character, weapon, or game asset in detail..."
              className="w-full bg-[#141517] border border-[#2d3034] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#ff7675] resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Options Row: Aspect Ratio & Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] flex items-center gap-1">
              <Ratio className="w-3.5 h-3.5 text-[#ff7675]" />
              <span>Aspect Ratio:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    aspectRatio === ratio
                      ? 'bg-[#3d1e28] border-[#ff7675] text-[#ff9f9e] font-bold shadow'
                      : 'bg-[#161719] border-[#2e3034] text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#9ca3af] flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-[#a55eea]" />
              <span>Realism & Visual Style:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'realistic', label: '📸 Ultra Realistic' },
                { id: 'photo', label: '🔍 Real Photo' },
                { id: 'roblox', label: '🧱 Roblox 3D' },
                { id: 'pixel-art', label: '👾 Pixel Art' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-center ${
                    style === s.id
                      ? 'bg-[#2b2038] border-[#a55eea] text-[#d1a5ff] font-bold shadow'
                      : 'bg-[#161719] border-[#2e3034] text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button & Progress */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                isGenerating || !prompt.trim()
                  ? 'bg-[#2b2d30] text-[#a0a5ad] cursor-wait'
                  : 'bg-gradient-to-r from-[#ff7675] via-[#a55eea] to-[#388bfd] text-white hover:opacity-95 active:scale-[0.99] shadow-[#ff7675]/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#ff7675]" />
                  <span>Synthesizing High-Detail Image...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Create Realistic Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Step Indicator while taking time to generate realistically */}
        {isGenerating && generationStep && (
          <div className="p-3 bg-gradient-to-r from-[#ff7675]/15 via-[#a55eea]/15 to-[#388bfd]/15 border border-[#ff7675]/30 rounded-xl flex items-center gap-3 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff7675] animate-ping shrink-0" />
            <div className="text-xs text-white">
              <span className="font-bold text-[#ff9f9e] mr-1.5">Processing with Care:</span>
              <span className="italic">{generationStep}</span>
            </div>
          </div>
        )}
      </div>

      {/* Featured Output Showcase */}
      {currentImage && (
        <div className="bg-[#1e1f20] border border-[#2e3034] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff7675]" />
                <span>Latest Creation</span>
              </h3>
              {currentImage.source === 'photo' ? (
                <span className="px-2 py-0.5 rounded-md bg-[#2563eb]/20 border border-[#3b82f6]/40 text-[#93c5fd] text-[10px] font-bold">
                  📸 Authentic Photo Reference
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-[#10b981]/20 border border-[#10b981]/40 text-[#6ee7b7] text-[10px] font-bold">
                  ✨ Ultra-Realistic 8k Synthesis
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyUrl(currentImage.url)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2b2d30] hover:bg-[#34373c] text-white text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#55efc4]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied URL' : 'Copy Link'}</span>
              </button>
              <a
                href={currentImage.url}
                download="ai_generated_image.png"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ff7675] hover:bg-[#ff8988] text-black text-xs font-bold transition-all shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download High-Res</span>
              </a>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-[#333538] bg-black/60 flex items-center justify-center max-h-[500px]">
            <img
              src={currentImage.url}
              alt={currentImage.prompt}
              className="max-h-[500px] w-auto object-contain cursor-pointer transition-transform hover:scale-[1.01]"
              onClick={() => setFullscreenImage(currentImage)}
            />
            <button
              onClick={() => setFullscreenImage(currentImage)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-[#161719] rounded-xl border border-[#2d3034] text-xs text-[#9ca3af] space-y-1">
            <p className="text-white font-medium">Prompt: "{currentImage.prompt}"</p>
            {currentImage.sourceTitle && (
              <p className="text-[#93c5fd] font-semibold text-[11px]">Real Reference: {currentImage.sourceTitle}</p>
            )}
            <p className="text-[11px]">Dimensions: {currentImage.width}x{currentImage.height} ({currentImage.aspectRatio})</p>
          </div>
        </div>
      )}

      {/* Gallery of Past Generations */}
      {gallery.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#70a1ff]" />
            <span>Generated Asset Gallery ({gallery.length})</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden border border-[#2e3034] bg-[#161719] hover:border-[#ff7675] transition-all shadow-md cursor-pointer"
                onClick={() => setFullscreenImage(img)}
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-2.5 bg-[#1e1f20] border-t border-[#2e3034] flex items-center justify-between text-[11px]">
                  <p className="text-white truncate max-w-[120px] font-medium">{img.prompt}</p>
                  <span className="text-[#8e8e93]">{img.aspectRatio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-[#161719] border border-[#333538] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-[#202124] border-b border-[#2e3034] flex items-center justify-between text-xs text-white">
              <span className="font-semibold truncate max-w-md">{fullscreenImage.prompt}</span>
              <button
                onClick={() => setFullscreenImage(null)}
                className="px-2.5 py-1 rounded-lg bg-[#2e3138] hover:bg-[#3d414a]"
              >
                Close (ESC)
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.prompt}
                className="max-h-[72vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-[#202124] border-t border-[#2e3034] flex items-center justify-between text-xs">
              <span className="text-[#8e8e93]">{fullscreenImage.width}x{fullscreenImage.height} • {fullscreenImage.aspectRatio}</span>
              <a
                href={fullscreenImage.url}
                download="ai_asset.png"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#ff7675] text-black font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Asset</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
