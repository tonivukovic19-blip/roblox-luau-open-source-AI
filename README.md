# RoboBrain — Roblox Luau AI

A Vercel-ready web AI for Roblox/Luau coding.

## What it does

- Uses Qwen3 Coder through OpenRouter.
- Chat about Roblox/Luau.
- Attach `.lua` and `.luau` files to a conversation.
- Save good answers, scripts, corrections, and lessons as browser memory.
- Inject saved memory into future AI requests.
- Keeps the OpenRouter API key on the server.
- No localhost is required for the deployed site.

## Deploy

1. Create an OpenRouter API key.
2. Put this project on GitHub.
3. Import the GitHub repository into Vercel.
4. In Vercel Project Settings → Environment Variables, add:
   - `OPENROUTER_API_KEY` = your key
   - optional `OPENROUTER_MODEL` = `qwen/qwen3-coder`
   - optional `SITE_URL` = your deployed Vercel URL
5. Redeploy.
6. Open the Vercel URL.

## Learning

The current version uses retrieval-style learning: saved examples are stored in the browser and included in the model context. This is intentional because serverless functions should not pretend to retrain a large model after every message.

For real model training later, add:
- Supabase/Postgres for shared memory
- a dataset exporter
- QLoRA/LoRA training on a GPU
- a new adapter that can be selected by the server

## Important

Never put the OpenRouter key inside `app.js` or `index.html`. It belongs in Vercel Environment Variables.
