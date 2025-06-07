# Summary Expansion Tools

This repository contains a Chrome extension for summarizing selected text and a small proxy server used to query the OpenAI API.

## gpt-proxy-server

1. Install dependencies (requires Node.js):
   ```bash
   npm install
   ```
2. Set `OPENAI_API_KEY` in a `.env` file or your environment.
3. Run the server:
   ```bash
   node index.js
   ```

The server exposes `POST /gpt` to generate a summary and quiz from text.

## text-summarizer

Load the `text-summarizer` folder as an unpacked extension in Chrome. Right-click selected text to generate a summary and quiz. Results are stored locally and can be viewed from the extension popup.
