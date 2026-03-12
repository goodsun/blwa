import { readFileSync } from 'fs';
import { readTool } from './tools/read.js';
import { writeTool } from './tools/write.js';
import { browseTool } from './tools/browse.js';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';
export const MODEL = process.env.LLM_MODEL
  || process.env.CLAUDE_MODEL
  || (LLM_PROVIDER === 'ollama' ? 'qwen2.5' : 'claude-sonnet-4-20250514');
const SOUL_PATH = process.env.SOUL_PATH || './souls/mii/SOUL.md';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 1024;

// プロバイダーの動的ロード
const { createProvider } = await import(`./providers/${LLM_PROVIDER}.js`);
const provider = createProvider();

const tools = [readTool, writeTool, browseTool];
const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));
provider.setTools(tools);

function loadSoul() {
  try { return readFileSync(SOUL_PATH, 'utf8'); } catch { return ''; }
}

export async function chat(memory, userMessage) {
  const soul = loadSoul();
  const systemPrompt = soul + '\n\n今は' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) + 'だよ。';

  memory.add({ role: 'user', content: userMessage });

  // ツール呼び出しループ
  let result = await provider.call(memory.get(), systemPrompt, MODEL, MAX_TOKENS);

  while (result.toolCalls) {
    // アシスタントメッセージを追加
    memory.add(provider.formatAssistantMessage(result.raw));

    // ツール実行
    const toolResults = [];
    for (const tc of result.toolCalls) {
      const tool = toolMap[tc.name];
      const output = tool
        ? await Promise.resolve(tool.execute(tc.args))
        : { error: 'unknown tool' };
      toolResults.push({ id: tc.id, output });
    }

    // ツール結果をメモリに追加
    const formatted = provider.formatToolResults(toolResults);
    if (Array.isArray(formatted)) {
      for (const msg of formatted) memory.add(msg);
    } else {
      memory.add(formatted);
    }

    result = await provider.call(memory.get(), systemPrompt, MODEL, MAX_TOKENS);
  }

  // テキスト応答を抽出
  const reply = result.text;
  memory.add({ role: 'assistant', content: reply });
  return reply;
}
