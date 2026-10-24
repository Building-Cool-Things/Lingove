// Server-side only (reads API keys). Any OpenAI-compatible API: OpenAI, Gemini, OpenRouter, Ollama, …
//
// Make as many configured instances as you need, each with its own endpoint, key, model and defaults:
//
//   const openai = createAI({ apiKey: process.env.OPENAI_API_KEY, model: "gpt-4o-mini" });
//   const local  = createAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama", model: "llama3.2" });
//   const tutor  = ai.with({ system: "You are a patient English tutor.", temperature: 0.4 }); // derive from one
//
// Every instance does the same four things:
//
//   await openai("Say hi")                                  -> string
//   for await (const t of openai.stream("Tell a story")) …  -> text chunks
//   await openai.json<{ a: number }>("Reply as JSON …")     -> parsed object
//   return openai.toResponse("Tell a story")                -> streaming Response for a route handler
//
// Per call, any option overrides the instance: openai("hi", { model: "gpt-4o", temperature: 0 }).
// The default instance `ai` reads AI_BASE_URL / AI_API_KEY / AI_MODEL, falling back to Gemini.
import OpenAI from "openai";
import { jsonrepair } from "jsonrepair";

export type Message = { role: "system" | "user" | "assistant"; content: string };
export type Input = string | Message[];

export type AiOptions = {
  model?: string;
  /** System prompt, added in front of the messages. */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  /** Any other chat.completions parameter (response_format, top_p, tools, reasoning_effort, …). */
  extra?: Record<string, unknown>;
};

export type AiConfig = AiOptions & {
  baseURL?: string;
  apiKey?: string;
  /** Extra HTTP headers sent on every request. */
  headers?: Record<string, string>;
};

export function createAI(config: AiConfig = {}) {
  let client: OpenAI | undefined;
  // Created on first use so a missing key never breaks importing this file.
  const getClient = () =>
    (client ??= new OpenAI({ apiKey: config.apiKey || "missing-key", baseURL: config.baseURL, defaultHeaders: config.headers }));

  const request = (input: Input, o: AiOptions) => {
    if (!config.apiKey) throw new Error("AI api key is not set for this instance (createAI({ apiKey })).");
    const system = o.system ?? config.system;
    return {
      model: o.model ?? config.model,
      messages: [...(system ? [{ role: "system" as const, content: system }] : []), ...(typeof input === "string" ? [{ role: "user" as const, content: input }] : input)],
      temperature: o.temperature ?? config.temperature,
      max_tokens: o.maxTokens ?? config.maxTokens,
      ...config.extra,
      ...o.extra,
    };
  };

  /** Full reply as a string. */
  async function ai(input: Input, o: AiOptions = {}): Promise<string> {
    const res = await getClient().chat.completions.create(request(input, o) as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, { signal: o.signal ?? config.signal });
    return res.choices[0]?.message?.content ?? "";
  }

  /** Reply as it arrives: yields text chunks. */
  ai.stream = async function* (input: Input, o: AiOptions = {}): AsyncGenerator<string> {
    const res = await getClient().chat.completions.create({ ...request(input, o), stream: true } as OpenAI.Chat.ChatCompletionCreateParamsStreaming, { signal: o.signal ?? config.signal });
    for await (const chunk of res) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  };

  /** Reply parsed as JSON (see parseJson). */
  ai.json = async <T = unknown>(input: Input, o: AiOptions = {}): Promise<T> => parseJson<T>(await ai(input, o));

  /** Streaming plain-text Response, ready to return from a route handler. */
  ai.toResponse = (input: Input, o: AiOptions = {}): Response => {
    const enc = new TextEncoder(), it = ai.stream(input, o);
    return new Response(
      new ReadableStream({
        async pull(ctrl) {
          const { value, done } = await it.next();
          if (done) ctrl.close();
          else ctrl.enqueue(enc.encode(value));
        },
        cancel() { void it.return(undefined); },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
    );
  };

  /** A new instance with some settings changed (different model, system prompt, endpoint, key, …). */
  ai.with = (overrides: AiConfig) => createAI({ ...config, ...overrides, extra: { ...config.extra, ...overrides.extra } });

  /** The raw OpenAI client, for what the helpers don't cover (embeddings, images, tools, …). */
  ai.client = getClient;

  return ai;
}

/** Parses LLM JSON: tolerates code fences, stray text around the object, small syntax slips. */
export function parseJson<T = unknown>(raw: string): T {
  let s = raw.replace(/^```(?:json)?[\r\n]*/im, "").replace(/[\r\n]*```\s*$/m, "").trim();
  const a = s.search(/[{[]/), b = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s) as T; } catch { /* fall through */ }
  try { return JSON.parse(jsonrepair(s)) as T; } catch (e) {
    throw new Error(`JSON repair failed: ${(e as Error).message}\n\nRaw snippet: ${s.slice(0, 300)}`);
  }
}

// ── Default instance: used by the Reading / Writing actions ──────────────────
// Defaults to Gemini's OpenAI-compatible endpoint (key: GEMINI_API_KEY). Point the whole app
// somewhere else with AI_BASE_URL / AI_API_KEY / AI_MODEL.
export const ai = createAI({
  baseURL: process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY,
  model: process.env.AI_MODEL || "gemini-3.5-flash-lite",
});

/** Existing call style: chat(messages, { temperature, maxTokens }) on the default instance. */
export const chat = (input: Input, o?: AiOptions) => ai(input, o);
