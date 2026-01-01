import { NextResponse } from "next/server";
import { parseArticle, ArticleFetchError } from "../utils/articleParser";
import { callOpenRouter } from "../utils/openRouter";

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

    // Parse the article
    let parsed;
    try {
      parsed = await parseArticle(url);
    } catch (error) {
      if (error instanceof ArticleFetchError && error.statusCode === 403) {
        return NextResponse.json(
          { error: "PAYWALL_ERROR" },
          { status: 403 }
        );
      }
      throw error;
    }
    
    if (!parsed.content) {
      return NextResponse.json(
        { error: "Could not extract content from the article" },
        { status: 400 }
      );
    }

    // Step 1: Generate image prompt using OpenRouter AI
    const imagePrompt = await callOpenRouter(
      "You are a professional image prompt generator. Based on the following article, create a detailed, vivid image generation prompt in English. The prompt should describe a scene, concept, or visual representation that captures the essence of the article. Focus on visual elements, style, mood, and composition. Return only the prompt text without additional comments or explanations.",
      "Create a detailed image generation prompt in English based on this article:",
      parsed.content,
      500 // Shorter prompt generation
    );

    // Step 2: Generate image using Hugging Face Inference API
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json(
        { error: "HUGGINGFACE_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const hfResponse = await fetch(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${hfApiKey}`,
        },
        body: JSON.stringify({
          inputs: imagePrompt.trim(),
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorData = await hfResponse.json().catch(() => ({}));
      console.error("Hugging Face API error:", errorData);
      return NextResponse.json(
        { error: `Image generation failed: ${errorData.error || hfResponse.statusText}` },
        { status: hfResponse.status }
      );
    }

    // Hugging Face returns image as blob
    const imageBlob = await hfResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    return NextResponse.json({
      illustration: imageDataUrl,
      prompt: imagePrompt,
    });
  } catch (error) {
    console.error("Illustration generation error", error);
    
    if (error instanceof ArticleFetchError) {
      return NextResponse.json(
        { error: "FETCH_ERROR", statusCode: error.statusCode, isTimeout: error.isTimeout },
        { status: 502 }
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unexpected error during illustration generation";
    
    // Check for token/credit limit errors
    if (errorMessage === "TOKEN_LIMIT_ERROR") {
      return NextResponse.json(
        { error: "TOKEN_LIMIT_ERROR" },
        { status: 402 }
      );
    }
    
    // Check if it's an OpenRouter API error
    if (errorMessage.includes("OPENROUTER_API_KEY") || errorMessage.includes("OpenRouter")) {
      return NextResponse.json(
        { error: "API_CONFIG_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "PROCESSING_ERROR" },
      { status: 500 }
    );
  }
}

