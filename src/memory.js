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
  }

  get() {
    return [...this.history];
  }

  clear() {
    this.history = [];
  }
}
