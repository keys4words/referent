"use client";

import { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type ActionType = "about" | "thesis" | "telegram";

const actionLabels: Record<ActionType, string> = {
  about: "О чем статья?",
  thesis: "Тезисы",
  telegram: "Пост для Telegram",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string>("Результат появится здесь.");
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAction = async (action: ActionType) => {
    if (!url.trim()) {
      setError("Введите ссылку на статью.");
      return;
    }

    setError(null);
    setErrorType(null);
    setActiveAction(action);
    setLoading(true);
    setStatus("Загружаю статью…");
    setResult("Загрузка...");

    // Map actions to their API endpoints and response keys
    const actionConfig: Record<
      ActionType,
      { endpoint: string; responseKey: string; errorMessage: string }
    > = {
      about: {
        endpoint: "/api/about",
        responseKey: "summary",
        errorMessage: "Не удалось создать описание статьи.",
      },
      thesis: {
        endpoint: "/api/thesis",
        responseKey: "thesis",
        errorMessage: "Не удалось извлечь тезисы.",
      },
      telegram: {
        endpoint: "/api/telegram",
        responseKey: "post",
        errorMessage: "Не удалось создать пост для Telegram.",
      },
    };

    const config = actionConfig[action];
    if (!config) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          statusCode?: number;
          isTimeout?: boolean;
        };
        
        // Handle different error types
        if (data.error === "FETCH_ERROR") {
          setErrorType("FETCH_ERROR");
          setError("Не удалось загрузить статью по этой ссылке.");
        } else if (data.error === "PAYWALL_ERROR") {
          setErrorType("PAYWALL_ERROR");
          setError("Статья недоступна: требуется подписка или вход в систему. Пожалуйста, используйте публично доступную статью.");
        } else if (data.error === "TOKEN_LIMIT_ERROR") {
          setErrorType("TOKEN_LIMIT_ERROR");
          setError("Превышен лимит токенов API. Статья слишком длинная или недостаточно кредитов. Попробуйте более короткую статью или пополните баланс на https://openrouter.ai/settings/credits");
        } else if (data.error === "API_CONFIG_ERROR") {
          setErrorType("API_CONFIG_ERROR");
          setError("Ошибка конфигурации API. Проверьте настройки.");
        } else if (data.error === "PROCESSING_ERROR") {
          setErrorType("PROCESSING_ERROR");
          setError(config.errorMessage);
        } else {
          setErrorType("UNKNOWN");
          setError(config.errorMessage);
        }
        setResult("");
        setStatus(null);
        return;
      }

      const data = (await response.json()) as {
        [key: string]: string | undefined;
        error?: string;
      };

      if (data.error) {
        setErrorType("PROCESSING_ERROR");
        setError(config.errorMessage);
        setResult("");
        setStatus(null);
        return;
      }

      const resultText = data[config.responseKey];
      if (!resultText) {
        setErrorType("PROCESSING_ERROR");
        setError(config.errorMessage);
        setResult("");
        setStatus(null);
        return;
      }

      setResult(resultText);
      setStatus(null);
      setError(null);
      setErrorType(null);
      
      // Scroll to results after successful generation
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setResult("");
      setStatus(null);
      
      // Handle network errors, timeouts, etc.
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setErrorType("FETCH_ERROR");
        setError("Не удалось загрузить статью по этой ссылке.");
      } else {
        setErrorType("UNKNOWN");
        setError("Произошла ошибка при выполнении действия.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setResult("Результат появится здесь.");
    setActiveAction(null);
    setLoading(false);
    setError(null);
    setErrorType(null);
    setStatus(null);
    setCopySuccess(false);
  };

  const handleCopy = async () => {
    if (!result || result === "Результат появится здесь." || result === "Загрузка...") {
      return;
    }

    try {
      await navigator.clipboard.writeText(result);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 sm:gap-10 px-4 sm:px-6 py-6 sm:py-12">
      <header className="space-y-2 text-center">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-500">
          Referent AI Translator
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
          Подготовка контента из статей
        </h1>
        <p className="text-sm sm:text-base text-slate-600 px-2">
          Вставьте ссылку на статью на любом языке и выберите нужное действие: описание, тезисы
          или пост для Telegram. Результат будет на русском языке.
        </p>
      </header>

      <section className="card p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-semibold text-slate-800" htmlFor="url">
            Ссылка на статью
          </label>
          <input
            id="url"
            type="url"
            inputMode="url"
            placeholder="Введите URL статьи, например: https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
          />
          <p className="text-xs text-slate-500">Укажите ссылку на статью на любом языке</p>
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription className="text-sm break-words">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            className="btn bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600 w-full sm:w-auto"
            onClick={() => handleAction("about")}
            aria-pressed={activeAction === "about"}
            disabled={loading}
            title="Получить краткое описание статьи на русском языке"
          >
            {loading && activeAction === "about" ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                {actionLabels.about}
              </>
            ) : (
              actionLabels.about
            )}
          </button>
          <button
            type="button"
            className="btn bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600 w-full sm:w-auto"
            onClick={() => handleAction("thesis")}
            aria-pressed={activeAction === "thesis"}
            disabled={loading}
            title="Извлечь основные тезисы и ключевые моменты статьи на русском языке"
          >
            {loading && activeAction === "thesis" ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                {actionLabels.thesis}
              </>
            ) : (
              actionLabels.thesis
            )}
          </button>
          <button
            type="button"
            className="btn bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600 w-full sm:w-auto"
            onClick={() => handleAction("telegram")}
            aria-pressed={activeAction === "telegram"}
            disabled={loading}
            title="Создать пост для Telegram на основе статьи на русском языке"
          >
            {loading && activeAction === "telegram" ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                {actionLabels.telegram}
              </>
            ) : (
              actionLabels.telegram
            )}
          </button>
          <button
            type="button"
            className="btn bg-slate-500 text-white hover:bg-slate-600 focus-visible:outline-slate-500 w-full sm:w-auto"
            onClick={handleClear}
            disabled={loading}
            title="Очистить все поля и результаты"
          >
            Очистить
          </button>
        </div>
      </section>

      <section ref={resultsRef} className="card p-4 sm:p-6 md:p-8">
        {status && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
            <Spinner size="sm" className="text-blue-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-blue-800 break-words">{status}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Результат</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {activeAction && (
              <span className="rounded-full bg-slate-100 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                {actionLabels[activeAction]}
              </span>
            )}
            {result && result !== "Результат появится здесь." && result !== "Загрузка..." && (
              <button
                type="button"
                onClick={handleCopy}
                className="btn bg-slate-600 text-white hover:bg-slate-700 focus-visible:outline-slate-600 text-xs sm:text-sm"
                title="Копировать результат"
              >
                {copySuccess ? "Скопировано!" : "Копировать"}
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 whitespace-pre-line break-words overflow-wrap-anywhere rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base text-slate-800" style={{ overflowWrap: 'anywhere' }}>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <Spinner size="lg" className="text-slate-600" />
              <span className="text-slate-600">Загрузка...</span>
            </div>
          ) : (
            result
          )}
        </div>
      </section>
    </main>
  );
}

