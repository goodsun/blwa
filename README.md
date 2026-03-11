# BLWA — Bonsoleil Lite Weight Agent

シンプルに、速く。OpenClawなし、フレームワークなし。

## コンセプト
- Ollama（ローカルLLM）+ Telegram Bot
- SOUL.md でキャラクター定義
- 猫の記憶：直近N件だけ保持、大切なことはSOULに刻む

## セットアップ

```bash
cp .env.example .env
# .envを編集
npm install
npm start
```

## ツール
- `read_file` — 許可されたパスのファイルを読む
- `write_file` — ファイルを書く
- `browse` — URLのテキストを取得（playwright）

## キャラクター追加
`souls/` 以下にディレクトリを作り、`SOUL.md` を置く。  
`.env` の `SOUL_PATH` を変えるだけで別キャラに切り替え。

---
*bon-soleil Holdings*
