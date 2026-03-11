// playwright ブラウジングツール
export const browseTool = {
  name: 'browse',
  description: 'URLを開いてテキストを取得する',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'URL' }
    },
    required: ['url']
  },
  async execute({ url }) {
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(url, { timeout: 15000 });
      const text = await page.evaluate(() => document.body.innerText);
      await browser.close();
      return { content: text.slice(0, 3000) };
    } catch (e) {
      return { error: e.message };
    }
  }
};
