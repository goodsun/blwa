// 会話履歴管理 - 猫の記憶
export class Memory {
  constructor(limit = 20) {
    this.limit = limit;
    this.history = [];
  }

  add(role, content) {
    this.history.push({ role, content });
    // 直近N件だけ保持。猫だから。
    if (this.history.length > this.limit) {
      this.history = this.history.slice(-this.limit);
    }
  }

  get() {
    return [...this.history];
  }

  clear() {
    this.history = [];
  }
}
