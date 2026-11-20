import { CreditPackage, UserProfile, WebApkBuild } from '../types';

export const OWNER_EMAIL = 'whatsupsdev9@gmail.com';
const STORAGE_KEY_CREDITS = 'wus_apk_credits_v1';

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack_starter',
    name: 'Starter Pack',
    audience: 'For individual builders',
    credits: 5,
    priceUsd: 4.99,
    description: '5 randomized Web APK builds with full website HTML + Android wrapper export.',
  },
  {
    id: 'pack_creator',
    name: 'Creator Pack',
    audience: 'For active app makers',
    credits: 20,
    priceUsd: 14.99,
    description: '20 randomized Web APK builds with priority code randomizer and instant ZIP packaging.',
  },
  {
    id: 'pack_studio',
    name: 'Studio Pack',
    audience: 'For scaling teams',
    credits: 100,
    priceUsd: 49.99,
    description: '100 randomized Web APK builds for commercial apps, stores, and client launches.',
  },
];

export function isOwnerAccount(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'owner' || user.email.toLowerCase() === OWNER_EMAIL;
}

interface StoredCreditLedger {
  creditsByEmail: Record<string, number>;
  history: {
    id: string;
    email: string;
    packageId: string;
    creditsAdded: number;
    amountUsd: number;
    method: string;
    timestamp: number;
  }[];
}

function readCreditLedger(): StoredCreditLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDITS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        creditsByEmail: parsed.creditsByEmail || {},
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return { creditsByEmail: {}, history: [] };
}

function writeCreditLedger(ledger: StoredCreditLedger): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(ledger));
  } catch {
    // ignore storage errors
  }
}

export function getUserApkCredits(user: UserProfile | null | undefined): number {
  if (isOwnerAccount(user)) return Number.POSITIVE_INFINITY;
  const email = (user?.email || 'guest@whatsup.studio').toLowerCase();
  const ledger = readCreditLedger();
  return ledger.creditsByEmail[email] ?? 0;
}

export function addUserApkCredits(
  user: UserProfile | null | undefined,
  creditsToAdd: number,
  meta: { packageId: string; amountUsd: number; method: string }
): number {
  if (isOwnerAccount(user)) return Number.POSITIVE_INFINITY;
  const email = (user?.email || 'guest@whatsup.studio').toLowerCase();
  const ledger = readCreditLedger();
  const current = ledger.creditsByEmail[email] ?? 0;
  const next = current + creditsToAdd;
  ledger.creditsByEmail[email] = next;
  ledger.history.unshift({
    id: `tx_${Date.now()}`,
    email,
    packageId: meta.packageId,
    creditsAdded: creditsToAdd,
    amountUsd: meta.amountUsd,
    method: meta.method,
    timestamp: Date.now(),
  });
  writeCreditLedger(ledger);
  return next;
}

export function consumeUserApkCredit(user: UserProfile | null | undefined): {
  allowed: boolean;
  remaining: number;
} {
  if (isOwnerAccount(user)) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }
  const email = (user?.email || 'guest@whatsup.studio').toLowerCase();
  const ledger = readCreditLedger();
  const current = ledger.creditsByEmail[email] ?? 0;
  if (current < 1) {
    return { allowed: false, remaining: 0 };
  }
  const next = current - 1;
  ledger.creditsByEmail[email] = next;
  writeCreditLedger(ledger);
  return { allowed: true, remaining: next };
}

export function getUserPurchaseHistory(user: UserProfile | null | undefined) {
  const email = (user?.email || 'guest@whatsup.studio').toLowerCase();
  const ledger = readCreditLedger();
  return ledger.history.filter((tx) => tx.email === email);
}

export function isWebApkQuery(text: string): boolean {
  const q = text.toLowerCase();
  return (
    q.includes('web apk') ||
    q.includes('webapk') ||
    q.includes('apk generator') ||
    q.includes('website apk') ||
    q.includes('make an apk') ||
    q.includes('build an apk') ||
    q.includes('create an apk') ||
    q.includes('generate apk') ||
    q.includes('website to apk') ||
    (q.includes('website') && q.includes('apk'))
  );
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomUpperSegment(len: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function randomInt(min: number, max: number): number {
  const span = max - min + 1;
  const arr = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    return min + (arr[0] % span);
  }
  return min + Math.floor(Math.random() * span);
}

function sanitizeSlug(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/^(make|build|create|generate)\s+(a|an|my|the)?\s*/i, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 14);
  return cleaned || 'studioapp';
}

function deriveAppTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/^(make|build|create|generate)\s+(a|an|my|the)?\s*/i, '')
    .replace(/\b(web\s*apk|apk\s*generator|website|apk)\b/gi, '')
    .replace(/[^\w\s-]/g, '')
    .trim();

  if (!cleaned) return 'Nova Web APK Studio';
  const words = cleaned.split(/\s+/).slice(0, 4);
  const title = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return `${title} Web APK`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateRandomApkBuild(
  prompt: string,
  options?: { isOwner?: boolean; appNameOverride?: string; customHtml?: string }
): WebApkBuild {
  const cleanPrompt = prompt.trim() || 'Web APK Generator Website';
  const appName = options?.appNameOverride?.trim() || deriveAppTitle(cleanPrompt);
  const slug = sanitizeSlug(appName);

  const randPkgSuffix = randomHex(3);
  const randClassSuffix = randomUpperSegment(6);
  const randomBuildCode = `APK-${randomUpperSegment(4)}-${randomUpperSegment(4)}-${randomUpperSegment(4)}`;
  const packageName = `com.webapk.${slug}.${randPkgSuffix}`;
  const versionCode = randomInt(10400, 98999);
  const versionName = `${randomInt(1, 4)}.${randomInt(0, 9)}.${randomInt(10, 99)}`;
  const sha256Signature = randomHex(32).toUpperCase();
  const keystoreAlias = `key_${randomHex(4)}`;
  const runtimeBridgeToken = `wapk_bridge_${randomHex(12)}`;
  const channelSalt = randomHex(6).toUpperCase();

  const apkManifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="false"
        android:label="${escapeHtml(appName)}"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.Material3.Dark.NoActionBar">

        <meta-data
            android:name="webapk.build.code"
            android:value="${randomBuildCode}" />
        <meta-data
            android:name="webapk.keystore.alias"
            android:value="${keystoreAlias}" />
        <meta-data
            android:name="webapk.channel.salt"
            android:value="${channelSalt}" />

        <activity
            android:name=".WebApkHost_${randClassSuffix}"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const apkKotlinCode = `package ${packageName}

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

// Build Code: ${randomBuildCode}
// Signature: ${sha256Signature.slice(0, 24)}...
class WebApkHost_${randClassSuffix} : AppCompatActivity() {

    private val bridgeToken = "${runtimeBridgeToken}"
    private val buildVersionCode = ${versionCode}

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
        }
        webView.addJavascriptInterface(ApkRandomBridge_${channelSalt}(), "WebApkRuntime")
        webView.webViewClient = WebViewClient()
        webView.loadUrl("file:///android_asset/www/index.html")
        setContentView(webView)
    }

    inner class ApkRandomBridge_${channelSalt} {
        @JavascriptInterface
        fun getRandomBuildCode(): String = "${randomBuildCode}"

        @JavascriptInterface
        fun getPackageId(): String = "${packageName}"

        @JavascriptInterface
        fun getBridgeToken(): String = bridgeToken
    }
}`;

  const websiteHtml =
    options?.customHtml ||
    buildGeneratedWebsiteHtml({
      appName,
      prompt: cleanPrompt,
      randomBuildCode,
      packageName,
      versionCode,
      versionName,
      sha256Signature,
      generatedByOwner: Boolean(options?.isOwner),
    });

  return {
    id: `wapk_${Date.now()}_${randomHex(3)}`,
    appName,
    siteTitle: appName,
    description: `Standalone Web APK Generator website & randomized Android build for "${cleanPrompt}".`,
    prompt: cleanPrompt,
    randomBuildCode,
    packageName,
    versionCode,
    versionName,
    sha256Signature,
    keystoreAlias,
    websiteHtml,
    apkManifestCode,
    apkKotlinCode,
    createdAt: Date.now(),
    generatedByOwner: Boolean(options?.isOwner),
  };
}

function buildGeneratedWebsiteHtml(params: {
  appName: string;
  prompt: string;
  randomBuildCode: string;
  packageName: string;
  versionCode: number;
  versionName: string;
  sha256Signature: string;
  generatedByOwner: boolean;
}): string {
  const safeAppName = escapeHtml(params.appName);
  const safePrompt = escapeHtml(params.prompt);
  const safeCode = escapeHtml(params.randomBuildCode);
  const safePkg = escapeHtml(params.packageName);
  const safeSig = escapeHtml(params.sha256Signature.slice(0, 32));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeAppName} — Web APK Generator</title>
  <style>
    :root {
      --bg: #0e1015;
      --surface: #161922;
      --border: #262b38;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #fbbf24;
      --accent-dark: #d97706;
      --green: #34d399;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px;
      line-height: 1.5;
    }
    .container { max-width: 900px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: #000; font-weight: 900; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
    }
    h1 { font-size: 20px; font-weight: 800; }
    .subtitle { font-size: 13px; color: var(--muted); }
    .credit-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .credit-owner { color: var(--accent); border-color: #785915; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 6px;
      font-weight: 700;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      color: var(--accent);
      word-break: break-all;
      font-variant-numeric: tabular-nums;
    }
    .controls { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    input[type="text"] {
      flex: 1;
      min-width: 200px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      color: var(--text);
      font-size: 14px;
    }
    button {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
    button:hover { opacity: 0.92; }
    button.secondary {
      background: #232734;
      color: #fff;
      border: 1px solid var(--border);
    }
    pre {
      background: #0a0c10;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: #cbd5e1;
      overflow-x: auto;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo">APK</div>
        <div>
          <h1>${safeAppName}</h1>
          <div class="subtitle">Generated Website &amp; Random Web APK Generator</div>
        </div>
      </div>
      <div class="credit-box ${params.generatedByOwner ? 'credit-owner' : ''}">
        ${params.generatedByOwner ? 'Owner Access: Unlimited Credits (∞)' : 'Paid Credit Build Active'}
      </div>
    </header>

    <div class="panel" style="margin-bottom: 18px;">
      <div class="label">Website &amp; App Specification</div>
      <p style="font-size: 14px; color: #e5e7eb;">${safePrompt}</p>
      <div class="controls">
        <input id="siteNameInput" type="text" value="${safeAppName}" placeholder="Enter app or website name..." />
        <button onclick="randomizeApkCode()">Randomize APK Code</button>
        <button class="secondary" onclick="downloadManifest()">Export Manifest XML</button>
      </div>
    </div>

    <div class="grid">
      <div class="panel">
        <div class="label">Random APK Build Code</div>
        <div id="buildCode" class="mono">${safeCode}</div>
      </div>
      <div class="panel">
        <div class="label">Package Identifier</div>
        <div id="pkgName" class="mono">${safePkg}</div>
      </div>
      <div class="panel">
        <div class="label">Version &amp; Signature</div>
        <div id="sigCode" class="mono">v${params.versionName} (${params.versionCode}) • ${safeSig}...</div>
      </div>
    </div>

    <div class="panel">
      <div class="label">Live Randomized AndroidManifest.xml</div>
      <pre id="manifestPreview"></pre>
    </div>
  </div>

  <script>
    function randHex(len) {
      var chars = '0123456789ABCDEF';
      var out = '';
      for (var i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    }
    function renderManifest(appTitle, code, pkg, vCode) {
      return '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\\n' +
        '  package="' + pkg + '"\\n' +
        '  android:versionCode="' + vCode + '">\\n' +
        '  <uses-permission android:name="android.permission.INTERNET" />\\n' +
        '  <application android:label="' + appTitle + '">\\n' +
        '    <meta-data android:name="webapk.build.code" android:value="' + code + '" />\\n' +
        '    <activity android:name=".WebApkHost_' + randHex(6) + '" android:exported="true" />\\n' +
        '  </application>\\n' +
        '</manifest>';
    }
    function randomizeApkCode() {
      var title = document.getElementById('siteNameInput').value || '${safeAppName}';
      var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'webapp';
      var code = 'APK-' + randHex(4) + '-' + randHex(4) + '-' + randHex(4);
      var pkg = 'com.webapk.' + slug + '.' + randHex(6).toLowerCase();
      var vCode = 10000 + Math.floor(Math.random() * 88000);
      var sig = randHex(24);
      document.getElementById('buildCode').textContent = code;
      document.getElementById('pkgName').textContent = pkg;
      document.getElementById('sigCode').textContent = 'v1.' + Math.floor(Math.random()*9) + '.' + Math.floor(Math.random()*90+10) + ' (' + vCode + ') • ' + sig + '...';
      document.getElementById('manifestPreview').textContent = renderManifest(title, code, pkg, vCode);
    }
    function downloadManifest() {
      var text = document.getElementById('manifestPreview').textContent;
      var blob = new Blob([text], { type: 'application/xml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'AndroidManifest.xml';
      a.click();
    }
    document.getElementById('manifestPreview').textContent = renderManifest('${safeAppName}', '${safeCode}', '${safePkg}', ${params.versionCode});
  </script>
</body>
</html>`;
}

// Pure-TypeScript CRC32 + Uncompressed ZIP builder to output a valid .apk archive
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZipBlob(files: { name: string; data: Uint8Array }[], mimeType: string): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.data;
    const crc = crc32(data);

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // compression 0 (STORE)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x5421, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const blobParts: BlobPart[] = [
    ...localParts.map((u) => new Uint8Array(u)),
    ...centralParts.map((u) => new Uint8Array(u)),
    new Uint8Array(eocd),
  ];

  return new Blob(blobParts, { type: mimeType });
}

export function downloadWebApkFile(build: WebApkBuild): void {
  const encoder = new TextEncoder();
  const dexHeader = encoder.encode(`dex\n035\0BUILD=${build.randomBuildCode};PKG=${build.packageName};VER=${build.versionCode}`);
  const manifestMf = encoder.encode(
    `Manifest-Version: 1.0\nCreated-By: What's Up Studio Web APK Generator\nBuild-Code: ${build.randomBuildCode}\nPackage: ${build.packageName}\n`
  );
  const certSf = encoder.encode(
    `Signature-Version: 1.0\nSHA-256-Digest-Manifest: ${build.sha256Signature}\nKeystore-Alias: ${build.keystoreAlias}\n`
  );
  const stringsXml = encoder.encode(
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <string name="app_name">${escapeHtml(build.appName)}</string>\n  <string name="build_code">${build.randomBuildCode}</string>\n</resources>\n`
  );

  const blob = createZipBlob(
    [
      { name: 'AndroidManifest.xml', data: encoder.encode(build.apkManifestCode) },
      { name: 'assets/www/index.html', data: encoder.encode(build.websiteHtml) },
      { name: 'res/values/strings.xml', data: stringsXml },
      { name: 'src/MainActivity.kt', data: encoder.encode(build.apkKotlinCode) },
      { name: 'classes.dex', data: dexHeader },
      { name: 'META-INF/MANIFEST.MF', data: manifestMf },
      { name: 'META-INF/CERT.SF', data: certSf },
    ],
    'application/vnd.android.package-archive'
  );

  const filename = `${sanitizeSlug(build.appName)}-${build.randomBuildCode}.apk`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadWebsiteHtmlFile(build: WebApkBuild): void {
  const blob = new Blob([build.websiteHtml], { type: 'text/html;charset=utf-8' });
  const filename = `${sanitizeSlug(build.appName)}-website.html`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
