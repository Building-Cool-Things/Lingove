import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages } from "@openrouter/sdk/models/chatmessages.js";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set in environment variables");
}

// Singleton client — import this anywhere on the server side
export const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  httpReferer: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appTitle: "LingoVe",
});

// ── Models ────────────────────────────────────────────────────────────────────
// Change DEFAULT_MODEL here to switch the whole app at once.
// Or pass `model` per-call to override for a single request.
export const MODELS = {
  default:   "google/gemini-2.5-flash-lite",
  fast:      "google/gemini-3.1-flash",
  smart:     "google/gemini-3.1-pro-preview",
  gpt4o:     "openai/gpt-4o",
  gpt4oMini: "openai/gpt-4o-mini",
  sonnet:    "anthropic/claude-sonnet-4.5",
  haiku:     "anthropic/claude-haiku-4.5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS] | (string & {});

// ── Message helper type ───────────────────────────────────────────────────────
export type Message = ChatMessages;

// ── Options shared by both helpers ───────────────────────────────────────────
export type ChatOptions = {
  model?: ModelId;
  temperature?: number;
  maxTokens?: number;
};

// ── chat() — one-shot, returns the full reply string ─────────────────────────
export async function chat(
  messages: Message[],
  options?: ChatOptions,
): Promise<string> {
  const result = await openrouter.chat.send({
    chatRequest: {
      messages,
      model: options?.model ?? MODELS.default,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    },
  });

  return result.choices[0]?.message?.content ?? "";
}

// ── streamChat() — yields text chunks as they arrive ─────────────────────────
export async function* streamChat(
  messages: Message[],
  options?: ChatOptions,
): AsyncGenerator<string> {
  const result = await openrouter.chat.send({
    chatRequest: {
      messages,
      model: options?.model ?? MODELS.default,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      stream: true,
    },
  });

  for await (const chunk of result) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
