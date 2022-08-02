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
import { JenkinsCredential } from '../types';
import { credsPath } from './credentials.utils';

/**
 * Get credential information
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param store
 * @param pathOrUser
 * @param {string} id - credential id
 * @param {string} [domain] - credential domain. Default `_`.
 *
 * @example
 *
 * const credential = await jenkins.credentials.system().get('credential-name');
 *
 * @example
 *
 * const credential = await jenkins.credentials.folder('/my-folder').get('credential-name', 'my-domain');
 *
 * @example
 *
 * const credential = await jenkins.credentials.user('user').get('credential-name');
 *
 * @example Example result:
 *
 * {
 *   _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$CredentialsWrapper',
 *   description: 'some description',
 *   displayName: 'username/****** (some description)',
 *   fingerprint: null,
 *   fullName: 'my-folder/folder/my-domain/credential-name',
 *   id: 'credential-name',
 *   typeName: 'Username with password',
 * }
 *
 */
export const get = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
  id: string,
  domain?: string,
): Promise<JenkinsCredential> =>
  requests.get(`${credsPath(pathOrUser, store, domain, id)}/api/json`).then(res => res.data);
