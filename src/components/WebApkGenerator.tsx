import React, { useState } from 'react';
import {
  Smartphone,
  Globe,
  RefreshCw,
  Download,
  Copy,
  Check,
  Crown,
  CreditCard,
  Lock,
  Code2,
  Eye,
  FileCode,
  Sparkles,
  UserCheck,
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { CreditPackage, UserProfile, WebApkBuild } from '../types';
import {
  CREDIT_PACKAGES,
  downloadWebApkFile,
  downloadWebsiteHtmlFile,
  getUserPurchaseHistory,
  isOwnerAccount,
} from '../services/webApkEngine';
import { generateWebApkApi } from '../services/api';

interface WebApkGeneratorProps {
  currentUser: UserProfile | null;
  credits: number;
  onUnlockOwnerCredits: () => void;
  onPurchaseCredits: (pkg: CreditPackage, paymentMethod: string) => void;
  onConsumeCredit: () => boolean;
  onOpenAuth: () => void;
  builds: WebApkBuild[];
  activeBuild: WebApkBuild | null;
  onAddBuild: (build: WebApkBuild) => void;
  onSelectBuild: (build: WebApkBuild) => void;
}

export const WebApkGenerator: React.FC<WebApkGeneratorProps> = ({
  currentUser,
  credits,
  onUnlockOwnerCredits,
  onPurchaseCredits,
  onConsumeCredit,
  onOpenAuth,
  builds,
  activeBuild,
  onAddBuild,
  onSelectBuild,
}) => {
  const isOwner = isOwnerAccount(currentUser);

  const [appName, setAppName] = useState(activeBuild?.appName || 'Nova Gaming Web APK');
  const [prompt, setPrompt] = useState(
    activeBuild?.prompt ||
      'Build a sleek interactive website that acts as a Web APK generator for mobile games and web apps.'
  );
  const [previewTab, setPreviewTab] = useState<'website' | 'apk-code' | 'html-source'>('website');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Payment Checkout Modal state (for non-owner paid credits)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<CreditPackage>(CREDIT_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Apple Pay' | 'Google Pay'>('Card');
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || '');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const purchaseHistory = getUserPurchaseHistory(currentUser);

  const copyText = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleOwnerUnlimitedClick = () => {
    if (!isOwner) {
      setIsCheckoutOpen(true);
      return;
    }
    onUnlockOwnerCredits();
    setStatusNotice('Owner Unlimited Credits active. Every click generates randomized APK builds at $0.00.');
  };

  const executeBuild = async (randomizeExisting = false) => {
    const targetPrompt = randomizeExisting && activeBuild ? activeBuild.prompt : prompt.trim();
    const targetName = randomizeExisting && activeBuild ? activeBuild.appName : appName.trim();

    if (!targetPrompt) {
      setStatusNotice('Enter a website or app description first.');
      return;
    }

    if (!isOwner && credits < 1) {
      setStatusNotice('Non-owner accounts need at least 1 credit to generate a randomized Web APK.');
      setIsCheckoutOpen(true);
      return;
    }

    setIsGenerating(true);
    setStatusNotice(null);

    try {
      const result = await generateWebApkApi({
        prompt: targetPrompt,
        appName: targetName || undefined,
        user: currentUser,
        availableCredits: isOwner ? 999999 : credits,
      });

      if (result.requiresPayment && !isOwner) {
        setIsCheckoutOpen(true);
        return;
      }

      if (!isOwner) {
        const deducted = onConsumeCredit();
        if (!deducted) {
          setIsCheckoutOpen(true);
          return;
        }
      }

      onAddBuild(result.build);
      setStatusNotice(
        `Generated ${result.build.appName} with random APK code ${result.build.randomBuildCode}.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentMethod === 'Card') {
      const cleanDigits = cardLast4.replace(/\D/g, '');
      if (cleanDigits.length < 4) {
        setPaymentError('Enter the last 4 digits of your payment card to confirm.');
        return;
      }
      if (!cardHolder.trim()) {
        setPaymentError('Enter the cardholder name to complete checkout.');
        return;
      }
    }

    onPurchaseCredits(
      selectedPack,
      paymentMethod === 'Card' ? `Card •••• ${cardLast4.slice(-4)}` : paymentMethod
    );
    setIsCheckoutOpen(false);
    setStatusNotice(
      `Added ${selectedPack.credits} Web APK credits to ${currentUser?.email || 'your account'} ($${selectedPack.priceUsd.toFixed(2)}).`
    );
  };

  const handleDownloadApk = () => {
    if (!activeBuild) return;
    if (!isOwner && credits < 1 && !activeBuild.generatedByOwner) {
      setIsCheckoutOpen(true);
      return;
    }
    downloadWebApkFile(activeBuild);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5 space-y-5 text-[#e3e3e3]">
      {/* Top Workspace Header & Credit Control Strip */}
      <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center text-black shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Web APK Generator Studio
            </h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Builds an interactive Web APK Generator website and exports randomized Android APK code.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Credit Balance Action Button */}
          {isOwner ? (
            <button
              onClick={handleOwnerUnlimitedClick}
              className="px-3.5 py-2 rounded-xl bg-[#2a210b] hover:bg-[#382b0e] border border-[#785915] text-[#ffd32a] text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 tabular-nums"
              title="Owner Unlimited Credits Active"
            >
              <Crown className="w-4 h-4 fill-[#ffd32a]" />
              <span>Owner Credits: ∞ Unlimited</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                credits > 0
                  ? 'bg-[#19232c] hover:bg-[#202d38] border-[#2d4a63] text-[#7dd3fc]'
                  : 'bg-[#2c191f] hover:bg-[#3a2028] border-[#6b2537] text-[#fda4af]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{credits} Credits — Buy More</span>
            </button>
          )}

          {/* Account Switcher to test Owner vs Paid Non-Owner */}
          <button
            onClick={onOpenAuth}
            className="px-3 py-2 rounded-xl bg-[#202228] hover:bg-[#2a2d35] border border-[#32353e] text-xs font-semibold text-[#d4d4d8] hover:text-white flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#ffd32a]" />
            <span>{isOwner ? 'Owner Account' : currentUser?.email || 'Guest Account'}</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusNotice && (
        <div className="bg-[#17181c] border border-[#3a3216] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-[#fde68a]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#ffd32a] shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-[#9ca3af] hover:text-white p-1"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Builder Controls + Randomized APK Metadata */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#ffd32a]" />
                <span>Website & APK Specification</span>
              </h2>
              <span className="text-[11px] font-mono text-[#9ca3af] tabular-nums">
                {isOwner ? 'Cost: Free (Owner)' : 'Cost: 1 Credit'}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-1.5">
                  Website / App Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Hyper Arcade Web APK"
                  className="w-full bg-[#111216] border border-[#2d3038] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] mb-1.5">
                  What Should This Website & APK Generator Do?
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the website and APK generator features..."
                  className="w-full bg-[#111216] border border-[#2d3038] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a] resize-none"
                />
              </div>

              {/* Preset Starters */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { name: 'Blox Store Web APK', desc: 'Roblox script & game storefront website packaged as a random Web APK generator.' },
                  { name: 'School Portal Web APK', desc: 'Homework dashboard website with built-in APK exporter and random package signer.' },
                  { name: 'Neon Arcade Web APK', desc: 'Browser mini-game arcade website wrapped as a randomized Android WebView APK.' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setAppName(preset.name);
                      setPrompt(preset.desc);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#202228] hover:bg-[#2a2d35] border border-[#30333d] text-[11px] text-[#cbd5e1] hover:text-white transition-colors whitespace-nowrap"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => executeBuild(false)}
                disabled={isGenerating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:opacity-95 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : !isOwner && credits < 1 ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isGenerating
                    ? 'Generating Random APK...'
                    : !isOwner && credits < 1
                    ? 'Pay for Credits to Build'
                    : 'Generate Website & Random APK'}
                </span>
              </button>

              {activeBuild && (
                <button
                  onClick={() => executeBuild(true)}
                  disabled={isGenerating}
                  className="py-2.5 px-3.5 rounded-xl bg-[#22242b] hover:bg-[#2b2e37] border border-[#343742] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  title="Generate a fresh random APK code, package ID, and signature"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#ffd32a]" />
                  <span>New Random Code</span>
                </button>
              )}
            </div>
          </div>

          {/* Non-Owner Pricing Prompt Banner when 0 credits */}
          {!isOwner && credits < 1 && (
            <div className="bg-[#17181c] border border-[#5c2635] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#fda4af]">
                  <Lock className="w-4 h-4" />
                  <span>Paid Credits Required for Non-Owners</span>
                </div>
                <span className="font-mono text-xs text-[#9ca3af] tabular-nums">0 Credits</span>
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                Only the Studio Owner (<span className="text-[#ffd32a] font-mono">whatsupsdev9@gmail.com</span>) receives unlimited free credits. Select a credit pack to unlock randomized APK generation.
              </p>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#ffd32a] hover:bg-[#fde047] text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Purchase APK Credits (From $4.99)</span>
              </button>
            </div>
          )}

          {/* Active Build Randomized APK Specs */}
          {activeBuild && (
            <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#262830] pb-2.5">
                <span className="text-xs font-bold text-white">Randomized APK Build Identity</span>
                <span className="text-[11px] font-mono text-[#34d399] tabular-nums">
                  v{activeBuild.versionName} ({activeBuild.versionCode})
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9ca3af]">Random Build Code</span>
                  <button
                    onClick={() => copyText(activeBuild.randomBuildCode, 'buildCode')}
                    className="font-mono font-bold text-[#ffd32a] hover:underline flex items-center gap-1 tabular-nums"
                  >
                    <span>{activeBuild.randomBuildCode}</span>
                    {copiedKey === 'buildCode' ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9ca3af]">Random Package ID</span>
                  <button
                    onClick={() => copyText(activeBuild.packageName, 'pkg')}
                    className="font-mono text-[#e2e8f0] hover:text-white flex items-center gap-1 truncate max-w-[230px]"
                    title={activeBuild.packageName}
                  >
                    <span className="truncate">{activeBuild.packageName}</span>
                    {copiedKey === 'pkg' ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3 shrink-0" />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9ca3af]">Keystore Alias</span>
                  <span className="font-mono text-[#cbd5e1]">{activeBuild.keystoreAlias}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#9ca3af]">SHA-256 Signature</span>
                  <span className="font-mono text-[#94a3b8] tabular-nums">
                    {activeBuild.sha256Signature.slice(0, 18)}...
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#262830] grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleDownloadApk}
                  className="py-2 px-3 rounded-xl bg-[#252830] hover:bg-[#30343e] border border-[#3a3f4b] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-[#ffd32a]" />
                  <span>Download .APK</span>
                </button>
                <button
                  onClick={() => downloadWebsiteHtmlFile(activeBuild)}
                  className="py-2 px-3 rounded-xl bg-[#202228] hover:bg-[#2a2d36] border border-[#32353f] text-[#cbd5e1] hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Download Site</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Website Preview & Randomized APK Code Viewer */}
        <div className="lg:col-span-7 bg-[#17181c] border border-[#2a2c32] rounded-2xl overflow-hidden flex flex-col min-h-[520px]">
          <div className="px-4 py-3 bg-[#1c1d22] border-b border-[#2a2c32] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPreviewTab('website')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  previewTab === 'website'
                    ? 'bg-[#2a2d36] text-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#ffd32a]" />
                <span>Live Website Preview</span>
              </button>
              <button
                onClick={() => setPreviewTab('apk-code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  previewTab === 'apk-code'
                    ? 'bg-[#2a2d36] text-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Random APK Code</span>
              </button>
              <button
                onClick={() => setPreviewTab('html-source')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  previewTab === 'html-source'
                    ? 'bg-[#2a2d36] text-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Website HTML</span>
              </button>
            </div>

            {activeBuild && (
              <span className="text-[11px] font-mono text-[#ffd32a] tabular-nums">
                {activeBuild.randomBuildCode}
              </span>
            )}
          </div>

          {!activeBuild ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#22242b] border border-[#32353f] flex items-center justify-center text-[#ffd32a]">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Web APK Build Generated Yet</h3>
              <p className="text-xs text-[#9ca3af] max-w-md">
                Enter your website description and click Generate Website &amp; Random APK to create an interactive APK generator site with a unique randomized Android build code.
              </p>
              <button
                onClick={() => executeBuild(false)}
                className="px-4 py-2 rounded-xl bg-[#ffd32a] hover:bg-[#fde047] text-black font-bold text-xs transition-colors"
              >
                Generate First Web APK
              </button>
            </div>
          ) : previewTab === 'website' ? (
            <div className="flex-1 bg-[#0e1015]">
              <iframe
                title={activeBuild.appName}
                srcDoc={activeBuild.websiteHtml}
                sandbox="allow-scripts allow-downloads allow-forms"
                className="w-full h-full min-h-[470px] border-0"
              />
            </div>
          ) : previewTab === 'apk-code' ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#111216] max-h-[540px]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#ffd32a]">AndroidManifest.xml</span>
                  <button
                    onClick={() => copyText(activeBuild.apkManifestCode, 'manifest')}
                    className="px-2 py-1 rounded bg-[#22242c] hover:bg-[#2d303b] text-[11px] text-white flex items-center gap-1"
                  >
                    {copiedKey === 'manifest' ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Manifest</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#0b0c10] border border-[#242731] font-mono text-[11px] text-[#cbd5e1] overflow-x-auto leading-relaxed">
                  {activeBuild.apkManifestCode}
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#34d399]">MainActivity.kt (Randomized Host)</span>
                  <button
                    onClick={() => copyText(activeBuild.apkKotlinCode, 'kotlin')}
                    className="px-2 py-1 rounded bg-[#22242c] hover:bg-[#2d303b] text-[11px] text-white flex items-center gap-1"
                  >
                    {copiedKey === 'kotlin' ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Kotlin</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#0b0c10] border border-[#242731] font-mono text-[11px] text-[#cbd5e1] overflow-x-auto leading-relaxed">
                  {activeBuild.apkKotlinCode}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto bg-[#111216] max-h-[540px] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[#38bdf8]">assets/www/index.html</span>
                <button
                  onClick={() => copyText(activeBuild.websiteHtml, 'html')}
                  className="px-2 py-1 rounded bg-[#22242c] hover:bg-[#2d303b] text-[11px] text-white flex items-center gap-1"
                >
                  {copiedKey === 'html' ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                  <span>Copy HTML</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#0b0c10] border border-[#242731] font-mono text-[11px] text-[#cbd5e1] overflow-x-auto leading-relaxed">
                {activeBuild.websiteHtml}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Build History Data Table */}
      <div className="bg-[#17181c] border border-[#2a2c32] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#262830] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
            Generated Web APK Build Ledger ({builds.length})
          </h3>
          {purchaseHistory.length > 0 && !isOwner && (
            <span className="text-[11px] text-[#7dd3fc] font-mono tabular-nums">
              Last purchase: +{purchaseHistory[0].creditsAdded} credits (${purchaseHistory[0].amountUsd.toFixed(2)})
            </span>
          )}
        </div>
        {builds.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[#6b7280]">
            Your randomized Web APK builds will appear here after generation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#252730] text-[#9ca3af] text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">App / Website</th>
                  <th className="py-2.5 px-4 font-semibold">Random Build Code</th>
                  <th className="py-2.5 px-4 font-semibold">Package ID</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Version</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {builds.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => onSelectBuild(b)}
                    className={`border-b border-[#22242c] cursor-pointer transition-colors ${
                      activeBuild?.id === b.id ? 'bg-[#22252e]' : 'hover:bg-[#1c1e24]'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-white">{b.appName}</td>
                    <td className="py-2.5 px-4 font-mono text-[#ffd32a] tabular-nums">{b.randomBuildCode}</td>
                    <td className="py-2.5 px-4 font-mono text-[#9ca3af]">{b.packageName}</td>
                    <td className="py-2.5 px-4 font-mono text-right text-[#cbd5e1] tabular-nums">
                      {b.versionName} ({b.versionCode})
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBuild(b);
                          downloadWebApkFile(b);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#252832] hover:bg-[#323642] text-white text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Download className="w-3 h-3 text-[#ffd32a]" />
                        <span>.APK</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paid Credits Checkout Modal for Non-Owners */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#18191f] border border-[#2f323d] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#282b34] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Purchase Web APK Credits</h3>
                <p className="text-xs text-[#9ca3af]">
                  Non-owner accounts require paid credits. Owner (whatsupsdev9@gmail.com) receives unlimited free credits.
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-lg bg-[#24262e] hover:bg-[#30333d] text-[#9ca3af] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-4">
              {/* Pricing Packs */}
              <div className="space-y-2">
                {CREDIT_PACKAGES.map((pkg) => {
                  const selected = selectedPack.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPack(pkg)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                        selected
                          ? 'bg-[#252010] border-[#ffd32a]'
                          : 'bg-[#121318] border-[#292c36] hover:border-[#3e4250]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{pkg.name}</span>
                          <span className="text-[11px] text-[#9ca3af]">{pkg.audience}</span>
                        </div>
                        <p className="text-xs text-[#9ca3af] mt-0.5">{pkg.description}</p>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <div className="text-sm font-bold text-[#ffd32a]">${pkg.priceUsd.toFixed(2)}</div>
                        <div className="text-[11px] font-mono text-[#cbd5e1]">{pkg.credits} Credits</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Payment Method */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Card', 'Apple Pay', 'Google Pay'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                        paymentMethod === method
                          ? 'bg-[#2a2d38] border-[#ffd32a] text-white'
                          : 'bg-[#121318] border-[#292c36] text-[#9ca3af] hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Card' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Cardholder full name"
                      className="bg-[#111216] border border-[#2d3038] rounded-xl px-3 py-2 text-xs text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a]"
                    />
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                      placeholder="Card last 4 digits (e.g. 4242)"
                      className="bg-[#111216] border border-[#2d3038] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#6b7280] focus:outline-none focus:border-[#ffd32a] tabular-nums"
                    />
                  </div>
                )}
              </div>

              {paymentError && (
                <div className="text-xs text-[#fda4af] bg-[#2e161d] border border-[#6b2537] rounded-xl px-3 py-2">
                  {paymentError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#282b34]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    onOpenAuth();
                  }}
                  className="text-xs text-[#ffd32a] hover:underline font-semibold flex items-center gap-1"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Are you the Owner? Sign in</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-bold text-xs flex items-center gap-2 whitespace-nowrap tabular-nums"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay ${selectedPack.priceUsd.toFixed(2)} for {selectedPack.credits} Credits</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
