// Sample content for the Lingov screens, copied verbatim from the prototype
// (Lingov Onboarding.dc.html, `class Component`). See REPLACE.md for what to swap for real data.
import {
  BedDouble, BookMarked, BookOpen, BookOpenText, Briefcase, Coffee, Compass, Flag, Flame, Gamepad2,
  GraduationCap, House, Lightbulb, MessageCircle, Microscope, Music, PenLine, Plane, Rocket, Smartphone,
  Soup, Sparkles, Target, Trophy, User, Utensils, Zap, type LucideIcon,
} from "lucide-react";

export type Tip = { original: string; better: string; pre: string; post: string; type: string; why: string; whyNative: string };
export type Msg = { id: string; ai?: 1; text: string; hi?: string; time: string; tip?: Tip; voice?: number };
export type Chat = { icon: LucideIcon; title: string; name: string; goal: string; done: number; total: number; time: string; persona?: 1 };


export const CH: Chat[] = [
  { icon: Utensils, title: "Order dinner for two", name: "Maria · Waiter", goal: "Order dinner for two", done: 2, total: 4, time: "9:41" },
  { icon: Briefcase, title: "Job interview", name: "Daniel · Hiring manager", goal: "Introduce yourself and answer 3 questions", done: 3, total: 3, time: "Yesterday" },
  { icon: Plane, title: "Airport check-in", name: "Priya · Check-in agent", goal: "Check in and choose a seat", done: 1, total: 3, time: "Mon" },
  { icon: Rocket, title: "Nova", name: "Nova · Rocket engineer", goal: "Free talk about space", done: 0, total: 3, time: "Now", persona: 1 },
  { icon: Lightbulb, title: "Rex", name: "Rex · Startup founder", goal: "Pitch your startup idea", done: 0, total: 3, time: "Now", persona: 1 },
  { icon: Microscope, title: "Dr. Mira", name: "Dr. Mira · Science teacher", goal: "Learn something new today", done: 0, total: 3, time: "Now", persona: 1 },
  { icon: Gamepad2, title: "Kai", name: "Kai · Game streamer", goal: "Talk about your favourite game", done: 0, total: 3, time: "Now", persona: 1 },
  { icon: Trophy, title: "Coach Leo", name: "Coach Leo · Football coach", goal: "Talk about the big match", done: 0, total: 3, time: "Now", persona: 1 },
];

export const CONV0: Record<number, Msg[]> = {
  0: [
    { id: "a1", ai: 1, text: "Good evening! Welcome to Olive & Co. How can I help you?", hi: "शुभ संध्या! Olive & Co में आपका स्वागत है। मैं आपकी कैसे मदद कर सकती हूँ?", time: "9:40" },
    { id: "u1", text: "Hello, I am want a table for two.", time: "9:41", tip: { original: "I am want", better: "I want", pre: "Hello, ", post: " a table for two.", type: "Grammar", why: '"Want" is already a verb, so we do not use "am" before it.', whyNative: '"want" खुद एक verb है, इसलिए इससे पहले "am" नहीं लगता।' } },
    { id: "a2", ai: 1, text: "Of course! A table for two. Would you like to see the menu?", hi: "बिल्कुल! दो लोगों के लिए टेबल। क्या आप मेन्यू देखना चाहेंगे?", time: "9:41" },
  ],
  1: [
    { id: "b1", ai: 1, text: "Thanks for coming in. Tell me about yourself.", hi: "आने के लिए धन्यवाद। अपने बारे में बताइए।", time: "4:10" },
    { id: "v1", text: "I am a software engineer with five years of experience.", time: "4:11" },
    { id: "b2", ai: 1, text: "Great. You answered all my questions well. We will contact you soon.", hi: "बढ़िया। आपने मेरे सभी सवालों के अच्छे जवाब दिए। हम जल्द संपर्क करेंगे।", time: "4:25" },
  ],
  2: [
    { id: "c1", ai: 1, text: "Good morning. Passport, please.", hi: "सुप्रभात। कृपया पासपोर्ट दिखाइए।", time: "8:02" },
    { id: "v2", text: "Here you are.", time: "8:02" },
    { id: "c2", ai: 1, text: "Thank you. Would you like a window or an aisle seat?", hi: "धन्यवाद। आप खिड़की वाली सीट लेंगे या गलियारे वाली?", time: "8:03" },
  ],
  3: [{ id: "p0", ai: 1, text: "Hi! I build rockets for a living. Ask me anything about space.", hi: "नमस्ते! मैं रॉकेट बनाती हूँ। अंतरिक्ष के बारे में कुछ भी पूछिए।", time: "9:45" }],
  4: [{ id: "p1", ai: 1, text: "Hey! I have started three companies. What is your business idea?", hi: "अरे! मैंने तीन कंपनियाँ शुरू की हैं। आपका बिज़नेस आइडिया क्या है?", time: "9:45" }],
  5: [{ id: "p2", ai: 1, text: "Hello! I love explaining science in simple words. What are you curious about?", hi: "नमस्ते! मुझे विज्ञान आसान शब्दों में समझाना पसंद है। आपको किस बारे में जिज्ञासा है?", time: "9:45" }],
  6: [{ id: "p3", ai: 1, text: "Yo! Just finished a stream. What games do you play?", hi: "अरे! अभी स्ट्रीम खत्म की। आप कौन से गेम खेलते हैं?", time: "9:45" }],
  7: [{ id: "p4", ai: 1, text: "Welcome! Big match tonight. Who is your team?", hi: "स्वागत है! आज रात बड़ा मैच है। आपकी टीम कौन सी है?", time: "9:45" }],
};

export const REPLIES: [string, string][][] = [
  [["Great choice! What would you like to drink?", "बढ़िया चुनाव! आप पीने के लिए क्या लेंगे?"], ["Nice. Anything else with your main dish?", "अच्छा। मुख्य डिश के साथ कुछ और?"], ["Of course. I will bring the bill right away.", "बिल्कुल। मैं अभी बिल लाती हूँ।"]],
  [["Thank you. Do you have any questions for us?", "धन्यवाद। क्या आपका हमसे कोई सवाल है?"]],
  [["Window seat, done. Do you have any bags to check?", "खिड़की वाली सीट पक्की। क्या आपके पास चेक-इन के लिए कोई बैग है?"], ["Perfect. Here is your boarding pass.", "बढ़िया। यह आपका बोर्डिंग पास है।"]],
  [["Good question! A rocket needs a lot of fuel to leave the Earth.", "अच्छा सवाल! पृथ्वी छोड़ने के लिए रॉकेट को बहुत ईंधन चाहिए।"], ["Yes, one day people may live on Mars. What do you think?", "हाँ, एक दिन लोग मंगल पर रह सकते हैं। आप क्या सोचते हैं?"], ["Interesting! Would you like to travel to space?", "दिलचस्प! क्या आप अंतरिक्ष में जाना चाहेंगे?"]],
  [["Nice. Who are your customers?", "अच्छा। आपके ग्राहक कौन हैं?"], ["Good. How will you make money from it?", "बढ़िया। आप इससे पैसे कैसे कमाएँगे?"], ["Strong idea. What is your first step this week?", "दमदार आइडिया। इस हफ्ते आपका पहला कदम क्या है?"]],
  [["Great question. Water boils at 100 degrees at sea level.", "बढ़िया सवाल। समुद्र तल पर पानी 100 डिग्री पर उबलता है।"], ["Right! Can you give me an everyday example?", "सही! क्या आप रोज़मर्रा का उदाहरण दे सकते हैं?"], ["Well explained. What shall we learn next?", "अच्छा समझाया। आगे क्या सीखें?"]],
  [["Cool! Do you play alone or with friends?", "मज़ेदार! आप अकेले खेलते हैं या दोस्तों के साथ?"], ["Nice. What is your best moment in that game?", "बढ़िया। उस गेम में आपका सबसे अच्छा पल कौन सा है?"], ["Haha, I like that. Any tips for beginners?", "हाहा, अच्छा लगा। शुरुआत करने वालों के लिए कोई सुझाव?"]],
  [["Good choice. Who is their best player?", "अच्छा चुनाव। उनका सबसे अच्छा खिलाड़ी कौन है?"], ["I agree. Do you think they will win tonight?", "मैं सहमत हूँ। क्या आपको लगता है वे आज जीतेंगे?"], ["Great opinion. Teamwork wins matches.", "बढ़िया राय। टीमवर्क मैच जिताता है।"]],
];
export const REPLY_FALLBACK: [string, string] = ["Nice! Tell me more.", "बढ़िया! और बताइए।"];

export const HINTS = ["I'd like a table for two, please.", "Could I see the menu?", "What do you recommend?"];

// Goals / key words for chats that have no scenario (personas).
export const CTX_GOALS_DEFAULT = ["Say hello and introduce yourself", "Ask two questions", "Share your own opinion"];
export const CTX_VOCAB_DEFAULT = ["opinion", "actually", "I think", "for example"];
// Chat index → scenario index (prototype: {"0":0,"1":2,"2":1}).
export const CHAT_SCENARIO: Record<number, number> = { 0: 0, 1: 2, 2: 1 };

export type Scenario = { k: string; icon: LucideIcon; title: string; goal: string; level: string; mins: number; xp: number; desc: string; goals: string[]; vocab: string[] };
export const SC: Scenario[] = [
  { k: "food", icon: Utensils, title: "Order dinner for two", goal: "Get a table, order and ask for the bill.", level: "A1", mins: 8, xp: 50, desc: "You and a friend arrive at a busy restaurant. Get a table, order food and drinks, and pay.", goals: ["Ask for a table for two", "Order a main dish and a drink", "Ask a question about the menu", "Ask for the bill"], vocab: ["menu", "I'd like", "bill", "recommend"] },
  { k: "travel", icon: Plane, title: "Airport check-in", goal: "Check in your bag and pick a seat.", level: "A2", mins: 7, xp: 50, desc: "You are flying abroad. Talk to the check-in agent about your bag and seat.", goals: ["Show your passport", "Choose a seat", "Ask about the gate"], vocab: ["boarding pass", "aisle", "luggage", "gate"] },
  { k: "work", icon: Briefcase, title: "Job interview", goal: "Introduce yourself and answer questions.", level: "B1", mins: 10, xp: 70, desc: "A hiring manager meets you for a first interview. Show your experience.", goals: ["Introduce yourself", "Describe your experience", "Ask one question about the role"], vocab: ["experience", "strengths", "responsibility", "team"] },
  { k: "food", icon: Coffee, title: "Coffee shop order", goal: "Order a drink and a snack.", level: "A1", mins: 5, xp: 30, desc: "Order your usual at a busy cafe, with one change to the recipe.", goals: ["Order a drink", "Ask for a change", "Pay"], vocab: ["takeaway", "medium", "extra", "receipt"] },
  { k: "tech", icon: Smartphone, title: "Phone shop help", goal: "Ask about plans and buy a SIM.", level: "A2", mins: 8, xp: 50, desc: "Visit a phone shop to compare data plans and get a new SIM.", goals: ["Ask about plans", "Compare two options", "Buy a SIM"], vocab: ["data", "plan", "contract", "coverage"] },
  { k: "music", icon: Music, title: "Talk about your favourite band", goal: "Share what music you like and why.", level: "B1", mins: 7, xp: 50, desc: "A new friend asks about your music taste. Keep the conversation going.", goals: ["Name a favourite artist", "Explain why you like them", "Ask them back"], vocab: ["lyrics", "genre", "concert", "playlist"] },
  { k: "sports", icon: Trophy, title: "Watching the match", goal: "Chat about a game with a stranger.", level: "B1", mins: 7, xp: 50, desc: "You are at a cafe watching a match. Join the conversation.", goals: ["Say who you support", "Give an opinion", "Ask a question"], vocab: ["score", "referee", "striker", "tournament"] },
  { k: "travel", icon: BedDouble, title: "Hotel check-in problem", goal: "Fix a booking mistake politely.", level: "B2", mins: 10, xp: 70, desc: "Your room is not what you booked. Explain and find a solution.", goals: ["Explain the problem", "Ask for a solution", "Confirm the new room"], vocab: ["reservation", "upgrade", "refund", "available"] },
];
export const EX_CHIPS: [string, string][] = [["All", "All"], ["food", "Food"], ["travel", "Travel"], ["work", "Work"], ["tech", "Tech"], ["music", "Music"], ["sports", "Sports"]];
export const PERSONA_TOPICS = ["Space", "Startups", "Science", "Gaming", "Sports"];

export const WORDS: [string, string, "New" | "Learning" | "Review" | "Mastered", string][] = [["negotiate", "to discuss to reach an agreement", "Learning", "चर्चा करके सहमति बनाना"], ["recommend", "to suggest something good", "New", "सुझाव देना"], ["aisle", "a walkway between seats", "Review", "गलियारा"], ["receipt", "proof of payment", "Mastered", "रसीद"], ["available", "free to use or get", "Learning", "उपलब्ध"], ["reservation", "a booking you made", "New", "आरक्षण"]];
export const WORD_STATE = { New: ["#8fa8ff", "#1c2a55"], Learning: ["#ffb38f", "rgba(255,179,143,.14)"], Review: ["#7fe3a8", "#0e2417"], Mastered: ["#d3f5e1", "#143a25"] } as const;
export const FC: [string, string, string][] = [["negotiate", "/nɪˈɡoʊʃieɪt/", "चर्चा करके सहमति बनाना"], ["aisle", "/aɪl/", "गलियारा"], ["receipt", "/rɪˈsiːt/", "रसीद"]];
export const EXQ = [
  { prompt: "Which sentence is correct?", opts: ["I am agree with you.", "I agree with you.", "I agreeing with you."], ans: 1, why: '"Agree" is already a verb, so we do not use "am" before it.' },
  { prompt: "Which sentence is correct?", opts: ["I need a information.", "I need an information.", "I need some information."], ans: 2, why: '"Information" is uncountable, so we use "some" and not "a" or "an".' },
  { prompt: "Which sentence is correct?", opts: ["She is good at cooking.", "She is good in cooking.", "She is good on cooking."], ans: 0, why: 'We say "good at" before a skill.' },
];
export const TOPICS: [string, number, "up" | "down" | "flat", string][] = [["Articles (a, an, the)", 35, "down", "I need a information."], ["Prepositions", 48, "flat", "good in cooking → good at cooking"], ["Verb forms", 62, "up", "I am agree → I agree"], ["Plurals", 81, "up", "two childs → two children"]];
export const PT_TABS = ["Words", "Grammar", "Exercises", "Reading", "Writing"];

export const RECS: [LucideIcon, string, string, string][] = [[Soup, "Order street food", "A1", "6 min · 40 XP"], [Plane, "Check in at the airport", "A2", "8 min · 50 XP"], [Music, "Talk about your favourite band", "B1", "7 min · 50 XP"]];
export const WEAK = [{ name: "Articles (a, an, the)", pct: 35 }, { name: "Prepositions", pct: 48 }];
export const SKILLS = [
  { title: "Reading", icon: BookOpenText, pt: 3, bg: "#0e2417", c: "#7fe3a8" },
  { title: "Writing", icon: PenLine, pt: 4, bg: "rgba(255,179,143,.14)", c: "#ffb38f" },
];
export const TABS: [LucideIcon, string, string][] = [[House, "Home", "/dashboard"], [MessageCircle, "Chats", "/dashboard/chats"], [Compass, "Explore", "/dashboard/explore"], [BookOpen, "Practice", "/dashboard/practice"], [User, "Profile", "/dashboard/profile"]];

export const STAT_ICONS = { xp: Zap, streak: Flame, missions: Target, words: BookOpen };
export const WEEK: [string, number][] = [["M", 60], ["T", 85], ["W", 40], ["T", 100], ["F", 70], ["S", 20], ["S", 55]];
export const BADGES: [LucideIcon, string, number][] = [[Flag, "First mission", 1], [Flame, "3 day streak", 1], [BookMarked, "100 words", 0], [Trophy, "10 missions", 0], [Sparkles, "Perfect mission", 0], [GraduationCap, "Grammar hero", 0]];

// Onboarding
export const LANGS: [string, string, string][] = [["hi", "हिन्दी", "Hindi"], ["es", "Español", "Spanish"], ["ar", "العربية", "Arabic"], ["pt-BR", "Português (Brasil)", "Portuguese"], ["id", "Bahasa Indonesia", "Indonesian"], ["bn", "বাংলা", "Bengali"], ["ur", "اردو", "Urdu"], ["tr", "Türkçe", "Turkish"], ["vi", "Tiếng Việt", "Vietnamese"], ["zh-Hans", "简体中文", "Chinese Simplified"], ["ru", "Русский", "Russian"], ["fr", "Français", "French"], ["sw", "Kiswahili", "Swahili"], ["fil", "Filipino", "Filipino"], ["de", "Deutsch", "German"], ["ja", "日本語", "Japanese"], ["ko", "한국어", "Korean"], ["ta", "தமிழ்", "Tamil"], ["te", "తెలుగు", "Telugu"], ["th", "ไทย", "Thai"], ["it", "Italiano", "Italian"], ["pl", "Polski", "Polish"], ["fa", "فارسی", "Persian"], ["ha", "Hausa", "Hausa"], ["am", "አማርኛ", "Amharic"]];
export const INTS: [string, [string, string][]][] = [["ALL INTERESTS", [["music", "Music"], ["movies", "Movies and TV"], ["sports", "Sports"], ["food", "Food and cooking"], ["travel", "Travel"], ["technology", "Technology"], ["business", "Business"], ["money", "Money and finance"], ["science", "Science"], ["gaming", "Gaming"], ["fashion", "Fashion and beauty"], ["health", "Health and fitness"], ["art", "Art and design"], ["books", "Books and writing"], ["nature", "Nature and animals"], ["cars", "Cars and bikes"], ["education", "Education"], ["history", "History and culture"], ["photography", "Photography"], ["news", "News and current affairs"], ["family", "Family and relationships"], ["home", "Home and garden"], ["social", "Social media"], ["languages", "Languages"], ["career", "Work and careers"], ["startups", "Startups"], ["space", "Space"], ["comedy", "Comedy and humour"], ["dance", "Dance"], ["wellbeing", "Mindfulness and wellbeing"]]]];
export const TARGETS: [string, string, string][] = [["en", "English", "Available now"], ["es", "Spanish", "Coming soon"], ["fr", "French", "Coming soon"], ["de", "German", "Coming soon"], ["ja", "Japanese", "Coming soon"]];
export const LEVELS: [string, string, string][] = [["A1", "Beginner", "Greet, order, ask for basic things."], ["A2", "Elementary", "Handle simple routine conversations."], ["B1", "Intermediate", "Manage most travel and work situations."], ["B2", "Upper intermediate", "Discuss ideas, interviews and meetings."], ["C1", "Advanced", "Speak fluently and flexibly."]];
export const GOALS: [number, string][] = [[5, "Casual"], [10, "Regular"], [15, "Serious"], [20, "Intense"]];
export const MODES: ["instant" | "end", string, string][] = [["instant", "Correct me right away", "A small tip appears under each message. Best for beginners."], ["end", "Tell me at the end", "No interruptions. Everything is in the summary. Best for advanced."]];
export const ONB_TITLES: [string, string][] = [
  ["", ""],
  ["What is your native language?", "Translations and explanations will be in this language."],
  ["What do you want to learn?", "Pick one. We will tell you when others launch."],
  ["What do you want to talk about?", "Pick at least 3. Up to 15."],
  ["What is your current level?", "You can change this any time in Settings."],
  ["How much time per day?", "Your daily goal ring is based on this."],
  ["How should we correct you?", "Change it later in Settings."],
  ["Add Lingov to your home screen", "Install it once. No app store needed."],
];

// Lower-case and strip accents (prototype `norm`).
export const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
