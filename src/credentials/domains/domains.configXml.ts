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

import { JenkinsRequests } from '../../requests';
import { credsPath } from '../credentials.utils';

/**
 * Get credential domain configuration as xml string
 *
 * @param requests
 * @param store
 * @param pathOrUser
 * @param {string} domain - domain name
 *
 * @example
 *
 * const domain = await jenkins.credentials.system().domains.configXml('github');
 *
 * @example
 *
 * const domain = await jenkins.credentials.folder('/my-folder').domains.configXml('github');
 *
 * @example
 *
 * const domain = await jenkins.credentials.user('user').domains.configXml('github');
 *
 * @example Example result:
 *
 * <com.cloudbees.plugins.credentials.domains.Domain plugin="credentials@2.6.1">
 *     <name>github</name>
 *     <specifications>
 *         <com.cloudbees.plugins.credentials.domains.HostnameSpecification>
 *             <includes>github.com</includes>
 *             <excludes></excludes>
 *         </com.cloudbees.plugins.credentials.domains.HostnameSpecification>
 *     </specifications>
 * </com.cloudbees.plugins.credentials.domains.Domain>
 *
 */
export const configXml = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
  domain: string,
): Promise<string> =>
  requests.get(`${credsPath(pathOrUser, store, domain)}/config.xml`).then(res => res.data);
