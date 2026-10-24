// Sample content for the Lingov screens, copied verbatim from the prototype
// (Lingov Onboarding.dc.html, `class Component`). See REPLACE.md for what to swap for real data.
import {
  BedDouble, BookMarked, BookOpen, BookOpenText, Briefcase, Coffee, Compass, Flag, Flame, Gamepad2,
  GraduationCap, House, Lightbulb, MessageCircle, Microscope, Music, PenLine, Plane, Rocket, Smartphone,
  Soup, Sparkles, Target, Trophy, User, Utensils, Zap, type LucideIcon,
} from "lucide-react";

export const WORDS: [string, string, "New" | "Learning" | "Review" | "Mastered", string][] = [["negotiate", "to discuss to reach an agreement", "Learning", "चर्चा करके सहमति बनाना"], ["recommend", "to suggest something good", "New", "सुझाव देना"], ["aisle", "a walkway between seats", "Review", "गलियारा"], ["receipt", "proof of payment", "Mastered", "रसीद"], ["available", "free to use or get", "Learning", "उपलब्ध"], ["reservation", "a booking you made", "New", "आरक्षण"]];
export const WORD_STATE = { New: ["#52C79A", "#2A2F2D"], Learning: ["#EDBF73", "rgba(237,191,115,.14)"], Review: ["#52C79A", "#212524"], Mastered: ["#6BD3AB", "#212524"] } as const;
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
  { title: "Reading", icon: BookOpenText, pt: 3, bg: "#212524", c: "#52C79A" },
  { title: "Writing", icon: PenLine, pt: 4, bg: "rgba(237,191,115,.14)", c: "#EDBF73" },
];
export const TABS: [LucideIcon, string, string][] = [[House, "Home", "/dashboard"], [MessageCircle, "Chats", "/dashboard/chats"], [Compass, "Explore", "/dashboard/explore"], [BookOpen, "Practice", "/dashboard/practice"], [User, "Profile", "/dashboard/profile"]];

export const STAT_ICONS = { xp: Zap, streak: Flame, missions: Target, words: BookOpen };
export const WEEK: [string, number][] = [["M", 60], ["T", 85], ["W", 40], ["T", 100], ["F", 70], ["S", 20], ["S", 55]];
export const BADGES: [LucideIcon, string, number][] = [[Flag, "First mission", 1], [Flame, "3 day streak", 1], [BookMarked, "100 words", 0], [Trophy, "10 missions", 0], [Sparkles, "Perfect mission", 0], [GraduationCap, "Grammar hero", 0]];

// Onboarding
export const LANGS: [string, string, string][] = [["hi", "हिन्दी", "Hindi"], ["es", "Español", "Spanish"], ["ar", "العربية", "Arabic"], ["pt-BR", "Português (Brasil)", "Portuguese"], ["id", "Bahasa Indonesia", "Indonesian"], ["bn", "বাংলা", "Bengali"], ["ur", "اردو", "Urdu"], ["tr", "Türkçe", "Turkish"], ["vi", "Tiếng Việt", "Vietnamese"], ["zh-Hans", "简体中文", "Chinese Simplified"], ["ru", "Русский", "Russian"], ["fr", "Français", "French"], ["sw", "Kiswahili", "Swahili"], ["fil", "Filipino", "Filipino"], ["de", "Deutsch", "German"], ["ja", "日本語", "Japanese"], ["ko", "한국어", "Korean"], ["ta", "தமிழ்", "Tamil"], ["te", "తెలుగు", "Telugu"], ["th", "ไทย", "Thai"], ["it", "Italiano", "Italian"], ["pl", "Polski", "Polish"], ["fa", "فارسی", "Persian"], ["ha", "Hausa", "Hausa"], ["am", "አማርኛ", "Amharic"]];
export const INTS: [string, [string, string][]][] = [["ALL INTERESTS", [["music", "Music"], ["movies", "Movies and TV"], ["sports", "Sports"], ["food", "Food and cooking"], ["travel", "Travel"], ["technology", "Technology"], ["business", "Business"], ["money", "Money and finance"], ["science", "Science"], ["gaming", "Gaming"], ["fashion", "Fashion and beauty"], ["health", "Health and fitness"], ["art", "Art and design"], ["books", "Books and writing"], ["nature", "Nature and animals"], ["cars", "Cars and bikes"], ["education", "Education"], ["history", "History and culture"], ["photography", "Photography"], ["news", "News and current affairs"], ["family", "Family and relationships"], ["home", "Home and garden"], ["social", "Social media"], ["languages", "Languages"], ["career", "Work and careers"], ["startups", "Startups"], ["space", "Space"], ["comedy", "Comedy and humour"], ["dance", "Dance"], ["wellbeing", "Mindfulness and wellbeing"]]]];
export const TARGETS: [string, string, string][] = [["en", "English", "Available now"], ["es", "Spanish", "Coming soon"], ["fr", "French", "Coming soon"], ["de", "German", "Coming soon"], ["ja", "Japanese", "Coming soon"]];
// The CEFR code is the stored key; people see these names.
const LEVEL_NAMES: Record<string, string> = { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper intermediate", C1: "Advanced", C2: "Advanced" };
export const levelName = (s: string) => s.replace(/\b[ABC][12]\b/g, (c) => LEVEL_NAMES[c] ?? c);
export const LEVELS: [string, string, string][] = [["A1", "Beginner", "Greet, order, ask for basic things."], ["A2", "Elementary", "Handle simple routine conversations."], ["B1", "Intermediate", "Manage most travel and work situations."], ["B2", "Upper intermediate", "Discuss ideas, interviews and meetings."], ["C1", "Advanced", "Speak fluently and flexibly."]];
// Pictures are stored as "icon:<name>" and drawn by Pic (components/lingov/ui.tsx).
export const AVATARS = ["icon:cat", "icon:dog", "icon:bird", "icon:fish", "icon:rabbit", "icon:squirrel", "icon:turtle", "icon:panda"];
export const GOALS: [number, string][] = [[5, "Casual"], [10, "Regular"], [15, "Serious"], [20, "Intense"]];
export const MODES: ["instant" | "end", string, string][] = [["instant", "Correct me right away", "A small tip appears under each message. Best for beginners."], ["end", "Tell me at the end", "No interruptions. Everything is in the summary. Best for advanced."]];
export const ONB_TITLES: [string, string][] = [
  ["", ""],
  ["What should we call you?", "Pick a name and a picture. You can change them later."],
  ["What is your native language?", "Translations and explanations will be in this language."],
  ["What do you want to talk about?", "Pick at least 3."],
  ["What is your current level?", "You can change this any time in Settings."],
];

// Lower-case and strip accents (prototype `norm`).
export const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
