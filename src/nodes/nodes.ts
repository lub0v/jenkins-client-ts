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

// eslint-disable-next-line max-classes-per-file
import { JenkinsRequests } from '../requests';
import { get } from './nodes.get';
import { list } from './nodes.list';
import { exists } from './nodes.exists';
import { markOffline } from './nodes.markOffline';
import { create } from './nodes.create';
import { update } from './nodes.update';
import { configJson } from './nodes.configJson';
import { configXml } from './nodes.configXml';
import { copy } from './nodes.copy';
import { setConfig } from './nodes.setConfig';
import { JenkinsNode } from '../types';
import { bringOnline } from './nodes.bringOnline';
import { deleteNode } from './nodes.delete';

export class JenkinsNodesApi {
  private requests: JenkinsRequests;

  constructor(requests: JenkinsRequests) {
    this.requests = requests;
  }

  configJson(nodeLabel: string): Promise<any> {
    return configJson(this.requests, nodeLabel);
  }

  configXml(nodeLabel: string): Promise<string> {
    return configXml(this.requests, nodeLabel);
  }

  setConfig(nodeLabel: string, xmlConfig: string): Promise<void> {
    return setConfig(this.requests, nodeLabel, xmlConfig);
  }

  create(nodeLabel: string, options?: any): Promise<void> {
    return create(this.requests, nodeLabel, options);
  }

  update(nodeName: string, options?: any): Promise<void> {
    return update(this.requests, nodeName, options);
  }

  copy(fromName: string, name: string): Promise<void> {
    return copy(this.requests, fromName, name);
  }

  delete(nodeName: string): Promise<void> {
    return deleteNode(this.requests, nodeName);
  }

  exists(nodeName: string): Promise<boolean> {
    return exists(this.requests, nodeName);
  }

  get(nodeName: string): Promise<JenkinsNode> {
    return get(this.requests, nodeName);
  }

  list(): Promise<JenkinsNode[]> {
    return list(this.requests);
  }

  markOffline(nodeName: string, message?: string): Promise<void> {
    return markOffline(this.requests, nodeName, message);
  }

  bringOnline(nodeName: string): Promise<void> {
    return bringOnline(this.requests, nodeName);
  }
}
