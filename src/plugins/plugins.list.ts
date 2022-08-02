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
import { JenkinsPlugin } from '../types';

/**
 * List plugins
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @example
 *
 * const plugins = await jenkins.plugins.list();
 *
 * @example Example result:
 *
 * [
 *   {
 *     active: true,
 *     backupVersion: null,
 *     bundled: false,
 *     deleted: false,
 *     dependencies: [
 *       {
 *         optional: true,
 *         shortName: 'bouncycastle-api',
 *         version: '2.16.0',
 *       },
 *       {
 *         optional: true,
 *         shortName: 'command-launcher',
 *         version: '1.0',
 *       },
 *       {
 *         optional: true,
 *         shortName: 'jdk-tool',
 *         version: '1.0',
 *       },
 *       {
 *         optional: true,
 *         shortName: 'trilead-api',
 *         version: '1.0.4',
 *       },
 *       {
 *         optional: true,
 *         shortName: 'sshd',
 *         version: '3.0.1',
 *       },
 *     ],
 *     detached: false,
 *     downgradable: false,
 *     enabled: true,
 *     hasUpdate: false,
 *     longName: 'JavaScript GUI Lib: Moment.js bundle plugin',
 *     minimumJavaVersion: null,
 *     pinned: false,
 *     requiredCoreVersion: '1.580.1',
 *     shortName: 'momentjs',
 *     supportsDynamicLoad: 'YES',
 *     url: 'https://wiki.jenkins-ci.org/display/JENKINS/Moment.js',
 *     version: '1.1.1',
 *   },
 * ]
 *
 */
export const list = async (requests: JenkinsRequests): Promise<JenkinsPlugin[]> =>
  requests.get('/pluginManager/api/json', { params: { depth: 1 } }).then(res => res.data.plugins);
