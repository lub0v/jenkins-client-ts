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

/**
 * Get node configuration as xml string
 *
 * @param {string} name - node name
 *
 * @example
 *
 * const configXml = await jenkins.nodes.configXml('my-node');
 *
 * @example Example result:
 *
 * <?xml version="1.1" encoding="UTF-8"?>
 * <slave>
 *     <name>NodeConfig</name>
 *     <numExecutors>1</numExecutors>
 *     <mode>NORMAL</mode>
 *     <retentionStrategy class="hudson.slaves.RetentionStrategy$Always"/>
 *     <launcher class="hudson.slaves.JNLPLauncher">
 *         <workDirSettings>
 *             <disabled>false</disabled>
 *             <internalDir>remoting</internalDir>
 *             <failIfWorkDirIsMissing>false</failIfWorkDirIsMissing>
 *         </workDirSettings>
 *         <webSocket>false</webSocket>
 *     </launcher>
 *     <label></label>
 *     <nodeProperties/>
 * </slave>
 */
export const configXml = async (requests: JenkinsRequests, name: string): Promise<string> =>
  requests.get(`/computer/${name}/config.xml`).then(res => res.data);
