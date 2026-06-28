import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("sor")
    .setDescription("Herhangi bir soruyu yanıtlar.")
    .addStringOption((o) => o.setName("soru").setDescription("Sorun").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ozetle")
    .setDescription("Verilen metni özetler.")
    .addStringOption((o) => o.setName("metin").setDescription("Özetlenecek metin").setRequired(true)),

  new SlashCommandBuilder()
    .setName("cevir")
    .setDescription("Metni istenen dile çevirir.")
    .addStringOption((o) => o.setName("metin").setDescription("Çevrilecek metin").setRequired(true))
    .addStringOption((o) => o.setName("dil").setDescription("Hedef dil (örn: İngilizce, Japonca)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("analiz")
    .setDescription("Bir metni veya durumu analiz eder.")
    .addStringOption((o) => o.setName("metin").setDescription("Analiz edilecek metin").setRequired(true)),

  new SlashCommandBuilder()
    .setName("kod")
    .setDescription("Açıklamaya göre kod yazar.")
    .addStringOption((o) => o.setName("aciklama").setDescription("Ne yapmasını istiyorsun?").setRequired(true))
    .addStringOption((o) => o.setName("dil").setDescription("Programlama dili (varsayılan: Python)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("hata-bul")
    .setDescription("Kodundaki hatayı bulur ve açıklar.")
    .addStringOption((o) => o.setName("kod").setDescription("Hatalı kod").setRequired(true)),

  new SlashCommandBuilder()
    .setName("kelime")
    .setDescription("Bir kelimenin anlamını, kökenini ve kullanımını açıklar.")
    .addStringOption((o) => o.setName("kelime").setDescription("Kelime").setRequired(true)),

  new SlashCommandBuilder()
    .setName("fikir")
    .setDescription("Bir konu hakkında özgün fikirler üretir.")
    .addStringOption((o) => o.setName("konu").setDescription("Konu").setRequired(true))
    .addIntegerOption((o) => o.setName("adet").setDescription("Kaç fikir? (1-10)").setMinValue(1).setMaxValue(10).setRequired(false)),

  new SlashCommandBuilder()
    .setName("karar")
    .setDescription("İki seçenek arasında karar verir ve gerekçeler sunar.")
    .addStringOption((o) => o.setName("birinci").setDescription("Birinci seçenek").setRequired(true))
    .addStringOption((o) => o.setName("ikinci").setDescription("İkinci seçenek").setRequired(true)),

  new SlashCommandBuilder()
    .setName("yeniden-yaz")
    .setDescription("Verilen metni daha iyi, daha etkili hale getirir.")
    .addStringOption((o) => o.setName("metin").setDescription("Düzeltilecek metin").setRequired(true))
    .addStringOption((o) => o.setName("ton").setDescription("Ton: resmi / samimi / agresif / profesyonel").setRequired(false)),

  new SlashCommandBuilder()
    .setName("siir")
    .setDescription("Verilen konuda şiir yazar.")
    .addStringOption((o) => o.setName("konu").setDescription("Şiirin konusu").setRequired(true))
    .addStringOption((o) => o.setName("tarz").setDescription("Tarz: serbest / hece / sonnet").setRequired(false)),

  new SlashCommandBuilder()
    .setName("slogan")
    .setDescription("Bir ürün, proje veya fikir için slogan üretir.")
    .addStringOption((o) => o.setName("konu").setDescription("Slogan yazılacak şey").setRequired(true))
    .addIntegerOption((o) => o.setName("adet").setDescription("Kaç slogan? (1-5)").setMinValue(1).setMaxValue(5).setRequired(false)),

  new SlashCommandBuilder()
    .setName("eposta")
    .setDescription("Profesyonel bir e-posta taslağı yazar.")
    .addStringOption((o) => o.setName("konu").setDescription("E-postanın konusu").setRequired(true))
    .addStringOption((o) => o.setName("amac").setDescription("Amacı: şikayet / teklif / başvuru / teşekkür").setRequired(false)),

  new SlashCommandBuilder()
    .setName("roast")
    .setDescription("Bir kullanıcıyı zekice ve sert şekilde eleştirir.")
    .addUserOption((o) => o.setName("kullanici").setDescription("Hedef kullanıcı").setRequired(true)),

  new SlashCommandBuilder()
    .setName("strateji")
    .setDescription("Bir durum veya problem için strateji önerir.")
    .addStringOption((o) => o.setName("durum").setDescription("Durum veya problem").setRequired(true)),

  new SlashCommandBuilder()
    .setName("matematik")
    .setDescription("Matematik işlemi veya problemi çözer.")
    .addStringOption((o) => o.setName("islem").setDescription("Matematik sorusu veya işlemi").setRequired(true)),

  new SlashCommandBuilder()
    .setName("trivia")
    .setDescription("Bir konuda ilginç ve az bilinen bir bilgi veya soru üretir.")
    .addStringOption((o) => o.setName("konu").setDescription("Konu (boş bırakırsan rastgele)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("ozgecmis")
    .setDescription("Verilen bilgilerle kısa bir biyografi veya özgeçmiş taslağı yazar.")
    .addStringOption((o) => o.setName("bilgiler").setDescription("Kişi hakkında bilgiler").setRequired(true)),

  new SlashCommandBuilder()
    .setName("tartis")
    .setDescription("Bir konunun artı ve eksilerini tarafsızca sunar.")
    .addStringOption((o) => o.setName("konu").setDescription("Tartışma konusu").setRequired(true)),

  new SlashCommandBuilder()
    .setName("sunucu-bilgi")
    .setDescription("Sunucu hakkında istatistik ve bilgileri gösterir."),

  new SlashCommandBuilder()
    .setName("kullanici-bilgi")
    .setDescription("Bir kullanıcı hakkında bilgi gösterir.")
    .addUserOption((o) => o.setName("kullanici").setDescription("Kullanıcı (boş: kendin)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("anket")
    .setDescription("Kanala anket gönderir.")
    .addStringOption((o) => o.setName("soru").setDescription("Anket sorusu").setRequired(true))
    .addStringOption((o) => o.setName("a").setDescription("1. seçenek").setRequired(true))
    .addStringOption((o) => o.setName("b").setDescription("2. seçenek").setRequired(true))
    .addStringOption((o) => o.setName("c").setDescription("3. seçenek").setRequired(false))
    .addStringOption((o) => o.setName("d").setDescription("4. seçenek").setRequired(false)),

  new SlashCommandBuilder()
    .setName("zar")
    .setDescription("Zar atar.")
    .addIntegerOption((o) => o.setName("yuz").setDescription("Kaç yüzlü zar? (varsayılan: 6)").setMinValue(2).setMaxValue(1000).setRequired(false))
    .addIntegerOption((o) => o.setName("adet").setDescription("Kaç zar? (varsayılan: 1)").setMinValue(1).setMaxValue(10).setRequired(false)),

  new SlashCommandBuilder()
    .setName("sec")
    .setDescription("Seçenekler arasından birini rastgele seçer.")
    .addStringOption((o) => o.setName("secenekler").setDescription("Virgülle ayır: pizza, burger, döner").setRequired(true)),

  new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("Tüm komutların listesini gösterir."),

  new SlashCommandBuilder()
    .setName("sinir")
    .setDescription("Seçilen kullanıcıya DM ile soğuk bir uyarı gönderir.")
    .addUserOption((o) => o.setName("kullanici").setDescription("Uyarılacak kullanıcı").setRequired(true))
    .addStringOption((o) => o.setName("sebep").setDescription("Uyarı sebebi (isteğe bağlı)").setRequired(false)),

  new SlashCommandBuilder()
    .setName("temizle")
    .setDescription("Bir kullanıcının tüm hafıza ve geçmişini siler. Bot onu yeni tanıyor gibi davranır.")
    .addUserOption((o) => o.setName("kullanici").setDescription("Geçmişi silinecek kullanıcı").setRequired(true)),
].map((cmd) => cmd.toJSON());
