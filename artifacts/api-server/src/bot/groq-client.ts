import Groq from "groq-sdk";
import { SYSTEM_PROMPT } from "./personality.js";
import { logger } from "../lib/logger.js";

const groq = new Groq({
  apiKey: process.env["GROQ_API_KEY"],
});

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

  const systemContent = extraContext
    ? `${SYSTEM_PROMPT}\n\nBAĞLAM: ${extraContext}`
    : SYSTEM_PROMPT;

  history.push({ role: "user", content: userMessage });

  if (history.length > 20) {
    history.splice(0, 2);
  }

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemContent },
        ...history,
      ],
      max_tokens: 400,
      temperature: 0.85,
    });

    const reply = response.choices[0]?.message?.content ?? "...";
    history.push({ role: "assistant", content: reply });
    conversationHistory.set(userId, history);

    return reply;
  } catch (err) {
    logger.error({ err }, "Groq API error");
    return "Şu an konuşmak istemiyorum. Sonra gel.";
  }
}

export function clearHistory(userId: string): void {
  conversationHistory.delete(userId);
}
