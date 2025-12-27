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

export const parseArticle = async (url: string): Promise<ParseResult> => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  return {
    date: null,
    title: null,
    content: extractContent($),
  };
};

