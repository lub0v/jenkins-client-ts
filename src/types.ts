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

/**
 */
export interface JenkinsObject {
  _class: string;
}

/**
 */
export interface JenkinsActionableObject extends JenkinsObject {
  actions: JenkinsAction[];
}

type JenkinsAnyKeyValue = {
  [key: string]: any;
};

/**
 */
export interface JenkinsUser extends JenkinsObject {
  fullName: string;
  absoluteUrl: string;
  description: string;
  id: string;
  property: any[];
}

/**
 */
export interface JenkinsNodeExecutor {
  currentExecutable: any;
  idle: boolean;
  likelyStuck: boolean;
  number: number;
  progress: number;
}

/**
 */
export interface JenkinsNode extends JenkinsActionableObject {
  assignedLabels: JenkinsLabel[];
  description: string;
  displayName: string;
  executors: JenkinsNodeExecutor[];
  icon: string;
  iconClassName: string;
  idle: boolean;
  jnlpAgent: boolean;
  launchSupported: boolean;
  loadStatistics: JenkinsLoadStatistics;
  manualLaunchAllowed: boolean;
  monitorData: JenkinsAnyKeyValue;
  numExecutors: number;
  offline: boolean;
  offlineCause: any;
  offlineCauseReason: string;
  oneOffExecutors: JenkinsNodeExecutor[];
  temporarilyOffline: boolean;
  absoluteRemotePath: string;
}

/**
 */
export interface JenkinsHealthReport {
  description: string;
  iconClassName: string;
  iconUrl: string;
  score: number;
}

/**
 */
export interface BaseJenkinsProject extends JenkinsActionableObject {
  description: string;
  displayName: string;
  displayNameOrNull: string;
  fullDisplayName: string;
  fullName: string;
  name: string;
  url: string;
}

/**
 */
export interface JenkinsJobAbstractFolder extends BaseJenkinsProject {
  healthReport: JenkinsHealthReport[];
  jobs: JenkinsJob[];
  primaryView: JenkinsView;
  views: JenkinsView[];
}

export type JenkinsJobWorkflowMultibranchProject = JenkinsJobAbstractFolder & { sources: any[] };
export type JenkinsJobFolder = JenkinsJobAbstractFolder;
export type JenkinsJobOrganizationFolder = JenkinsJobAbstractFolder;

/**
 */
export interface BaseJenkinsJob extends BaseJenkinsProject {
  buildable: boolean;
  builds: JenkinsBuild[];
  color: string;
  firstBuild: JenkinsBuild;
  lastBuild: JenkinsBuild;
  lastCompletedBuild: JenkinsBuild;
  lastFailedBuild: JenkinsBuild;
  lastStableBuild: JenkinsBuild;
  lastSuccessfulBuild: JenkinsBuild;
  lastUnstableBuild: JenkinsBuild;
  lastUnsuccessfulBuild: JenkinsBuild;
  nextBuildNumber: number;
  healthReport: JenkinsHealthReport[];
  inQueue: boolean;
  keepDependencies: boolean;
  property: any[];
  queueItem: JenkinsQueueItem;
}

export type JenkinsJobExternal = BaseJenkinsJob;
export type JenkinsJobWorkflow = BaseJenkinsJob & {
  resumeBlocked: boolean;
  concurrentBuild: boolean;
};

/**
 */
export interface JenkinsAbstractProject extends BaseJenkinsJob {
  downstreamProjects: any[];
  upstreamProjects: any[];
  scm: JenkinsObject;
  disabled: boolean;
  concurrentBuild: boolean;
  labelExpression: string;
}

export type JenkinsJobFreestyleProject = JenkinsAbstractProject;
export type JenkinsJobBackupProject = JenkinsAbstractProject;
export type JenkinsJobMavenModuleSet = JenkinsAbstractProject & { modules: any[] };
export type JenkinsJobMultiConfigurationProject = JenkinsAbstractProject & {
  activeConfigurations: any[];
};

/**
 */
export type JenkinsJob =
  | JenkinsJobWorkflow
  | JenkinsJobFreestyleProject
  | JenkinsJobWorkflowMultibranchProject
  | JenkinsJobMultiConfigurationProject
  | JenkinsJobMavenModuleSet
  | JenkinsJobFolder
  | JenkinsJobBackupProject
  | JenkinsJobExternal
  | JenkinsJobOrganizationFolder;

/**
 */
export interface JobBuildOptions {
  token?: string;
  wait?: boolean;
  waitForStart?: boolean;
  interval?: number;
  timeout?: number;
}

/**
 */
export interface JenkinsArtifact {
  displayPath: string;
  fileName: string;
  relativePath: string;
}

/**
 */
export enum JenkinsBuildResult {
  ABORTED = 'ABORTED',
  FAILURE = 'FAILURE',
  NOT_BUILT = 'NOT_BUILT',
  SUCCESS = 'SUCCESS',
  UNSTABLE = 'UNSTABLE',
}

/**
 */
export enum JenkinsBuildAbortType {
  STOP = 'stop',
  TERM = 'term',
  KILL = 'kill',
}

/**
 */
export interface JenkinsBuild extends JenkinsActionableObject {
  id: string;
  number: number;
  url: string;
  displayName: string;
  fullDisplayName: string;
  description: string;
  culprits: JenkinsUser[];
  executor: any;
  artifacts: JenkinsArtifact[];
  estimatedDuration: number;
  duration: number;
  queueId: number;
  result: JenkinsBuildResult | null;
  changeSets: JenkinsObject & { kind: string; items: JenkinsChangeSet[] };
  timestamp: number;
  building: boolean;
  keepLog: boolean;
  fingerprint: any;
}

/**
 */
export interface JenkinsChangeSet extends JenkinsObject {
  affectedPaths: string[];
  commitId: string;
  timestamp: number;
  authorEmail: string;
  comment: string;
  date: string;
  id: string;
  msg: string;
  paths: any[];
  author: JenkinsUser;
}

/**
 */
export interface JenkinsView extends JenkinsObject {
  name: string;
  url: string;
  description: string;
  jobs: JenkinsJob[];
  property: any[];
}

/**
 */
export interface JenkinsQueueItem extends JenkinsActionableObject {
  blocked: boolean;
  buildable: boolean;
  cancelled: boolean;
  stuck: boolean;
  id: number;
  inQueueSince: number;
  params: string;
  task: JenkinsJob;
  url: string;
  why: string;
  timestamp: number;
  executable: JenkinsObject & { number: number; url: string } & any;
}

/**
 */
export interface JenkinsQueue extends JenkinsObject {
  items: JenkinsQueueItem[];
  discoverableItems: { task: { name: string } }[];
}

/**
 */
export interface JenkinsAction extends JenkinsObject {
  [key: string]: any;
}

/**
 */
export interface LogOptions {
  start?: number;
  html?: boolean;
}

/**
 */
export interface JenkinsLog {
  text: string;
  more: boolean;
  size: number;
}

/**
 */
export interface LogStreamOptions {
  start?: number;
  interval?: number;
}

/**
 */
export interface JenkinsBuildWaitOptions {
  interval?: number;
  timeout?: number;
}

/**
 */
export interface JenkinsTimeSeries {
  history: number[];
  latest: number;
}

/**
 */
export interface JenkinsMultiStageTimeSeries {
  hour: JenkinsTimeSeries;
  min: JenkinsTimeSeries;
  sec10: JenkinsTimeSeries;
}

/**
 */
export interface JenkinsLoadStatistics extends JenkinsObject {
  availableExecutors: JenkinsMultiStageTimeSeries;
  busyExecutors: JenkinsMultiStageTimeSeries;
  connectingExecutors: JenkinsMultiStageTimeSeries;
  definedExecutors: JenkinsMultiStageTimeSeries;
  idleExecutors: JenkinsMultiStageTimeSeries;
  onlineExecutors: JenkinsMultiStageTimeSeries;
  queueLength: JenkinsMultiStageTimeSeries;
  totalExecutors: JenkinsMultiStageTimeSeries;
}

/**
 */
export interface JenkinsLabel extends JenkinsObject {
  actions: JenkinsAction[];
  busyExecutors: number;
  clouds: JenkinsActionableObject[];
  description: string;
  idleExecutors: number;
  totalExecutors: number;
  loadStatistics: JenkinsLoadStatistics;
  name: string;
  nodes: any[];
  offline: boolean;
  tiedJobs: JenkinsJob[];
  propertiesList: any[];
}

/**
 */
export interface JenkinsPlugin {
  active: boolean;
  bundled: boolean;
  deleted: boolean;
  dependency: any[];
  detached: boolean;
  downgradable: boolean;
  enabled: boolean;
  hasUpdate: boolean;
  longName: string;
  pinned: boolean;
  requiredCoreVersion: string;
  shortName: string;
  supportsDynamicLoad: string;
  url: string;
  version: string;
}

/**
 */
export interface JenkinsCredential extends JenkinsObject {
  id: string;
  description: string;
  displayName: string;
  fingerprint: any;
  fullName: string;
  typeName: string;
}

/**
 */
export interface JenkinsCredentialDomain extends JenkinsObject {
  id: string;
  credentials: JenkinsCredential[];
  description: string;
  displayName: string;
  fullDisplayName: string;
  fullName: string;
  global: boolean;
  urlName: string;
}

/**
 */
export interface JenkinsWhoAmI extends JenkinsObject {
  anonymous: boolean;
  authenticated: boolean;
  name: string;
  authorities: string[];
}

/**
 */
export interface JenkinsUserToken {
  tokenName: string;
  tokenUuid: string;
  tokenValue: string;
}

/**
 */
export interface JenkinsCreateUserOptions {
  username: string;
  password: string;
  email: string;
  fullname?: string;
}
