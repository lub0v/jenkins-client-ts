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

import { JenkinsRequests } from '../../requests';
import { JenkinsCredentialDomain } from '../../types';
import { configJson } from './domains.configJson';
import { configXml } from './domains.configXml';
import { deleteDomain } from './domains.delete';
import { create } from './domains.create';
import { get } from './domains.get';
import { list } from './domains.list';
import { exists } from './domains.exists';
import { setConfig } from './domains.setConfig';

export class JenkinsCredentialStoreDomainsApi {
  private requests: JenkinsRequests;
  private readonly store: string;
  private readonly pathOrUser;

  constructor(requests: JenkinsRequests, store: string, pathOrUser: string) {
    this.requests = requests;
    this.store = store;
    this.pathOrUser = pathOrUser;
  }

  create(xmlConfig: string): Promise<void> {
    return create(this.requests, this.store, this.pathOrUser, xmlConfig);
  }

  configJson(domain: string): Promise<any> {
    return configJson(this.requests, this.store, this.pathOrUser, domain);
  }

  configXml(domain: string): Promise<string> {
    return configXml(this.requests, this.store, this.pathOrUser, domain);
  }

  setConfig(domain: string, xmlConfig: string): Promise<void> {
    return setConfig(this.requests, this.store, this.pathOrUser, domain, xmlConfig);
  }

  delete(domain: string): Promise<void> {
    return deleteDomain(this.requests, this.store, this.pathOrUser, domain);
  }

  list(): Promise<JenkinsCredentialDomain[]> {
    return list(this.requests, this.store, this.pathOrUser);
  }

  get(domain: string): Promise<JenkinsCredentialDomain> {
    return get(this.requests, this.store, this.pathOrUser, domain);
  }

  exists(domain: string): Promise<boolean> {
    return exists(this.requests, this.store, this.pathOrUser, domain);
  }
}
