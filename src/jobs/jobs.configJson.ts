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

import xmlParser from 'fast-xml-parser';
import { JenkinsRequests } from '../requests';
import { JobPath } from '../utils/jobPath';

/**
 * Get job configuration as json object
 *
 * @param requests
 * @param {string} path - path to the job
 *
 * @example
 *
 * const config = await jenkins.jobs.configJson('my-job');
 *
 * @example Example result:
 *
 * {
 *   'flow-definition': {
 *     actions: '',
 *     description: 'My Job description',
 *     keepDependencies: false,
 *     properties: '',
 *     definition: { script: 'echo "hello";', sandbox: true },
 *     triggers: '',
 *     disabled: false,
 *   }
 * }
 *
 */
export const configJson = async (requests: JenkinsRequests, path: string): Promise<any> =>
  requests
    .get(`${JobPath.parse(path).path()}/config.xml`)
    .then(res => res.data)
    .then(xmlParser.parse);
