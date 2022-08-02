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
import { viewUrl } from './views.url';

/**
 * Get view configuration as xml string
 *
 * @param {string} path - path to the folder with view
 * @param {string} name - view name
 *
 * @example
 *
 * const configXml = await jenkins.views.configXml('/', 'MyView');
 *
 * @example Example result:
 *
 * <?xml version="1.1" encoding="UTF-8"?>
 * <hudson.model.ListView>
 *     <name>MyView</name>
 *     <filterExecutors>false</filterExecutors>
 *     <filterQueue>false</filterQueue>
 *     <properties class="hudson.model.View$PropertyList"/>
 *     <jobNames>
 *         <comparator class="hudson.util.CaseInsensitiveComparator"/>
 *     </jobNames>
 *     <jobFilters/>
 *     <columns>
 *         <hudson.views.StatusColumn/>
 *         <hudson.views.WeatherColumn/>
 *         <hudson.views.JobColumn/>
 *         <hudson.views.LastSuccessColumn/>
 *         <hudson.views.LastFailureColumn/>
 *         <hudson.views.LastDurationColumn/>
 *         <hudson.views.BuildButtonColumn/>
 *     </columns>
 *     <recurse>true</recurse>
 * </hudson.model.ListView>
 *
 */
export const configXml = async (
  requests: JenkinsRequests,
  path: string,
  name: string,
): Promise<any> => requests.get(`${viewUrl(path, name)}/config.xml`).then(res => res.data);
