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
import { get } from './views.get';
import { list } from './views.list';
import { removeJob } from './views.removeJob';
import { exists } from './views.exists';
import { deleteView } from './views.delete';
import { create } from './views.create';
import { configJson } from './views.configJson';
import { configXml } from './views.configXml';
import { addJob } from './views.addJob';
import { JenkinsView } from '../types';
import { setConfig } from './views.setConfig';

export class JenkinsViewsApi {
  private requests: JenkinsRequests;

  constructor(requests: JenkinsRequests) {
    this.requests = requests;
  }

  addJob(folderPath: string, viewName: string, jobPath: string): Promise<void> {
    return addJob(this.requests, folderPath, viewName, jobPath);
  }

  configJson(path: string, name: string): Promise<any> {
    return configJson(this.requests, path, name);
  }

  configXml(path: string, name: string): Promise<string> {
    return configXml(this.requests, path, name);
  }

  setConfig(path: string, name: string, xml: string): Promise<void> {
    return setConfig(this.requests, path, name, xml);
  }

  create(folderPath: string, name: string, mode: 'ListView' | 'MyView'): Promise<void> {
    return create(this.requests, folderPath, name, mode);
  }

  delete(path: string, name: string): Promise<void> {
    return deleteView(this.requests, path, name);
  }

  exists(path: string, name: string): Promise<boolean> {
    return exists(this.requests, path, name);
  }

  get(path: string, name: string): Promise<JenkinsView> {
    return get(this.requests, path, name);
  }

  list(path: string): Promise<JenkinsView[]> {
    return list(this.requests, path);
  }

  removeJob(folderPath: string, viewName: string, jobPath: string): Promise<void> {
    return removeJob(this.requests, folderPath, viewName, jobPath);
  }
}
