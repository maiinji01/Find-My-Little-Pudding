// app/page.tsx
"use client";

import React, { useState, useCallback } from "react";

/** =========================
 *  Gemini / Imagen API 설정
 * ========================= */

// ⚠️ Fill Your API Key Here (for testing only; don't expose in real production)
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Imagen 4.0 model endpoint
const IMAGE_GENERATION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
const MAX_RETRIES = 5;

// Simple delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff fetch helper
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await delay(waitTime);
      }
    }
  }
  throw new Error(
    `Failed to fetch after ${maxRetries} attempts. Last error: ${String(
      lastError
    )}`
  );
}

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
      { value: "night", label: "Night type" }, // moon / stars
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
      { value: "direct", label: "Honestly and directly" },
      {
        value: "indirect",
        label: "Indirectly or in a subtle way",
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
        label: "I need time to organize my thoughts first.",
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

type IdealMatch = {
  id: string;
  nickname: string;
  puddingName: string;
  gender: "male" | "female";
  lovePriority: string;
  dateFrequency: string;
  conflictStyle: string;
  shareInstagram: boolean;
  instagramUrl?: string | null;
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
 *  Dummy Ideal Match DB
 *  ========================= */

const IDEAL_PUDDING_DB: IdealMatch[] = [
  {
    id: "ideal_1",
    nickname: "Strawberry Heart",
    puddingName: "Romantic Heart Strawberry 💘🍓",
    gender: "female",
    lovePriority: "thrilled",
    dateFrequency: "everyday",
    conflictStyle: "immediate",
    shareInstagram: true,
    instagramUrl: "https://instagram.com/strawberry_heart",
  },
  {
    id: "ideal_2",
    nickname: "Matcha Growth",
    puddingName: "Calm Growth Matcha 📚🍵",
    gender: "male",
    lovePriority: "growth",
    dateFrequency: "biweekly",
    conflictStyle: "afterThinking",
    shareInstagram: false,
    instagramUrl: null,
  },
  {
    id: "ideal_3",
    nickname: "Choco Laugh",
    puddingName: "Funny Choco Buddy 😂🍫",
    gender: "female",
    lovePriority: "humor code",
    dateFrequency: "monthly",
    conflictStyle: "immediate",
    shareInstagram: true,
    instagramUrl: "https://instagram.com/choco_laugh",
  },
  {
    id: "ideal_4",
    nickname: "Custard Prince",
    puddingName: "Romantic Custard Prince 💘🍮",
    gender: "male",
    lovePriority: "thrilled",
    dateFrequency: "everyday",
    conflictStyle: "afterThinking",
    shareInstagram: false,
    instagramUrl: null,
  },
  {
    id: "ideal_5",
    nickname: "Caramel Partner",
    puddingName: "Diligent Caramel Partner 📚🍯",
    gender: "female",
    lovePriority: "growth",
    dateFrequency: "biweekly",
    conflictStyle: "immediate",
    shareInstagram: true,
    instagramUrl: "https://instagram.com/caramel_partner",
  },
];

/** =========================
 *  Logic Functions
 *  ========================= */

function decideBasePuddingId(answers: AnswerMap): string {
  const energy = answers["energy"];
  const plan = answers["plan"];
  const hobby = answers["hobby"];

  if (energy === "extrovert" && plan === "impromptu") {
    return "strawberry";
  }
  if (energy === "extrovert" && plan === "planned type") {
    return "custard";
  }
  if (energy === "introvert" && plan === "planned type") {
    return "matcha";
  }

  if (hobby === "exercise") return "protein";
  if (hobby === "reading") return "matcha";
  if (hobby === "music" || hobby === "dance") return "choco";
  if (hobby === "cooking") return "caramel";

  return "vanilla";
}

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

// user's gender → opposite for matching
function getTargetGender(answers: AnswerMap): "male" | "female" {
  const gender = answers["gender"];
  return gender === "male" ? "female" : "male";
}

// Prompt for Gemini/Imagen
function buildImagePrompt(answers: AnswerMap, puddingId: string): string {
  const gender = answers["gender"];
  const energy = answers["energy"];
  const hobby = answers["hobby"];
  const rhythm = answers["rhythm"];
  const season = answers["season"];
  const plan = answers["plan"];
  const emotionExpression = answers["emotionExpression"];

  const fullName = getPuddingName(puddingId);
  const puddingName = fullName.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim(); // strip emoji-ish

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
Cute pastel illustration of a sweet ${puddingName} as ${genderDesc}.
The pudding has ${energyDesc} and ${faceDesc}.
${hobbyDesc}.
Background: ${seasonBg}, and also ${rhythmBg}.
${planItems}.
High detail, soft lighting, kawaii 3D character illustration, cinematic lighting, no text, no watermark.
`.trim();
}

// description for ideal match when IG is private
function buildIdealDescription(match: IdealMatch): string {
  const parts: string[] = [];

  if (match.lovePriority === "thrilled") {
    parts.push(
      "They care a lot about keeping the spark alive and creating exciting, heart-fluttering moments."
    );
  } else if (match.lovePriority === "growth") {
    parts.push(
      "They value growing together and supporting each other's long-term goals."
    );
  } else if (match.lovePriority === "humor code") {
    parts.push(
      "They believe that sharing the same sense of humor is one of the most important parts of a relationship."
    );
  }

  if (match.dateFrequency === "everyday") {
    parts.push(
      "This pudding would love to stay closely connected and spend time together very frequently."
    );
  } else if (match.dateFrequency === "biweekly") {
    parts.push(
      "They prefer a balanced rhythm, meeting regularly without feeling too rushed."
    );
  } else if (match.dateFrequency === "monthly") {
    parts.push(
      "They are comfortable with more personal space and meaningful, less frequent dates."
    );
  }

  if (match.conflictStyle === "immediate") {
    parts.push(
      "When conflicts happen, they prefer to talk honestly and solve things as soon as possible."
    );
  } else if (match.conflictStyle === "afterThinking") {
    parts.push(
      "In conflicts, they need a bit of time to organize their thoughts before having a calm conversation."
    );
  }

  return parts.join(" ");
}

// pick top 3 ideal matches using dummy DB
function pickIdealMatches(
  answers: AnswerMap,
  db: IdealMatch[] = IDEAL_PUDDING_DB
): IdealMatch[] {
  const targetGender = getTargetGender(answers);
  const love = answers["lovePriority"];
  const date = answers["dateFrequency"];
  const conflict = answers["conflictStyle"];

  const candidates = db.filter((p) => p.gender === targetGender);

  const scored = candidates
    .map((p) => {
      let score = 0;
      if (p.lovePriority === love) score += 3;
      if (p.dateFrequency === date) score += 2;
      if (p.conflictStyle === conflict) score += 1;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

// base pudding result + smooth reason
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
      "You get energized by being around people, so your pudding naturally carries a bright and outgoing vibe."
    );
  } else if (energy === "introvert") {
    reasonParts.push(
      "You recharge by spending time on your own, which gives your pudding a calm and introspective feel."
    );
  }

  if (plan === "planned type") {
    reasonParts.push(
      "Because you like to plan ahead and stay organized, your pudding feels steady, thoughtful, and reliable."
    );
  } else if (plan === "impromptu") {
    reasonParts.push(
      "Since you enjoy being spontaneous and going with the flow, your pudding radiates a playful and free-spirited energy."
    );
  }

  if (hobby) {
    reasonParts.push(
      `Your hobby (“${hobby}”) also shaped the tiny props and overall atmosphere around your pudding character.`
    );
  }

  if (rhythm === "morning") {
    reasonParts.push(
      "As a morning type, you fit naturally into a bright sky with soft sunlight and gentle clouds."
    );
  } else if (rhythm === "night") {
    reasonParts.push(
      "As a night type, a moonlit, starry sky becomes the perfect backdrop for your pudding world."
    );
  }

  if (season) {
    reasonParts.push(
      `Your favorite season (“${season}”) sets the seasonal mood and color palette of your entire pudding scene.`
    );
  }

  const reason = `You turned into ${name} based on your answers. ${reasonParts.join(
    " "
  )}`;

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
  const [finishedQuestions, setFinishedQuestions] = useState(false);

  const [nickname, setNickname] = useState("");
  const [shareInstagram, setShareInstagram] = useState<null | boolean>(null);
  const [instagramUrl, setInstagramUrl] = useState("");

  const [result, setResult] = useState<PuddingResult | null>(null);
  const [idealMatches, setIdealMatches] = useState<IdealMatch[]>([]);

  // image states (Gemini / Imagen)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
      // finished Q10 → go to profile step
      setFinishedQuestions(true);
    }
  };

  // Call Gemini/Imagen to generate image
 const generatePuddingImage = useCallback(
  async (prompt: string | undefined) => {
    if (!prompt || !API_KEY) return;

    setIsLoadingImage(true);
    setImageError(null);
    setImageUrl(null);

    // 🔹 Gemini REST 형식
    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        imageConfig: {
          // 1:1 정사각형 (원하면 16:9, 9:16 등으로 변경 가능)
          aspectRatio: "1:1",
        },
      },
    };

    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetchWithBackoff(IMAGE_GENERATION_URL, options);
      const data: any = await response.json();

      // 🔹 inlineData 에서 base64 추출
      const partWithImage =
        data?.candidates?.[0]?.content?.parts?.find(
          (p: any) => p.inlineData
        );
      const base64Data = partWithImage?.inlineData?.data;

      if (base64Data) {
        const url = `data:image/png;base64,${base64Data}`;
        setImageUrl(url);
      } else {
        console.error("No inlineData in response:", data);
        setImageError(
          "Failed to generate image. Response did not contain image data."
        );
      }
    } catch (err) {
      console.error("Gemini image API call failed:", err);
      setImageError(
        "Failed to connect to the image generation service. Please try again."
      );
    } finally {
      setIsLoadingImage(false);
    }
  },
  []
);

  const handleCreateProfileAndResult = () => {
    if (!nickname || shareInstagram === null) return;

    const pudding = pickPudding(answers);
    const matches = pickIdealMatches(answers);

    // later: send nickname/instagram/answers to backend here
    // and use backend matches instead of dummy

    setResult(pudding);
    setIdealMatches(matches);

    // start generating image immediately
    generatePuddingImage(pudding.imagePrompt);
  };

  const handleRestart = () => {
    setStarted(false);
    setStep(0);
    setAnswers({});
    setFinishedQuestions(false);
    setNickname("");
    setShareInstagram(null);
    setInstagramUrl("");
    setResult(null);
    setIdealMatches([]);
    setImageUrl(null);
    setIsLoadingImage(false);
    setImageError(null);
  };

  const loadingIndicator = (
    <div className="w-full h-48 bg-orange-100/70 rounded-2xl flex flex-col items-center justify-center border border-orange-200 shadow-inner">
      <svg
        className="animate-spin h-8 w-8 text-orange-600 mb-3"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 
             1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="text-sm text-orange-700 font-semibold">
        Generating your pudding... Please wait!
      </span>
    </div>
  );

  const errorDisplay =
    imageError && result ? (
      <div className="w-full h-48 bg-red-100 rounded-2xl flex flex-col items-center justify-center border-2 border-red-300 p-4">
        <p className="text-red-700 font-semibold mb-2">
          😭 Image generation error
        </p>
        <p className="text-xs text-red-600 text-center">{imageError}</p>
        <button
          onClick={() => generatePuddingImage(result.imagePrompt)}
          className="mt-3 text-xs bg-red-400 text-white px-3 py-1 rounded-full hover:bg-red-500 transition"
        >
          Try again
        </button>
      </div>
    ) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white/90 shadow-2xl rounded-3xl p-6 md:p-8 border-t-4 border-orange-400 backdrop-blur-sm">
        {/* Start Screen */}
        {!started && !result && !finishedQuestions && (
          <section className="text-center space-y-6 py-12">
            <div className="text-6xl animate-bounce">🍮✨</div>
            <h1 className="text-3xl font-extrabold text-orange-800">
              Find my little pudding
            </h1>
            <p className="text-sm text-orange-700/90 leading-relaxed">
              Answer 10 questions about your personality and dating style,
              <br />
              and let AI create a one-of-a-kind pudding character just for you.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-orange-600 px-8 py-3 text-white font-bold text-lg hover:bg-orange-700 transition transform hover:scale-105 shadow-lg"
            >
              Start the quiz 🚀
            </button>
          </section>
        )}

        {/* Question Screen */}
        {started && !finishedQuestions && !result && current && (
          <section className="space-y-6">
            <div className="flex justify-between items-center text-xs text-orange-800/70 mb-1">
              <span>
                Q{step + 1} / {QUESTIONS.length}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-orange-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h2 className="text-sm font-semibold text-orange-700">
              {current.title}
            </h2>
            <p className="text-xl text-orange-900 font-bold">
              {current.question}
            </p>

            <div className="space-y-3 mt-4">
              {current.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(current.id, opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border text-base transition ${
                    answers[current.id] === opt.value
                      ? "bg-orange-500 text-white border-orange-500 shadow-md"
                      : "bg-white/70 hover:bg-orange-50 border-orange-200 text-orange-900"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                className="rounded-full bg-orange-500 px-6 py-2 text-white text-md font-semibold hover:bg-orange-600 transition disabled:bg-orange-200"
                disabled={!answers[current.id]}
              >
                {step < QUESTIONS.length - 1 ? "Next →" : "Go to profile ✨"}
              </button>
            </div>
          </section>
        )}

        {/* Profile Screen (nickname + Instagram share) */}
        {finishedQuestions && !result && (
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-orange-700 text-center">
              Almost done! ✨
            </h2>
            <p className="text-sm text-orange-900/80 text-center">
              Set up your profile so we can show your pudding and your ideal
              matches.
            </p>

            {/* Nickname */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-orange-700">
                Nickname
              </label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm"
                placeholder="How should we call your pudding?"
              />
            </div>

            {/* Instagram share yes/no */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-orange-700">
                Do you want to share your Instagram with your matches?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShareInstagram(true)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm ${
                    shareInstagram === true
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white/70 border-orange-200 text-orange-900"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShareInstagram(false)}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm ${
                    shareInstagram === false
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white/70 border-orange-200 text-orange-900"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Instagram URL (only if Yes) */}
            {shareInstagram === true && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-orange-700">
                  Instagram URL
                </label>
                <input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 text-sm"
                  placeholder="https://instagram.com/your_id"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCreateProfileAndResult}
                className="rounded-full bg-orange-500 px-5 py-2 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:bg-orange-200"
                disabled={!nickname || shareInstagram === null}
              >
                See my pudding →
              </button>
            </div>
          </section>
        )}

        {/* Result Screen */}
        {result && (
          <section className="space-y-6">
            <div className="text-center space-y-3">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold text-orange-700">
                {nickname ? `${nickname}, you are...` : "You are..."}
                <br />
                <span className="text-3xl font-extrabold text-orange-600 block mt-2">
                  {result.name}
                </span>
              </h2>
            </div>

            {/* Image Section */}
            <div className="mt-4">
              {isLoadingImage
                ? loadingIndicator
                : imageError
                ? errorDisplay
                : imageUrl
                ? (
                  <div className="relative w-full rounded-2xl shadow-xl overflow-hidden border-4 border-orange-200 bg-white">
                    <img
                      src={imageUrl}
                      alt={`${result.name} character image`}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )
                : (
                  <div className="w-full h-48 bg-orange-100 rounded-2xl flex items-center justify-center border-4 border-dashed border-orange-300">
                    <span className="text-orange-500 font-medium text-sm">
                      Image will appear here once generated.
                    </span>
                  </div>
                )}
            </div>

            <p className="text-sm text-orange-900/80 whitespace-pre-line text-center bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              {result.reason}
            </p>

            {/* Image Prompt (dev/debug) */}
            <details className="mt-4 rounded-xl bg-orange-50/70 border border-orange-100 p-3 cursor-pointer">
              <summary className="text-xs font-semibold text-orange-700">
                🪄 View image generation prompt (for developers)
              </summary>
              <pre className="text-[10px] text-orange-900/80 whitespace-pre-wrap mt-2 p-1 border-t border-orange-100 pt-2">
                {result.imagePrompt}
              </pre>
            </details>

            {/* Ideal Matches */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-orange-700 mb-3 text-center">
                💖 Your top 3 ideal pudding matches 💖
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {idealMatches.map((m, index) => {
                  const showInstagram = m.shareInstagram && m.instagramUrl;
                  const desc = buildIdealDescription(m);

                  return (
                    <div
                      key={m.id}
                      className="rounded-2xl bg-white/80 border-2 border-orange-200 p-4 text-center text-xs flex flex-col gap-1 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
                    >
                      <div
                        className={`text-sm font-extrabold mb-1 ${
                          index === 0 ? "text-red-500" : "text-orange-800"
                        }`}
                      >
                        #{index + 1} · {m.nickname}
                      </div>
                      <div className="text-[11px] text-orange-900/80">
                        {m.puddingName}
                      </div>
                      <div className="text-[10px] text-orange-900/70">
                        Gender vibe: {m.gender === "male" ? "Male" : "Female"}
                      </div>

                      {showInstagram ? (
                        <a
                          href={m.instagramUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 underline break-all mt-1"
                        >
                          Instagram: {m.instagramUrl}
                        </a>
                      ) : (
                        <p className="text-[10px] text-orange-900/80 text-left leading-snug mt-1">
                          {desc}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-6">
              <button
                onClick={handleRestart}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-600 px-8 py-3 text-white font-bold text-lg hover:bg-orange-700 transition transform hover:scale-105 shadow-lg"
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
