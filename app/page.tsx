// app/page.tsx
"use client";

import { useState } from "react";

/** =========================
 *  Question Definitions
 *  ========================= */
const QUESTIONS = [
  {
    id: "gender",
    title: "[Gender]",
    question: "What is your gender?",
    options: [
      { value: "male", label: "Man" },
      { value: "female", label: "Woman" },
    ],
  },
  {
    id: "energy",
    title: "[Energy]",
    question: "What are your tendencies?",
    options: [
      {
        value: "extrovert",
        label: "Extroverted (I gain energy when I'm with people)",
      },
      {
        value: "introvert",
        label: "Introverted (I gain energy when I'm alone)",
      },
    ],
  },
  {
    id: "hobby",
    title: "[Hobby]",
    question: "What is your hobby?",
    options: [
      { value: "exercise", label: "Exercise" },
      { value: "reading", label: "Reading" },
      { value: "relaxing", label: "Sleeping / Resting" },
      { value: "music", label: "Music / Instruments" },
      { value: "dance", label: "Dancing" },
      { value: "cooking", label: "Cooking" },
    ],
  },
  {
    id: "rhythm",
    title: "[Biorhythm]",
    question: "What is your lifestyle like?",
    options: [
      { value: "morning", label: "Morning type" }, // sun / clouds
      { value: "night", label: "Night type" },     // moon / stars
    ],
  },
  {
    id: "season",
    title: "[Preferred Season]",
    question: "What is your favorite season?",
    options: [
      { value: "spring", label: "Spring" },
      { value: "summer", label: "Summer" },
      { value: "autumn", label: "Autumn" },
      { value: "winter", label: "Winter" },
    ],
  },
  {
    id: "plan",
    title: "[Planning Style]",
    question: "Are you more of a planner or spontaneous?",
    options: [
      {
        value: "planned type",
        label: "Planned type (I like to organize and schedule things)",
      },
      {
        value: "impromptu",
        label: "Impromptu type (I prefer to go with the flow)",
      },
    ],
  },
  {
    id: "emotionExpression",
    title: "[Emotion Expression]",
    question: "How do you usually express your emotions?",
    options: [
      { value: "direct", label: "Honestly and directly" },   // bold expression
      {
        value: "indirect",
        label: "Indirectly or in a subtle way",              // calm expression
      },
    ],
  },
  {
    id: "lovePriority",
    title: "[Dating Values 1]",
    question: "What is your top priority in a relationship?",
    options: [
      { value: "thrilled", label: "Feeling thrilled / butterflies" },
      { value: "growth", label: "Growing together" },
      { value: "humor code", label: "Shared sense of humor" },
    ],
  },
  {
    id: "dateFrequency",
    title: "[Dating Values 2]",
    question: "What is your preferred dating frequency?",
    options: [
      { value: "everyday", label: "I want to be together almost every day." },
      {
        value: "biweekly",
        label: "Once every two weeks is comfortable for me.",
      },
      {
        value: "monthly",
        label: "Once a month is enough for me.",
      },
    ],
  },
  {
    id: "conflictStyle",
    title: "[Dating Values 3]",
    question: "How do you resolve conflicts in a relationship?",
    options: [
      {
        value: "immediate",
        label: "I want to talk and resolve it right away.",
      },
      {
        value: "afterThinking",
        label: "I need time to整理 my thoughts first.",
      },
    ],
  },
];

type AnswerMap = Record<string, string>;

type PuddingResult = {
  id: string;
  name: string;
  reason: string;
  imagePrompt: string;
};

type IdealPudding = {
  id: string;
  name: string;
  gender: "male" | "female"; // perceived gender vibe of this pudding
  lovePriority: string;      // thrilled / growth / humor code
  dateFrequency: string;     // everyday / biweekly / monthly
  conflictStyle: string;     // immediate / afterThinking
};

/** =========================
 *  Image Mapping Helpers
 *  ========================= */
const ENERGY_DESC: Record<string, string> = {
  extrovert: "a cheerful and energetic expression",
  introvert: "a calm and relaxed expression",
};

const HOBBY_PROPS: Record<string, string> = {
  exercise: "wearing a sporty headband or holding a small dumbbell",
  reading: "holding a tiny open book next to the pudding",
  relaxing: "lying on a soft cushion or pillow, looking sleepy and relaxed",
  music: "surrounded by musical notes or holding a tiny musical instrument",
  dance: "in a dancing pose with motion lines around it",
  cooking: "wearing a cute apron and holding a spoon or small dish",
};

const RHYTHM_BG: Record<string, string> = {
  morning: "a bright morning sky with a warm sun and soft clouds",
  night: "a night sky with a gentle moon and twinkling stars",
};

const SEASON_BG: Record<string, string> = {
  spring: "a spring scenery with blooming flowers and fresh greenery",
  summer: "a summer scenery with blue sky and a refreshing vibe",
  autumn: "an autumn scenery with falling leaves and warm orange tones",
  winter: "a winter scenery with snow and a cozy, calm atmosphere",
};

const PLAN_ITEMS: Record<string, string> = {
  "planned type":
    "near the pudding there is a planner notebook, a pencil, glasses, and a small clock",
  impromptu: "around the pudding there are doodles and question marks",
};

const EMOTION_FACE: Record<string, string> = {
  direct: "a confident and expressive face",
  indirect: "a gentle and subtle face",
};

/** =========================
 *  Ideal Pudding Dummy DB
 *  (you can replace this with a real DB later)
 *  ========================= */
const IDEAL_PUDDING_DB: IdealPudding[] = [
  {
    id: "ideal_heart_female",
    name: "Romantic Heart Strawberry 💘🍓",
    gender: "female",
    lovePriority: "thrilled",
    dateFrequency: "everyday",
    conflictStyle: "immediate",
  },
  {
    id: "ideal_growth_male",
    name: "Calm Growth Matcha 📚🍵",
    gender: "male",
    lovePriority: "growth",
    dateFrequency: "biweekly",
    conflictStyle: "afterThinking",
  },
  {
    id: "ideal_funny_female",
    name: "Funny Choco Buddy 😂🍫",
    gender: "female",
    lovePriority: "humor code",
    dateFrequency: "monthly",
    conflictStyle: "immediate",
  },
  {
    id: "ideal_heart_male",
    name: "Romantic Custard Prince 💘🍮",
    gender: "male",
    lovePriority: "thrilled",
    dateFrequency: "everyday",
    conflictStyle: "afterThinking",
  },
  {
    id: "ideal_growth_female",
    name: "Diligent Caramel Partner 📚🍯",
    gender: "female",
    lovePriority: "growth",
    dateFrequency: "biweekly",
    conflictStyle: "immediate",
  },
];

/** =========================
 *  Logic Functions
 *  ========================= */

// Decide base pudding type (energy + planning first, then hobby)
function decideBasePuddingId(answers: AnswerMap): string {
  const energy = answers["energy"]; // extrovert / introvert
  const plan = answers["plan"];     // planned type / impromptu
  const hobby = answers["hobby"];   // exercise / reading / ...

  // 1) Energy + planning shape the main pudding type
  if (energy === "extrovert" && plan === "impromptu") {
    return "strawberry"; // spontaneous + active
  }
  if (energy === "extrovert" && plan === "planned type") {
    return "custard"; // bright + reliable
  }
  if (energy === "introvert" && plan === "planned type") {
    return "matcha"; // calm + organized
  }

  // 2) For other combinations, let the hobby influence the base
  if (hobby === "exercise") return "protein";
  if (hobby === "reading") return "matcha";
  if (hobby === "music" || hobby === "dance") return "choco";
  if (hobby === "cooking") return "caramel";

  // 3) Default
  return "vanilla";
}

// Human-readable pudding name
function getPuddingName(id: string): string {
  switch (id) {
    case "strawberry":
      return "Spontaneous Strawberry Pudding 🍓";
    case "custard":
      return "Bright Custard Pudding 🍮";
    case "matcha":
      return "Calm Matcha Pudding 🍵";
    case "protein":
      return "Sporty Protein Pudding 💪";
    case "choco":
      return "Funny Choco Pudding 😂";
    case "caramel":
      return "Sweet Caramel Pudding 🍯";
    default:
      return "Soft Vanilla Pudding 🤎";
  }
}

// From user's gender → ideal match gender (male → female, female → male)
function getTargetGender(answers: AnswerMap): "male" | "female" {
  const gender = answers["gender"]; // male / female
  return gender === "male" ? "female" : "male";
}

// Build image generation prompt using all selected traits
function buildImagePrompt(answers: AnswerMap, puddingId: string): string {
  const gender = answers["gender"]; // male / female
  const energy = answers["energy"];
  const hobby = answers["hobby"];
  const rhythm = answers["rhythm"];
  const season = answers["season"];
  const plan = answers["plan"];
  const emotionExpression = answers["emotionExpression"];

  const puddingName = getPuddingName(puddingId);

  const genderDesc =
    gender === "male"
      ? "a male-vibe pudding character"
      : "a female-vibe pudding character";

  const energyDesc = ENERGY_DESC[energy] ?? "";
  const hobbyDesc = HOBBY_PROPS[hobby] ?? "";
  const rhythmBg = RHYTHM_BG[rhythm] ?? "";
  const seasonBg = SEASON_BG[season] ?? "";
  const planItems = PLAN_ITEMS[plan] ?? "";
  const faceDesc = EMOTION_FACE[emotionExpression] ?? "";

  return `
Cute pastel illustration of ${puddingName} as ${genderDesc}.
The pudding has ${energyDesc} and ${faceDesc}.
${hobbyDesc}.
Background: ${seasonBg}, and also ${rhythmBg}.
${planItems}.
High detail, soft lighting, kawaii character design, no text, no watermark.
`.trim();
}

// Pick top 3 ideal pudding matches based on dating answers
function pickIdealMatches(
  answers: AnswerMap,
  db: IdealPudding[] = IDEAL_PUDDING_DB
): IdealPudding[] {
  const targetGender = getTargetGender(answers);
  const love = answers["lovePriority"];
  const date = answers["dateFrequency"];
  const conflict = answers["conflictStyle"];

  const candidates = db.filter((p) => p.gender === targetGender);

  const scored = candidates
    .map((p) => {
      let score = 0;

      if (p.lovePriority === love) score += 3;      // priority: biggest weight
      if (p.dateFrequency === date) score += 2;     // dating frequency
      if (p.conflictStyle === conflict) score += 1; // conflict resolution

      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

// Final pudding result object
function pickPudding(answers: AnswerMap): PuddingResult {
  const puddingId = decideBasePuddingId(answers);
  const name = getPuddingName(puddingId);
  const imagePrompt = buildImagePrompt(answers, puddingId);

  const energy = answers["energy"];
  const plan = answers["plan"];
  const hobby = answers["hobby"];
  const rhythm = answers["rhythm"];
  const season = answers["season"];

  const reasonParts: string[] = [];

  if (energy === "extrovert") {
    reasonParts.push(
      "You gain energy from being around people, so your pudding has a bright and outgoing vibe."
    );
  } else if (energy === "introvert") {
    reasonParts.push(
      "You recharge by spending time alone, so your pudding feels calm and introspective."
    );
  }

  if (plan === "planned type") {
    reasonParts.push(
      "You like to plan ahead and stay organized, which makes your pudding feel stable and reliable."
    );
  } else if (plan === "impromptu") {
    reasonParts.push(
      "You prefer to be spontaneous and go with the flow, so your pudding feels free-spirited and playful."
    );
  }

  if (hobby) {
    reasonParts.push(
      `Your hobby (“${hobby}”) is reflected in the small items and overall mood around your pudding.`
    );
  }

  if (rhythm === "morning") {
    reasonParts.push(
      "Because you are a morning type, a bright sky with the sun and soft clouds fits your background."
    );
  } else if (rhythm === "night") {
    reasonParts.push(
      "Because you are a night type, a moon and starry night sky matches your background."
    );
  }

  if (season) {
    reasonParts.push(
      `Your favorite season (“${season}”) sets the overall seasonal tone of your pudding world.`
    );
  }

  const reason =
    reasonParts.join(" ") ||
    "Your personality and lifestyle came together to shape this unique pudding character.";

  return {
    id: puddingId,
    name,
    reason,
    imagePrompt,
  };
}

/** =========================
 *  Main Component
 *  ========================= */

export default function Home() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState<PuddingResult | null>(null);
  const [idealMatches, setIdealMatches] = useState<IdealPudding[]>([]);

  const current = QUESTIONS[step];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  const handleSelect = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleNext = () => {
    if (!current) return;
    if (!answers[current.id]) return;

    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      const pudding = pickPudding(answers);
      const matches = pickIdealMatches(answers);

      setResult(pudding);
      setIdealMatches(matches);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setStep(0);
    setAnswers({});
    setResult(null);
    setIdealMatches([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white/80 shadow-xl rounded-3xl p-8 border border-orange-100">
        {/* Start Screen */}
        {!started && !result && (
          <section className="text-center space-y-6">
            <div className="text-5xl">🍮</div>
            <h1 className="text-2xl font-bold text-orange-700">
              Find my little pudding
            </h1>
            <p className="text-sm text-orange-900/80">
              Create your own pudding character
              <br />
              and discover three ideal pudding matches that go well with you.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2 text-white font-semibold hover:bg-orange-600 transition"
            >
              START 🍮
            </button>
          </section>
        )}

        {/* Question Screen */}
        {started && !result && current && (
          <section className="space-y-6">
            <div className="flex justify-between items-center text-xs text-orange-800/70 mb-1">
              <span>
                Q{step + 1} / {QUESTIONS.length}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-orange-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h2 className="text-sm font-semibold text-orange-700">
              {current.title}
            </h2>
            <p className="text-base text-orange-900">{current.question}</p>

            <div className="space-y-3 mt-4">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(current.id, opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border text-sm transition ${
                    answers[current.id] === opt.value
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white/70 hover:bg-orange-50 border-orange-200 text-orange-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleNext}
                className="rounded-full bg-orange-500 px-5 py-2 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:bg-orange-200"
                disabled={!answers[current.id]}
              >
                Next →
              </button>
            </div>
          </section>
        )}

        {/* Result Screen */}
        {result && (
          <section className="space-y-6">
            <div className="text-center space-y-3">
              <div className="text-5xl">🍮✨</div>
              <h2 className="text-xl font-bold text-orange-700">
                You are...
                <br />
                {result.name}
              </h2>
              <p className="text-sm text-orange-900/80 whitespace-pre-line">
                {result.reason}
              </p>
            </div>

            {/* Image prompt for external image generation AI */}
            <div className="mt-4 rounded-2xl bg-orange-50/70 border border-orange-100 p-3">
              <p className="text-xs font-semibold text-orange-700 mb-1">
                🪄 Image generation prompt (send this to your AI image model)
              </p>
              <pre className="text-[10px] text-orange-900/80 whitespace-pre-wrap">
                {result.imagePrompt}
              </pre>
            </div>

            {/* Ideal Matches */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-orange-700 mb-2 text-center">
                Your ideal pudding matches 💕
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {idealMatches.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white/80 border border-orange-100 p-3 text-center text-xs flex flex-col gap-1"
                  >
                    <div className="font-semibold text-orange-800">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-orange-900/70">
                      Gender vibe: {p.gender === "male" ? "Male" : "Female"}
                    </div>
                    <div className="text-[10px] text-orange-900/70">
                      Priority: {p.lovePriority}
                    </div>
                    <div className="text-[10px] text-orange-900/70">
                      Dating frequency: {p.dateFrequency}
                    </div>
                    <div className="text-[10px] text-orange-900/70">
                      Conflict style:{" "}
                      {p.conflictStyle === "immediate"
                        ? "Talk immediately"
                        : "Think first, talk later"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleRestart}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2 text-white font-semibold hover:bg-orange-600 transition"
              >
                Restart 🔁
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
