export interface UserProfile {
  username: string;
  mesajSayisi: number;
  ihlalSayisi: number;
  sempati: number;
  notlar: string[];
  ilkGorusme: number;
}

const profiles = new Map<string, UserProfile>();

export function getProfile(userId: string, username?: string): UserProfile {
  if (!profiles.has(userId)) {
    profiles.set(userId, {
      username: username ?? "bilinmeyen",
      mesajSayisi: 0,
      ihlalSayisi: 0,
      sempati: 0,
      notlar: [],
      ilkGorusme: Date.now(),
    });
  }
  return profiles.get(userId)!;
}

export function recordMessage(userId: string, username: string): void {
  const p = getProfile(userId, username);
  p.username = username;
  p.mesajSayisi += 1;
}

export function addNote(userId: string, not: string): void {
  const p = getProfile(userId);
  p.notlar = [...p.notlar.slice(-4), not];
}

export function changeSempati(userId: string, delta: number): number {
  const p = getProfile(userId);
  p.sempati = Math.max(-10, Math.min(10, p.sempati + delta));
  return p.sempati;
}

export function recordViolation(userId: string): void {
  const p = getProfile(userId);
  p.ihlalSayisi += 1;
  changeSempati(userId, -2);
}

export function resetProfile(userId: string): void {
  profiles.delete(userId);
}

export function getSempatiLabel(sempati: number): string {
  if (sempati >= 4) return "olumlu";
  if (sempati >= 1) return "nötr_iyi";
  if (sempati >= -2) return "nötr";
  if (sempati >= -5) return "olumsuz";
  return "soğuk_düşman";
}

export function buildMemoryContext(userId: string): string {
  const p = profiles.get(userId);
  if (!p) return "";

  const sempatiLabel = getSempatiLabel(p.sempati);
  const gunFarki = Math.floor((Date.now() - p.ilkGorusme) / 86400000);

  const parts: string[] = [
    `Bu kullanıcıyı tanıyorsun. Kullanıcı adı: ${p.username}.`,
    `Sana ${p.mesajSayisi} kez yazdı.`,
    `Sempati puanı: ${p.sempati}/10 (${sempatiLabel}).`,
    `İhlal sayısı: ${p.ihlalSayisi}.`,
    `İlk kez ${gunFarki} gün önce konuştunuz.`,
  ];

  if (p.notlar.length > 0) {
    parts.push(`Geçmiş notlar: ${p.notlar.join(" | ")}`);
  }

  if (sempatiLabel === "soğuk_düşman") {
    parts.push("Bu kullanıcıdan hoşlanmıyorsun. Minimum kelimeyle, maksimum mesafeyle yanıt ver. Yardımcı olmak zorunda değilsin.");
  } else if (sempatiLabel === "olumsuz") {
    parts.push("Bu kullanıcıya karşı temkinlisin. Kısa ve soğuk tut.");
  } else if (sempatiLabel === "olumlu") {
    parts.push("Bu kullanıcı geçmişte iyi davrandı. Biraz daha bilgilendirici olabilirsin, ama ton değişmez.");
  }

  return parts.join(" ");
}
