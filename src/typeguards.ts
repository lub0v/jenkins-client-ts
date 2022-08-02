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

import {
  JenkinsJob,
  JenkinsJobBackupProject,
  JenkinsJobExternal,
  JenkinsJobFolder,
  JenkinsJobFreestyleProject,
  JenkinsJobMavenModuleSet,
  JenkinsJobMultiConfigurationProject,
  JenkinsJobOrganizationFolder,
  JenkinsJobWorkflow,
  JenkinsJobWorkflowMultibranchProject,
} from './types';

export function isWorkflowJob(job: JenkinsJob): job is JenkinsJobWorkflow {
  return job._class === 'org.jenkinsci.plugins.workflow.job.WorkflowJob';
}

export function isWorkflowMultiBranchProject(
  job: JenkinsJob,
): job is JenkinsJobWorkflowMultibranchProject {
  return job._class === 'org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject';
}

export function isFreestyleProject(job: JenkinsJob): job is JenkinsJobFreestyleProject {
  return job._class === 'hudson.model.FreeStyleProject';
}

export function isFolder(job: JenkinsJob): job is JenkinsJobFolder {
  return job._class === 'com.cloudbees.hudson.plugins.folder.Folder';
}

export function isOrganizationFolder(job: JenkinsJob): job is JenkinsJobOrganizationFolder {
  return job._class === 'jenkins.branch.OrganizationFolder';
}

export function isMultiConfigurationProject(
  job: JenkinsJob,
): job is JenkinsJobMultiConfigurationProject {
  return job._class === 'hudson.matrix.MatrixProject';
}

export function isMavenProject(job: JenkinsJob): job is JenkinsJobMavenModuleSet {
  return job._class === 'hudson.maven.MavenModuleSet';
}

export function isBackupProject(job: JenkinsJob): job is JenkinsJobBackupProject {
  return job._class === 'com.infradna.hudson.plugins.backup.BackupProject';
}

export function isExternalJob(job: JenkinsJob): job is JenkinsJobExternal {
  return job._class === 'hudson.model.ExternalJob';
}
