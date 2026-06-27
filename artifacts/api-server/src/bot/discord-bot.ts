import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Guild,
  TextChannel,
  ChannelType,
} from "discord.js";
import { askGroq, clearHistory } from "./groq-client.js";
import { updateAnger, getAnger, getAngerLabel, increaseAnger, resetAnger } from "./anger-system.js";
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

async function executeAngerAction(message: Message, anger: number): Promise<void> {
  const guild = message.guild;
  if (!guild) return;

  const label = getAngerLabel(anger);

  if (label === "furious" && anger >= 9) {
    await executeDestructiveAction(message, guild, anger);
  }
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
        await targetChannel.delete("Patron sinirlendiği için silindi.");
        await message.channel.send(
          `**#${chName}** kanalını sildim. Sabrımı taşırdın, evladım. Bir daha olursa başka şeyler de gider.`
        );
        resetAnger(message.author.id);
        return;
      }
    }

    if (anger >= 9 && botMember.permissions.has("KickMembers")) {
      const member = message.member;
      if (member && member.kickable) {
        await member.kick("Patronu sindirmeye çalıştı.");
        const channel = message.channel as TextChannel;
        await channel.send(
          `${message.author.username} isimli herifi gönderdim. Kimse Patron'la oynamaz.`
        );
        return;
      }
    }
  } catch (err) {
    logger.error({ err }, "Destructive action failed");
  }
}

client.once(Events.ClientReady, (c) => {
  logger.info({ tag: c.user.tag }, "Discord bot bağlandı");
  c.user.setPresence({
    status: "online",
    activities: [{ name: "Sunucuyu yönetiyorum", type: 3 }],
  });
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  if (!content) return;

  const isMentioned = message.mentions.has(client.user!);
  const isCommand = content.startsWith("!patron") || content.startsWith("!p ");
  const isDM = !message.guild;

  if (!isMentioned && !isCommand && !isDM) return;

  let userMessage = content;
  if (isMentioned) {
    userMessage = content.replace(/<@!?\d+>/g, "").trim();
  } else if (content.startsWith("!patron")) {
    userMessage = content.slice(7).trim();
  } else if (content.startsWith("!p ")) {
    userMessage = content.slice(3).trim();
  }

  if (!userMessage) {
    await message.reply("Ne istiyorsun, söyle. Vaktim değerli.");
    return;
  }

  const anger = updateAnger(message.author.id, userMessage);
  const angerLabel = getAngerLabel(anger);

  const guild = message.guild;
  let context = `Kullanıcı adı: ${message.author.username}. Öfke seviyem bu kullanıcıya karşı: ${anger}/10 (${angerLabel}).`;

  if (guild) {
    context += ` Sunucu adı: ${guild.name}. Üye sayısı: ${guild.memberCount}.`;
  }

  if (angerLabel === "warning") {
    context += " Bu kullanıcı beni sinir etmeye başladı. Sert ama kontrollü uyar.";
  } else if (angerLabel === "furious") {
    context += " Bu kullanıcı sabrımı tüketti. Çok sinirliim. Tehdit et ve ne yapacağını söyle.";
  }

  try {
    await message.channel.sendTyping();

    const reply = await askGroq(message.author.id, userMessage, context);
    await message.reply(reply);

    await executeAngerAction(message, anger);
  } catch (err) {
    logger.error({ err }, "Message handling error");
    await message.reply("Şu an meşgulüm. Sonra gel.").catch(() => {});
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const guild = member.guild;
  const systemChannel = guild.systemChannel;
  if (!systemChannel) return;

  try {
    const greeting = await askGroq(
      member.id,
      `Yeni bir üye geldi: ${member.user.username}. Onu karşıla.`,
      "Yeni üye karşılama mesajı yaz. Kısa ve etkileyici olsun."
    );
    await systemChannel.send(greeting);
  } catch (err) {
    logger.error({ err }, "Welcome message error");
  }
});

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN bulunamadı, bot başlatılmıyor");
    return;
  }

  client.login(token).catch((err) => {
    logger.error({ err }, "Discord bot login failed");
  });
}

export { client };
