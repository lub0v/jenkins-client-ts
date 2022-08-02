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
import { JenkinsCreateUserOptions } from '../types';

/**
 * Create user
 *
 * @param {JenkinsCreateUserOptions} options - user information - `username`, `password`, `email`, `fullname`
 *
 * @example
 *
 * await jenkins.users.create({
 *    username: 'john',
 *    fullname: 'john.doe',
 *    password: 'pass#1234',
 *    email: 'john.doe@company.com',
 * });
 *
 */
export const create = async (
  requests: JenkinsRequests,
  options: JenkinsCreateUserOptions,
): Promise<void> => {
  const data = {
    username: options.username,
    password1: options.password,
    password2: options.password,
    fullname: options.fullname ?? '',
    email: options.email,
  };
  await requests.postForm('/securityRealm/createAccountByAdmin', {
    ...data,
    json: JSON.stringify(data),
  });
};
