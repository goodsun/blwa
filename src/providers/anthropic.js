import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

function formatTools(tools) {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters
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
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
        tools: formattedTools
      });

      // ツール呼び出しがあるか
      const toolCalls = response.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({ id: b.id, name: b.name, args: b.input }));

      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      return {
        raw: response.content,
        toolCalls: toolCalls.length > 0 ? toolCalls : null,
        text
      };
    },

    // メモリに追加するアシスタントメッセージの形式
    formatAssistantMessage(raw) {
      return { role: 'assistant', content: raw };
    },

    // ツール結果のメッセージ形式
    formatToolResults(results) {
      return {
        role: 'user',
        content: results.map(r => ({
          type: 'tool_result',
          tool_use_id: r.id,
          content: JSON.stringify(r.output)
        }))
      };
    }
  };
}
