// 会話履歴管理 - 猫の記憶
export class Memory {
  constructor(limit = 20) {
    this.limit = limit;
    this.history = [];
  }

  add(message) {
    this.history.push(message);
    // 直近N件だけ保持。猫だから。
    // ただしtool_resultが孤立しないよう、先頭がuser以外なら切り詰める
    while (this.history.length > this.limit) {
      this.history.shift();
    }
    while (this.history.length > 0 && this.history[0].role !== 'user') {
      this.history.shift();
    }
    // tool_resultを含むuserメッセージが先頭に来た場合も除去
    // （対応するtool_useを持つassistantメッセージが無いとAPIエラーになる）
    while (
      this.history.length > 0 &&
      this.history[0].role === 'user' &&
      Array.isArray(this.history[0].content) &&
      this.history[0].content.some(c => c.type === 'tool_result')
    ) {
      this.history.shift();
      // tool_result除去後、次のassistantも孤立するので除去
      while (this.history.length > 0 && this.history[0].role !== 'user') {
        this.history.shift();
      }
    }
  }

  get() {
    return [...this.history];
  }

  clear() {
    this.history = [];
  }
}
