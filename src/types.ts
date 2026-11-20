export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  provider: 'google' | 'windows' | 'apple';
  createdAt: number;
}

export interface ApiKeyLink {
  id: string;
  code: string;
  url: string;
  createdAt: number;
  expiresInDays: number;
  label: string;
  createdBy: string;
  status: 'active' | 'revoked';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedImage?: string; // base64 or URL
  imageAnalysis?: {
    extractedText?: string;
    directAnswer?: string;
    instructions?: string;
  };
  generatedImages?: GeneratedImage[];
  detectedScripts?: CodeSnippet[];
  webApkData?: WebApkBuild;
  model?: string;
  isStreaming?: boolean;
}

export interface WebApkBuild {
  id: string;
  appName: string;
  siteTitle: string;
  description: string;
  prompt: string;
  randomBuildCode: string;
  packageName: string;
  versionCode: number;
  versionName: string;
  sha256Signature: string;
  keystoreAlias: string;
  websiteHtml: string;
  apkManifestCode: string;
  apkKotlinCode: string;
  createdAt: number;
  generatedByOwner: boolean;
}

export interface CreditPackage {
  id: string;
  name: string;
  audience: string;
  credits: number;
  priceUsd: number;
  description: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  aspectRatio: string;
  width: number;
  height: number;
  timestamp: number;
  category?: string;
  source?: 'photo' | 'realistic-ai' | 'generated';
  sourceTitle?: string;
}

export interface CodeSnippet {
  id: string;
  language: 'lua' | 'luau' | 'csharp' | 'gdscript' | 'cpp' | 'typescript' | 'json';
  code: string;
  title?: string;
  location?: string; // e.g. "ServerScriptService > Script"
  engine: 'roblox' | 'unity' | 'godot' | 'unreal' | 'general';
}

export interface RobloxTemplate {
  id: string;
  title: string;
  category: 'Backend & Data' | 'GUI & HUD' | 'Combat & Weapons' | 'Movement & Physics' | 'Systems & Mechanics' | 'Admin & Utility' | 'Anti-Cheat';
  description: string;
  location: string;
  engine: string;
  code: string;
  tags: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ActiveTab = 'chat' | 'gmail' | 'web-apk' | 'school-solver' | 'roblox-hub' | 'gui-fixer' | 'image-studio' | 'multi-engine' | 'owner-panel';

export type PromptMode = 'general' | 'web-apk' | 'school' | 'roblox' | 'image' | 'gui' | 'multi-engine' | 'ocr-answer';
