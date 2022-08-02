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
import { JenkinsUserToken } from '../types';
import { whoAmI } from './users.whoAmI';

/**
 * Generate API token for currently authenticated user
 *
 * @param {string} tokenName - new token name
 *
 * @example
 *
 * const tokenInfo = await jenkins.users.generateToken('ApiToken');
 *
 * @example Example result:
 *
 * {
 *   tokenName: 'ApiToken',
 *   tokenUuid: 'ded6d423-7feb-4411-86c1-97bf82548074',
 *   tokenValue: '11c6e56d420f63c3ada149de4d52ba8dfe'
 * }
 *
 */
export const generateToken = async (
  requests: JenkinsRequests,
  tokenName: string,
): Promise<JenkinsUserToken> => {
  const userName = (await whoAmI(requests)).name;
  return requests
    .postForm(
      `/user/${userName}/descriptorByName/jenkins.security.ApiTokenProperty/generateNewToken`,
      {
        newTokenName: tokenName,
      },
    )
    .then(res => res.data.data);
};
