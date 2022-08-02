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
import { whoAmI } from './users.whoAmI';

/**
 * Revoke API token for currently authenticated user
 *
 * @param {string} tokenUuid - token uuid
 *
 * @example
 *
 * await jenkins.users.revokeToken('ded6d423-7feb-4411-86c1-97bf82548074');
 *
 */
export const revokeToken = async (requests: JenkinsRequests, tokenUuid: string): Promise<void> => {
  const userName = (await whoAmI(requests)).name;
  await requests.postForm(
    `/user/${userName}/descriptorByName/jenkins.security.ApiTokenProperty/revoke`,
    {
      tokenUuid,
    },
  );
};
