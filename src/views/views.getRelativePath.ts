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

/**
 * This helper function only applies to the addJob and removeJob for views.
 * Since views can be nested within folders and user may provide the full path to the job
 * we need to transform the provided path to the path relative to the folder where the view is created.
 */
export const getRelativePath = (path: string, name: string, jobPath: string): string => {
  const folderPrettyPath = JobPath.parse(path).prettyPath();
  let jobName = JobPath.parse(jobPath).prettyPath();
  if (jobName.startsWith(folderPrettyPath)) {
    jobName = JobPath.parse(jobName.replace(folderPrettyPath, '')).prettyPath();
  }
  return jobName;
};
