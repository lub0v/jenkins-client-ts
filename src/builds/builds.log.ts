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
import { JobPath } from '../utils/jobPath';
import { JenkinsLog, LogOptions } from '../types';

/**
 * Return build log
 *
 * Returns:
 *
 *  - `text` - log text or html (see options parameter)
 *  - `more` - whether the log has more data to return (for example, if build is still running)
 *  - `size` - content size. Can be used as `start` position for the next log request.
 *
 * To return log as a stream while build is still running, use [`jenkins.builds.logStream`](#jenkinsbuildslogstream)
 *
 * @param requests
 * @param {string} path - path to the job
 * @param {number} buildNumber - job build number
 * @param {LogOptions} options - log options
 *
 *  - `html` - whether to return log as html or plain text. Default `false`.
 *  - `start` - return log starting from this position.
 *
 * @example
 *
 * const log = await jenkins.builds.log('my-job', 1);
 *
 * @example Example result:
 *
 * {
 *   text:
 *     'Started by user admin\r\n' +
 *     '[Pipeline] Start of Pipeline\r\n' +
 *     '[Pipeline] echo\r\n' +
 *     'Hi\r\n' +
 *     '[Pipeline] echo\r\n' +
 *     'Bye!\r\n' +
 *     '[Pipeline] End of Pipeline\r\n' +
 *     'Finished: SUCCESS\r\n',
 *   more: false,
 *   size: 1535,
 * }
 *
 */
export const log = async (
  requests: JenkinsRequests,
  path: string,
  buildNumber: number,
  options?: LogOptions,
): Promise<JenkinsLog> => {
  const logType = options?.html ? 'Html' : 'Text';
  const url = `${JobPath.parse(path).path()}/${buildNumber}/logText/progressive${logType}`;
  const res = await requests.postForm(url, { start: options?.start || 0 });
  return {
    text: res.data,
    more: res.headers['x-more-data'] === 'true',
    size: +res.headers['x-text-size'],
  };
};
