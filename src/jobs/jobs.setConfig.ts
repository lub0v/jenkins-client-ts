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
 * Update job with xml configuration
 *
 * @param {string} path - path to the job
 * @param {string} xmlConfig - new xml configuration for job
 *
 * @example Example:
 *
 * await jenkins.jobs.setConfig(
 *   '/my-job',
 *   `<flow-definition plugin="workflow-job@1145.v7f2433caa07f">
 *     <actions/>
 *     <description>Job one description</description>
 *     <keepDependencies>false</keepDependencies>
 *     <properties/>
 *     <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2648.va9433432b33c">
 *         <script>echo "HELLO!"</script>
 *         <sandbox>true</sandbox>
 *     </definition>
 *     <triggers/>
 *     <disabled>false</disabled>
 * </flow-definition>
 * `,
 * );
 *
 */
export const setConfig = async (
  requests: JenkinsRequests,
  path: string,
  xmlConfig: string,
): Promise<void> => {
  await requests.postXml(`${JobPath.parse(path).path()}/config.xml`, xmlConfig);
};
