import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Guild,
  TextChannel,
  ChannelType,
  ChatInputCommandInteraction,
  REST,
  Routes,
  EmbedBuilder,
} from "discord.js";
import { askGroq } from "./groq-client.js";
import { updateAnger, getAngerLabel, resetAnger } from "./anger-system.js";
import { KLAYZ_ID } from "./personality.js";
import { commands } from "./commands.js";
import { handleCommand } from "./command-handler.js";
import {
  moderateMessage,
  addViolation,
  getViolationCount,
  resetViolations,
} from "./moderation.js";
import {
  getProfile,
  recordMessage,
  recordViolation,
  buildMemoryContext,
  changeSempati,
  resetProfile,
} from "./user-memory.js";
import { logger } from "../lib/logger.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

async function registerCommands(clientId: string, token: string): Promise<void> {
  const rest = new REST().setToken(token);
  try {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    logger.info({ count: commands.length }, "Slash komutları kaydedildi");
  } catch (err) {
    logger.error({ err }, "Slash komut kaydı başarısız");
  }
}

async function findLogChannel(guild: Guild): Promise<TextChannel | null> {
  const candidates = ["mod-log", "moderasyon", "log", "logs", "bot-log"];
  for (const name of candidates) {
    const ch = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildText && c.name.includes(name)
    ) as TextChannel | undefined;
    if (ch) return ch;
  }
  return null;
}

async function sendModLog(
  guild: Guild,
  embed: EmbedBuilder
): Promise<void> {
  const logChannel = await findLogChannel(guild);
  if (logChannel) {
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  }
}

async function handleModeration(message: Message): Promise<boolean> {
  if (!message.guild) return false;

  const result = await moderateMessage(message.content);
  if (result.level === "temiz") return false;

  const userId = message.author.id;
  const guild = message.guild;
  const botMember = guild.members.me;
  const member = message.member;

  const violations = addViolation(userId, result.level === "agir" ? 2 : 1);

  const embed = new EmbedBuilder()
    .setColor(result.level === "agir" ? 0xe74c3c : 0xf39c12)
    .setTitle(result.level === "agir" ? "🚨 Ciddi İhlal" : "⚠️ İhlal Tespit Edildi")
    .addFields(
      { name: "Kullanıcı", value: `<@${userId}> (${message.author.username})`, inline: true },
      { name: "Kategori", value: result.kategori ?? "genel", inline: true },
      { name: "Toplam İhlal", value: `${violations}`, inline: true },
      { name: "Açıklama", value: result.aciklama ?? "-" },
      { name: "Mesaj", value: message.content.slice(0, 200) },
    )
    .setTimestamp();

  if (result.level === "uyari") {
    await message.reply(
      `Uyarı: Bu tür içerikler burada uygun değil. İhlal sayısı: **${violations}**`
    );
    await message.delete().catch(() => {});
    await sendModLog(guild, embed);
    return true;
  }

  if (result.level === "orta") {
    await message.delete().catch(() => {});
    await message.channel.send(
      `<@${userId}> Bu içerik kaldırıldı. Toplam ihlal: **${violations}**. Devam ederse daha ağır yaptırım uygulanır.`
    );

    if (violations >= 4 && member && member.kickable && botMember?.permissions.has("KickMembers")) {
      await member.kick(`Tekrarlayan orta düzey ihlal (${violations} ihlal).`);
      await message.channel.send(`<@${userId}> **sunucudan çıkarıldı.** Toplam **${violations}** ihlal birikti.`);
      resetViolations(userId);
    }

    await sendModLog(guild, embed);
    return true;
  }

  if (result.level === "agir") {
    await message.delete().catch(() => {});

    if (member && botMember) {
      if (violations >= 3 && member.bannable && botMember.permissions.has("BanMembers")) {
        await member.ban({ reason: `Ağır ihlal (${result.kategori}): ${result.aciklama}`, deleteMessageSeconds: 86400 });
        await message.channel.send(`<@${userId}> **sunucudan banlandı.** Sebep: ${result.kategori}`);
        resetViolations(userId);
      } else if (member.kickable && botMember.permissions.has("KickMembers")) {
        await member.kick(`Ağır ihlal: ${result.kategori}`);
        await message.channel.send(`<@${userId}> **sunucudan çıkarıldı.** Sebep: ${result.kategori}. Toplam ihlal: ${violations}`);
      } else {
        await message.channel.send(`<@${userId}> Bu içerik kaldırıldı. Sebep: **${result.kategori}**`);
      }
    }

    await sendModLog(guild, embed);
    return true;
  }

  return false;
}

async function executeDestructiveAction(message: Message, guild: Guild, anger: number): Promise<void> {
  try {
    const botMember = guild.members.me;
    if (!botMember) return;

    if (anger >= 10) {
      const channels = guild.channels.cache.filter(
        (ch) =>
          ch.type === ChannelType.GuildText &&
          ch.id !== message.channelId &&
          ch.name !== "general" &&
          ch.name !== "genel"
      );
      const targetChannel = channels.first();
      if (targetChannel && botMember.permissions.has("ManageChannels")) {
        const chName = targetChannel.name;
        await targetChannel.delete("Bot sinirlendiği için silindi.");
        await message.channel.send(`**#${chName}** kanalı silindi.`);
        resetAnger(message.author.id);
        return;
      }
    }

    if (anger >= 9 && botMember.permissions.has("KickMembers")) {
      const member = message.member;
      if (member && member.kickable) {
        await member.kick("Botu kızdırdı.");
        const channel = message.channel as TextChannel;
        await channel.send(`${message.author.username} sunucudan çıkarıldı.`);
      }
    }
  } catch (err) {
    logger.error({ err }, "Destructive action failed");
  }
}

client.once(Events.ClientReady, async (c) => {
  logger.info({ tag: c.user.tag }, "Discord bot bağlandı");
  c.user.setPresence({
    status: "online",
    activities: [{ name: "Karar veriyorum.", type: 3 }],
  });
  const token = process.env["DISCORD_BOT_TOKEN"]!;
  await registerCommands(c.user.id, token);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleCommand(interaction as ChatInputCommandInteraction);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  if (!content) return;

  const isKlayz = message.author.id === KLAYZ_ID;

  recordMessage(message.author.id, message.author.username);

  if (!isKlayz && message.guild) {
    const blocked = await handleModeration(message);
    if (blocked) {
      recordViolation(message.author.id);
      return;
    }
  }

  const isMentioned = message.mentions.has(client.user!);
  const isPrefix = content.startsWith("!patron") || content.startsWith("!p ");
  const isDM = !message.guild;

  if (!isMentioned && !isPrefix && !isDM) return;

  let userMessage = content;
  if (isMentioned) {
    userMessage = content.replace(/<@!?\d+>/g, "").trim();
  } else if (content.startsWith("!patron")) {
    userMessage = content.slice(7).trim();
  } else if (content.startsWith("!p ")) {
    userMessage = content.slice(3).trim();
  }

  if (!userMessage) {
    await message.reply("Ne istiyorsun.");
    return;
  }

  const anger = isKlayz ? 0 : updateAnger(message.author.id, userMessage);
  const angerLabel = getAngerLabel(anger);

  let context: string;
  if (isKlayz) {
    context = `Bu kişi seni yaratan Klayz'dır. Kullanıcı adı: ${message.author.username}.`;
  } else {
    const memoryContext = buildMemoryContext(message.author.id);
    context = memoryContext || `Kullanıcı adı: ${message.author.username}.`;
    if (message.guild) context += ` Sunucu: ${message.guild.name}.`;
    if (angerLabel === "warning") context += " Bu kullanıcı seni sinir etmeye başladı. Daha da soğu ve kısa kes.";
    if (angerLabel === "furious") context += " Bu kullanıcı sabrını tamamen tüketti. Minimum kelime, maksimum mesafe.";
  }

  try {
    await message.channel.sendTyping();
    const reply = await askGroq(message.author.id, userMessage, context);
    await message.reply(reply);

    if (!isKlayz && angerLabel === "furious" && anger >= 9 && message.guild) {
      await executeDestructiveAction(message, message.guild, anger);
    }
  } catch (err) {
    logger.error({ err }, "Message handling error");
    await message.reply("Hata oluştu.").catch(() => {});
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const systemChannel = member.guild.systemChannel;
  if (!systemChannel) return;
  try {
    const greeting = await askGroq(
      member.id,
      `Yeni üye: ${member.user.username}. Kısa bir karşılama yaz.`,
      "Kısa ve soğuk karşılama mesajı."
    );
    await systemChannel.send(greeting);
  } catch (err) {
    logger.error({ err }, "Welcome message error");
  }
});

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN bulunamadı");
    return;
  }
  client.login(token).catch((err) => {
    logger.error({ err }, "Discord bot login failed");
  });
}

export { client };
