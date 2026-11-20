// Universal robust Voice Service for Speech Recognition (Voice-to-Text) and Speech Synthesis (Text-to-Voice)

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isDefault: boolean;
}

// 1. Text-To-Speech (AI Voice)
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const handler = () => {
      voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(voices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 400);
  });
}

export async function getBestVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  // Prefer natural / high quality voices
  const preferred = voices.find(
    (v) =>
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Siri') ||
        v.name.includes('Samantha') ||
        v.name.includes('Jenny') ||
        v.name.includes('Guy')) &&
      v.lang.startsWith('en')
  );

  if (preferred) return preferred;
  const english = voices.find((v) => v.lang.startsWith('en'));
  if (english) return english;
  return voices.find((v) => v.default) || voices[0] || null;
}

export async function speakText(
  text: string,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  if (!('speechSynthesis' in window)) {
    onError?.('Speech synthesis is not supported on this browser');
    return;
  }

  window.speechSynthesis.cancel();

  // Strip code blocks and markdown formatting to speak cleanly
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*`_~>[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  const bestVoice = await getBestVoice();
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    if (e.error === 'canceled' || e.error === 'interrupted') {
      onEnd?.();
    } else {
      console.warn('SpeechSynthesis error:', e);
      onError?.(e);
    }
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// 2. Microphone Hardware Access & Speech Recognition (Voice-To-Text)
export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

/**
 * Pre-warms & requests explicit microphone permission via getUserMedia.
 * This guarantees the browser asks for mic permissions and activates the hardware
 * before Web Speech API listens.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the probe tracks so it doesn't leave the red dot on indefinitely
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      console.warn('getUserMedia mic request result/error:', err?.name || err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission was denied. Please click the lock or camera/mic icon in your browser URL bar to allow microphone access.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        throw new Error('No microphone device found on this computer or phone. Please plug in or connect a microphone.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        throw new Error('Microphone is already in use by another app (e.g. Discord, Zoom, or another tab).');
      }
      throw err;
    }
  }
  return true;
}

export class RobustSpeechRecognition {
  private recognition: any = null;
  private isListening = false;
  private handlers: SpeechRecognitionHandlers = {};
  private autoRestart = false;

  constructor(handlers: SpeechRecognitionHandlers) {
    this.handlers = handlers;
  }

  private createInstance() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    try {
      const instance = new SpeechRecognition();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = navigator.language || 'en-US';
      instance.maxAlternatives = 1;

      instance.onstart = () => {
        this.isListening = true;
        this.handlers.onStart?.();
      };

      instance.onresult = (event: any) => {
        let finalTranscripts = '';
        let interimTranscripts = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscripts += text;
          } else {
            interimTranscripts += text;
          }
        }

        if (finalTranscripts) {
          this.handlers.onResult?.(finalTranscripts, true);
        } else if (interimTranscripts) {
          this.handlers.onResult?.(interimTranscripts, false);
        }
      };

      instance.onerror = (event: any) => {
        console.warn('SpeechRecognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.autoRestart = false;
          this.handlers.onError?.('Microphone access blocked. Please click the lock icon in your browser address bar and allow Microphone.');
        } else if (event.error === 'audio-capture') {
          this.autoRestart = false;
          this.handlers.onError?.('No microphone detected. Please connect a microphone or headset.');
        } else if (event.error === 'no-speech') {
          // Standard pause when user is quiet
        } else if (event.error === 'network') {
          this.handlers.onError?.('Speech recognition network timeout. Please check your connection.');
        } else if (event.error !== 'aborted') {
          this.handlers.onError?.(`Voice dictation note: ${event.error}`);
        }
      };

      instance.onend = () => {
        if (this.autoRestart && this.isListening) {
          try {
            this.recognition = this.createInstance();
            this.recognition?.start();
            return;
          } catch {}
        }
        this.isListening = false;
        this.handlers.onEnd?.();
      };

      return instance;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition instance:', e);
      return null;
    }
  }

  public isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition
    );
  }

  public async start(): Promise<boolean> {
    if (!this.isSupported()) {
      this.handlers.onError?.(
        'Voice speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.'
      );
      return false;
    }

    // Step 1: Explicitly request microphone stream from user media to guarantee hardware readiness
    try {
      await requestMicrophonePermission();
    } catch (permErr: any) {
      this.handlers.onError?.(permErr.message || 'Microphone permission denied.');
      return false;
    }

    // Step 2: Fresh instance creation avoids "already started" or dead socket states
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }

    this.recognition = this.createInstance();
    if (!this.recognition) {
      this.handlers.onError?.('Failed to create speech recognition instance.');
      return false;
    }

    try {
      this.autoRestart = true;
      this.recognition.start();
      return true;
    } catch (err: any) {
      console.warn('Recognition start error:', err);
      this.handlers.onError?.('Could not activate microphone recognition. Try refreshing or clicking again.');
      return false;
    }
  }

  public stop(): void {
    this.autoRestart = false;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {}
      }
    }
  }

  public abort(): void {
    this.autoRestart = false;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }
  }
}
