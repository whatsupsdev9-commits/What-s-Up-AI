import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({ prompt: 'consent' });

// In-memory only OAuth access token cache (never written to localStorage/sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const googleGmailSignIn = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google sign-in completed, but no Gmail access token was returned.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getGmailAccessToken = (): string | null => cachedAccessToken;

export const gmailLogout = async (): Promise<void> => {
  cachedAccessToken = null;
  await auth.signOut();
};

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  bodyText: string;
  labelIds: string[];
  isUnread: boolean;
}

export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
}

function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data && payload.mimeType === 'text/plain') {
    return decodeBase64Url(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const plain = extractBodyFromPayload(part);
      if (plain) return plain;
    }
    for (const part of payload.parts) {
      if (part.body?.data && part.mimeType === 'text/html') {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }
  if (payload.body?.data) {
    const raw = decodeBase64Url(payload.body.data);
    return raw.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function getHeader(headers: any[], name: string): string {
  if (!Array.isArray(headers)) return '';
  const found = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return found?.value || '';
}

export async function fetchGmailProfile(accessToken: string): Promise<{ emailAddress: string; messagesTotal: number }> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gmail profile request failed (${res.status})`);
  }
  return res.json();
}

export async function listGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.labels) ? data.labels : [];
}

export async function listGmailMessages(
  accessToken: string,
  options?: { query?: string; labelId?: string; maxResults?: number }
): Promise<GmailMessageSummary[]> {
  const params = new URLSearchParams();
  params.set('maxResults', String(options?.maxResults || 15));
  if (options?.query?.trim()) {
    params.set('q', options.query.trim());
  }
  if (options?.labelId && options.labelId !== 'ALL') {
    params.set('labelIds', options.labelId);
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to load Gmail messages (${res.status})`);
  }

  const listData = await res.json();
  const messageRefs: { id: string }[] = Array.isArray(listData.messages) ? listData.messages : [];
  if (messageRefs.length === 0) return [];

  const details = await Promise.all(
    messageRefs.map(async (ref) => {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!detailRes.ok) return null;
      const msg = await detailRes.json();
      const headers = msg.payload?.headers || [];
      const labelIds: string[] = Array.isArray(msg.labelIds) ? msg.labelIds : [];
      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: getHeader(headers, 'Subject') || '(No Subject)',
        from: getHeader(headers, 'From') || 'Unknown Sender',
        to: getHeader(headers, 'To') || '',
        date: getHeader(headers, 'Date') || '',
        snippet: msg.snippet || '',
        bodyText: extractBodyFromPayload(msg.payload) || msg.snippet || '',
        labelIds,
        isUnread: labelIds.includes('UNREAD'),
      } as GmailMessageSummary;
    })
  );

  return details.filter((m): m is GmailMessageSummary => m !== null);
}

export async function sendGmailMessage(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string }> {
  const mime = [
    `To: ${params.to.trim()}`,
    `Subject: ${params.subject.trim()}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    params.body,
  ].join('\r\n');

  const raw = encodeBase64Url(mime);
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to send email (${res.status})`);
  }
  return res.json();
}

export async function trashGmailMessage(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to move email to Trash (${res.status})`);
  }
}

export async function markGmailMessageRead(accessToken: string, messageId: string): Promise<void> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to mark message as read (${res.status})`);
  }
}
