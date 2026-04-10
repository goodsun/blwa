import { execFile } from 'child_process';

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';

function run(prompt, systemPrompt) {
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n---\n${prompt}`
    : prompt;

  return new Promise((resolve, reject) => {
    const proc = execFile(CLAUDE_BIN, ['-p', '--output-format', 'text'], {
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
    proc.stdin.write(fullPrompt);
    proc.stdin.end();
  });
}

export function createProvider() {
  return {
    setTools() { /* claude-code handles tools internally */ },

    async call(messages, systemPrompt, _model, _maxTokens) {
      // 直近のユーザーメッセージだけ渡す（会話履歴はsystemPromptに含める）
      const history = messages.map(m =>
        `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`
      ).join('\n');

      const text = await run(history, systemPrompt);

      return {
        raw: text,
        toolCalls: null,
        text
      };
    },

    formatAssistantMessage(raw) {
      return { role: 'assistant', content: raw };
    },

    formatToolResults(results) {
      return results.map(r => ({
        role: 'tool',
        content: JSON.stringify(r.output)
      }));
    }
  };
}
