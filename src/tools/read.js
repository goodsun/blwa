import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ALLOWED_BASE = process.env.ALLOWED_PATHS || './blwa_data';

export const readTool = {
  name: 'read_file',
  description: '許可されたパスのファイルを読む',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'ファイルパス' }
    },
    required: ['path']
  },
  execute({ path }) {
    const abs = resolve(path);
    if (!abs.startsWith(resolve(ALLOWED_BASE))) {
      return { error: 'アクセス拒否: 許可されていないパスよ' };
    }
    if (!existsSync(abs)) return { error: 'ファイルが見つからない' };
    return { content: readFileSync(abs, 'utf8') };
  }
};
