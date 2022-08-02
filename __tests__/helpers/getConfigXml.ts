import fs from 'fs';
import * as path from 'path';

export function getXmlConfig(name: string, p = path.resolve(__dirname)): string {
  return fs.readFileSync(`${p}/resources/${name}`, 'utf-8');
}
