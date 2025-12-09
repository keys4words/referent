"use client";

import { useState } from "react";

type ActionType = "about" | "thesis" | "telegram";

const actionLabels: Record<ActionType, string> = {
  about: "О чем статья?",
  thesis: "Тезисы",
  telegram: "Пост для Telegram",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string>(
    "Результат появится здесь после выбора действия."
  );
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = (action: ActionType) => {
    if (!url.trim()) {
      setError("Введите ссылку на статью на английском языке.");
      return;
    }

    setError(null);
    setActiveAction(action);

    const examples: Record<ActionType, string> = {
      about: "Краткое описание: AI расскажет, о чем статья.",
      thesis:
        "Тезисы: AI подготовит список ключевых пунктов и основных идей статьи.",
      telegram:
        "Пост для Telegram: AI создаст лаконичный пост с выводами и ссылкой.",
    };

    // Placeholder until backend/AI wiring is added.
    setResult(
      `URL: ${url}\n\n${examples[action]}\n\n(Интеграция с AI будет добавлена позже.)`
    );
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Referent AI Translator
        </p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Подготовка контента из английских статей
        </h1>
        <p className="text-base text-slate-600">
          Вставьте ссылку на статью и выберите нужное действие: описание, тезисы
          или пост для Telegram.
        </p>
      </header>

      <section className="card p-6 sm:p-8">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-slate-800" htmlFor="url">
            Ссылка на статью (EN)
          </label>
          <input
            id="url"
            type="url"
            inputMode="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-600"
            onClick={() => handleAction("about")}
            aria-pressed={activeAction === "about"}
          >
            {actionLabels.about}
          </button>
          <button
            type="button"
            className="btn bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600"
            onClick={() => handleAction("thesis")}
            aria-pressed={activeAction === "thesis"}
          >
            {actionLabels.thesis}
          </button>
          <button
            type="button"
            className="btn bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600"
            onClick={() => handleAction("telegram")}
            aria-pressed={activeAction === "telegram"}
          >
            {actionLabels.telegram}
          </button>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Результат</h2>
          {activeAction && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {actionLabels[activeAction]}
            </span>
          )}
        </div>
        <div className="mt-4 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-800">
          {result}
        </div>
      </section>
    </main>
  );
}

