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

/**
 * Get node configuration as json object
 *
 * @param {string} name - node name
 *
 * @example
 *
 * const config = await jenkins.nodes.configJson('my-node');
 *
 * @example Example result:
 *
 * {
 *   slave: {
 *     name: 'my-node',
 *     numExecutors: 1,
 *     mode: 'NORMAL',
 *     retentionStrategy: '',
 *     launcher: {
 *       workDirSettings: {
 *         disabled: false,
 *         internalDir: 'remoting',
 *         failIfWorkDirIsMissing: false,
 *       },
 *       webSocket: false,
 *     },
 *     label: '',
 *     nodeProperties: '',
 *   },
 * }
 */
export const configJson = async (requests: JenkinsRequests, name: string): Promise<any> =>
  requests
    .get(`/computer/${name}/config.xml`)
    .then(res => res.data)
    .then(xmlParser.parse);
