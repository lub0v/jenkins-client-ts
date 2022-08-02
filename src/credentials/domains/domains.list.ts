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
import { JenkinsCredentialDomain } from '../../types';
import { get } from './domains.get';

/**
 * List credential domains
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 *
 * @param store
 * @param pathOrUser
 * @example
 *
 * const domains = await jenkins.credentials.system().domains.list();
 *
 * @example Example result:
 *
 * [
 *   {
 *     _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
 *     credentials: [],
 *     description:
 *       'Credentials that should be available irrespective of domain specification to requirements matching.',
 *     displayName: 'Global credentials (unrestricted)',
 *     fullDisplayName: 'System » Global credentials (unrestricted)',
 *     fullName: 'system/_',
 *     global: true,
 *     urlName: '_',
 *   },
 *   {
 *     _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
 *     credentials: [],
 *     description: null,
 *     displayName: 'github',
 *     fullDisplayName: 'System » github',
 *     fullName: 'system/github',
 *     global: false,
 *     urlName: 'github',
 *   },
 * ]
 *
 * @example
 *
 * const domains = await jenkins.credentials.folder('/my-folder').domains.list();
 *
 * @example
 *
 * const domains = await jenkins.credentials.user('user').domains.list();
 *
 */
export const list = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
): Promise<JenkinsCredentialDomain[]> => {
  if (store === 'user') {
    /* 
      This is a workaround for the issue with 500 error for /user/<user>/credentials/store/user/api/json url.
      Parse html for domain names and get each domain independently.
     */
    const domains = await parseDomainsFromUserCredentialsHtmlPage(requests, store, pathOrUser);
    return Promise.all(domains.map(domain => get(requests, store, pathOrUser, domain)));
  }

  return requests
    .get(`${credsPath(pathOrUser, store)}/api/json`)
    .then(res => Object.values(res.data.domains));
};

async function parseDomainsFromUserCredentialsHtmlPage(
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
): Promise<string[]> {
  const res: string = await requests.get(credsPath(pathOrUser, store)).then(r => r.data);
  const regex = new RegExp('href="domain/(.+?)"', 'g');
  return [...new Set(res.match(regex))].map(r => r.replace(regex, '$1'));
}
