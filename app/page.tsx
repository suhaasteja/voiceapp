"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DOWNLOAD_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse"
];

export default function Home() {
  const [text, setText] = useState(
    "Drop your script here. I can preview with browser voices and generate a high-quality MP3 for download."
  );
  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewVoice, setPreviewVoice] = useState<string>("");
  const [downloadVoice, setDownloadVoice] = useState<string>(DOWNLOAD_VOICES[0]);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generationInfo, setGenerationInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedKey = window.localStorage.getItem("OPENAI_API_KEY");
    if (storedKey) {
      setApiKey(storedKey);
      setApiKeyReady(true);
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (!previewVoice && available.length > 0) {
        setPreviewVoice(available[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [previewVoice]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setGenerationInfo(null);
  }, [downloadVoice, rate, text]);

  const voiceOptions = useMemo(() => {
    return voices.map((voice) => ({
      label: `${voice.name} (${voice.lang})`,
      value: voice.name
    }));
  }, [voices]);

  const handlePreview = () => {
    if (!text.trim()) {
      setError("Add some text before previewing.");
      return;
    }
    setError(null);

    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    const selected = voices.find((voice) => voice.name === previewVoice);
    if (selected) {
      utterance.voice = selected;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleDownload = async () => {
    if (!text.trim()) {
      setError("Add some text before generating audio.");
      return;
    }
    if (!apiKey) {
      setError("Add your OpenAI API key to generate audio.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text,
          voice: downloadVoice,
          speed: rate
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate audio.");
      }

      const blob = await response.blob();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(URL.createObjectURL(blob));
      setGenerationInfo(`Voice: ${downloadVoice}, speed: ${rate.toFixed(2)}x`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <header>
        <h1>VoiceForge Studio</h1>
        <p>
          Craft lifelike speech with fine-tuned pitch, speed, and voice selection.
          Preview instantly in your browser, then generate a studio-grade MP3 for download.
        </p>
      </header>

      {!apiKeyReady ? (
        <section className="card">
          <h2>Connect OpenAI</h2>
          <div className="control">
            <label htmlFor="api-key">OpenAI API key</label>
            <input
              id="api-key"
              type="password"
              value={apiKeyInput}
              onChange={(event) => setApiKeyInput(event.target.value)}
              placeholder="sk-..."
              style={{
                width: "100%",
                borderRadius: 12,
                padding: "10px 12px",
                border: "1px solid rgba(31, 26, 22, 0.15)",
                fontSize: "0.95rem"
              }}
            />
            <div className="note">
              Your key is stored locally in this browser and sent only to the TTS API route.
            </div>
          </div>
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                if (!apiKeyInput.trim()) {
                  setError("Enter your OpenAI API key to continue.");
                  return;
                }
                window.localStorage.setItem("OPENAI_API_KEY", apiKeyInput.trim());
                setApiKey(apiKeyInput.trim());
                setApiKeyReady(true);
                setApiKeyInput("");
                setError(null);
              }}
            >
              Save Key
            </button>
            <button
              className="secondary"
              onClick={() => {
                window.localStorage.removeItem("OPENAI_API_KEY");
                setApiKey("");
                setApiKeyReady(false);
              }}
            >
              Clear Key
            </button>
          </div>
          {error && <div className="status">{error}</div>}
        </section>
      ) : (
      <div className="grid">
        <section className="card">
          <h2>Script</h2>
          <div className="control">
            <label htmlFor="script">Text input</label>
            <textarea
              id="script"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type or paste your narration..."
            />
          </div>
          <div className="actions">
            <button className="primary" onClick={handlePreview} disabled={isSpeaking}>
              {isSpeaking ? "Previewing..." : "Preview"}
            </button>
            <button className="secondary" onClick={handleStop} disabled={!isSpeaking}>
              Stop
            </button>
            <button className="ghost" onClick={handleDownload} disabled={isLoading}>
              {isLoading ? "Generating MP3..." : "Generate MP3"}
            </button>
          </div>
          {error && <div className="status">{error}</div>}
          {audioUrl && (
            <div>
              <audio className="audio" controls src={audioUrl} />
              {generationInfo && <div className="status">{generationInfo}</div>}
              <div className="actions">
                <a
                  href={audioUrl}
                  download={`voiceforge-${Date.now()}.mp3`}
                >
                  <button className="secondary">Download MP3</button>
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Preview Settings</h2>
          <div className="control">
            <label htmlFor="preview-voice">Browser voice</label>
            <select
              id="preview-voice"
              value={previewVoice}
              onChange={(event) => setPreviewVoice(event.target.value)}
            >
              {voiceOptions.length === 0 && <option>No voices detected</option>}
              {voiceOptions.map((voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>
          <div className="control">
            <label htmlFor="rate">Speed</label>
            <div className="range-row">
              <span>0.5x</span>
              <span>{rate.toFixed(2)}x</span>
              <span>2.0x</span>
            </div>
            <input
              id="rate"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
          </div>
          <div className="control">
            <label htmlFor="pitch">Pitch</label>
            <div className="range-row">
              <span>0.5</span>
              <span>{pitch.toFixed(2)}</span>
              <span>2.0</span>
            </div>
            <input
              id="pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={pitch}
              onChange={(event) => setPitch(Number(event.target.value))}
            />
            <div className="note">
              Pitch affects browser preview only. The MP3 is generated by the server voice model.
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Download Settings</h2>
          <div className="control">
            <label htmlFor="download-voice">Studio voice</label>
            <select
              id="download-voice"
              value={downloadVoice}
              onChange={(event) => setDownloadVoice(event.target.value)}
            >
              {DOWNLOAD_VOICES.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
            <div className="note">
              MP3 generation uses OpenAI TTS for consistent, high-quality audio.
            </div>
          </div>
        </section>
      </div>
      )}

      <footer>
        Tip: browser previews depend on installed voices. Chrome and Safari provide the widest set.
      </footer>
    </main>
  );
}
