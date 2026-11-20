import { GeneratedImage, CodeSnippet, UserProfile, WebApkBuild } from '../types';
import { resolveOfflineQuery } from './offlineAiEngine';
import { generateRandomApkBuild, isOwnerAccount, isWebApkQuery } from './webApkEngine';

const STORAGE_KEY_API_KEY = 'gemini_user_api_key';

function generateOwnStudioApiKey(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `WUAI-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export function getStoredApiKey(): string {
  try {
    const key = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (!key || key === 'WUAI-FFF9-WA8L-DLQD-8YKV' || key === 'FFF9-WA8L-DLQD-8YKV') {
      const freshKey = generateOwnStudioApiKey();
      localStorage.setItem(STORAGE_KEY_API_KEY, freshKey);
      return freshKey;
    }
    return key;
  } catch {
    return generateOwnStudioApiKey();
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } catch (e) {
    console.error('Failed to store API key', e);
  }
}

export async function regenerateOwnApiKey(): Promise<string> {
  try {
    const res = await fetch('/api/ai-key/rotate', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.selfGeneratedKey) {
        setStoredApiKey(data.selfGeneratedKey);
        return data.selfGeneratedKey;
      }
    }
  } catch {
    // offline fallback
  }
  const localNewKey = generateOwnStudioApiKey();
  setStoredApiKey(localNewKey);
  return localNewKey;
}

export async function generateWebApkApi(params: {
  prompt: string;
  appName?: string;
  user?: UserProfile | null;
  availableCredits?: number;
}): Promise<{ build: WebApkBuild; requiresPayment?: boolean }> {
  const isOwner = isOwnerAccount(params.user);
  const credits = isOwner ? 999999 : (params.availableCredits ?? 0);

  try {
    const response = await fetch('/api/generate-web-apk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt,
        appName: params.appName,
        userEmail: params.user?.email || 'guest@whatsup.studio',
        userRole: params.user?.role || 'member',
        availableCredits: credits,
        userApiKey: getStoredApiKey(),
      }),
    });

    if (response.status === 402) {
      // Return website preview + flag payment required for APK credit unlocking
      return {
        build: generateRandomApkBuild(params.prompt, {
          isOwner: false,
          appNameOverride: params.appName,
        }),
        requiresPayment: true,
      };
    }

    if (response.ok) {
      const data = await response.json();
      if (data.build) {
        return { build: data.build };
      }
    }
  } catch (err) {
    console.warn('Server Web APK route unavailable, using local random APK generator:', err);
  }

  return {
    build: generateRandomApkBuild(params.prompt, {
      isOwner,
      appNameOverride: params.appName,
    }),
    requiresPayment: !isOwner && credits < 1,
  };
}

export async function sendChatMessage(
  messages: { role: string; content: string; attachedImage?: string }[],
  options?: {
    modelOverride?: string;
    mode?: string;
    userApiKey?: string;
    familyFriendly?: boolean;
    antiCheatActive?: boolean;
    currentUser?: UserProfile | null;
    apkCredits?: number;
  }
): Promise<{
  content: string;
  model: string;
  generatedImages?: GeneratedImage[];
  codeSnippets?: CodeSnippet[];
  webApkData?: WebApkBuild;
}> {
  const activeKey = options?.userApiKey || getStoredApiKey();
  const lastRawMsg = messages[messages.length - 1]?.content || '';
  const wantsWebApk = options?.mode === 'web-apk' || isWebApkQuery(lastRawMsg);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        userApiKey: activeKey,
        mode: options?.mode,
        modelOverride: options?.modelOverride || 'gemini-4-hydrogen',
        familyFriendly: options?.familyFriendly,
        antiCheatActive: options?.antiCheatActive,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    const content = data.content || '';

    // Check if the prompt was asking for an image
    const lastMsg = lastRawMsg.toLowerCase();
    const isImageRequest =
      !wantsWebApk &&
      (lastMsg.startsWith('generate image') ||
        lastMsg.startsWith('/image') ||
        lastMsg.includes('generate an image') ||
        lastMsg.includes('generate image') ||
        lastMsg.includes('draw a') ||
        lastMsg.includes('draw me') ||
        lastMsg.includes('make a picture of') ||
        lastMsg.includes('make an image of') ||
        lastMsg.includes('show me a picture of') ||
        lastMsg.includes('show me an image of') ||
        lastMsg.includes('show me a picture') ||
        lastMsg.includes('show me the image') ||
        lastMsg.includes('show the image') ||
        lastMsg.includes('see the image') ||
        lastMsg.includes('see the picture') ||
        lastMsg.includes('image of') ||
        lastMsg.includes('picture of') ||
        lastMsg.includes('render of'));

    let generatedImages: GeneratedImage[] | undefined;
    if (isImageRequest) {
      try {
        const cleanPrompt = lastMsg
          .replace(/^(generate image|generate an image of|generate image of|\/image|draw a|draw me a|draw me|make an image of|make a picture of|show me a picture of|show me an image of|show me the image of|see the image of|see the picture of|picture of|image of)/i, '')
          .trim();
        const promptToUse = cleanPrompt.length > 2 ? cleanPrompt : lastMsg;
        const imgData = await generateImageApi({ prompt: promptToUse, aspectRatio: '1:1' });
        generatedImages = [imgData];
      } catch (err) {
        console.warn('Inline image generation skipped', err);
      }
    }

    let webApkData: WebApkBuild | undefined;
    if (wantsWebApk) {
      const apkRes = await generateWebApkApi({
        prompt: lastRawMsg,
        user: options?.currentUser,
        availableCredits: options?.apkCredits ?? 0,
      });
      webApkData = apkRes.build;
    }

    // Extract detected code snippets for quick-copy and studio placement
    const codeSnippets = extractCodeSnippets(content);

    return {
      content,
      model: data.model || 'gemini-4-hydrogen',
      generatedImages,
      codeSnippets,
      webApkData,
    };
  } catch (error: any) {
    console.warn('Network or API issue, generating zero-Wi-Fi client fallback', error);

    // Seamless Zero-Wi-Fi / Offline Fallback Engine: Works 100% locally
    const offlineResult = resolveOfflineQuery(lastRawMsg);
    const webApkData = wantsWebApk
      ? generateRandomApkBuild(lastRawMsg, { isOwner: isOwnerAccount(options?.currentUser) })
      : undefined;

    return {
      content: offlineResult.content,
      model: 'local-offline-engine',
      codeSnippets: extractCodeSnippets(offlineResult.content),
      webApkData,
    };
  }
}

export async function generateImageApi(params: {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: string;
  mode?: 'realistic' | 'photo' | 'creative';
}): Promise<GeneratedImage> {
  const { prompt, aspectRatio = '1:1', style = 'realistic', mode = 'realistic' } = params;

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio, style, mode }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        id: 'img_' + Date.now(),
        url: data.imageUrl,
        prompt: data.prompt,
        enhancedPrompt: data.enhancedPrompt,
        aspectRatio,
        width: data.width,
        height: data.height,
        timestamp: Date.now(),
        source: data.source || 'realistic-ai',
        sourceTitle: data.sourceTitle,
      };
    }
  } catch (e) {
    console.warn('Server image route failed, using direct generation', e);
  }

  // Direct client fallback via Pollinations AI
  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') {
    width = 1280;
    height = 720;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  }
  const seed = Math.floor(Math.random() * 1000000);
  const cleanPrompt = encodeURIComponent(
    `Ultra-realistic 8k photograph, master photography, realistic portrait: ${prompt.trim()}`
  );
  const directUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;

  return {
    id: 'img_' + Date.now(),
    url: directUrl,
    prompt,
    aspectRatio,
    width,
    height,
    timestamp: Date.now(),
    source: 'realistic-ai',
  };
}

function extractCodeSnippets(markdown: string): CodeSnippet[] {
  const codeRegex = /```(lua|luau|csharp|c#|gdscript|cpp|c\+\+|json|typescript|ts)?\n([\s\S]*?)```/g;
  const snippets: CodeSnippet[] = [];
  let match;
  let index = 0;

  while ((match = codeRegex.exec(markdown)) !== null) {
    index++;
    const rawLang = (match[1] || 'lua').toLowerCase();
    const code = match[2].trim();

    let lang: CodeSnippet['language'] = 'luau';
    let engine: CodeSnippet['engine'] = 'roblox';

    if (rawLang === 'csharp' || rawLang === 'c#') {
      lang = 'csharp';
      engine = 'unity';
    } else if (rawLang === 'gdscript') {
      lang = 'gdscript';
      engine = 'godot';
    } else if (rawLang === 'cpp' || rawLang === 'c++') {
      lang = 'cpp';
      engine = 'unreal';
    } else if (rawLang === 'json') {
      lang = 'json';
      engine = 'general';
    }

    // Try extracting location hint from comments
    const locMatch = code.match(/--\s*\[Location:\s*(.*?)\]/) || code.match(/\/\/\s*\[Location:\s*(.*?)\]/);
    const location = locMatch ? locMatch[1].trim() : undefined;

    const titleMatch = code.match(/--\s*\[Name:\s*(.*?)\]/) || code.match(/\/\/\s*\[Name:\s*(.*?)\]/);
    const title = titleMatch ? titleMatch[1].trim() : `Script #${index}`;

    snippets.push({
      id: `snippet_${Date.now()}_${index}`,
      language: lang,
      code,
      engine,
      location,
      title,
    });
  }

  return snippets;
}
