# Tanzania Grain Prices Chatbot

A simple chatbot that answers questions about wholesale grain prices in Tanzania, powered by the Google Gemini API. Ask in English or Swahili, for example "Cheapest market for maize?", "Bei ya mchele Arusha?" or "How much would I make buying rice in Mbeya and selling in Dar es Salaam?".

The prices come from the Ministry of Industry and Trade's Market Information System (MIT) wholesale price report (TZS per 100 kg), stored in a CSV file and passed to the model as context.

## Features

- Answers price questions for 8 grains across 31 markets in Tanzania
- Handles lookups, comparisons, averages, per-kg conversion and simple buy/sell margin calculations
- Replies in English or Swahili, matching the user's language
- Automatic model fallback with timeouts if a Gemini model is overloaded or slow
- No database and no build step, just Node.js and a plain HTML page

## Grains covered

Maize, rice, sorghum, bulrush millet, finger millet, wheat, beans and Irish potatoes. Each has a minimum and maximum wholesale price per market.

## Tech stack

- Node.js 20.6+ (uses the built-in `--env-file` flag)
- Express
- `@google/genai` (Gemini API SDK)
- Vanilla HTML, CSS and JavaScript frontend

## Getting started

1. Clone the repo and install dependencies:

   ```bash
   git clone <your-repo-url>
   cd grain-chatbot
   npm install
   ```

2. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

3. Create your `.env` file from the example and add your key:

   ```bash
   cp .env.example .env
   ```

   On Windows Command Prompt, use `copy .env.example .env`.

   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-3.5-flash-lite
   PORT=3000
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open http://localhost:3000

## Project structure

```
grain-chatbot/
├── data/
│   └── prices.csv        # Wholesale price data (min/max per crop per market)
├── public/
│   └── index.html        # Chat interface
├── server.js             # Express server and Gemini API calls
├── package.json
├── .env.example
└── README.md
```

## How it works

1. The browser sends the conversation history to `POST /api/chat`.
2. `server.js` adds a system prompt containing the rules and the full contents of `data/prices.csv`.
3. The request goes to Gemini with low thinking effort for fast replies. If a model fails or takes longer than 15 seconds, the server tries the next model in the fallback list.
4. The answer is returned to the browser and shown in the chat.

Because the whole price table is small, it is passed directly in the prompt. Larger datasets would need a different approach, such as function calling or retrieval.

## Updating the data

1. Replace the rows in `data/prices.csv` with the new price sheet, keeping the same columns. Use `NA` where no price was reported.
2. Update the date in the `SYSTEM` prompt in `server.js`.
3. Restart the server.

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `GEMINI_API_KEY` | Your Google Gemini API key | required |
| `GEMINI_MODEL` | Model name shown at startup | `gemini-3.8-flash` |
| `PORT` | Port for the web server | `3000` |

The models actually used, and their order, are set in the `FALLBACKS` array in `server.js`. Gemini model availability changes often, so if you get a 404 or repeated timeouts, check the models available to your key:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
```

## Limitations

- The data is a single published snapshot, so the bot cannot show trends or forecasts.
- Prices are wholesale prices per 100 kg and do not include transport or handling costs.
- Answers depend on the model, so check important figures against the source report.

## Security

Never commit your `.env` file or share your API key. Keep `.env` in `.gitignore`. If a key is exposed, delete it in Google AI Studio and create a new one.

## Data source

Wizara ya Viwanda na Biashara (Ministry of Industry and Trade), Idara ya Maendeleo ya Biashara, Market Information System (MIT).