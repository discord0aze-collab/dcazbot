import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { askGroq, clearHistory } from "./groq-client.js";
import { resetProfile, getProfile, getSempatiLabel } from "./user-memory.js";
import { logger } from "../lib/logger.js";

async function groqReply(
  interaction: ChatInputCommandInteraction,
  prompt: string,
  userId: string
): Promise<void> {
  await interaction.deferReply();
  const reply = await askGroq(userId, prompt, "Slash komut yanıtı. Kısa, net, doğrudan yaz.");
  await interaction.editReply(reply);
}

export async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName, user } = interaction;

  try {
    switch (commandName) {
      case "sor": {
        const soru = interaction.options.getString("soru", true);
        await groqReply(interaction, soru, user.id);
        break;
      }

      case "ozetle": {
        const metin = interaction.options.getString("metin", true);
        await groqReply(interaction, `Şu metni özetle, ana fikirleri koru, gereksiz detayları at:\n\n${metin}`, user.id);
        break;
      }

      case "cevir": {
        const metin = interaction.options.getString("metin", true);
        const dil = interaction.options.getString("dil", true);
        await groqReply(interaction, `Şu metni ${dil} diline çevir, sadece çeviriyi yaz:\n\n${metin}`, user.id);
        break;
      }

      case "analiz": {
        const metin = interaction.options.getString("metin", true);
        await groqReply(interaction, `Şu metni analiz et — içerik, ton, niyet ve varsa psikolojik alt metin açısından:\n\n${metin}`, user.id);
        break;
      }

      case "kod": {
        const aciklama = interaction.options.getString("aciklama", true);
        const dil = interaction.options.getString("dil") ?? "Python";
        await groqReply(interaction, `${dil} dilinde şunu yapan kod yaz: ${aciklama}. Sadece kodu ver, gereksiz açıklama ekleme. Discord mesajında kod bloğu kullan.`, user.id);
        break;
      }

      case "hata-bul": {
        const kod = interaction.options.getString("kod", true);
        await groqReply(interaction, `Bu kodda hata bul, hatanın ne olduğunu ve nasıl düzeltileceğini söyle:\n\`\`\`\n${kod}\n\`\`\``, user.id);
        break;
      }

      case "kelime": {
        const kelime = interaction.options.getString("kelime", true);
        await groqReply(interaction, `"${kelime}" kelimesinin anlamını, kökenini ve bir cümle içinde kullanımını açıkla. Kısa tut.`, user.id);
        break;
      }

      case "fikir": {
        const konu = interaction.options.getString("konu", true);
        const adet = interaction.options.getInteger("adet") ?? 5;
        await groqReply(interaction, `"${konu}" hakkında ${adet} özgün ve uygulanabilir fikir üret. Madde madde yaz.`, user.id);
        break;
      }

      case "karar": {
        const birinci = interaction.options.getString("birinci", true);
        const ikinci = interaction.options.getString("ikinci", true);
        await groqReply(interaction, `"${birinci}" ve "${ikinci}" arasında hangisini seçmeli? Gerekçeli ve net bir karar ver. Kararsız kalma.`, user.id);
        break;
      }

      case "yeniden-yaz": {
        const metin = interaction.options.getString("metin", true);
        const ton = interaction.options.getString("ton") ?? "profesyonel";
        await groqReply(interaction, `Bu metni ${ton} bir tonla yeniden yaz, sadece yeni versiyonu ver:\n\n${metin}`, user.id);
        break;
      }

      case "siir": {
        const konu = interaction.options.getString("konu", true);
        const tarz = interaction.options.getString("tarz") ?? "serbest";
        await groqReply(interaction, `"${konu}" hakkında ${tarz} tarzda kısa bir şiir yaz. Sadece şiiri ver.`, user.id);
        break;
      }

      case "slogan": {
        const konu = interaction.options.getString("konu", true);
        const adet = interaction.options.getInteger("adet") ?? 3;
        await groqReply(interaction, `"${konu}" için ${adet} farklı, akılda kalıcı slogan üret. Madde madde yaz.`, user.id);
        break;
      }

      case "eposta": {
        const konu = interaction.options.getString("konu", true);
        const amac = interaction.options.getString("amac") ?? "genel";
        await groqReply(interaction, `"${konu}" konusunda ${amac} amaçlı, profesyonel bir e-posta taslağı yaz. Konu satırı ve gövde dahil.`, user.id);
        break;
      }

      case "roast": {
        const hedef = interaction.options.getUser("kullanici", true);
        const member = interaction.guild?.members.cache.get(hedef.id) as GuildMember | undefined;
        const hesapYasi = Math.floor((Date.now() - hedef.createdTimestamp) / (1000 * 60 * 60 * 24));
        const sunucuBilgi = member?.joinedTimestamp
          ? `Sunucuya katılım: ${Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24))} gün önce.`
          : "";
        await groqReply(
          interaction,
          `Discord kullanıcısı ${hedef.username}'i roast et. Hesap yaşı: ${hesapYasi} gün. ${sunucuBilgi} Zekice, sert ama hakaret içermeyen bir roast yaz. Kısa tut.`,
          user.id
        );
        break;
      }

      case "strateji": {
        const durum = interaction.options.getString("durum", true);
        await groqReply(interaction, `Şu durum için adım adım, uygulanabilir bir strateji öner:\n\n${durum}`, user.id);
        break;
      }

      case "matematik": {
        const islem = interaction.options.getString("islem", true);
        await groqReply(interaction, `Şu matematik sorusunu çöz, adımları göster:\n\n${islem}`, user.id);
        break;
      }

      case "trivia": {
        const konu = interaction.options.getString("konu") ?? "rastgele bir konu";
        await groqReply(interaction, `${konu} hakkında ilginç, az bilinen bir gerçek veya trivia sorusu üret. Cevabıyla birlikte yaz.`, user.id);
        break;
      }

      case "ozgecmis": {
        const bilgiler = interaction.options.getString("bilgiler", true);
        await groqReply(interaction, `Şu bilgilere dayanarak kısa ve etkili bir biyografi/özgeçmiş taslağı yaz:\n\n${bilgiler}`, user.id);
        break;
      }

      case "tartis": {
        const konu = interaction.options.getString("konu", true);
        await groqReply(interaction, `"${konu}" konusunun artılarını ve eksilerini tarafsızca, madde madde sun. İki tarafı dengeli işle.`, user.id);
        break;
      }

      case "sunucu-bilgi": {
        const guild = interaction.guild;
        if (!guild) { await interaction.reply("Sunucu bilgisi alınamadı."); break; }
        const embed = new EmbedBuilder()
          .setTitle(guild.name)
          .setThumbnail(guild.iconURL())
          .addFields(
            { name: "Üye Sayısı", value: `${guild.memberCount}`, inline: true },
            { name: "Kanal Sayısı", value: `${guild.channels.cache.size}`, inline: true },
            { name: "Rol Sayısı", value: `${guild.roles.cache.size}`, inline: true },
            { name: "Sunucu ID", value: guild.id, inline: true },
            { name: "Oluşturulma", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "Boost Seviyesi", value: `${guild.premiumTier}`, inline: true },
          )
          .setColor(0x2b2d31);
        await interaction.reply({ embeds: [embed] });
        break;
      }

      case "kullanici-bilgi": {
        const hedef = interaction.options.getUser("kullanici") ?? user;
        const member = interaction.guild?.members.cache.get(hedef.id) as GuildMember | undefined;
        const embed = new EmbedBuilder()
          .setTitle(hedef.username)
          .setThumbnail(hedef.displayAvatarURL())
          .addFields(
            { name: "ID", value: hedef.id, inline: true },
            { name: "Hesap Oluşturma", value: `<t:${Math.floor(hedef.createdTimestamp / 1000)}:R>`, inline: true },
          )
          .setColor(0x2b2d31);
        if (member?.joinedTimestamp) {
          embed.addFields({ name: "Sunucuya Katılım", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true });
        }
        if (member?.roles.cache.size) {
          const roller = member.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => `<@&${r.id}>`)
            .join(" ") || "Yok";
          embed.addFields({ name: "Roller", value: roller });
        }
        await interaction.reply({ embeds: [embed] });
        break;
      }

      case "anket": {
        const soru = interaction.options.getString("soru", true);
        const secenekler = ["a", "b", "c", "d"]
          .map((k) => interaction.options.getString(k))
          .filter(Boolean) as string[];
        const emojiler = ["🇦", "🇧", "🇨", "🇩"];
        const embed = new EmbedBuilder()
          .setTitle(`📊 ${soru}`)
          .setDescription(secenekler.map((s, i) => `${emojiler[i]} ${s}`).join("\n"))
          .setColor(0x5865f2)
          .setFooter({ text: `Anket açan: ${user.username}` });
        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        for (let i = 0; i < secenekler.length; i++) {
          await msg.react(emojiler[i]!);
        }
        break;
      }

      case "zar": {
        const yuz = interaction.options.getInteger("yuz") ?? 6;
        const adet = interaction.options.getInteger("adet") ?? 1;
        const sonuclar = Array.from({ length: adet }, () => Math.floor(Math.random() * yuz) + 1);
        const toplam = sonuclar.reduce((a, b) => a + b, 0);
        const mesaj = adet === 1
          ? `🎲 d${yuz}: **${sonuclar[0]}**`
          : `🎲 ${adet}×d${yuz}: **${sonuclar.join(", ")}** → Toplam: **${toplam}**`;
        await interaction.reply(mesaj);
        break;
      }

      case "sec": {
        const raw = interaction.options.getString("secenekler", true);
        const liste = raw.split(",").map((s) => s.trim()).filter(Boolean);
        if (liste.length < 2) { await interaction.reply("En az 2 seçenek gir."); break; }
        const secilen = liste[Math.floor(Math.random() * liste.length)];
        await interaction.reply(`Seçim: **${secilen}**`);
        break;
      }

      case "temizle": {
        if (user.id !== "1030507919290150972") {
          await interaction.reply({ content: "Bu komutu kullanma yetkin yok.", ephemeral: true });
          break;
        }
        const hedef = interaction.options.getUser("kullanici", true);
        resetProfile(hedef.id);
        clearHistory(hedef.id);
        await interaction.reply({ content: `**${hedef.username}** — hafıza sıfırlandı. Bot onu ilk kez görüyor gibi davranacak.`, ephemeral: true });
        break;
      }

      case "sinir": {
        const hedef = interaction.options.getUser("kullanici", true);
        const sebep = interaction.options.getString("sebep");

        if (hedef.bot) {
          await interaction.reply({ content: "Bota DM gönderilemez.", ephemeral: true });
          break;
        }

        await interaction.deferReply({ ephemeral: true });

        const prompt = sebep
          ? `Bir Discord kullanıcısına DM at. Konu: "${sebep}". Bunu bir daha yapmamasını söyle. Soğuk, kısa, net. Tehdit değil ama ciddi.`
          : `Bir Discord kullanıcısına DM at. Genel olarak davranışlarından memnun olmadığını belirt, bir daha bu tür şeyler yazmamasını söyle. Soğuk, kısa, net.`;

        const mesaj = await askGroq("dm_sinir_" + user.id, prompt, "DM mesajı yazıyorsun. Maksimum 3 cümle. Selamlama ve imza ekleme.");

        try {
          await hedef.send(mesaj);
          await interaction.editReply(`DM gönderildi → **${hedef.username}**`);
        } catch {
          await interaction.editReply(`${hedef.username} adlı kullanıcının DM'i kapalı, mesaj gönderilemedi.`);
        }
        break;
      }

      case "yardim": {
        const embed = new EmbedBuilder()
          .setTitle("Komut Listesi")
          .setColor(0x2b2d31)
          .addFields(
            { name: "🤖 Yapay Zeka", value: "`/sor` `/ozetle` `/cevir` `/analiz` `/fikir` `/karar` `/strateji` `/tartis` `/trivia`" },
            { name: "✍️ Yazı & İçerik", value: "`/yeniden-yaz` `/siir` `/slogan` `/eposta` `/ozgecmis`" },
            { name: "💻 Kod", value: "`/kod` `/hata-bul`" },
            { name: "🎭 Eğlence", value: "`/roast` `/zar` `/sec` `/sinir` `/temizle`" },
            { name: "📋 Kelime", value: "`/kelime` `/matematik`" },
            { name: "📊 Sunucu", value: "`/sunucu-bilgi` `/kullanici-bilgi` `/anket`" },
          )
          .setFooter({ text: "Mention veya !p komutuyla da doğrudan konuşabilirsin." });
        await interaction.reply({ embeds: [embed] });
        break;
      }

      default:
        await interaction.reply({ content: "Bilinmeyen komut.", ephemeral: true });
    }
  } catch (err) {
    logger.error({ err, commandName }, "Slash command error");
    const msg = "Bir hata oluştu.";
    if (interaction.deferred) await interaction.editReply(msg).catch(() => {});
    else await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
  }
}
