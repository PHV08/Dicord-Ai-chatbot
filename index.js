const { Client, GatewayIntentBits } = require("discord.js");
const { Hercai } = require("hercai");
const Tesseract = require("tesseract.js");
const fetch = require("node-fetch");
const { startServer } = require("./alive.js");
const {
  allowed_channel_ids,
  token,
  image2textChannels,
} = require("./config.json");

const herc = new Hercai();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`bot is ready! ${client.user.tag}!`);
  console.log(`Help`);
  console.log(`discord.gg/phvsupport`);

  // Set the bot's presence
  client.user.setPresence({ activities: [{ name: "discord.js v14", type: "WATCHING" }], status: "dnd" });
});

  
async function extractTextFromImage(url) {
  try {
    const image = await fetch(url).then((res) => res.buffer());
    const textFromImage = await Tesseract.recognize(image, "eng");
    return textFromImage.data.text;
  } catch (error) {
    return "Error ";
  }
}

client.on("messageCreate", async (message) => {
  if (
    message.author.bot ||
    (!allowed_channel_ids.includes(message.channel.id) &&
      !image2textChannels.includes(message.channel.id))
  )
    return;

  let fullContent = message.content;

  try {
    // Send "Bot is typing..." without displaying in chat
    await message.channel.sendTyping();

    if (
      message.attachments.size > 0 &&
      image2textChannels.includes(message.channel.id)
    ) {
      const attachment = message.attachments.first();
      if (attachment.contentType && attachment.contentType.startsWith("image/")) {
        const extractedText = await extractTextFromImage(attachment.url);
        await message.reply(`Extracted Text: ${extractedText}`);
      }
    } else if (
      message.attachments.size > 0 &&
      allowed_channel_ids.includes(message.channel.id)
    ) {
      const attachment = message.attachments.first();
      if (attachment.contentType && attachment.contentType.startsWith("image/")) {
        const textFromImage = await extractTextFromImage(attachment.url);
        fullContent += ` [Image Content: ${textFromImage}]`;
      }
    }

    const response = await herc.question({
      model: "v3-beta",
      content: fullContent,
    });
    await message.reply(response.reply);
  } catch (error) {
    console.error("Error processing message:", error);
    await message.reply(
      "Sorry, I ran into a bit of trouble trying to respond."
    );
  }
});

startServer();

client.login(process.env.TOKEN);
