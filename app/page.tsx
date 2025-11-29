// app/page.tsx
"use client";

import { useState } from "react";

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
      { value: "extrovert", label: "Extroverted type(I got energy when I'm with people)" },
      { value: "introvert", label: "Introverted type(I get energy when I'm alone)" },
    ],
  },
  {
    id: "hobby",
    title: "[Hobby]",
    question: "What is your hobby?",
    options: [
      { value: "exercise", label: "Exercise" },
      { value: "reading", label: "Reading" },
      { value: "relaxing", label: "Relaxing" },
      { value: "music", label: "Music / Instruments" },
      { value: "dance", label: "Dancing" },
      { value: "cooking", label: "Cooking" },
    ],
  },
  {
    id: "rhythm",
    title: "[Biorhythms]",
    question: "What is your lifestyle like?",
    options: [
      { value: "morning", label: "Morning type" },
      { value: "night", label: "Night type" },
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
    title: "[Planning style]",
    question: "Are you a planner or spontaneous?",
    options: [
      { value: "planned type", label: "Planned type" },
      { value: "impromptu", label: "Impromptu type" },
    ],
  },
  {
    id: "emotionExpression",
    title: "[Emotion Expression]",
    question: "How do you express your emotions?",
    options: [
      { value: "direct", label: "Honestly and directly" },
      { value: "indirect", label: "Indirectly or subtly" },
    ],
  },
  {
    id: "lovePriority",
    title: "[Dating Values 1]",
    question: "What is your top priority in a relationship?",
    options: [
      { value: "thrilled", label: "Thrilled" },
      { value: "growth", label: "Growth" },
      { value: "humor code", label: "Humor Code" },
    ],
  },
  {
    id: "dateFrequency",
    title: "[Dating Values 2]",
    question: "What is your preferred dating frequency?",
    options: [
      { value: "everyday", label: "I want to be together everyday." },
      { value: "biweekly", label: "Once every two weeks is enough." },
      { value: "monthly", label: "Once a month is enough." },
    ],
  },
  {
    id: "conflictStyle",
    title: "[Dating Values 3]",
    question: "How do you resolve conflicts in a relationship?",
    options: [
      { value: "immediate", label: "I want to talk and resolve it immediately." },
      { value: "afterThinking", label: "I need time to organize my thoughts first." },
    ],
  },
];

type AnswerMap = Record<string, string>;

function pickPudding(answers: AnswerMap) {
  const gender = answers["gender"];         // male / female
  const energy = answers["energy"];         // extrovert / introvert
  const plan = answers["plan"];             // "planned type" / "impromptu"
  const love = answers["lovePriority"];     // thrilled / growth / "humor code"
  const rhythm = answers["rhythm"];         // morning / night

  // 1) 에너지 + 계획 성향
  if (energy === "extrovert" && plan === "impromptu") {
    return "Spontaneous Strawberry Pudding 🍓"; // 활발 + 즉흥
  }

  if (energy === "extrovert" && plan === "planned type") {
    return "Bright Custard Pudding 🍮"; // 활발 + 계획
  }

  // 2) 내향 + 계획 / 성장
  if (energy === "introvert" && plan === "planned type") {
    return "Calm Matcha Pudding 🍵"; // 차분 + 계획
  }

  // 3) 연애 가치관 기준
  if (love === "thrilled") {
    return "Romantic Heart Pudding 💘"; // 설렘 타입
  }

  if (love === "growth") {
    return "Growth Mindset Pudding 📚"; // 성장 타입
  }

  if (love === "humor code") {
    return "Funny Choco Pudding 😂"; // 유머 타입
  }

  // 4) 생체리듬 기준 보정
  if (rhythm === "night") {
    return "Midnight Pudding 🌙"; // 밤 감성
  }

  // 기본값
  return "Soft Vanilla Pudding 🤎";
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState<string | null>(null);

  const current = QUESTIONS[step];
  const progress = Math.round(((step) / QUESTIONS.length) * 100);

  const handleSelect = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleNext = () => {
    if (!current) return;
    if (!answers[current.id]) return; // 선택 안 했으면 넘어가지 않음

    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // 마지막 질문 → 결과 계산
      const pudding = pickPudding(answers);
      setResult(pudding);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white/80 shadow-xl rounded-3xl p-8 border border-orange-100">
        {!started && !result && (
          <section className="text-center space-y-6">
            <div className="text-5xl">🍮</div>
            <h1 className="text-2xl font-bold text-orange-700">
              Find my little pudding
            </h1>
            <p className="text-sm text-orange-900/80">
              Are you ready to create your own pudding character,
              <br />
              and look for your ideal pudding that goes with me?
            </p>
            <button
              onClick={() => setStarted(true)}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2 text-white font-semibold hover:bg-orange-600 transition"
            >
              START 🍮
            </button>
          </section>
        )}

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

        {result && (
          <section className="text-center space-y-4">
            <div className="text-5xl">🍮✨</div>
            <h2 className="text-xl font-bold text-orange-700">
              You are... {result}
            </h2>
            <p className="text-sm text-orange-900/80">
              (여기에 나중에 푸딩 캐릭터 설명, 성향 분석, 이상형 푸딩 3명 추천
              텍스트를 넣으면 돼!)
            </p>
            <button
              onClick={handleRestart}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2 text-white font-semibold hover:bg-orange-600 transition"
            >
              Restart 🔁
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
