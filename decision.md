# Decisions: story chats

This file explains, in plain words, why the chat feature is built the way it is.

## What it does

A user starts a story (a "scenario") from Explore. The story is split into scenes ("incidents"). In a scene, the user chats with characters and tries to reach a few goals ("milestones"). Nothing is scripted: the user can write anything and the AI answers in character. Behind the scenes the AI also checks the user's English, and a guide helps the user. At the end of a scene the user gets feedback, then chooses the next scene or "tomorrow".

## How to run it

1. Restart the dev server (the models changed and are cached while the server runs).
2. Load the stories and grammar topics: `pnpm seed ~/Downloads/stories.json ~/Downloads/grammar-topics.json`. It is safe to run again.
3. Open Explore, start a mission, chat.

Optional: set `AI_CHECK_MODEL` in `.env.local` to use a cheaper model for the English check.

---

## 1. The story file only keeps the skeleton

**Decision:** a scenario stores the setting, characters (with their secrets), scenes and goals. It does **not** store the ready-made hints, the three level variants (basic / mid / high) or the key vocabulary.

**Why:** you wanted the chat to feel free, not guided by fixed lines. Fixed hints would pull every user the same way. The AI now writes the replies, the guide advice and the vocabulary live, at the user's own level. The seed script ignores `variants` and `keyVocab` if they are still in the JSON, so you do not need to edit the file.

## 2. Two AI calls per message, at the same time

**Decision:** each message sends two calls in parallel:
1. **Story call:** the characters answer, the goals are checked, moods are updated, the guide gives advice, and useful new words are picked.
2. **Language check call:** only checks the user's English.

**Why:**
- A single call that does both would make the characters strict and boring, or make the grading sloppy. Two jobs, two prompts.
- They do not depend on each other, so running them together costs the time of one.
- The check can use a cheaper model (`AI_CHECK_MODEL`) because it needs less creativity.
- If the check fails, the chat still works (the user just gets no tip for that message). If the story call fails, nothing is saved and the text goes back into the box, so the user does not lose their message.

## 3. The guide does not need its own call every turn

**Decision:** the guide's advice comes back inside the story call. A separate guide call happens only when the user types a question to the guide.

**Why:** this is the cheapest way to have a guide that reacts after every reply. The guide knows the open goals and each character's mood, so it can say "Tobias is still angry, ask for his booking number". The prompt tells it to describe *what* to do, not to write the English sentence, so the user still has to think.

## 4. Characters have moods

**Decision:** the AI returns a mood and a trust score (0 to 10) for each character who speaks. We save it and send it back next turn. The browser never sees it.

**Why:** without it, a character forgets they were insulted two messages ago. With it, rude messages cool people down and honest answers warm them up. It also keeps secrets safe: Rafael's secret is only ever in the AI prompt, never sent to the browser.

## 5. Goals are checked by the AI, and scenes have an end

**Decision:** the story call says which goals the user newly reached. The scene ends when all goals are done, or after 30 user messages. After 20 messages the characters start steering toward a finish.

**Why:** some users need 4 messages and some need 12, so there is no fixed length. But a chat that never ends costs money and frustrates the user, so there is a safety limit. A scene that ends early gives less XP (20 instead of 50) and the feedback says which goals were missed.

## 6. Mistakes are tied to your grammar topics (and can have several)

**Decision:** the check call gets the list of the 124 topic slugs and titles. For each mistake it returns **a list** of slugs. The server throws away any slug that is not in your list. If no topic fits, the mistake is saved as `spelling`, `word_choice`, `punctuation`, `register` or `other`.

**Why:** one wrong sentence can break several rules ("I am want the information" breaks verb form and countable nouns), so one slug is not enough. Only allowing real slugs means the mistakes can later link to your lessons and exercises. The check also must copy the wrong words exactly from the message; if it cannot, we drop that mistake, so a tip never points at nothing.

**Also:** the lesson text itself (`lesson` in the grammar file) is stored as given and is never generated again, so it costs nothing.

## 7. Short messages are not checked

**Decision:** messages with fewer than 3 words (like "ok" or "yes sir") skip the language check.

**Why:** they almost never contain something useful and still cost a call.

## 8. Keep the AI's memory small

**Decision:** the AI only gets the scene, the characters of that scene, the last 8 messages, the current moods and a short recap of earlier scenes (`memorySummary`). Never the whole chat.

**Why:** sending the whole history makes every message more expensive than the last. The recap is a single sentence written at the end of each scene by the feedback call, so it costs nothing extra.

## 9. Feedback is mostly counting, not AI

**Decision:** at the end of a scene, plain code counts the mistakes per grammar topic, picks example corrections and lists the new words. One AI call then writes a short, kind summary from those numbers.

**Why:** the AI does not need to re-read the chat; the facts are already saved. If that one call fails, a simple default summary is used so the user can still move on.

## 10. Vocabulary builds itself, from three places

**Decision:** new words are saved to the user's list from (1) useful words in the characters' replies, (2) words the user misused, (3) words tapped in Reading (this already existed). They all go through one function, `addUserWord` in `lib/vocab-store.ts`.

**Why:** one place means one set of rules: a word the user already has is never duplicated, the shared word bank is filled too (so it shows in the Words flashcards) and `totalVocabLearned` counts correctly. I moved the Reading "save word" code into the same function.

## 11. The translate button is lazy

**Decision:** a character message is translated into the user's native language only when they tap Translate, and the result is saved on the message.

**Why:** most users do not tap it on most messages. Translating everything in advance would add cost to every reply.

## 12. Tips follow the user's correction setting

**Decision:** if the user chose "Correct me right away", a tip button appears under the message. If they chose "Tell me at the end", no tip appears during the chat; everything is in the end-of-scene feedback. Mistakes are saved either way.

## 13. Changes to the database shapes

- `Guide`: added `key` (maya, jonah, zara) so the story file can point to guides by name.
- `GrammarTopic`: added `lesson` (the full lesson from your JSON).
- `Scenario`: characters have `secret`, scenes have `title` and `openingFrom`; `variants` and `keyVocab` removed; the title is unique so the seed script can run again safely.
- `Message`: `sentences` replaced by `mistakes` (wrong, right, why, why in the user's language, topic slugs, category), plus `translation`.
- `UserScenarioProgress`: each scene's `feedback` is saved there; `hiddenState` holds the moods; `memorySummary` holds the recap. Removed the unused `difficulty` and the `not_started` status.

## 14. What I removed from the screens, and why

- **Persona row and "Featured" card in Explore:** they opened the fake sample chats. Real stories replace them. Free-talk personas can come back later as their own feature.
- **Category chips in Explore:** stories have no category in the data. Add a `category` to the story file if you want them back.
- **Voice messages in the chat:** the recording was simulated and sent a fixed sentence, which would be sent to the AI as if the user wrote it. Real voice needs speech-to-text first (see REPLACE.md #3).
- **The three sample hint chips:** replaced by the guide panel behind the light bulb. A dot on the bulb shows when the guide has something new.
- **Sample chat data** (`CH`, `CONV0`, `REPLIES`, …) in `lib/lingov/data.ts`.

## 15. Things I did not do (on purpose)

- **Tagging a character with @:** every character in the scene may answer; the AI decides who speaks. Simpler for the user.
- **Streaming the answer word by word:** the reply is JSON (replies + goals + moods + guide), so it cannot be shown until it is complete. Waiting 1 to 3 seconds with a typing indicator is acceptable for now.
- **Locking against two tabs sending at once:** the screen blocks double sends; the server does not.
- **Changing the difficulty after each scene:** the old field was never used, so I removed it instead of pretending.
- **Level-ups from chat XP:** XP and streak are updated like Reading and Writing do it. Level numbers are not recalculated anywhere in the app yet.

## 16. What is not tested

I checked the TypeScript compiles, the linter is clean, and the story and grammar files are valid (every character, guide and start scene id exists; 124 unique topics). I did **not** run a real chat, because that needs your database, the seed and an AI key. Run the steps at the top and try one scene end to end. Things most worth watching: whether the AI keeps to valid JSON (the code repairs small slips and throws a clear error otherwise), and whether goals are ticked at a good pace (tune the rules in `lib/chat/prompts.ts`).

## Where things are

| Part | File |
|---|---|
| Seed script | `scripts/seed.mjs` |
| What the AI is told | `lib/chat/prompts.ts` |
| AI calls and checking what comes back | `lib/chat/engine.ts` |
| Shared shapes | `lib/chat/types.ts` |
| Database + login + bookkeeping | `app/actions/chat.ts` |
| Chat state in the browser | `components/lingov/chat-state.ts` |
| Screens | `components/lingov/chats.tsx`, `explore.tsx`, `home.tsx` (Continue card) |

---

## 17. The chat screens use shadcn components, and the design lives there

**Decision:** the chat list, conversation, guide panel, feedback, Explore and the Home "Continue" card use the shadcn components in `components/ui` (Button, Input, Badge, Card, Avatar, Tabs, Progress, Sheet). The screens only pass layout classes (width, gap, position). Colours, radius, height and hover looks are set in the component files.

**Why:** to change how every button or field looks you now edit one file, not every screen. The Lingov colours were already shadcn theme variables in `globals.css`, so the components pick them up.

**What I added to the shadcn files:**
- `button.tsx`: variants `soft`, `warm` (peach); sizes `xl`, `2xl`, `chip`, `icon-round`.
- `input.tsx` (new): sizes `default`, `pill` (chat and search), `sm`.
- `badge.tsx`: variant `warm`.
- `card.tsx`: `interactive` option (pointer, green border on hover).
- `tabs.tsx` (new): `pills` variant for the chat filters.
- `avatar.tsx` (new): sizes `xl`, `2xl` and the dark gradient fallback.
- `sheet.tsx` (new, written by hand): bottom sheet on base-ui Dialog. It replaces the two hand-made sheets (tip and scenario), and brings Escape and focus handling.

**Not changed:** Reading, Writing, Onboarding, Profile and the rest of Home still use their old styles. Only the chat work was moved, so nothing else can break. The message bubbles and the goal segments in the chat header stay custom because shadcn has no component for them.

**Side effect to know:** running the shadcn CLI added a stray `cn` package to `package.json` and wrote `from "cn"` imports. I fixed the imports to `@/lib/utils` and removed the package.
