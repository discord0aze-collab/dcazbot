import Groq from "groq-sdk";
import { logger } from "../lib/logger.js";

const groq = new Groq({ apiKey: process.env["GROQ_API_KEY"] });

export type ViolationLevel = "temiz" | "uyari" | "orta" | "agir";

export interface ModerationResult {
  level: ViolationLevel;
  kategori: string | null;
  aciklama: string | null;
}

const MOD_SYSTEM = `Sen bir Discord sunucusu içerik moderatörüsün. Sana verilen mesajı analiz et ve JSON formatında yanıt ver.

Değerlendirme kategorileri:
- "temiz": Sorun yok
- "uyari": Hafif uygunsuz içerik (hafif argo, sinirli dil, minör spam)
- "orta": Orta düzey ihlal (hakaret, taciz, uygunsuz içerik, spam)
- "agir": Ciddi ihlal (nefret söylemi, aşırı şiddet/tehdit, yasadışı içerik, doxxing, link kötüye kullanımı, NSFW)

Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{"level":"temiz","kategori":null,"aciklama":null}
veya
{"level":"uyari","kategori":"spam","aciklama":"Tekrarlayan mesaj"}
veya
{"level":"agir","kategori":"nefret_soylemi","aciklama":"Kişiye yönelik ağır hakaret"}`;

const violationCount = new Map<string, number>();

export function getViolationCount(userId: string): number {
  return violationCount.get(userId) ?? 0;
}

export function addViolation(userId: string, amount = 1): number {
  const current = getViolationCount(userId);
  const next = current + amount;
  violationCount.set(userId, next);
  return next;
}

export function resetViolations(userId: string): void {
  violationCount.set(userId, 0);
}

export async function moderateMessage(content: string): Promise<ModerationResult> {
  if (content.length < 3) return { level: "temiz", kategori: null, aciklama: null };

  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: MOD_SYSTEM },
        { role: "user", content: `Mesaj: "${content.slice(0, 500)}"` },
      ],
      max_tokens: 80,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as ModerationResult;
    return parsed;
  } catch (err) {
    logger.error({ err }, "Moderation error");
    return { level: "temiz", kategori: null, aciklama: null };
  }
}
