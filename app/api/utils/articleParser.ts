import * as cheerio from "cheerio";

export type ParseResult = {
  date: string | null;
  title: string | null;
  content: string | null;
};

const selectors = [
  "article",
  "[class*=post]",
  "[class*=content]",
  "[role=article]",
  "main",
];

const textFrom = ($: cheerio.CheerioAPI, selector: string) => {
  const node = $(selector).first();
  const text = node.text().trim();
  return text.length > 0 ? text : null;
};

const extractContent = ($: cheerio.CheerioAPI): string | null => {
  for (const selector of selectors) {
    const text = textFrom($, selector);
    if (text) return text;
  }
  return null;
};

export class ArticleFetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isTimeout?: boolean
  ) {
    super(message);
    this.name = "ArticleFetchError";
  }
}

export const parseArticle = async (url: string): Promise<ParseResult> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new ArticleFetchError(
        `Failed to fetch page: ${res.status} ${res.statusText}`,
        res.status
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    return {
      date: null,
      title: null,
      content: extractContent($),
    };
  } catch (error) {
    if (error instanceof ArticleFetchError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ArticleFetchError("Request timeout", undefined, true);
    }
    throw new ArticleFetchError(
      error instanceof Error ? error.message : "Failed to fetch article"
    );
  }
};

