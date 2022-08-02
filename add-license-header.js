const { readdir, readFile, writeFile } = require('fs/promises');
const { resolve } = require('path');

const HEADER = `/* Copyright 2022 Parsable Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
`;

async function* getFiles(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  for (const dirent of files) {
    if (dirent.isDirectory()) {
      yield* getFiles(resolve(dir, dirent.name));
    } else {
      yield `${dir}/${f.name}`;
    }
  }
}

(async () => {
  const srcPath = resolve(__dirname, 'src');
  for await (const file of getFiles(srcPath)) {
    const fileContent = (await readFile(file)).toString();
    if (fileContent.startsWith('/* Copyright ')) {
      continue;
    }
    await writeFile(file, `${HEADER}\n${fileContent}`);
  }
})();
