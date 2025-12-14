import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

type ParseResult = {
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

const extractDate = ($: cheerio.CheerioAPI): string | null => {
  const metaProps = [
    'meta[property="article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[name="pubdate"]',
    'meta[name="publish-date"]',
    'meta[name="date"]',
  ];
  for (const selector of metaProps) {
    const value = $(selector).attr("content");
    if (value) return value.trim();
  }

  const timeTag = $("time").first();
  if (timeTag.length) {
    const datetime = timeTag.attr("datetime");
    if (datetime) return datetime.trim();
    const text = timeTag.text().trim();
    if (text) return text;
  }

  const dateLike = $("*[class*=date], *[id*=date]")
    .first()
    .text()
    .trim();
  return dateLike || null;
};

const extractTitle = ($: cheerio.CheerioAPI): string | null => {
  const og = $('meta[property="og:title"]').attr("content");
  if (og) return og.trim();
  const titleTag = $("title").first().text().trim();
  if (titleTag) return titleTag;
  const h1 = $("h1").first().text().trim();
  return h1 || null;
};

const extractContent = ($: cheerio.CheerioAPI): string | null => {
  for (const selector of selectors) {
    const text = textFrom($, selector);
    if (text) return text;
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { error: "URL is required in body: { url: string }" },
        { status: 400 }
      );
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const result: ParseResult = {
      date: extractDate($),
      title: extractTitle($),
      content: extractContent($),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Parse error", error);
    return NextResponse.json(
      { error: "Unexpected error during parsing" },
      { status: 500 }
    );
  }
}

