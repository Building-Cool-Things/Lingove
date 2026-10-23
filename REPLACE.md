# Lingov UI — what is real, what is dummy, and how to replace it

The Lingov screens are a 1:1 port of the design prototype `Lingov Onboarding.dc.html`, covering its markup and its `class Component` logic. Wherever the backend already has data, the screens use it. Everything else uses the prototype's sample data and is marked in code with `dummy: see REPLACE.md`.

`README.md` and `reference-logic.js` were not in the design export. The Reading and Writing logic was ported from `rwVals`, `wsVals` and `evalSent` in the prototype's `class Component`. `node lib/lingov/writing.check.ts` checks the port against the prototype's own numbers: the sample essay scores **3.4**, the same value as the prototype's `write-fixed` demo.

## Map

| Piece | File |
|---|---|
| Sample content (chats, scenarios, words, exercises, languages, interests, …) | `lib/lingov/data.ts` |
| Reading passage, questions, marking | `lib/lingov/reading.ts` |
| Writing rules, sentence checker, scoring | `lib/lingov/writing.ts` (+ `writing.check.ts`) |
| App state (one object, like the prototype) and timers | `components/lingov/store.tsx` |
| Shared styles and logo | `components/lingov/ui.tsx` |
| Screens | `components/lingov/{auth-screen,onboarding,app-shell,home,chats,explore,practice,profile,reading-session,writing-session}.tsx` |
| Breakpoints `dk` 900 / `wd` 1100 / `xw` 1240 and keyframes | `app/globals.css` |

### Routes

| URL | Screen |
|---|---|
| `/` | Sign in / Create account (signed-in users are redirected to `/dashboard`) |
| `/onboarding` | 7 steps plus Done (onboarded users are redirected to `/dashboard`) |
| `/dashboard` | Home |
| `/dashboard/chats` | Chats list and chat |
| `/dashboard/explore` | Explore |
| `/dashboard/practice` | Practice (Words / Grammar / Exercises / Reading / Writing tabs) |
| `/dashboard/profile` | Profile |
| `/dashboard/practice/reading` | Reading session (full screen) |
| `/dashboard/practice/writing` | Writing session (full screen) |
| `/dashboard/{reading,writing,vocabulary,corrections,listening,progress,speaking}` | Earlier pages, now inside the new shell (`app/dashboard/(features)/layout.tsx`) |
| `/dashboard/{reading,writing}/practice`, `…/analysis/[id]` | Earlier AI reading and writing practice (unchanged) |

`app/dashboard/layout.tsx` sends signed-out users to `/` and users who have not onboarded to `/onboarding`. It also mounts `LingovProvider`, so state survives tab changes the same way it does in the prototype.

## Already real

- **Sign in, create account and Google**: better-auth in `auth-screen.tsx`. Errors show under the button.
- **Onboarding answers**: saved by `completeOnboarding` (`app/actions/onboarding.ts`) when you press "Start my first mission". The Done screen then goes to Home after 1.5s.
- **Back on onboarding step 1**: signs you out and returns to `/`, the same as going back to Auth in the prototype.
- **Name, initial, level, XP, XP to next level, streak, native language, daily goal, level, interest count, correction style, missions, words learned**: read from `UserProfile` through `getLingovData()` and turned into display values by `makeMe()` in `store.tsx`.
- **Word flashcards**: use `getVocabCards()` when the user has any vocabulary, and fall back to the prototype's 3 sample cards otherwise.
- **Log out**: `signOut()` → `/`.
- **Home avatar**: opens Profile. The prototype restarted the demo instead.
- **Install on Android**: uses the browser's `beforeinstallprompt`. It only works once the app has a manifest (see below).
- **Reading session** (`/dashboard/practice/reading`), backed by `app/actions/reading.ts`:
  - **On open:** `generateReadingTask({ objectiveOnly: true })` writes a passage for your difficulty and interests: 5 multiple-choice / True-False-Not given questions, the paragraph that holds each answer, the skill each question tests, and a 4–6 word glossary translated into your native language.
  - **Submit:** `submitReadingSession()` saves the attempt, grades it, and returns the AI feedback, real time taken and XP. It also updates XP, streak and difficulty, and the shell refreshes.
  - **Save word:** `saveWord()` in `app/actions/vocab.ts` adds the word to `UserVocab`, increments `totalVocabLearned`, and adds it to the shared word bank so it appears in Words flashcards.
  - **Practice again:** keeps the same passage. Opening Reading again after finishing generates a new one.
  - **Resume:** an unfinished passage and its answers survive a reload (localStorage).
- **Writing session** (`/dashboard/practice/writing`), backed by `app/actions/writing.ts`:
  - **On open:** `generateWritingQuestion()` supplies the prompt, topic, level, type and minimum words. The word goal, progress bar and "Check writing" all use that minimum.
  - **Check writing:** `submitWritingSession()` saves the essay and runs the AI analysis, which now also returns **word-level corrections** (`find` → `replace`). These are stored on the submission (`corrections` in `models/writing.ts`), and `analyseAI()` in `lib/lingov/writing.ts` maps them onto the design: highlights, categories, Apply / Apply all, the Improved view, and a score that rises as you apply fixes. XP, streak and difficulty update.
  - **Resume:** the draft is kept across reloads ("Saved as you type"). "Try a sample" only appears on the demo prompt, because there is no sample answer for AI prompts.
- **Launchers** (Practice Reading/Writing cards, Home skill cards): show the unfinished task, or the next task's level and XP for your current difficulty.
- **Demo links** (`?demo=`): still run the prototype's sample passage, essay and rule checker locally; nothing is saved.

## Dummy data and how to replace it

| # | Dummy | Where | Replace with |
|---|---|---|---|
| 1 | Minutes practised today, fixed at `8` (ring, Today card, "N more minutes…") | `store.tsx` `makeMe()` (`today: 8`) | Store practice minutes per day on `UserProfile` (or a sessions collection) and fill `today` in `lib/lingov-data.ts` → `LingovProfile` |
| 2 | ~~Chat list, conversations, replies, tips~~: **now real**, see `decision.md` | — | — |
| 3 | Voice messages are simulated (timer and waveform, no microphone; the transcript is a hint sentence) | removed from the chat (it sent a fixed sentence to the AI) | `navigator.mediaDevices.getUserMedia` + `MediaRecorder`, upload, speech-to-text, then `push(transcript, { voice: seconds })` |
| 4 | ~~Scenarios, personas~~: scenarios are **now real** (seed with `pnpm seed`, see `decision.md`). Free-talk personas and the Featured card were removed | — | — |
| 5 | ~~Home Continue card~~: **now real** (latest unfinished chat) | — | — |
| 6 | Daily challenge ("Return a dish to the kitchen", arrow does nothing) | `home.tsx` | Add a daily scenario and open its sheet / chat |
| 7 | Recommended cards and weak spots | `data.ts` `RECS`, `WEAK` | Recommendations from `models/scenario.ts` matched to interests; weak spots from `models/grammar-topic.ts` / `models/user-learning.ts` |
| 8 | "12 words to review" (Home), "My words" states (New / Learning / Review / Mastered) | `home.tsx`, `data.ts` `WORDS` | `models/user-vocab.ts` (per-user word state). Again / Good both move to the next card, as in the prototype; add spaced repetition there |
| 9 | Grammar topics and exercises | `data.ts` `TOPICS`, `EXQ` | `models/grammar-topic.ts`, `models/exercise.ts`. "Correct. +3 XP" does not award XP yet |
| 10 | ~~Reading session~~: **now real**, see "Already real" | — | — |
| 11 | ~~Writing session~~: **now real**, see "Already real" | — | — |
| 12 | ~~Skill card subtitles~~: **now real** (current task or next difficulty) | — | — |
| 13 | Profile: "Explorer" title, week chart ("46 min total"), badges | `profile.tsx`, `data.ts` `WEEK`, `BADGES` | Week chart from `profile.activeDays` + minutes from #1; badges from stats |
| 14 | Settings rows only display values (chevrons do nothing); Theme is always "Dark" | `profile.tsx` | One edit sheet per row that writes to `UserProfile`. The design is dark-only |
| 15 | Forgot password, Terms, Privacy links (`href="#"`) | `auth-screen.tsx` | Turn on better-auth's `sendResetPassword` (needs an email sender) and add `/terms` and `/privacy` pages |
| 16 | "Take the 5 question test" | `onboarding.tsx` | A 5-question placement quiz that sets `level` |
| 17 | Installing the app | `onboarding.tsx` step 7 | Add `app/manifest.ts` plus 192px and 512px icons in `public/`. The button then opens the native install prompt |
| 18 | Chat "⋮ More", "Save to practice" in the tip sheet | `chats.tsx` | More menu (restart / leave mission); save the tip to `models/user-learning.ts` |

Controls wired to the obvious destination, which the prototype left doing nothing:

- Home: "See all" and the recommended cards → Explore; weak spots "Practice" → Practice/Grammar; "Review" → Practice/Words.
- Practice: Grammar "Practice" → Exercises.
- Chats: "+" → Explore; tip sheet "Practice now" → Practice/Exercises.

## Reading and Writing: behaviour notes

- **After deploying these changes, restart the server.** `models/writing.ts` caches its schema across hot reloads, so a dev server started before the `corrections` field was added will silently drop it.
- **Older Reading pages:** the earlier AI practice pages (`/dashboard/reading/practice`, `/dashboard/writing/practice`) call the same actions with no options and behave as before. Medium/hard passages there can still include short-answer questions; the Lingov session always asks for 5 objective questions to match the design.
- **XP is fixed per difficulty, as before:** Reading 30 / 60 / 100 and Writing 40 / 80 / 120 (`lib/skill-config.ts`, shared by the actions and the UI). It is not scaled by the score.
- **Writing score:** `10 × (1 − sentences with an error ÷ sentences)`. This is the backend formula, recomputed in the browser as fixes are applied. Fixes you apply after checking are not re-saved; press "Edit my response" → "Check writing" to submit the improved text as a new attempt.
- **Missing extras:** if the AI omits a question's paragraph number, the ¶ button and "Show in passage" are hidden for that question. If it returns no usable glossary words, nothing is underlined and the "Tap underlined words" hint is hidden.

## States that aren't in the prototype design

- **Preparing / error card** (Reading and Writing): shown while the AI builds the task, or if it fails ("Try again"). It reuses the "checking" card layout.
- **Submit / check errors:** shown in red in place of "n/5 answered" (Reading) or "Saved as you type" (Writing).

- **Sign-in error**: 12.5px `#ea7a4f` text under the button. While a request is in flight, the button drops to 0.45 opacity.
- **Onboarding save error**: shown in the hint line under Continue.
- **Home "Daily goal done…"**: used when today's minutes reach the goal; the prototype only wrote "N more minutes".
- **Greeting**: follows the time of day (morning / afternoon / evening) instead of always "Good evening".
- **Done screen**: shown after step 7, then Home after 1.5s. The prototype skipped it, and its "Restart flow" button (a demo tool) was removed.
- **Mobile device frame**: the prototype's 390×844 frame and fake "9:41" status bar are left out, so the phone layout fills the real screen.

## Demo links (session states)

`?demo=` works exactly like the prototype's `applyDemo`. It replaces session state on load.

- Reading: `/dashboard/practice/reading?demo=` `read-start` · `read-word` · `read-ready` · `read-checking` · `read-results` · `read-review`
- Writing: `/dashboard/practice/writing?demo=` `write-empty` · `write-draft` · `write-ready` · `write-checking` · `write-results` · `write-selected` · `write-improved` · `write-fixed`

## Acceptance checklist

Widths: **mobile** below 900px; **desktop** 900px and up; **brand panel** 1100px and up; **chat context panel** 1240px and up.

**Auth (`/`, signed out)**
- [ ] Sign in tab is the default: title "Learn English by talking.", Forgot password? link, CTA "Sign in".
- [ ] Create account tab: Name field appears, Forgot password? disappears, CTA "Create account".
- [ ] Password strength on Create account: empty shows no label; type `abc` → Weak, `abcdefgh` → Weak, `Abcdefgh` → Fair, `Abcdefg1` → Good, `Abcdefg1!` → Strong.
- [ ] Mobile: chat preview card under the title. 900–1099: centred 400px form, no preview. 1100+: brand panel on the left, form 500px wide.
- [ ] A wrong password shows the error under the button.
- [ ] Creating an account → `/onboarding`. Signing in → `/dashboard`. Google → Google consent screen.

**Onboarding (`/onboarding`, new account)**
- [ ] Header: back button, 7 dots fill as you go, `n/7`. Back on step 1 signs out to `/`.
- [ ] 1: search `espan` finds Español (accents ignored). `xyz` → "No language matches “xyz”.". Ticking a language animates the check.
- [ ] 2: English is selected. Notify me ↔ We will tell you toggles on each "Coming soon" row.
- [ ] 3: starts at 3 picked (`3/15`, green). Remove one → orange `2/15`, Continue disabled, hint "Pick 1 more to continue". Pick until 15: other chips turn grey and won't add. `zzz` → nothing-found text.
- [ ] 4: level cards with code badge. A2 is selected.
- [ ] 5: 2×2 goals, selected tag turns peach.
- [ ] 6: radio cards. Preview shows "1 tip" (instant) or "Tips appear in your summary" (end).
- [ ] 7: install card. CTA reads "Start my first mission".
- [ ] Press it → saves → "You are set" → Home after 1.5s. Desktop: column max 600px.

**Shell**
- [ ] Desktop: 240px sidebar with 5 tabs (active tab tinted), SKILLS → Reading/Writing open the sessions and are highlighted while Practice is on that tab, Today card (`8 / goal min`, bar, streak), user row.
- [ ] Mobile: bottom tab bar, hidden while a chat is open.

**Home (`/dashboard`)**
- [ ] Header (avatar → Profile, greeting, name, streak, Lv). Daily goal ring and XP bar. Continue card → chat 0. Recommended carousel. Reading and writing cards → sessions. Daily challenge. Weak spots. Words to review.
- [ ] Desktop 6-column grid: at 900–1099 the challenge and weak spots are half width; at 1100+ they are a third each, with words to review beside them. Mobile: one column in the prototype's order.

**Chats (`/dashboard/chats`)**
- [ ] List: search, All / In progress / Completed, rows with Done or x/y pills, "No chats found.". Personas only appear after you start one from Explore.
- [ ] Mobile: tap a row → full-screen chat with a back arrow; tabs hidden. Desktop: 340px list plus chat 0 open by default; selected row highlighted.
- [ ] Translate ↔ Hide on AI messages. "1 tip" under "Hello, I am want…" opens the tip sheet; Got it / Save to practice close it, Practice now → Exercises.
- [ ] Lightbulb toggles 3 hint chips; tapping one fills the draft. Typing turns the mic dark and shows Send; Enter sends. Header shows "typing…" with dots, and a reply arrives after ~1.3s. The list scrolls to the bottom.
- [ ] Mic → recording bar (red dot, timer up to 1:00, 22 animated bars), trash cancels, send posts a voice bubble. Play fills the waveform and turns into pause.
- [ ] 1240+: context panel with goals, key words, tip count.

**Explore (`/dashboard/explore`)**
- [ ] Search matches title and goal. 7 chips. Personas and Featured only on All with an empty search. A persona → Chats with that persona open and added to the list.
- [ ] Bookmark toggles green. Card or Featured → scenario sheet (goals, key words). Start mission → chat 0. `zzz` → "No scenarios match. Try another topic.".

**Practice (`/dashboard/practice`)**
- [ ] Words: tap the card to flip to the meaning (green). Again/Good → next card, unflipped. My words grid with 4 state colours.
- [ ] Grammar: 4 topics, orange below 50%, trend icons. Practice → Exercises.
- [ ] Exercises: Check disabled until you pick. Right answer → green check plus "Correct. +3 XP". Wrong → red ✕ plus "Not quite" and the reason. Continue → next question (3, then repeats).
- [ ] Reading / Writing tabs: launcher card → session.

**Reading session**: walk through it with the `read-*` demo links above, then check by hand:
- [ ] Tap an underlined word → word card; Save word ↔ Saved; ✕ closes.
- [ ] ¶ button highlights and dims paragraphs.
- [ ] Submit stays disabled until 5/5 → checking (1.6s) → results. The first wrong answer is already open. Show in passage highlights the paragraph.
- [ ] Practice again / Retry resets.
- [ ] Desktop: two panes side by side, footer in the right pane. Mobile: stacked, footer at the bottom.

**Writing session**: walk through it with the `write-*` demo links, then check by hand:
- [ ] Try a sample → 113 words, plan 2 of 3. Clear empties it. Check stays disabled below 100 words.
- [ ] Check → 1.7s → score 3.4 "Needs work", 11 issues.
- [ ] Filters by category. Tap a highlight or a card to select it. Apply fixes one sentence. Apply all → 0 issues, "Every sentence is correct", "Up from 3.4 after your fixes".
- [ ] Improved view. Edit my response returns to the editor.

**Profile (`/dashboard/profile`)**
- [ ] Header and XP bar, 4 stats (real), week chart (today green), 6 badges (4 dimmed), 6 settings rows showing your onboarding answers, Log out → `/`.

Logic check: `node lib/lingov/writing.check.ts` → `writing ok`.
