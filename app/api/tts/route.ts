const OPENAI_URL = "https://api.openai.com/v1/audio/speech";
const ALLOWED_VOICES = new Set([
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
]);

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!apiKey) {
    return Response.json({ error: "Missing OpenAI API key." }, { status: 401 });
  }

  let payload: { text?: string; voice?: string; speed?: number } = {};
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const text = payload.text?.trim();
  if (!text) {
    return Response.json({ error: "Text is required." }, { status: 400 });
  }

  const voice = payload.voice && ALLOWED_VOICES.has(payload.voice)
    ? payload.voice
    : "alloy";

  const speed = typeof payload.speed === "number" ? payload.speed : 1;
  const clampedSpeed = Math.min(2, Math.max(0.5, speed));

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      input: text,
      voice,
      format: "mp3",
      speed: clampedSpeed
    })
  });

  if (!response.ok) {
    const message = await response.text();
    return Response.json({ error: message || "TTS request failed." }, { status: 500 });
  }

  const audio = await response.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "attachment; filename=voiceforge.mp3"
    }
  });
}
