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
 * List credentials
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param store
 * @param pathOrUser
 * @param {string} [domain] - credential domain. Default `_`.
 *
 * @example
 *
 * const credential = await jenkins.credentials.system().list();
 *
 * @example
 *
 * const credential = await jenkins.credentials.folder('/my-folder').list();
 *
 * @example
 *
 * const credential = await jenkins.credentials.user('user').list();
 *
 * @example Example result:
 *
 * [
 *   {
 *     description: 'some description',
 *     displayName: 'username/****** (some description)',
 *     fingerprint: null,
 *     fullName: 'my-folder/folder/my-domain/credential-name',
 *     id: 'credential-name',
 *     typeName: 'Username with password',
 *   }
 * ]
 *
 */
export const list = async (
  requests: JenkinsRequests,
  store: string,
  pathOrUser: string,
  domain?: string,
): Promise<JenkinsCredential[]> =>
  requests
    .get(`${credsPath(pathOrUser, store, domain)}/api/json`)
    .then(res => res.data.credentials);
