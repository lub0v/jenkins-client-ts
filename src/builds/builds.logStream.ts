/* Copyright 2022 Parsable Inc.
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

import { JenkinsRequests } from '../requests';
import { log } from './builds.log';
import { LogStreamOptions } from '../types';
import { Readable } from 'stream';

export class LogReadableStream extends Readable {
  private readonly interval: number = 0;
  private readonly requests: JenkinsRequests;
  private readonly path: string;
  private readonly buildNumber: number;
  private startTime: number;
  private start = 0;

  constructor(
    requests: JenkinsRequests,
    path: string,
    buildNumber: number,
    options?: LogStreamOptions,
  ) {
    super({});
    this.requests = requests;
    this.path = path;
    this.buildNumber = buildNumber;
    this.interval = options ? options.interval ?? 1000 : 1000;
    this.start = options ? options.start ?? 0 : 0;
    this.startTime = new Date().getTime();
  }

  async _read() {
    const now: number = new Date().getTime();
    const diff = this.interval! - (now - this.startTime);
    if (diff > 0) {
      await new Promise(r => setTimeout(r, diff));
    }
    this.startTime = new Date().getTime();
    try {
      const res = await log(this.requests, this.path, this.buildNumber, { start: this.start });
      if (res.size < this.start) {
        this.push('');
        return;
      }
      this.start = res.size;
      this.push(res.text);
      if (!res.more) {
        this.push(null);
      }
    } catch (err) {
      this.emit('error', err);
      this.emit('end');
    }
  }

  public promise(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.on('end', resolve);
      this.on('error', reject);
    });
  }
}

/**
 * Return build log stream
 *
 * @param requests
 * @param {string} path - path to the job
 * @param {number} buildNumber - job build number
 * @param {LogStreamOptions} options - options
 *
 *  - `interval` - how frequently return log chunks. Default every `1000` milliseconds.
 *  - `start` - return log starting from this position. Default `0`.
 *
 * @example
 *
 * const logStream = await jenkins.builds.logStream('my-job', 1);
 *
 * logStream.pipe(process.stdout)
 *
 * @example
 *
 * const logStream = await jenkins.builds.logStream('my-job', 1, { interval: 500 });
 *
 * logStream.on('data', (text) => {
 *   console.log(text);
 * });
 *
 * logStream.on('end', () => {
 *   console.log('Log transfer completed');
 * });
 *
 * logStream.on('error', (error) => {
 *   console.log(`There was an error ${error}`);
 * });
 */
export const logStream = (
  requests: JenkinsRequests,
  path: string,
  buildNumber: number,
  options?: LogStreamOptions,
): LogReadableStream => new LogReadableStream(requests, path, buildNumber, options);
