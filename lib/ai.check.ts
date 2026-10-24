// Run: node lib/ai.check.ts   (uses two local fake OpenAI-compatible servers, no network or key)
import assert from "node:assert";
import http from "node:http";
import { ai, chat, createAI, parseJson } from "./ai.ts";

type Seen = { url?: string; auth?: string; body?: Record<string, unknown> };
function fake(reply: string) {
  const seen: Seen[] = [];
  const server = http.createServer((req, res) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      const body = JSON.parse(data);
      seen.push({ url: req.url, auth: req.headers.authorization, body });
      if (body.stream) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        for (const t of ["Hel", "lo"]) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`);
        res.end("data: [DONE]\n\n");
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: reply } }] }));
      }
    });
  });
  return new Promise<{ seen: Seen[]; url: string; close: () => void }>((r) =>
    server.listen(0, () => r({ seen, url: `http://127.0.0.1:${(server.address() as { port: number }).port}/v1`, close: () => server.close() })),
  );
}

const A = await fake('```json\n{"a": 1,}\n```'), B = await fake("from B");

// Two instances, two endpoints, two keys, two models.
const one = createAI({ baseURL: A.url, apiKey: "key-A", model: "model-A", temperature: 0.7 });
const two = createAI({ baseURL: B.url, apiKey: "key-B", model: "model-B" });

assert.equal(await two("hi"), "from B");
assert.equal(B.seen[0].auth, "Bearer key-B");
assert.equal(B.seen[0].body?.model, "model-B");
assert.equal(A.seen.length, 0);

await one("hi", { system: "sys", maxTokens: 9, extra: { top_p: 0.5 } });
assert.equal(A.seen[0].url, "/v1/chat/completions");
assert.equal(A.seen[0].auth, "Bearer key-A");
assert.deepEqual(A.seen[0].body?.messages, [{ role: "system", content: "sys" }, { role: "user", content: "hi" }]);
assert.equal(A.seen[0].body?.temperature, 0.7); // instance default
assert.equal(A.seen[0].body?.max_tokens, 9);
assert.equal(A.seen[0].body?.top_p, 0.5);

// Per-call options beat instance defaults; .with() derives a new instance.
await one("hi", { model: "other", temperature: 0 });
assert.equal(A.seen[1].body?.model, "other");
assert.equal(A.seen[1].body?.temperature, 0);
await one.with({ model: "derived", system: "tutor" })("hi");
assert.equal(A.seen[2].body?.model, "derived");
assert.equal((A.seen[2].body?.messages as { content: string }[])[0].content, "tutor");

let text = "";
for await (const t of one.stream("hi")) text += t;
assert.equal(text, "Hello");
assert.equal(await one.toResponse("hi").text(), "Hello");
assert.deepEqual(await one.json("hi", { extra: { stream: false } }), { a: 1 });
assert.deepEqual(parseJson('noise {"b": [1, 2]} tail'), { b: [1, 2] });

// No key: a clear error at call time, not at import time.
await assert.rejects(() => createAI({ baseURL: A.url })("hi"), /api key/);
assert.equal(typeof chat, "function");
assert.equal(typeof ai.with, "function");

A.close(); B.close();
console.log("ai ok");
