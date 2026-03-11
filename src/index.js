import 'dotenv/config';
import { startTelegramBot } from './telegram.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN が設定されていないよ！');
  process.exit(1);
}

startTelegramBot(token);
