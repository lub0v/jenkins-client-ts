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
import { list } from './credentials.list';
import { exists } from './credentials.exists';
import { get } from './credentials.get';
import { create } from './credentials.create';
import { configJson } from './credentials.configJson';
import { configXml } from './credentials.configXml';
import { setConfig } from './credentials.setConfig';
import { JenkinsCredential } from '../types';
import { deleteCredentials } from './credentials.delete';
import { JenkinsCredentialStoreDomainsApi } from './domains/domains';

export class JenkinsCredentialsStoreApi {
  private requests: JenkinsRequests;
  public domains: JenkinsCredentialStoreDomainsApi;
  private readonly store: string;
  private readonly pathOrUser: string;

  constructor(requests: JenkinsRequests, store: string, pathOrUser = '') {
    this.requests = requests;
    this.domains = new JenkinsCredentialStoreDomainsApi(this.requests, store, pathOrUser);
    this.store = store;
    this.pathOrUser = pathOrUser;
  }

  configJson(id: string, domain = '_'): Promise<any> {
    return configJson(this.requests, this.store, this.pathOrUser, id, domain);
  }

  configXml(id: string, domain = '_'): Promise<string> {
    return configXml(this.requests, this.store, this.pathOrUser, id, domain);
  }

  exists(id: string, domain = '_'): Promise<boolean> {
    return exists(this.requests, this.store, this.pathOrUser, id, domain);
  }

  create(xmlConfig: string, domain = '_'): Promise<void> {
    return create(this.requests, this.store, this.pathOrUser, xmlConfig, domain);
  }

  setConfig(id: string, xmlContent: string, domain = '_'): Promise<void> {
    return setConfig(this.requests, this.store, this.pathOrUser, id, xmlContent, domain);
  }

  delete(id: string, domain = '_'): Promise<void> {
    return deleteCredentials(this.requests, this.store, this.pathOrUser, id, domain);
  }

  get(id: string, domain = '_'): Promise<JenkinsCredential> {
    return get(this.requests, this.store, this.pathOrUser, id, domain);
  }

  list(domain = '_'): Promise<JenkinsCredential[]> {
    return list(this.requests, this.store, this.pathOrUser, domain);
  }
}
