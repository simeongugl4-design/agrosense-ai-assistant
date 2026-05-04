// Tiny TTS helper around Web Speech Synthesis.
// Best-effort language matching with graceful fallback.

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(langHint?: string): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  if (langHint) {
    const exact = voices.find((v) => v.lang.toLowerCase() === langHint.toLowerCase());
    if (exact) return exact;
    const prefix = langHint.split("-")[0].toLowerCase();
    const partial = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (partial) return partial;
  }
  return voices.find((v) => v.default) ?? voices[0];
}

export function speak(
  text: string,
  options: { lang?: string; rate?: number; onEnd?: () => void } = {},
): void {
  if (!isSpeechSupported() || !text.trim()) return;
  stopSpeaking();
  const utt = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(options.lang);
  if (voice) utt.voice = voice;
  if (options.lang) utt.lang = options.lang;
  utt.rate = options.rate ?? 1;
  utt.onend = () => {
    if (currentUtterance === utt) currentUtterance = null;
    options.onEnd?.();
  };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isSpeechSupported() && window.speechSynthesis.speaking;
}

// Map app language label → BCP-47 tag for Web Speech.
const LANG_MAP: Record<string, string> = {
  English: "en-US",
  "Tok Pisin": "en-PG",
  Hindi: "hi-IN",
  Spanish: "es-ES",
  French: "fr-FR",
  Portuguese: "pt-BR",
  Swahili: "sw-KE",
  Indonesian: "id-ID",
  Vietnamese: "vi-VN",
  Tagalog: "tl-PH",
  Bengali: "bn-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
  Punjabi: "pa-IN",
};

export function languageToBcp47(label?: string): string {
  if (!label) return "en-US";
  return LANG_MAP[label] ?? "en-US";
}
