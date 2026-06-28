import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "./personality.js";
import { logger } from "../lib/logger.js";

const groq = new Groq({ apiKey: process.env["GROQ_API_KEY"] });

const MODEL = "llama-3.3-70b-versatile";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

const conversationHistory = new Map<string, ConversationMessage[]>();

export async function askGroq(
  userId: string,
  userMessage: string,
  extraContext?: string
): Promise<string> {
  const history = conversationHistory.get(userId) ?? [];

  const systemContent = [
    SYSTEM_PROMPT,
    extraContext ? `\nBAĞLAM: ${extraContext}` : "",
  ].join("");

  history.push({ role: "user", content: userMessage });

  if (history.length > 30) {
    history.splice(0, 2);
  }

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemContent },
        ...history,
      ],
      max_tokens: 600,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.3,
    });

    const reply = response.choices[0]?.message?.content?.trim() ?? "...";
    history.push({ role: "assistant", content: reply });
    conversationHistory.set(userId, history);

    return reply;
  } catch (err) {
    logger.error({ err }, "Groq API error");
    return "Hata oluştu.";
  }
}

export function clearHistory(userId: string): void {
  conversationHistory.delete(userId);
}
