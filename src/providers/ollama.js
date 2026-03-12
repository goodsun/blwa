import { Ollama } from 'ollama';

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

function formatTools(tools) {
  return tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));
}

export function createProvider() {
  const formattedTools = [];

  return {
    setTools(tools) {
      formattedTools.length = 0;
      formattedTools.push(...formatTools(tools));
    },

    async call(messages, systemPrompt, model, maxTokens) {
      // Ollama は system メッセージを messages 配列の先頭に入れる
      const msgs = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => normalizeMessage(m))
      ];

      const response = await ollama.chat({
        model,
        messages: msgs,
        // tools: formattedTools,  // llm-jp-4 does not support tools
        options: { num_predict: maxTokens }
      });

      const toolCalls = response.message.tool_calls?.map(tc => ({
        id: tc.function.name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        name: tc.function.name,
        args: tc.function.arguments
      })) || null;

      return {
        raw: response.message,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : null,
        text: response.message.content || ''
      };
    },

    formatAssistantMessage(raw) {
      return { role: 'assistant', content: raw.content || '', tool_calls: raw.tool_calls };
    },

    formatToolResults(results) {
      // Ollama: ツール結果は個別の tool メッセージとして返す
      return results.map(r => ({
        role: 'tool',
        content: JSON.stringify(r.output)
      }));
    }
  };
}

// Anthropic 形式のメッセージを Ollama 形式に変換
function normalizeMessage(msg) {
  // ツール結果メッセージ（Anthropic形式の配列content）
  if (msg.role === 'user' && Array.isArray(msg.content)) {
    const toolResults = msg.content.filter(c => c.type === 'tool_result');
    if (toolResults.length > 0) {
      // 複数の tool_result は結合して返す
      return {
        role: 'tool',
        content: toolResults.map(r => r.content).join('\n')
      };
    }
  }

  // アシスタントメッセージ（Anthropic形式の配列content）
  if (msg.role === 'assistant' && Array.isArray(msg.content)) {
    const text = msg.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    const toolUses = msg.content.filter(b => b.type === 'tool_use');
    const result = { role: 'assistant', content: text };
    if (toolUses.length > 0) {
      result.tool_calls = toolUses.map(t => ({
        function: { name: t.name, arguments: t.input }
      }));
    }
    return result;
  }

  // そのまま
  return { role: msg.role, content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
}
