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
import { get } from './users.get';
import { JenkinsCreateUserOptions, JenkinsUser, JenkinsUserToken, JenkinsWhoAmI } from '../types';
import { generateToken } from './users.generateToken';
import { revokeToken } from './users.revokeToken';
import { whoAmI } from './users.whoAmI';
import { list } from './users.list';
import { deleteUser } from './users.delete';
import { create } from './users.create';
import { exists } from './users.exists';

export class JenkinsUsersApi {
  private requests: JenkinsRequests;

  constructor(requests: JenkinsRequests) {
    this.requests = requests;
  }

  get(name: string): Promise<JenkinsUser> {
    return get(this.requests, name);
  }

  exists(name: string): Promise<boolean> {
    return exists(this.requests, name);
  }

  list(): Promise<JenkinsUser[]> {
    return list(this.requests);
  }

  create(user: JenkinsCreateUserOptions): Promise<void> {
    return create(this.requests, user);
  }

  delete(name: string): Promise<void> {
    return deleteUser(this.requests, name);
  }

  whoAmI(): Promise<JenkinsWhoAmI> {
    return whoAmI(this.requests);
  }

  generateToken(tokenName: string): Promise<JenkinsUserToken> {
    return generateToken(this.requests, tokenName);
  }

  revokeToken(tokenUuid: string): Promise<void> {
    return revokeToken(this.requests, tokenUuid);
  }
}
