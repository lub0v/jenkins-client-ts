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

/**
 * Get job configuration as xml string
 *
 * @param {string} path - path to the job
 *
 * @example
 *
 * const config = await jenkins.jobs.configXml('my-job');
 *
 * @example Example result:
 *
 * <?xml version="1.0" encoding="UTF-8"?>
 * <flow-definition plugin="workflow-job@2.40">
 *     <actions/>
 *     <description>My Job description</description>
 *     <keepDependencies>false</keepDependencies>
 *     <properties/>
 *     <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.87">
 *         <script>echo "hello";</script>
 *         <sandbox>true</sandbox>
 *     </definition>
 *     <triggers/>
 *     <disabled>false</disabled>
 * </flow-definition>
 *
 */
export const configXml = async (requests: JenkinsRequests, path: string): Promise<string> =>
  requests.get(`${JobPath.parse(path).path()}/config.xml`).then(res => res.data);
