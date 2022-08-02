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

import { JobPath } from '../utils/jobPath';

function getPath(pathOrUser: string, store: string) {
  if (store === 'system') {
    return '';
  }
  if (store === 'user') {
    return `/user/${pathOrUser}`;
  }
  return JobPath.parse(pathOrUser).path();
}

export function credsPath(pathOrUser: string, store: string, domain?: string, id?: string): string {
  return `${getPath(pathOrUser, store)}/credentials/store/${store}${
    domain ? `/domain/${domain}` : ''
  }${id ? `/credential/${id}` : ''}`;
}
