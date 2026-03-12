import TelegramBot from 'node-telegram-bot-api';
import { Memory } from './memory.js';
import { chat, MODEL } from './agent.js';

const sessions = new Map(); // chatId → Memory

const ALLOWED_USERS = (process.env.ALLOWED_USERS || '')
  .split(',')
  .map(s => parseInt(s.trim()))
  .filter(Boolean);

export function startTelegramBot(token) {
  const bot = new TelegramBot(token, { polling: true });
  console.log('🐱 みぃちゃん起動中...');

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    if (!text) return;

    // アクセス制限
    if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(userId)) {
      console.log(`アクセス拒否: userId=${userId}`);
      return;
    }

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
      console.log(`[IN]  ${userId}: ${text}`);
      await bot.sendChatAction(chatId, 'typing');
      const raw = await chat(memory, text);
      const reply = raw
        .replace(/<0x0A>/g, '\n')
        .replace(/^#{1,6}\s*/gm, '')        // ### 見出し → 見出し
        .replace(/\*\*(.+?)\*\*/g, '$1')    // **太字** → 太字
        .replace(/\*(.+?)\*/g, '$1')        // *イタリック* → イタリック
        .replace(/^[-*]\s/gm, '・')          // - リスト → ・リスト
        .replace(/^\d+\.\s/gm, (m) => m)    // 番号リストはそのまま
        .replace(/^>\s?/gm, '')              // > 引用 → 引用
        .replace(/^---+$/gm, '')             // --- 水平線を除去
        .replace(/\|[^|\n]+\|/g, '')         // テーブル行を除去
        .replace(/\n{3,}/g, '\n\n')          // 連続空行を詰める
        .trim();
      console.log(`[OUT] ${userId} (${MODEL}): ${reply}`);
      bot.sendMessage(chatId, reply);
    } catch (e) {
      console.error(e);
      bot.sendMessage(chatId, 'うぅ、エラーが出ちゃった...もう一回試してみて？');
    }
  });

  return bot;
}
