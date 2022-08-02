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
import { JenkinsUser } from '../types';

/**
 * Get information about user
 *
 * This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)
 *
 * @param requests
 * @param {string} name - user name
 *
 * @example
 *
 * const user = await jenkins.users.get('john');
 *
 * @example Example result:
 *
 * {
 *   _class: 'hudson.model.User',
 *   absoluteUrl: 'http://localhost:8080/user/john',
 *   description: null,
 *   fullName: 'john.doe',
 *   id: 'john',
 *   property: [
 *     { _class: 'jenkins.security.ApiTokenProperty' },
 *     {
 *       _class: 'com.cloudbees.plugins.credentials.UserCredentialsProvider$UserCredentialsProperty',
 *     },
 *     {
 *       _class: 'hudson.plugins.emailext.watching.EmailExtWatchAction$UserProperty',
 *       triggers: [],
 *     },
 *     { _class: 'hudson.model.MyViewsProperty' },
 *     {
 *       _class: 'org.jenkinsci.plugins.displayurlapi.user.PreferredProviderUserProperty',
 *     },
 *     { _class: 'hudson.model.PaneStatusProperties' },
 *     { _class: 'jenkins.security.seed.UserSeedProperty' },
 *     {
 *       _class: 'hudson.search.UserSearchProperty',
 *       insensitiveSearch: true,
 *     },
 *     { _class: 'hudson.model.TimeZoneProperty' },
 *     { _class: 'hudson.security.HudsonPrivateSecurityRealm$Details' },
 *     {
 *       _class: 'hudson.tasks.Mailer$UserProperty',
 *       address: 'john@doe.com',
 *     }
 *   ]
 * }
 *
 */
export const get = async (requests: JenkinsRequests, name: string): Promise<JenkinsUser> =>
  requests.get(`user/${name}/api/json`).then(res => res.data);
