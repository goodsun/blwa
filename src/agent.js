import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { readTool } from './tools/read.js';
import { writeTool } from './tools/write.js';
import { browseTool } from './tools/browse.js';

const client = new Anthropic();
export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
const SOUL_PATH = process.env.SOUL_PATH || './souls/mii/SOUL.md';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 1024;

const tools = [readTool, writeTool, browseTool];
const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));

// Anthropic tool format に変換
const anthropicTools = tools.map(t => ({
  name: t.name,
  description: t.description,
  input_schema: t.parameters
}));

function loadSoul() {
  try { return readFileSync(SOUL_PATH, 'utf8'); } catch { return ''; }
}

export async function chat(memory, userMessage) {
  const soul = loadSoul();
  const systemPrompt = soul + '\n\n今は' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) + 'だよ。';

  memory.add({ role: 'user', content: userMessage });

  const callApi = (msgs) => client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: msgs,
    tools: anthropicTools
  });

  // ツール呼び出しループ
  let response = await callApi(memory.get());

  while (response.stop_reason === 'tool_use') {
    // assistantメッセージを追加
    memory.add({ role: 'assistant', content: response.content });

    // ツール実行結果を収集
    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const tool = toolMap[block.name];
      const result = tool
        ? await Promise.resolve(tool.execute(block.input))
        : { error: 'unknown tool' };
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }

    memory.add({ role: 'user', content: toolResults });
    response = await callApi(memory.get());
  }

  // テキスト応答を抽出
  const reply = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  memory.add({ role: 'assistant', content: reply });
  return reply;
}
