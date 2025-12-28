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
  "[class*=article-content]",
  "[class*=entry-content]",
  "[class*=post-content]",
  "[class*=story-body]",
  "[class*=article-body]",
  "[class*=text-content]",
  "[class*=main-content]",
  "[class*=page-content]",
  "[id*=content]",
  "[id*=article]",
  "[id*=post]",
  "[role=article]",
  "main",
];

// Elements to exclude from content extraction
const excludeSelectors = [
  "nav",
  "header",
  "footer",
  "aside",
  "[class*=nav]",
  "[class*=menu]",
  "[class*=sidebar]",
  "[class*=header]",
  "[class*=footer]",
  "[class*=ad]",
  "[class*=advertisement]",
  "[class*=widget]",
  "[class*=social]",
  "[class*=share]",
  "[class*=comment]",
  "script",
  "style",
  "noscript",
];

// Paywall/login indicators
const paywallIndicators = [
  "login",
  "subscribe",
  "sign up",
  "premium",
  "members only",
  "end of free content",
  "to access this material",
  "please log in",
];

const textFrom = ($: cheerio.CheerioAPI, selector: string) => {
  const node = $(selector).first();
  if (!node.length) return null;
  
  // Clone the node to avoid modifying the original
  const clone = node.clone();
  
  // Remove excluded elements
  excludeSelectors.forEach(excludeSelector => {
    clone.find(excludeSelector).remove();
  });
  
  const text = clone.text().trim();
  return text.length > 0 ? text : null;
};

const isPaywalled = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return paywallIndicators.some(indicator => lowerText.includes(indicator));
};

const extractContent = ($: cheerio.CheerioAPI): string | null => {
  // Try to find the main content area
  for (const selector of selectors) {
    const text = textFrom($, selector);
    if (text) {
      // Check if content seems substantial (not just paywall message)
      // Paywall messages are usually short, real articles are longer
      if (text.length > 200 && !isPaywalled(text)) {
        return text;
      }
      // If we found something but it might be paywalled, still return it
      // but the length check helps filter out very short paywall messages
      if (text.length > 100 && !isPaywalled(text)) {
        return text;
      }
    }
  }
  
  // Fallback: try to find paragraphs or divs with substantial text
  const paragraphs = $("p").filter((_, el) => {
    const text = $(el).text().trim();
    // More lenient - accept paragraphs with at least 30 characters
    return text.length > 30;
  });
  
  if (paragraphs.length > 0) {
    const combinedText = paragraphs
      .map((_, el) => {
        const p = $(el).clone();
        excludeSelectors.forEach(excludeSelector => {
          p.find(excludeSelector).remove();
        });
        return p.text().trim();
      })
      .get()
      .filter(text => text.length > 0)
      .join("\n\n")
      .trim();
    
    if (combinedText.length > 80 && !isPaywalled(combinedText)) {
      return combinedText;
    }
  }
  
  // Try to find divs with class names that suggest content
  const contentDivs = $("div[class*='text'], div[class*='story'], div[class*='news'], div[class*='article']")
    .filter((_, el) => {
      const text = $(el).text().trim();
      return text.length > 100;
    });
  
  if (contentDivs.length > 0) {
    const bestDiv = contentDivs.toArray().reduce((best, el) => {
      const currentText = $(el).text().trim();
      const bestText = $(best).text().trim();
      return currentText.length > bestText.length ? el : best;
    }, contentDivs[0]);
    
    const divText = $(bestDiv).clone();
    excludeSelectors.forEach(excludeSelector => {
      divText.find(excludeSelector).remove();
    });
    const text = divText.text().trim();
    
    if (text.length > 100 && !isPaywalled(text)) {
      return text;
    }
  }
  
  // Try to find any div with substantial text content (very broad search)
  const allDivs = $("div").filter((_, el) => {
    const div = $(el);
    const text = div.text().trim();
    // Check if this div has substantial text and isn't just a container
    const hasSubstantialText = text.length > 150;
    const hasMultipleParagraphs = div.find("p").length > 2;
    const hasMultipleLines = text.split("\n").filter(line => line.trim().length > 20).length > 3;
    
    return hasSubstantialText && (hasMultipleParagraphs || hasMultipleLines);
  });
  
  if (allDivs.length > 0) {
    // Find the div with the most text content
    const bestDiv = allDivs.toArray().reduce((best, el) => {
      const currentText = $(el).text().trim();
      const bestText = $(best).text().trim();
      return currentText.length > bestText.length ? el : best;
    }, allDivs[0]);
    
    const div = $(bestDiv).clone();
    excludeSelectors.forEach(excludeSelector => {
      div.find(excludeSelector).remove();
    });
    const text = div.text().trim();
    
    if (text.length > 100 && !isPaywalled(text)) {
      return text;
    }
  }
  
  // Last fallback: try to get body text but exclude navigation/menus
  const body = $("body").clone();
  excludeSelectors.forEach(excludeSelector => {
    body.find(excludeSelector).remove();
  });
  const bodyText = body.text().trim();
  
  // More lenient: accept body text if it's substantial and not paywalled
  if (bodyText.length > 150 && !isPaywalled(bodyText)) {
    return bodyText;
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

    const content = extractContent($);
    
    // Check if content extraction failed
    if (!content) {
      throw new ArticleFetchError(
        "Could not extract article content. The article may be behind a paywall or require login.",
        403
      );
    }
    
    // If content is very short (less than 50 chars), it's likely not real content
    if (content.length < 50) {
      throw new ArticleFetchError(
        "Could not extract article content. The article may be behind a paywall or require login.",
        403
      );
    }
    
    // If content has paywall indicators and is short, reject it
    if (isPaywalled(content) && content.length < 300) {
      throw new ArticleFetchError(
        "Could not extract article content. The article may be behind a paywall or require login.",
        403
      );
    }
    
    // Log for debugging
    console.log(`Extracted content length: ${content.length} characters`);
    console.log(`Content preview: ${content.substring(0, 200)}...`);

    return {
      date: null,
      title: null,
      content,
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

