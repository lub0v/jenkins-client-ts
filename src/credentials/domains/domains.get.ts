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
import { JenkinsCredentialDomain } from '../../types';
import { JenkinsRequests } from '../../requests';

/**
 * Get credential domain
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param store
 * @param pathOrUser
 * @param {string} domain - domain name
 *
 * @example
 *
 * await jenkins.credentials.system().domains.get('github');
 *
 * @example Example result:
 *
 * {
 *   _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
 *   credentials: [],
 *   description: null,
 *   displayName: 'github',
 *   fullDisplayName: 'System » github',
 *   fullName: 'system/github',
 *   global: false,
 *   urlName: 'github',
 * };
 *
 * @example
 *
 * await jenkins.credentials.user('admin').domains.get('github');
 *
 * @example Example result:
 *
 * {
 *   _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
 *   credentials: [],
 *   description: null,
 *   displayName: 'github',
 *   fullDisplayName: 'User: admin » User » github',
 *   fullName: 'user:admin/user/github',
 *   global: false,
 *   urlName: 'github',
 * }
 *
 * @example
 *
 * await jenkins.credentials.folder('/my-folder').domains.get('github');
 *
 * @example Example result:
 *
 * {
 *   _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
 *   credentials: [],
 *   description: null,
 *   displayName: 'github',
 *   fullDisplayName: 'my-folder » Folder » github',
 *   fullName: 'my-folder/folder/github',
 *   global: false,
 *   urlName: 'github',
 * }
 *
 */
export const get = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
  domain: string,
): Promise<JenkinsCredentialDomain> =>
  requests.get(`${credsPath(pathOrUser, store, domain)}/api/json`).then(res => res.data);
