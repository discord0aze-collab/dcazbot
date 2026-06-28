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
} from "discord.js";
import { askGroq } from "./groq-client.js";
import { updateAnger, getAngerLabel, resetAnger } from "./anger-system.js";
import { KLAYZ_ID } from "./personality.js";
import { commands } from "./commands.js";
import { handleCommand } from "./command-handler.js";
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
    activities: [{ name: "/yardim", type: 3 }],
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
    await message.reply("Ne istiyorsun?");
    return;
  }

  const isKlayz = message.author.id === KLAYZ_ID;
  const anger = isKlayz ? 0 : updateAnger(message.author.id, userMessage);
  const angerLabel = getAngerLabel(anger);

  let context = isKlayz
    ? `Bu kişi seni yaratan Klayz'dır. Kullanıcı adı: ${message.author.username}.`
    : `Kullanıcı: ${message.author.username}. Öfke seviyesi: ${anger}/10.`;

  if (message.guild) {
    context += ` Sunucu: ${message.guild.name}.`;
  }

  if (!isKlayz) {
    if (angerLabel === "warning") context += " Kullanıcıyı sert ama kontrollü uyar.";
    if (angerLabel === "furious") context += " Kullanıcıya çok sert çık, ceza vereceğini belirt.";
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
      "Soğuk ve kısa karşılama mesajı."
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
