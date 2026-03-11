import { Ollama } from 'ollama';
import { readFileSync } from 'fs';
import { readTool } from './tools/read.js';
import { writeTool } from './tools/write.js';
import { browseTool } from './tools/browse.js';

const ollama = new Ollama({ host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' });
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:latest';
const SOUL_PATH = process.env.SOUL_PATH || './souls/mii/SOUL.md';

const tools = [readTool, writeTool, browseTool];
const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));

function loadSoul() {
  try { return readFileSync(SOUL_PATH, 'utf8'); } catch { return ''; }
}

export async function chat(memory, userMessage) {
  const soul = loadSoul();
  const systemPrompt = soul + '\n\n今は' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) + 'だよ。';

  memory.add('user', userMessage);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...memory.get()
  ];

  // ツール呼び出しループ
  let response = await ollama.chat({
    model: MODEL,
    messages,
    tools: tools.map(t => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters }
    }))
  });

  // ツール実行
  while (response.message.tool_calls?.length > 0) {
    messages.push(response.message);
    for (const call of response.message.tool_calls) {
      const tool = toolMap[call.function.name];
      const result = tool ? await Promise.resolve(tool.execute(call.function.arguments)) : { error: 'unknown tool' };
      messages.push({ role: 'tool', content: JSON.stringify(result) });
    }
    response = await ollama.chat({ model: MODEL, messages });
  }

  const reply = response.message.content;
  memory.add('assistant', reply);
  return reply;
}
