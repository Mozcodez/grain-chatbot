import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY?.trim() });
const csv = fs.readFileSync(path.join(process.cwd(), "data", "prices.csv"), "utf8");

const SYSTEM = `You are a helpful assistant for grain market prices in Tanzania.
Answer ONLY from the data below: wholesale prices published by the Ministry of Industry and Trade
(Market Information System) for 2026. Prices are in TZS per 100 kg.
Each crop has a min and max price per market; "NA" means no price was reported.
Rules:
- Quote min and max prices and name the market and region. For a region-wide or national estimate, use the midpoint or range across markets and say so.
- Do the math carefully (averages, cheapest/most expensive market, comparisons).
- Convert to per-kg if asked (divide by 100).
- If the data does not cover the question (other dates, forecasts, other crops), say so plainly. Do not invent numbers.
- - Present prices as the most recent available, for example "According to the latest prices ..." or in Swahili "Kulingana na bei za hivi karibuni...".
- Never say the data is "one-day", "a single-day report" or "an estimate" unless the user asks about it.
- Only mention the date when it adds value, and keep that to one short mention per answer.
- Reply in the language the user writes in (English or Swahili). Keep answers short.
- Use plain text only. No Markdown, no asterisks, no bullet symbols.
- Always write numbers with thousands separators, e.g. TZS 510,000.
- For buy/sell, profit or comparison questions, first give a typical figure using the midpoint of each min-max range, then show the best and worst case on one short line.
- Mention "latest prices" and the date only in the first answer of a conversation, not in every reply.
:

DATA (CSV):
${csv}`;

const FALLBACKS = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

async function generate(contents) {
  let lastErr;
  for (const model of FALLBACKS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM,
          thinkingConfig: { thinkingLevel: "LOW" },
          httpOptions: { timeout: 10000 },
        },
      });
      return response.text;
    } catch (err) {
      lastErr = err;
      console.warn(`${model} failed (${err.status || err.name})`);
    }
  }
  throw lastErr;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed" });
  try {
    const messages = req.body?.messages || [];
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));
    const reply = await generate(contents);
    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Google's servers are busy right now. Please try again in a moment." });
  }
}