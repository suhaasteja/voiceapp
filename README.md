# VoiceForge

A lightweight TTS studio that previews voices in-browser and generates high-quality MP3 downloads via a serverless API.

## Features
- Browser preview with pitch + speed controls (Web Speech API).
- Studio MP3 generation using OpenAI TTS.
- Voice selection for both preview and download.

## Local setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. When you open the app, it will prompt for your OpenAI API key and store it locally.

## Deployment (Vercel)
1. Push this folder to a Git repo.
2. Create a new Vercel project from the repo.
3. Deploy.

## Notes
- Pitch is applied to the browser preview only. MP3 generation uses the server voice model.
- Browser preview voice availability depends on OS and browser.
- The app prompts for an OpenAI API key before showing the studio UI.
