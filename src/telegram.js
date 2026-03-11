import TelegramBot from 'node-telegram-bot-api';
import { Memory } from './memory.js';
import { chat } from './agent.js';

const sessions = new Map(); // chatId → Memory

export function startTelegramBot(token) {
  const bot = new TelegramBot(token, { polling: true });
  console.log('🐱 みぃちゃん起動中...');

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text) return;

    if (!sessions.has(chatId)) {
      sessions.set(chatId, new Memory(parseInt(process.env.HISTORY_LIMIT) || 20));
    }
    const memory = sessions.get(chatId);

    if (text === '/clear') {
      memory.clear();
      bot.sendMessage(chatId, 'えへへ、記憶リセットしたよ〜！');
      return;
    }

    try {
      await bot.sendChatAction(chatId, 'typing');
      const reply = await chat(memory, text);
      bot.sendMessage(chatId, reply);
    } catch (e) {
      console.error(e);
      bot.sendMessage(chatId, 'うぅ、エラーが出ちゃった...もう一回試してみて？');
    }
  });

  return bot;
}
