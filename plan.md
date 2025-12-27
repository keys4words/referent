# Implementation Plan: AI Action Buttons

Based on `project.md`, this document outlines the order of actions to implement functionality for the three AI action buttons:
- «О чем статья?» (blue) - "What is the article about?"
- «Тезисы» (green) - "Thesis/Key Points"
- «Пост для Telegram» (red) - "Post for Telegram"

## Current State
- Buttons exist in the UI (`app/page.tsx`)
- Buttons currently only set `activeAction` state but don't perform any AI operations
- Translation functionality (`/api/translate`) is already implemented and can serve as a reference

## Implementation Order

### Step 1: Create API Route for "О чем статья?" (About/Summary)
**File:** `app/api/about/route.ts`

1. Create new API route file following the pattern from `/api/translate/route.ts`
2. Implement article parsing (reuse parsing logic from translate route)
3. Call OpenRouter AI API with Deepseek model
4. System prompt: "You are a professional content analyst. Analyze the following article and provide a concise summary in Russian explaining what the article is about. Focus on the main topic, key points, and purpose. Return only the summary without additional comments."
5. User prompt: "What is this article about? Provide a summary in Russian:\n\n{article_content}"
6. Return response in format: `{ summary: string }`
7. Handle errors appropriately

### Step 2: Create API Route for "Тезисы" (Thesis/Key Points)
**File:** `app/api/thesis/route.ts`

1. Create new API route file following the same pattern
2. Implement article parsing (reuse parsing logic)
3. Call OpenRouter AI API with Deepseek model
4. System prompt: "You are a professional content analyst. Analyze the following article and extract the main thesis statements and key points in Russian. Present them as a structured list of concise bullet points. Return only the thesis points without additional comments."
5. User prompt: "Extract the main thesis and key points from this article in Russian:\n\n{article_content}"
6. Return response in format: `{ thesis: string }`
7. Handle errors appropriately

### Step 3: Create API Route for "Пост для Telegram" (Telegram Post)
**File:** `app/api/telegram/route.ts`

1. Create new API route file following the same pattern
2. Implement article parsing (reuse parsing logic)
3. Call OpenRouter AI API with Deepseek model
4. System prompt: "You are a social media content creator. Create an engaging Telegram post in Russian based on the following article. The post should be concise, informative, and suitable for Telegram format. Include relevant hashtags if appropriate. Return only the post content without additional comments."
5. User prompt: "Create a Telegram post in Russian based on this article:\n\n{article_content}"
6. Return response in format: `{ post: string }`
7. Handle errors appropriately

### Step 4: Update Frontend - Handle "О чем статья?" Action
**File:** `app/page.tsx`

1. In `handleAction` function, add condition for `action === "about"`
2. Make API call to `/api/about` endpoint
3. Pass URL in request body: `{ url: string }`
4. Handle response and set result: `setResult(data.summary)`
5. Handle errors and display appropriate error messages
6. Set loading states appropriately

### Step 5: Update Frontend - Handle "Тезисы" Action
**File:** `app/page.tsx`

1. In `handleAction` function, add condition for `action === "thesis"`
2. Make API call to `/api/thesis` endpoint
3. Pass URL in request body: `{ url: string }`
4. Handle response and set result: `setResult(data.thesis)`
5. Handle errors and display appropriate error messages
6. Set loading states appropriately

### Step 6: Update Frontend - Handle "Пост для Telegram" Action
**File:** `app/page.tsx`

1. In `handleAction` function, add condition for `action === "telegram"`
2. Make API call to `/api/telegram` endpoint
3. Pass URL in request body: `{ url: string }`
4. Handle response and set result: `setResult(data.post)`
5. Handle errors and display appropriate error messages
6. Set loading states appropriately

### Step 7: Code Reusability Optimization (Optional but Recommended)
**Consideration:** Create shared utility functions

1. Extract article parsing logic into a shared utility function
2. Extract OpenRouter API call logic into a shared utility function
3. This will reduce code duplication across all API routes

### Step 8: Testing
1. Test each button with a sample article URL
2. Verify that results appear in the "Результат" field
3. Test error handling (invalid URL, API errors, etc.)
4. Verify loading states work correctly
5. Ensure active action badge displays correctly

## Technical Details

### API Configuration
- **Service:** OpenRouter AI
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Model:** `deepseek/deepseek-chat`
- **API Key:** From `OPENROUTER_API_KEY` environment variable in `.env.local`
- **Headers:** 
  - `Authorization: Bearer {apiKey}`
  - `HTTP-Referer: {app_url}`
  - `X-Title: Referent AI Translator`

### Response Format
All API routes should return:
- Success: `{ [actionType]: string }` (e.g., `{ summary: string }`, `{ thesis: string }`, `{ post: string }`)
- Error: `{ error: string }`

### Error Handling
- Invalid or missing URL
- Failed article parsing
- OpenRouter API errors
- Network errors
- Missing API key

## Notes
- All responses should be in Russian language
- Follow the same error handling pattern as the translate route
- Maintain consistent code style with existing codebase
- All three actions should parse the article first, then process with AI

