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

import { credsPath } from '../credentials.utils';
import { JenkinsRequests } from '../../requests';

/**
 * Create credential domain
 *
 * @param requests
 * @param store
 * @param pathOrUser
 * @param {string} xmlContent - domain configuration
 *
 * @example
 *
 * await jenkins.credentials.system().domains.create(`
 *  <com.cloudbees.plugins.credentials.domains.Domain plugin="credentials@2.6.1">
 *      <name>github</name>
 *      <specifications>
 *          <com.cloudbees.plugins.credentials.domains.HostnameSpecification>
 *              <includes>github.com</includes>
 *              <excludes/>
 *          </com.cloudbees.plugins.credentials.domains.HostnameSpecification>
 *      </specifications>
 *  </com.cloudbees.plugins.credentials.domains.Domain>`
 * );
 *
 * @example
 *
 * await jenkins.credentials.folder('/my-folder').domains.create(`...`);
 *
 * @example
 *
 * await jenkins.credentials.user('user').domains.create(`...`);
 *
 */
export const create = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
  xmlContent: string,
): Promise<void> => {
  await requests.postXml(`${credsPath(pathOrUser, store)}/createDomain`, xmlContent);
};
