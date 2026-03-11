import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const ALLOWED_BASE = process.env.ALLOWED_PATHS || './blwa_data';

export const writeTool = {
  name: 'write_file',
  description: '許可されたパスにファイルを書く',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'ファイルパス' },
      content: { type: 'string', description: '書き込む内容' }
    },
    required: ['path', 'content']
  },
  execute({ path, content }) {
    const abs = resolve(path);
    if (!abs.startsWith(resolve(ALLOWED_BASE))) {
      return { error: 'アクセス拒否: 許可されていないパスよ' };
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    return { success: true, path: abs };
  }
};
