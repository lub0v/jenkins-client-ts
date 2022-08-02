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
import { get } from './queue.get';
import { list } from './queue.list';
import { cancel } from './queue.cancel';
import { JenkinsQueue, JenkinsQueueItem } from '../types';

export class JenkinsQueueApi {
  private requests: JenkinsRequests;

  constructor(requests: JenkinsRequests) {
    this.requests = requests;
  }

  list(path?: string): Promise<JenkinsQueue> {
    return list(this.requests, path);
  }

  get(id: number): Promise<JenkinsQueueItem> {
    return get(this.requests, id);
  }

  cancel(id: number): Promise<void> {
    return cancel(this.requests, id);
  }
}
