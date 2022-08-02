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

/**
 * Check whether user exists
 *
 * @param {string} name - user name
 *
 * @example
 *
 * const userExists = await jenkins.users.exists('john')
 *
 */
export const exists = async (requests: JenkinsRequests, name: string): Promise<boolean> =>
  requests.exists(`user/${name}/api/json`);
