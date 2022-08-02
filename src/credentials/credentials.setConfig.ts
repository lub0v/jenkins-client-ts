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
import { credsPath } from './credentials.utils';

/**
 * Update credential configuration
 *
 * @param requests
 * @param store
 * @param pathOrUser
 * @param {string} id - credential id
 * @param {string} xmlConfig - credential configuration as xml string
 * @param {string} [domain] - credential domain. Default `_`.
 *
 * @example
 *
 * await jenkins.credentials.system().setConfig('credential-name',
 *   `
 * <com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl plugin="credentials@2.6.1">
 *   <scope>GLOBAL</scope>
 *   <id>credential-name</id>
 *   <description>some description</description>
 *   <username>username_updated</username>
 *   <password>password</password>
 *   <usernameSecret>false</usernameSecret>
 * </com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>`
 * );
 *
 * @example
 *
 * await jenkins.credentials.folder('/my-folder').setConfig('credential-name', `...`);
 *
 * @example
 *
 * await jenkins.credentials.user('user').setConfig('credential-name', `...`);
 *
 */
export const setConfig = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
  id: string,
  xmlConfig: string,
  domain?: string,
): Promise<void> => {
  await requests.postXml(`${credsPath(pathOrUser, store, domain, id)}/config.xml`, xmlConfig);
};
