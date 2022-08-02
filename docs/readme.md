# Jenkins Typescript Client

[![Run Tests](https://github.com/parsable/jenkins-client-ts/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/parsable/jenkins-client-ts/actions/workflows/build.yml) [![codecov](https://codecov.io/gh/parsable/jenkins-client-ts/branch/main/graph/badge.svg?token=AF3AHH9LS0)](https://codecov.io/gh/parsable/jenkins-client-ts)

Typescript API wrapper for working with Jenkins API.

## Table of Contents

- [Features](#features)
- [Usage examples](#usage-examples)
- [Installation](#installation)
- [Creating a JenkinsClient](#creating-a-jenkinsclient)
- [Common methods parameters](#common-methods-parameters)
    - [`path` parameter](#path-parameter)
    - [`depth` and `tree` parameters](#depth-and-tree-parameters)
- [Types](#types)
- [Utilities](#utilities)
  - [`requests` object](#requests-object)
  - [Types guards](#type-guards)
  - [JobPath](#jobpath)
  - [waitWhile](#waitwhile)
- [License](#license) 
- [API](#api)

## Features

* Clear extensive [API](#API) and simple [usage](#usage-examples)
* [Types](#types) for the majority of Jenkins objects
* Automatic [crumb headers](https://www.jenkins.io/doc/book/security/csrf-protection/#working-with-scripted-clients) issuer with ability to override
* Built-in [wait for Jenkins builds](#jenkinsjobsbuild) and convenient utility [waitWhile](#waitwhile) function to wait for custom conditions 
* Exposed [requests](#requests-object) object to invoke APIs that are not yet implemented
* Ability to retrieve _more_ or _less_ information using [`depth` and `tree` parameters](#depth-and-tree-parameters)
* Ability to override http configurations for calls

## Usage Examples

### Example 1

Trigger a job build with parameters, wait for it to complete and verify build status.

```javascript
import { JenkinsBuildResult, JenkinsClient } from 'jenkins-client-ts';

const jenkins = new JenkinsClient({
  baseUrl: 'https://localhost:8080',
  username: 'admin',
  password: '<token> | <password>',
});

(async () => {
  const jobPath = '/my-folder/my-job/';
  const queueId = await jenkins.jobs.build(jobPath, { param1: 'value1' }, { wait: true });
  const buildNumber = (await jenkins.queue.get(queueId)).executable.number;
  const build = await jenkins.builds.get(jobPath, buildNumber);

  if (build.result === JenkinsBuildResult.SUCCESS) {
    console.log('Success!');
  }
})();
``` 

### Example 2

Create a job or update configuration if job exists.

```javascript
import { JenkinsClient } from 'jenkins-client-ts';

const jenkins = new JenkinsClient(...);

(async () => {
  const JOB_NAME = 'my-job';
  const JOB_CONFIG = `
  <flow-definition plugin="workflow-job@2.40">
      <actions/>
      <description>My Job description</description>
      <keepDependencies>false</keepDependencies>
      <properties/>
      <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.87">
          <script/>
          <sandbox>true</sandbox>
      </definition>
      <triggers/>
      <disabled>false</disabled>
  </flow-definition>`;

  const jobExists = await jenkins.jobs.exists(JOB_NAME);
  if (jobExists) {
    await jenkins.jobs.setConfig(JOB_NAME, JOB_CONFIG);
  } else {
    await jenkins.jobs.create('/', JOB_NAME, JOB_CONFIG);
  }
})();
```

### Example 3

Trigger a job build and stream logs from it to the console.

```javascript
import { JenkinsClient } from 'jenkins-client-ts';

const jenkins = new JenkinsClient(...);

(async () => {
  const jobPath = '/my-folder/my-job/';
  const queueId = await jenkins.jobs.build(jobPath, undefined, { waitForStart: true });
  const buildNumber = (await jenkins.queue.get(queueId)).executable.number;
  const logStream = await jenkins.builds.logStream(jobPath, buildNumber);

  logStream.on('data', (text) => {
    console.log(text);
  });

  logStream.on('end', () => {
    console.log('Log transfer completed');
  });

  logStream.on('error', (error) => {
    console.log(`There was an error ${error}`);
  });
})();
``` 

## Installation

With npm:
```
npm install jenkins-client-ts
```

With yarn:
```
yarn add jenkins-client-ts
```

## Creating a JenkinsClient

```javascript
const jenkins = new JenkinsClient({
  baseUrl: 'http://127.0.0.1:8000',
  username: 'admin',
  password: '<api token | password>',
});
```

##### [JenkinsClientOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/requests.ts#L35-L41)

All fields are optional:

- `baseUrl` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** - URL of the jenkins controller. Default `http://localhost:8080`
- `config` **[AxiosRequestConfig](https://github.com/axios/axios/blob/master/index.d.ts#L127-L166)?** - http configuration to include in every request such as additional headers or parameters.

<details><summary>Another way to provide config overrides</summary>

##

Config can also be overridden after client initialization with the `config()` method
which returns a new instance of the client, leaving initial config untouched.
It allows overriding options only for some calls.

##### Example 1 - return new client with overridden config

```javascript
const newClient: JenkinsClient = jenkins.config({ headers: { ['x-custom']: 'cusom-value' } });

const jobs = await newClient.jobs.list('/');
```

##### Example 2 - or override configuration only for one call

```javascript
const jobs = await jenkins.config({ params: { depth: 2 } }).jobs.list('/');
```

</details>
 
Credentials:

- `username` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** - username for authentication. If not provided, will use anonymous access
- `password` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** - [API token](https://www.jenkins.io/doc/book/system-administration/authenticating-scripted-clients/) or real user password. It is preferred to use API token for scripted clients.

  When real user password is used, Jenkins requires [CSRF protection](https://www.jenkins.io/doc/book/security/csrf-protection/) token (crumb) to be sent along with every `POST`/`DELETE` request.
  JenkinsClient automatically requests crumb token value.

- `crumbIssuer` **[function](https://github.com/parsable/jenkins-client-ts/blob/main/src/requests.ts#L49)?** - custom function to retrieve Jenkins crumb value. It receives the Jenkins [`requests`](https://github.com/parsable/jenkins-client-ts/blob/main/src/requests.ts#L34) object and expects `Promise<`[JenkinsCrumbIssuerResponse](https://github.com/parsable/jenkins-client-ts/blob/main/src/requests.ts#L30-L33) `>` as a return value. See example below.

##### Examples:

```javascript
const jenkins = new JenkinsClient({
  baseUrl: 'http://127.0.0.1:8000',
  username: 'admin',
  password: '<api token | password>',
  // this is the default crumbIssuer function, but you can override it
  crumbIssuer: (requests: JenkinsRequests) =>
    requests.get('/crumbIssuer/api/json').then(res => ({
      crumbRequestField: res.data.crumbRequestField,
      crumb: res.data.crumb,
    })),
  // custom headers to send with every request
  config: {
    headers: {
      'x-custom-header': 'custom-value',
    },
  },
});
```

### Common methods parameters

#### `path` parameter

In a number of methods you have to specify a path to Jenkins job or folder, which looks similar to this `/job/my-folder/job/my-job`

For better readability, you can pass a shorter version of the path: `/my-folder/my-job`

> Exception: if your job name is "job", then you must provide full path, e.g. `/job/my-folder/job/job`

Path can also be a full job URL: `http://localhost:8080/job/my-folder/job/my-job/`

##### Example

All below variants are equivalent:

```javascript
await jenkins.jobs.build('/my-folder/my-job');
await jenkins.jobs.build('/job/my-folder/job/my-job');
await jenkins.jobs.build('http://localhost:8080/job/my-folder/job/my-job');
```

```javascript
// must provide full path or url if job or folder name is "job"

await jenkins.jobs.build('/job/job');
await jenkins.jobs.build('http://localhost:8080/job/job');
```

#### `depth` and `tree` parameters

These parameters allow to control the amount of data returned from the server. Please read about them [here](https://www.cloudbees.com/blog/taming-jenkins-json-api-depth-and-tree).

See below example on how to define `depth` or `tree` for calls:

##### Example - use `depth`/`tree` only for one method

```javascript
const job1 = jenkins.depth(2).jobs.get('my-job');
const job2 = jenkins.tree('name,description').jobs.get('my-job');
const job3 = jenkins.depth(2).tree('name,description,builds[number,result]').jobs.get('my-job');
```

##### Example - use `depth`/`tree` for all methods

```javascript
// assingn new jenkins client to variable and use it
const jenkinsWithDepthTree = jenkins.depth(2).tree('name,description');

const job1 = jenkinsWithDepthTree.jobs.get('my-job');
```

### Types

This client [exposes](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts) many types for Jenkins objects, such as jobs, builds, credentials, users etc, but not all possible types are presented and some of them defined as `any`. Do not hesitate to raise issues and ask to add or update types. 

## Utilities

### `requests` object

JenkinsClient exposes a handy [`requests`](https://github.com/parsable/jenkins-client-ts/blob/main/src/requests.ts#L49) object which can be used to invoke APIs that are not yet implemented. It uses provided credentials and automatically requests Jenkins crumb headers, so you only need to worry about actual API call.

##### Example

```javascript
const requests = new JenkinsClient().requests;

const result = await requests.get('/some/api/json').then(res => res.data);

await requests.post('/doSomething', { param: 'value' });
await requests.postForm('/doSomething', { param: 'value' });
await requests.postXml('/createSomething', '<xml></xml>');
await requests.delete('/doDeleteSomething');
```

### Type guards

Some types are union types, for example [JenkinsJob](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L158-L167). In order to easily distinguish one type from another this library [exposes several type guards](https://github.com/parsable/jenkins-client-ts/blob/main/src/typeguards.ts#L29-L67) for your convenience.

Read more about [`type guards`](https://www.typescriptlang.org/docs/handbook/advanced-types.html)

##### Example - job type guards

```javascript
isWorkflowJob(job)
isWorkflowMultiBranchProject(job)
isFreestyleProject(job)
isFolder(job)
isOrganizationFolder(job)
isMultiConfigurationProject(job)
isMavenProject(job)
isBackupProject(job)
isExternalJob(job)
```

### JobPath

Library exposes utility class `JobPath` to alleviate work with Jenkins job paths. 

##### Example - using JobPath

```javascript
import { JobPath } from 'jenkins-client-ts';

const jobPath = JobPath.parse('/my-folder/my-job');

console.log(jobPath.path()) // '/job/my-folder/job/my-job/'
console.log(jobPath.prettyPath()) // 'my-folder/my-job'
console.log(jobPath.name()) // 'my-job'
console.log(jobPath.parent()) // JobPath object for /my-folder/
```

### waitWhile

Library exposes utility function `waitWhile` that allows executing a function while specified condition is `true`. This is useful for situations when you want to wait for build to finish or queue item to be available, etc.

##### Parameters

* `func` **() => Promise\<T\>** async function that is executed while below condition is `true`. Returns data object of generic type `T`.
* `condition`  **(res: RequestResult\<T>) => boolean** - wait while this function returns `true`. `RequestResult<T>` has two fields
    - `ok` **boolean** - `true` if function did not throw otherwise `false`
    - `data` **T** - function result
* `options` - wait options
    - `interval` - how frequently to execute function (in milliseconds). Default `1000`.
    - `timeout` - what is the maximum time to wait for condition to become `false` (in milliseconds). Default wait forever.

##### Example - using waitWhile

```javascript
import { JenkinsBuild, JenkinsClient, JenkinsQueueItem, waitWhile } from 'jenkins-client-ts';

const jenkins = new JenkinsClient(...);

// Example 1: waiting until queue item with id 123 is available
const queueItem: JenkinsQueueItem | undefined = await waitWhile<JenkinsQueueItem>(
  () => jenkins.queue.get(123), // try to get queue with id 123
  r => !r.ok, // do it while function throws error (not ok)
  { timeout: 10000, interval: 500 }, // wait for 10 seconds maximum, and retry every 500 milliseconds
)

// Example 2: waiting until build is completed.
// Note that there are special methods for that particular case, this is just an example for waitWhile function usage
const build: JenkinsBuild | undefined = await waitWhile<JenkinsBuild>(
  () => jenkins.builds.get('/my-job', 1), // try to get build with number 1
  r => !r.data || r.data.building, // do it while build is unavailable or still running
);

```

## License

This project is licensed under the Apache 2.0 [LICENSE](./LICENSE)

## API
[__jobs__](#jobs): [`build`](#jenkinsjobsbuild) [`get`](#jenkinsjobsget) [`exists`](#jenkinsjobsexists) [`list`](#jenkinsjobslist) [`create`](#jenkinsjobscreate) [`copy`](#jenkinsjobscopy) [`delete`](#jenkinsjobsdelete) [`setConfig`](#jenkinsjobssetConfig) [`configJson`](#jenkinsjobsconfigJson) [`configXml`](#jenkinsjobsconfigXml) [`disable`](#jenkinsjobsdisable) [`enable`](#jenkinsjobsenable)

[__builds__](#builds): [`get`](#jenkinsbuildsget) [`delete`](#jenkinsbuildsdelete) [`wait`](#jenkinsbuildswait) [`waitForStart`](#jenkinsbuildswaitForStart) [`abort`](#jenkinsbuildsabort) [`log`](#jenkinsbuildslog) [`logStream`](#jenkinsbuildslogStream)

[__queue__](#queue): [`get`](#jenkinsqueueget) [`list`](#jenkinsqueuelist) [`cancel`](#jenkinsqueuecancel)

[__views__](#views): [`get`](#jenkinsviewsget) [`exists`](#jenkinsviewsexists) [`list`](#jenkinsviewslist) [`create`](#jenkinsviewscreate) [`setConfig`](#jenkinsviewssetConfig) [`configJson`](#jenkinsviewsconfigJson) [`configXml`](#jenkinsviewsconfigXml) [`addJob`](#jenkinsviewsaddJob) [`removeJob`](#jenkinsviewsremoveJob) [`getRelativePath`](#jenkinsviewsgetRelativePath)

[__users__](#users): [`get`](#jenkinsusersget) [`exists`](#jenkinsusersexists) [`list`](#jenkinsuserslist) [`create`](#jenkinsuserscreate) [`delete`](#jenkinsusersdelete) [`whoAmI`](#jenkinsuserswhoAmI) [`generateToken`](#jenkinsusersgenerateToken) [`revokeToken`](#jenkinsusersrevokeToken)

[__nodes__](#nodes): [`get`](#jenkinsnodesget) [`exists`](#jenkinsnodesexists) [`list`](#jenkinsnodeslist) [`create`](#jenkinsnodescreate) [`copy`](#jenkinsnodescopy) [`delete`](#jenkinsnodesdelete) [`update`](#jenkinsnodesupdate) [`setConfig`](#jenkinsnodessetConfig) [`configJson`](#jenkinsnodesconfigJson) [`configXml`](#jenkinsnodesconfigXml) [`markOffline`](#jenkinsnodesmarkOffline) [`bringOnline`](#jenkinsnodesbringOnline)

[__labels__](#labels): [`get`](#jenkinslabelsget)

[__plugins__](#plugins): [`list`](#jenkinspluginslist)

[__credentials__](#credentials): [`get`](#jenkinscredentialsget) [`exists`](#jenkinscredentialsexists) [`list`](#jenkinscredentialslist) [`create`](#jenkinscredentialscreate) [`delete`](#jenkinscredentialsdelete) [`setConfig`](#jenkinscredentialssetConfig) [`configJson`](#jenkinscredentialsconfigJson) [`configXml`](#jenkinscredentialsconfigXml)

[__credentials.domains__](#credentials-domains): [`get`](#jenkinscredentialsdomainsget) [`exists`](#jenkinscredentialsdomainsexists) [`list`](#jenkinscredentialsdomainslist) [`create`](#jenkinscredentialsdomainscreate) [`delete`](#jenkinscredentialsdomainsdelete) [`setConfig`](#jenkinscredentialsdomainssetConfig) [`configJson`](#jenkinscredentialsdomainsconfigJson) [`configXml`](#jenkinscredentialsdomainsconfigXml)

## Jobs

#### `jenkins.jobs.build`

<details><summary>Trigger a job build</summary>

##### Notes

If parameters are specified will run `buildWithParameters` otherwise just `build`. Returns queue item id for the triggered build.

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `parameters` **Record<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String), [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>?** parameters for the job.
*   `options` **[JobBuildOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L171-L177 "Source code on GitHub")?** build options

    *   `token` - authentication token used to allow unauthenticated users to run the job
    *   `wait` - if `true` will wait until job is completed
    *   `waitForStart` - if `true` will wait for job to start executing
    *   `interval` - interval in milliseconds to specify how often to check job build status. Default `1000`. Only if `wait` or `waitForStart` flags are enabled.
    *   `timeout` - timeout for job build to complete, will throw `Timeout 408` error if not completed in time. By default will wait forever. Only if `wait` or `waitForStart` flags are enabled.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)>**

##### Examples

```javascript
// trigger a job without parameters

const queueId = await jenkins.jobs.build('/my-folder/my-job/');
```

```javascript
// trigger a job with parameters

const queueId = await jenkins.jobs.build('job-with-params', { param1: 'value1', param2: 'value2' });
```

```javascript
// trigger a job with parameters, wait for it to complete, then check wheter job result is 'SUCCESS'

const jobPath = '/my-folder/my-job/';
const queueId = await jenkins.jobs.build(jobPath, { param1: 'value1' }, { wait: true });
const buildNumber = (await jenkins.queue.get(queueId)).executable.number;
const build = await jenkins.builds.get(jobPath, buildNumber);

if (build.result === 'SUCCESS') {
  console.log('Success!');
}
```

##### Code reference

[src/jobs/jobs.build.ts:75-116](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.build.ts#L75-L116 "Source code on GitHub")

</details>


#### `jenkins.jobs.get`

<details><summary>Get job information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsJob](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L156-L157 "Source code on GitHub")>**

##### Examples

```javascript
const job = await jenkins.jobs.get('/job/folder/job/my-job');
```

```javascript
const job = await jenkins.jobs.get('/folder/my-job');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.model.FreeStyleProject',
  actions: [
    {},
    {},
    {
      _class: 'org.jenkinsci.plugins.displayurlapi.actions.JobDisplayAction',
    },
    {
      _class: 'com.cloudbees.plugins.credentials.ViewCredentialsAction',
    },
  ],
  description: '',
  displayName: 'freestyle2',
  displayNameOrNull: null,
  fullDisplayName: 'freestyle2',
  fullName: 'freestyle2',
  name: 'freestyle2',
  url: 'http: * localhost:8080/job/freestyle2/',
  buildable: true,
  builds: [
    {
      _class: 'hudson.model.FreeStyleBuild',
      number: 2,
      url: 'http: * localhost:8080/job/freestyle2/2/',
    },
    {
      _class: 'hudson.model.FreeStyleBuild',
      number: 1,
      url: 'http: * localhost:8080/job/freestyle2/1/',
    },
  ],
  color: 'blue',
  firstBuild: {
    _class: 'hudson.model.FreeStyleBuild',
    number: 1,
    url: 'http: * localhost:8080/job/freestyle2/1/',
  },
  healthReport: [
    {
      description: 'Build stability: No recent builds failed.',
      iconClassName: 'icon-health-80plus',
      iconUrl: 'health-80plus.png',
      score: 100,
    },
  ],
  inQueue: false,
  keepDependencies: false,
  lastBuild: {
    _class: 'hudson.model.FreeStyleBuild',
    number: 2,
    url: 'http: * localhost:8080/job/freestyle2/2/',
  },
  lastCompletedBuild: {
    _class: 'hudson.model.FreeStyleBuild',
    number: 2,
    url: 'http: * localhost:8080/job/freestyle2/2/',
  },
  lastFailedBuild: null,
  lastStableBuild: {
    _class: 'hudson.model.FreeStyleBuild',
    number: 2,
    url: 'http: * localhost:8080/job/freestyle2/2/',
  },
  lastSuccessfulBuild: {
    _class: 'hudson.model.FreeStyleBuild',
    number: 2,
    url: 'http: * localhost:8080/job/freestyle2/2/',
  },
  lastUnstableBuild: null,
  lastUnsuccessfulBuild: null,
  nextBuildNumber: 3,
  property: [],
  queueItem: null,
  concurrentBuild: false,
  disabled: false,
  downstreamProjects: [],
  labelExpression: null,
  scm: {
    _class: 'hudson.scm.NullSCM',
  },
  upstreamProjects: [
    {
      _class: 'hudson.model.FreeStyleProject',
      name: 'freestyle1',
      url: 'http: * localhost:8080/job/freestyle1/',
      color: 'blue',
    },
  ],
}
```
</details>

##### Code reference

[src/jobs/jobs.get.ts:130-131](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.get.ts#L130-L131 "Source code on GitHub")

</details>


#### `jenkins.jobs.exists`

<details><summary>Check whether the specified job exists</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>**

##### Examples

```javascript
const jobExists = await jenkins.jobs.exists('my-job')
```

##### Code reference

[src/jobs/jobs.exists.ts:30-31](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.exists.ts#L30-L31 "Source code on GitHub")

</details>


#### `jenkins.jobs.list`

<details><summary>List jobs</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder
*   `recursive` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** whether to list jobs in the subfolders recursively

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsJob](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L156-L157 "Source code on GitHub")>>**

##### Examples

```javascript
const res = await jenkins.jobs.list('/');
```

<details><summary>Example result</summary>

```javascript
[
  {
    _class: 'com.cloudbees.hudson.plugins.folder.Folder',
    name: 'folder',
    url: 'http://localhost:8080/job/folder/',
  },
  {
    _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
    name: 'job1',
    url: 'http://localhost:8080/job/job1/',
    color: 'notbuilt',
  }
]
```
</details>


```javascript
const res = await jenkins.jobs.list('/', true);
```

<details><summary>Example result</summary>

```javascript
[
  {
    _class: 'com.cloudbees.hudson.plugins.folder.Folder',
    name: 'folder',
    url: 'http://localhost:8080/job/folder/',
  },
  {
    _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
    name: 'job2',
    url: 'http://localhost:8080/job/folder/job/job2',
  },
  {
    _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
    name: 'job1',
    url: 'http://localhost:8080/job/job1/',
    color: 'notbuilt',
  }
]
```
</details>

##### Code reference

[src/jobs/jobs.list.ts:76-106](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.list.ts#L76-L106 "Source code on GitHub")

</details>


#### `jenkins.jobs.create`

<details><summary>Create job or folder from xml config</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder where to create a job
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** new job name
*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** job xml config

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.jobs.create(
  '/',
  'my-job',
  `
<flow-definition plugin="workflow-job@2.40">
    <actions/>
    <description>My Job description</description>
    <keepDependencies>false</keepDependencies>
    <properties/>
    <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.87">
        <script/>
        <sandbox>true</sandbox>
    </definition>
    <triggers/>
    <disabled>false</disabled>
</flow-definition>`,
);
```

##### Code reference

[src/jobs/jobs.create.ts:48-55](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.create.ts#L48-L55 "Source code on GitHub")

</details>


#### `jenkins.jobs.copy`

<details><summary>Copy job from one path to another</summary>

##### Parameters

*   `fromPath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the source job
*   `toPath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the new job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.jobs.copy('/folder1/my-job', '/other-folder/job-copy');
```

##### Code reference

[src/jobs/jobs.copy.ts:33-41](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.copy.ts#L33-L41 "Source code on GitHub")

</details>


#### `jenkins.jobs.delete`

<details><summary>Delete job or folder</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job or folder

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.jobs.delete('/folder/my-job');
```

##### Code reference

[src/jobs/jobs.delete.ts:29-31](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.delete.ts#L29-L31 "Source code on GitHub")

</details>


#### `jenkins.jobs.setConfig`

<details><summary>Update job with xml configuration</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** new xml configuration for job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
Example:

await jenkins.jobs.setConfig(
  '/my-job',
  `<flow-definition plugin="workflow-job@1145.v7f2433caa07f">
    <actions/>
    <description>Job one description</description>
    <keepDependencies>false</keepDependencies>
    <properties/>
    <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2648.va9433432b33c">
        <script>echo "HELLO!"</script>
        <sandbox>true</sandbox>
    </definition>
    <triggers/>
    <disabled>false</disabled>
</flow-definition>
`,
);
```

##### Code reference

[src/jobs/jobs.setConfig.ts:45-51](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.setConfig.ts#L45-L51 "Source code on GitHub")

</details>


#### `jenkins.jobs.configJson`

<details><summary>Get job configuration as json object</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<any>**

##### Examples

```javascript
const config = await jenkins.jobs.configJson('my-job');
```

<details><summary>Example result</summary>

```javascript
{
  'flow-definition': {
    actions: '',
    description: 'My Job description',
    keepDependencies: false,
    properties: '',
    definition: { script: 'echo "hello";', sandbox: true },
    triggers: '',
    disabled: false,
  }
}
```
</details>

##### Code reference

[src/jobs/jobs.configJson.ts:45-49](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.configJson.ts#L45-L49 "Source code on GitHub")

</details>


#### `jenkins.jobs.configXml`

<details><summary>Get job configuration as xml string</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

##### Examples

```javascript
const config = await jenkins.jobs.configXml('my-job');
```

<details><summary>Example result</summary>

```javascript
<?xml version="1.0" encoding="UTF-8"?>
<flow-definition plugin="workflow-job@2.40">
    <actions/>
    <description>My Job description</description>
    <keepDependencies>false</keepDependencies>
    <properties/>
    <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.87">
        <script>echo "hello";</script>
        <sandbox>true</sandbox>
    </definition>
    <triggers/>
    <disabled>false</disabled>
</flow-definition>
```
</details>

##### Code reference

[src/jobs/jobs.configXml.ts:45-46](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.configXml.ts#L45-L46 "Source code on GitHub")

</details>


#### `jenkins.jobs.disable`

<details><summary>Disable job</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.jobs.disable('my-job');
```

##### Code reference

[src/jobs/jobs.disable.ts:29-31](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.disable.ts#L29-L31 "Source code on GitHub")

</details>


#### `jenkins.jobs.enable`

<details><summary>Enable job</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.jobs.enable('my-job');
```

##### Code reference

[src/jobs/jobs.enable.ts:29-31](https://github.com/parsable/jenkins-client-ts/blob/main/src/jobs/jobs.enable.ts#L29-L31 "Source code on GitHub")

</details>

## Builds

#### `jenkins.builds.get`

<details><summary>Get build information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** job build number

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsBuild](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L207-L226 "Source code on GitHub")>**

##### Examples

```javascript
const build = await jenkins.builds.get('my-job', 1);
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun',
  actions: [
    {
      _class: 'hudson.model.ParametersAction',
      parameters: [
        {
          _class: 'hudson.model.StringParameterValue',
          name: 'param',
          value: 'MyParam',
        },
      ],
    },
    {
      _class: 'hudson.model.CauseAction',
      causes: [
        {
          _class: 'hudson.model.Cause$RemoteCause',
          shortDescription: 'Started by remote host 172.26.0.1',
          addr: '172.26.0.1',
          note: null,
        },
      ],
    },
    {
      _class: 'org.jenkinsci.plugins.workflow.libs.LibrariesAction',
    },
    {},
    {},
    {
      _class: 'org.jenkinsci.plugins.displayurlapi.actions.RunDisplayAction',
    },
    {
      _class:
        'org.jenkinsci.plugins.pipeline.modeldefinition.actions.RestartDeclarativePipelineAction',
    },
    {},
    {
      _class: 'org.jenkinsci.plugins.workflow.job.views.FlowGraphAction',
    },
    {},
    {},
    {},
  ],
  artifacts: [],
  building: false,
  description: null,
  displayName: '#1',
  duration: 149,
  estimatedDuration: 149,
  executor: null,
  fullDisplayName: 'a7c06f5c-0234-4d31-b0cc-05b239c6ce21 » jobWParamsAndToken #1',
  id: '1',
  keepLog: false,
  number: 1,
  queueId: 1857,
  result: 'SUCCESS',
  timestamp: 1650317856368,
  url: 'http://localhost:8080/job/a7c06f5c-0234-4d31-b0cc-05b239c6ce21/job/jobWParamsAndToken/1/',
  changeSets: [],
  culprits: [],
  nextBuild: null,
  previousBuild: null,
}
```
</details>

##### Code reference

[src/builds/builds.get.ts:101-106](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.get.ts#L101-L106 "Source code on GitHub")

</details>


#### `jenkins.builds.delete`

<details><summary>Delete build</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** job build number

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.builds.delete('my-job', 1);
```

##### Code reference

[src/builds/builds.delete.ts:31-37](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.delete.ts#L31-L37 "Source code on GitHub")

</details>


#### `jenkins.builds.wait`

<details><summary>Wait for build to complete and return build information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** job build number
*   `options` **[JenkinsBuildWaitOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L307-L310 "Source code on GitHub")** build wait options

    *   `interval` - how often to check job build status. Default `1000` milliseconds.
    *   `timeout` - timeout in milliseconds for job build to complete, will throw `Timeout 408` error if not completed in time. By default waits forever.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsBuild](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L207-L226 "Source code on GitHub")>**

##### Examples

```javascript
const build = await jenkins.builds.wait('/job/folder/job/my-job', 1);
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun',
  actions: [
    {
      _class: 'hudson.model.CauseAction',
      causes: [
        {
          _class: 'hudson.model.Cause$UserIdCause',
        },
      ],
    },
    {
      _class: 'org.jenkinsci.plugins.workflow.libs.LibrariesAction',
      libraries: [],
    },
    {
      _class: 'org.jenkinsci.plugins.displayurlapi.actions.RunDisplayAction',
      artifactsUrl: 'http://localhost:8080/job/folder/job/my-job/1/artifact',
      changesUrl: 'http://localhost:8080/job/folder/job/my-job/changes',
      displayUrl: 'http://localhost:8080/job/folder/job/my-job/1/',
      testsUrl: 'http://localhost:8080/job/folder/job/my-job/1/testReport',
    },
    {
      _class:
        'org.jenkinsci.plugins.pipeline.modeldefinition.actions.RestartDeclarativePipelineAction',
      restartEnabled: false,
      restartableStages: [],
    },
    {},
    {
      _class: 'org.jenkinsci.plugins.workflow.job.views.FlowGraphAction',
      nodes: [
        {
          _class: 'org.jenkinsci.plugins.workflow.graph.FlowStartNode',
        },
        {
          _class: 'org.jenkinsci.plugins.workflow.cps.nodes.StepAtomNode',
        },
        {
          _class: 'org.jenkinsci.plugins.workflow.graph.FlowEndNode',
        },
      ],
    }
  ],
  artifacts: [],
  building: false,
  description: null,
  displayName: '#1',
  duration: 142,
  estimatedDuration: 142,
  executor: null,
  fingerprint: [],
  fullDisplayName: 'folder » my-job #1',
  id: '1',
  keepLog: false,
  number: 1,
  queueId: 1819,
  result: 'SUCCESS',
  timestamp: 1650054944928,
  url: 'http://localhost:8080/job/folder/job/my-job/1/',
  changeSets: [],
  culprits: [],
  nextBuild: null,
  previousBuild: null,
}
```
</details>

##### Code reference

[src/builds/builds.wait.ts:108-118](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.wait.ts#L108-L118 "Source code on GitHub")

</details>


#### `jenkins.builds.waitForStart`

<details><summary>Wait for build to start and return build information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** job build number
*   `options` **[JenkinsBuildWaitOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L307-L310 "Source code on GitHub")** build wait options

    *   `interval` - how often to check job build status. Default `1000` milliseconds.
    *   `timeout` - timeout in milliseconds for job build to start building, will throw `Timeout 408` error if not completed in time. By default waits forever.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsBuild](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L207-L226 "Source code on GitHub")>**

##### Examples

```javascript
const build = await jenkins.builds.waitForStart('/job/folder/job/my-job', 1);
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun',
  actions: [
    {
      _class: 'hudson.model.CauseAction',
      causes: [
        {
          _class: 'hudson.model.Cause$UserIdCause',
        },
      ],
    },
    {
      _class: 'org.jenkinsci.plugins.workflow.libs.LibrariesAction',
      libraries: [],
    },
    {
      _class: 'org.jenkinsci.plugins.displayurlapi.actions.RunDisplayAction',
      artifactsUrl: 'http://localhost:8080/job/folder/job/my-job/1/artifact',
      changesUrl: 'http://localhost:8080/job/folder/job/my-job/changes',
      displayUrl: 'http://localhost:8080/job/folder/job/my-job/1/',
      testsUrl: 'http://localhost:8080/job/folder/job/my-job/1/testReport',
    },
    {
      _class:
        'org.jenkinsci.plugins.pipeline.modeldefinition.actions.RestartDeclarativePipelineAction',
      restartEnabled: false,
      restartableStages: [],
    },
    {},
    {
      _class: 'org.jenkinsci.plugins.workflow.job.views.FlowGraphAction',
      nodes: [
        {
          _class: 'org.jenkinsci.plugins.workflow.graph.FlowStartNode',
        },
        {
          _class: 'org.jenkinsci.plugins.workflow.cps.nodes.StepAtomNode',
        },
        {
          _class: 'org.jenkinsci.plugins.workflow.graph.FlowEndNode',
        },
      ],
    }
  ],
  artifacts: [],
  building: true,
  description: null,
  displayName: '#1',
  duration: 0,
  estimatedDuration: -1,
  executor: {
    _class: 'hudson.model.OneOffExecutor',
    currentExecutable: { _class: 'org.jenkinsci.plugins.workflow.job.WorkflowRun' },
    idle: false,
    likelyStuck: false,
    number: -1,
    progress: -1
  },
  fingerprint: [],
  fullDisplayName: 'folder » my-job #1',
  id: '1',
  keepLog: false,
  number: 1,
  queueId: 1821,
  result: null,
  timestamp: 1650054944928,
  url: 'http://localhost:8080/job/folder/job/my-job/1/',
  changeSets: [],
  culprits: [],
  nextBuild: null,
  previousBuild: null,
}
```
</details>

##### Code reference

[src/builds/builds.waitForStart.ts:115-127](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.waitForStart.ts#L115-L127 "Source code on GitHub")

</details>


#### `jenkins.builds.abort`

<details><summary>Abort the build</summary>

##### Notes

<https://www.jenkins.io/doc/book/using/aborting-a-build/>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** build number
*   `type` **[JenkinsBuildAbortType](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L199-L203 "Source code on GitHub")?** the abort action - `stop`, `term` or `kill`. Default `stop`.

    *   `stop` - aborts a pipeline
    *   `term` - forcibly terminates a build (should only be used if stop does not work)
    *   `kill` - hard kill a pipeline. This is the most destructive way to stop a pipeline and should only be used as a last resort.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.jobs.abort('/job/my-job', 5);
```

##### Code reference

[src/builds/builds.abort.ts:39-46](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.abort.ts#L39-L46 "Source code on GitHub")

</details>


#### `jenkins.builds.log`

<details><summary>Return build log</summary>

##### Notes

Returns:

*   `text` - log text or html (see options parameter)
*   `more` - whether the log has more data to return (for example, if build is still running)
*   `size` - content size. Can be used as `start` position for the next log request.

To return log as a stream while build is still running, use [`jenkins.builds.logStream`](#jenkinsbuildslogstream)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** job build number
*   `options` **[LogOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L285-L288 "Source code on GitHub")** log options

    *   `html` - whether to return log as html or plain text. Default `false`.
    *   `start` - return log starting from this position.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsLog](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L292-L296 "Source code on GitHub")>**

##### Examples

```javascript
const log = await jenkins.builds.log('my-job', 1);
```

<details><summary>Example result</summary>

```javascript
{
  text:
    'Started by user admin\r\n' +
    '[Pipeline] Start of Pipeline\r\n' +
    '[Pipeline] echo\r\n' +
    'Hi\r\n' +
    '[Pipeline] echo\r\n' +
    'Bye!\r\n' +
    '[Pipeline] End of Pipeline\r\n' +
    'Finished: SUCCESS\r\n',
  more: false,
  size: 1535,
}
```
</details>

##### Code reference

[src/builds/builds.log.ts:60-74](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.log.ts#L60-L74 "Source code on GitHub")

</details>


#### `jenkins.builds.logStream`

<details><summary>Return build log stream</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the job
*   `buildNumber` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** job build number
*   `options` **[LogStreamOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L300-L303 "Source code on GitHub")** options

    *   `interval` - how frequently return log chunks. Default every `1000` milliseconds.
    *   `start` - return log starting from this position. Default `0`.

##### Returns

 **LogReadableStream**

##### Examples

```javascript
const logStream = await jenkins.builds.logStream('my-job', 1);

logStream.pipe(process.stdout)
```

```javascript
const logStream = await jenkins.builds.logStream('my-job', 1, { interval: 500 });

logStream.on('data', (text) => {
  console.log(text);
});

logStream.on('end', () => {
  console.log('Log transfer completed');
});

logStream.on('error', (error) => {
  console.log(`There was an error ${error}`);
});
```

##### Code reference

[src/builds/builds.logStream.ts:109-114](https://github.com/parsable/jenkins-client-ts/blob/main/src/builds/builds.logStream.ts#L109-L114 "Source code on GitHub")

</details>

## Queue

#### `jenkins.queue.get`

<details><summary>Get queue item by id</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `id` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** queue id

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsQueueItem](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L255-L268 "Source code on GitHub")>**

##### Examples

```javascript
const queueItem = await jenkins.queue.get(1790);
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.model.Queue$WaitingItem',
  actions: [
    {
      _class: 'hudson.model.CauseAction',
      causes: [
        {
          _class: 'hudson.model.Cause$UserIdCause',
          shortDescription: 'Started by user admin',
          userId: 'admin',
          userName: 'admin',
        },
      ],
    },
  ],
  blocked: false,
  buildable: false,
  id: 1790,
  inQueueSince: 1650047426432,
  params: '',
  stuck: false,
  task: {
    _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
    name: 'job1',
    url: 'http://localhost:8080/job/e010173e-ce32-441f-a9a7-e1d2ecd4fbc2/job/job1/',
    color: 'notbuilt',
  },
  url: 'queue/item/1790/',
  why: 'In the quiet period. Expires in 4.6 sec',
  timestamp: 1650047431432,
}
```
</details>

##### Code reference

[src/queue/queue.get.ts:65-66](https://github.com/parsable/jenkins-client-ts/blob/main/src/queue/queue.get.ts#L65-L66 "Source code on GitHub")

</details>


#### `jenkins.queue.list`

<details><summary>List queue</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** optionally specify job path to filter queue items by job

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsQueue](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L272-L275 "Source code on GitHub")>**

##### Examples

```javascript
const queue = await jenkins.queue.list();
```

```javascript
const queue = await jenkins.queue.list('/folder/my-job');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.model.Queue',
  discoverableItems: [],
  items: [
    {
      _class: 'hudson.model.Queue$WaitingItem',
      actions: [
        {
          _class: 'hudson.model.CauseAction',
          causes: [
            {
              _class: 'hudson.model.Cause$UserIdCause',
              shortDescription: 'Started by user admin',
              userId: 'admin',
              userName: 'admin',
            },
          ],
        },
      ],
      blocked: false,
      buildable: false,
      id: 1798,
      inQueueSince: 1650047730909,
      params: '',
      stuck: false,
      task: {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        name: 'job1',
        url: 'http://localhost:8080/job/e0c9a9bd-5577-4670-bc6f-ee40abcd2adc/job/job1/',
        color: 'notbuilt',
      },
      url: 'queue/item/1798/',
      why: 'In the quiet period. Expires in 4.8 sec',
      timestamp: 1650047735909,
    },
    {
      _class: 'hudson.model.Queue$WaitingItem',
      actions: [
        {
          _class: 'hudson.model.CauseAction',
          causes: [
            {
              _class: 'hudson.model.Cause$UserIdCause',
              shortDescription: 'Started by user admin',
              userId: 'admin',
              userName: 'admin',
            },
          ],
        },
      ],
      blocked: false,
      buildable: false,
      id: 1799,
      inQueueSince: 1650047730984,
      params: '',
      stuck: false,
      task: {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        name: 'job2',
        url: 'http://localhost:8080/job/e0c9a9bd-5577-4670-bc6f-ee40abcd2adc/job/job2/',
        color: 'notbuilt',
      },
      url: 'queue/item/1799/',
      why: 'In the quiet period. Expires in 4.9 sec',
      timestamp: 1650047735984,
    },
  ],
}
```
</details>

##### Code reference

[src/queue/queue.list.ts:107-114](https://github.com/parsable/jenkins-client-ts/blob/main/src/queue/queue.list.ts#L107-L114 "Source code on GitHub")

</details>


#### `jenkins.queue.cancel`

<details><summary>Cancel queue item by id</summary>

##### Parameters

*   `id` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** queue item id

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.queue.cancel(1701);
```

##### Code reference

[src/queue/queue.cancel.ts:28-30](https://github.com/parsable/jenkins-client-ts/blob/main/src/queue/queue.cancel.ts#L28-L30 "Source code on GitHub")

</details>

## Views

#### `jenkins.views.get`

<details><summary>Get view info</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsView](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L245-L251 "Source code on GitHub")>**

##### Examples

```javascript
const rootView  = await jenkins.views.get('/', 'All');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.model.AllView',
  description: null,
  jobs: [
    {
      _class: 'com.cloudbees.hudson.plugins.folder.Folder',
      name: 'my-folder',
      url: 'http://localhost:8080/job/my-folder/',
    },
  ],
  name: 'all',
  property: [],
  url: 'http://localhost:8080/',
}
```
</details>

##### Code reference

[src/views/views.get.ts:51-55](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.get.ts#L51-L55 "Source code on GitHub")

</details>


#### `jenkins.views.exists`

<details><summary>Check whether view exists</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name to check

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>**

##### Examples

```javascript
const viewExists = await jenkins.views.exists('/', 'All')
```

##### Code reference

[src/views/views.exists.ts:30-34](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.exists.ts#L30-L34 "Source code on GitHub")

</details>


#### `jenkins.views.list`

<details><summary>List views</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsView](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L245-L251 "Source code on GitHub")>>**

##### Examples

```javascript
const views = await jenkins.views.list('/');
```

<details><summary>Example result</summary>

```javascript
[
  {
    _class: 'hudson.model.AllView',
    name: 'all',
    url: 'http://localhost:8080/',
  }
]
```
</details>

##### Code reference

[src/views/views.list.ts:43-50](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.list.ts#L43-L50 "Source code on GitHub")

</details>


#### `jenkins.views.create`

<details><summary>Create view</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** new view name
*   `mode` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view mode - `ListView` or `MyView`

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.views.create('/', 'ViewName', 'ListView');
```

##### Code reference

[src/views/views.create.ts:31-42](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.create.ts#L31-L42 "Source code on GitHub")

</details>


#### `jenkins.views.setConfig`

<details><summary>Update view configuration with xml config</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name
*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** xml configuration for the view

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.views.setConfig(
  '/',
  'MyView',
  `
   <hudson.model.ListView>
      <name>MyView</name>
      <filterExecutors>false</filterExecutors>
      <filterQueue>false</filterQueue>
      <properties class="hudson.model.View$PropertyList"/>
      <jobNames>
          <comparator class="hudson.util.CaseInsensitiveComparator"/>
      </jobNames>
      <jobFilters/>
      <columns>
          <hudson.views.StatusColumn/>
          <hudson.views.WeatherColumn/>
          <hudson.views.JobColumn/>
          <hudson.views.LastSuccessColumn/>
          <hudson.views.LastFailureColumn/>
          <hudson.views.LastDurationColumn/>
          <hudson.views.BuildButtonColumn/>
      </columns>
      <recurse>false</recurse>
  </hudson.model.ListView>`,
);
```

##### Code reference

[src/views/views.setConfig.ts:55-62](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.setConfig.ts#L55-L62 "Source code on GitHub")

</details>


#### `jenkins.views.configJson`

<details><summary>Get view configuration as json object</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<any>**

##### Examples

```javascript
const config = await jenkins.views.configJson('/', 'MyView');
```

<details><summary>Example result</summary>

```javascript
{
  'hudson.model.ListView': {
    name: 'MyView',
    filterExecutors: false,
    filterQueue: false,
    properties: '',
    jobNames: { comparator: '' },
    jobFilters: '',
    columns: {
      'hudson.views.StatusColumn': '',
      'hudson.views.WeatherColumn': '',
      'hudson.views.JobColumn': '',
      'hudson.views.LastSuccessColumn': '',
      'hudson.views.LastFailureColumn': '',
      'hudson.views.LastDurationColumn': '',
      'hudson.views.BuildButtonColumn': '',
    },
    recurse: false,
  }
}
```
</details>

##### Code reference

[src/views/views.configJson.ts:53-61](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.configJson.ts#L53-L61 "Source code on GitHub")

</details>


#### `jenkins.views.configXml`

<details><summary>Get view configuration as xml string</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<any>**

##### Examples

```javascript
const configXml = await jenkins.views.configXml('/', 'MyView');
```

<details><summary>Example result</summary>

```javascript
<?xml version="1.1" encoding="UTF-8"?>
<hudson.model.ListView>
    <name>MyView</name>
    <filterExecutors>false</filterExecutors>
    <filterQueue>false</filterQueue>
    <properties class="hudson.model.View$PropertyList"/>
    <jobNames>
        <comparator class="hudson.util.CaseInsensitiveComparator"/>
    </jobNames>
    <jobFilters/>
    <columns>
        <hudson.views.StatusColumn/>
        <hudson.views.WeatherColumn/>
        <hudson.views.JobColumn/>
        <hudson.views.LastSuccessColumn/>
        <hudson.views.LastFailureColumn/>
        <hudson.views.LastDurationColumn/>
        <hudson.views.BuildButtonColumn/>
    </columns>
    <recurse>true</recurse>
</hudson.model.ListView>
```
</details>

##### Code reference

[src/views/views.configXml.ts:54-58](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.configXml.ts#L54-L58 "Source code on GitHub")

</details>


#### `jenkins.views.addJob`

<details><summary>Add job to the view</summary>

##### Notes

If view configuration has enabled Job Filter "Recurse in subfolders" then you can add any job located
in the subfolders but if this filter is disabled, you can only add jobs located directly in the current folder.

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name
*   `jobPath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path for the job to add. Path can be relative to the folder or absolute. If job is not located in the folder it won't be added.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.views.addJob('/my-folder', 'MyView', '/my-folder/my-job');
```

```javascript
await jenkins.views.addJob('/my-folder', 'MyView', 'my-job');
```

##### Code reference

[src/views/views.addJob.ts:40-49](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.addJob.ts#L40-L49 "Source code on GitHub")

</details>


#### `jenkins.views.removeJob`

<details><summary>Remove job from view</summary>

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name to delete
*   `jobPath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path for the job to remove. Path can be relative to the folder or absolute.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.views.removeJob('/my-folder', 'MyView', 'my-job');
```

```javascript
await jenkins.views.removeJob('/my-folder', 'MyView', '/my-folder/my-job');
```

##### Code reference

[src/views/views.removeJob.ts:37-46](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.removeJob.ts#L37-L46 "Source code on GitHub")

</details>


#### `jenkins.views.getRelativePath`

<details><summary>This helper function only applies to the addJob and removeJob for views.</summary>

##### Notes

Since views can be nested within folders and user may provide the full path to the job
we need to transform the provided path to the path relative to the folder where the view is created.

##### Parameters

*   [`path`](#path-parameter) **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
*   `jobPath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## deleteView

[src/views/views.delete.ts:30-36](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.delete.ts#L30-L36 "Source code on GitHub")

Delete view

### Parameters

 
*   `path` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the folder with view
*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** view name to delete

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.views.delete('/', 'MyView');
```

##### Code reference

[src/views/views.getRelativePath.ts:23-30](https://github.com/parsable/jenkins-client-ts/blob/main/src/views/views.getRelativePath.ts#L23-L30 "Source code on GitHub")

</details>

## Users

#### `jenkins.users.get`

<details><summary>Get information about user</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** user name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsUser](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L34-L40 "Source code on GitHub")>**

##### Examples

```javascript
const user = await jenkins.users.get('john');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.model.User',
  absoluteUrl: 'http://localhost:8080/user/john',
  description: null,
  fullName: 'john.doe',
  id: 'john',
  property: [
    { _class: 'jenkins.security.ApiTokenProperty' },
    {
      _class: 'com.cloudbees.plugins.credentials.UserCredentialsProvider$UserCredentialsProperty',
    },
    {
      _class: 'hudson.plugins.emailext.watching.EmailExtWatchAction$UserProperty',
      triggers: [],
    },
    { _class: 'hudson.model.MyViewsProperty' },
    {
      _class: 'org.jenkinsci.plugins.displayurlapi.user.PreferredProviderUserProperty',
    },
    { _class: 'hudson.model.PaneStatusProperties' },
    { _class: 'jenkins.security.seed.UserSeedProperty' },
    {
      _class: 'hudson.search.UserSearchProperty',
      insensitiveSearch: true,
    },
    { _class: 'hudson.model.TimeZoneProperty' },
    { _class: 'hudson.security.HudsonPrivateSecurityRealm$Details' },
    {
      _class: 'hudson.tasks.Mailer$UserProperty',
      address: 'john@doe.com',
    }
  ]
}
```
</details>

##### Code reference

[src/users/users.get.ts:68-69](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.get.ts#L68-L69 "Source code on GitHub")

</details>


#### `jenkins.users.exists`

<details><summary>Check whether user exists</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** user name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>**

##### Examples

```javascript
const userExists = await jenkins.users.exists('john')
```

##### Code reference

[src/users/users.exists.ts:28-29](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.exists.ts#L28-L29 "Source code on GitHub")

</details>


#### `jenkins.users.list`

<details><summary>List users</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsUser](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L34-L40 "Source code on GitHub")>>**

##### Examples

```javascript
const users = await jenkins.users.list()
```

<details><summary>Example result</summary>

```javascript
[
  {
    absoluteUrl: 'http://localhost:8080/user/admin',
    description: null,
    fullName: 'admin',
    id: 'admin',
    property: [
      {
        _class: 'com.cloudbees.plugins.credentials.UserCredentialsProvider$UserCredentialsProperty',
      },
      {
        _class: 'hudson.plugins.emailext.watching.EmailExtWatchAction$UserProperty',
        triggers: [],
      },
      {
        _class: 'hudson.model.MyViewsProperty',
      },
      {
        _class: 'org.jenkinsci.plugins.displayurlapi.user.PreferredProviderUserProperty',
      },
      {
        _class: 'hudson.model.PaneStatusProperties',
      },
      {
        _class: 'jenkins.security.seed.UserSeedProperty',
      },
      {
        _class: 'hudson.search.UserSearchProperty',
        insensitiveSearch: true,
      },
      {
        _class: 'hudson.model.TimeZoneProperty',
      },
      {
        _class: 'hudson.security.HudsonPrivateSecurityRealm$Details',
      },
      {
        _class: 'hudson.tasks.Mailer$UserProperty',
        address: 'admin@user.dev',
      },
      {
        _class: 'jenkins.security.ApiTokenProperty',
      },
      {
        _class: 'jenkins.security.LastGrantedAuthoritiesProperty',
      },
    ],
  },
  {
    absoluteUrl: 'http://localhost:8080/user/system',
    description: null,
    fullName: 'SYSTEM',
    id: 'SYSTEM',
    property: [
      {
        _class: 'jenkins.security.ApiTokenProperty',
      },
      {
        _class: 'com.cloudbees.plugins.credentials.UserCredentialsProvider$UserCredentialsProperty',
      },
      {
        _class: 'hudson.tasks.Mailer$UserProperty',
        address: null,
      },
      {
        _class: 'hudson.plugins.emailext.watching.EmailExtWatchAction$UserProperty',
        triggers: [],
      },
      {
        _class: 'hudson.model.MyViewsProperty',
      },
      {
        _class: 'org.jenkinsci.plugins.displayurlapi.user.PreferredProviderUserProperty',
      },
      {
        _class: 'hudson.model.PaneStatusProperties',
      },
      {
        _class: 'jenkins.security.seed.UserSeedProperty',
      },
      {
        _class: 'hudson.search.UserSearchProperty',
        insensitiveSearch: true,
      },
      {
        _class: 'hudson.model.TimeZoneProperty',
      },
    ],
  },
];
```
</details>

##### Code reference

[src/users/users.list.ts:122-123](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.list.ts#L122-L123 "Source code on GitHub")

</details>


#### `jenkins.users.create`

<details><summary>Create user</summary>

##### Parameters

*   `options` **[JenkinsCreateUserOptions](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L420-L425 "Source code on GitHub")** user information - `username`, `password`, `email`, `fullname`

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.users.create({
   username: 'john',
   fullname: 'john.doe',
   password: 'pass#1234',
   email: 'john.doe@company.com',
});
```

##### Code reference

[src/users/users.create.ts:34-49](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.create.ts#L34-L49 "Source code on GitHub")

</details>


#### `jenkins.users.delete`

<details><summary>Delete user</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** user name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.users.delete('john');
```

##### Code reference

[src/users/users.delete.ts:28-30](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.delete.ts#L28-L30 "Source code on GitHub")

</details>


#### `jenkins.users.whoAmI`

<details><summary>Return information about currently authenticated user</summary>

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsWhoAmI](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L403-L408 "Source code on GitHub")>**

##### Examples

```javascript
const user = await jenkins.users.whoAmI();
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.security.WhoAmI',
  anonymous: false,
  authenticated: true,
  authorities: [ 'authenticated' ],
  name: 'admin'
 }
```
</details>

##### Code reference

[src/users/users.whoAmI.ts:37-38](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.whoAmI.ts#L37-L38 "Source code on GitHub")

</details>


#### `jenkins.users.generateToken`

<details><summary>Generate API token for currently authenticated user</summary>

##### Parameters

*   `tokenName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** new token name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsUserToken](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L412-L416 "Source code on GitHub")>**

##### Examples

```javascript
const tokenInfo = await jenkins.users.generateToken('ApiToken');
```

<details><summary>Example result</summary>

```javascript
{
  tokenName: 'ApiToken',
  tokenUuid: 'ded6d423-7feb-4411-86c1-97bf82548074',
  tokenValue: '11c6e56d420f63c3ada149de4d52ba8dfe'
}
```
</details>

##### Code reference

[src/users/users.generateToken.ts:38-51](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.generateToken.ts#L38-L51 "Source code on GitHub")

</details>


#### `jenkins.users.revokeToken`

<details><summary>Revoke API token for currently authenticated user</summary>

##### Parameters

*   `tokenUuid` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** token uuid

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.users.revokeToken('ded6d423-7feb-4411-86c1-97bf82548074');
```

##### Code reference

[src/users/users.revokeToken.ts:29-37](https://github.com/parsable/jenkins-client-ts/blob/main/src/users/users.revokeToken.ts#L29-L37 "Source code on GitHub")

</details>

## Nodes

#### `jenkins.nodes.get`

<details><summary>Get node information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name. For the built-in node use parentheses: `(built-in)`

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsNode](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L54-L74 "Source code on GitHub")>**

##### Examples

```javascript
const node = await jenkins.nodes.get('(built-in)');
```

<details><summary>Example result</summary>

```javascript
{
 _class: 'hudson.model.Hudson$MasterComputer',
 actions: [],
 assignedLabels: [ { name: 'another' }, { name: 'built-in' } ],
 description: 'the Jenkins controller's built-in node',
 displayName: 'Built-In Node',
 executors: [ {}, {} ],
 icon: 'computer.png',
 iconClassName: 'icon-computer',
 idle: true,
 jnlpAgent: false,
 launchSupported: true,
 loadStatistics: { _class: 'hudson.model.Label$1' },
 manualLaunchAllowed: true,
 monitorData: {
  'hudson.node_monitors.SwapSpaceMonitor': {
   _class: 'hudson.node_monitors.SwapSpaceMonitor$MemoryUsage2',
   availablePhysicalMemory: 5502185472,
   availableSwapSpace: 2147479552,
   totalPhysicalMemory: 8345554944,
   totalSwapSpace: 2147479552
  },
  'hudson.node_monitors.TemporarySpaceMonitor': {
   _class: 'hudson.node_monitors.DiskSpaceMonitorDescriptor$DiskSpace',
   timestamp: 1649971520244,
   path: '/tmp',
   size: 5669916672
  },
  'hudson.node_monitors.DiskSpaceMonitor': {
   _class: 'hudson.node_monitors.DiskSpaceMonitorDescriptor$DiskSpace',
   timestamp: 1649971520244,
   path: '/var/jenkins_home',
   size: 179432824832
  },
  'hudson.node_monitors.ArchitectureMonitor': 'Linux (amd64)',
  'hudson.node_monitors.ResponseTimeMonitor': {
   _class: 'hudson.node_monitors.ResponseTimeMonitor$Data',
   timestamp: 1649971520244,
   average: 0
  },
  'hudson.node_monitors.ClockMonitor': { _class: 'hudson.util.ClockDifference', diff: 0 }
 },
 numExecutors: 2,
 offline: false,
 offlineCause: null,
 offlineCauseReason: '',
 oneOffExecutors: [],
 temporarilyOffline: false
}
```
</details>


```javascript
const node = await jenkins.nodes.get('MyNode');
```

<details><summary>Example result</summary>

```javascript
{
 _class: 'hudson.slaves.SlaveComputer',
 actions: [],
 assignedLabels: [ { name: 'MyNode' } ],
 description: null,
 displayName: 'MyNode',
 executors: [ {} ],
 icon: 'computer-x.png',
 iconClassName: 'icon-computer-x',
 idle: true,
 jnlpAgent: true,
 launchSupported: false,
 loadStatistics: { _class: 'hudson.model.Label$1' },
 manualLaunchAllowed: true,
 monitorData: {
  'hudson.node_monitors.SwapSpaceMonitor': null,
  'hudson.node_monitors.TemporarySpaceMonitor': null,
  'hudson.node_monitors.DiskSpaceMonitor': null,
  'hudson.node_monitors.ArchitectureMonitor': null,
  'hudson.node_monitors.ResponseTimeMonitor': null,
  'hudson.node_monitors.ClockMonitor': null
 },
 numExecutors: 1,
 offline: true,
 offlineCause: null,
 offlineCauseReason: '',
 oneOffExecutors: [],
 temporarilyOffline: false,
 absoluteRemotePath: null
}
```
</details>

##### Code reference

[src/nodes/nodes.get.ts:120-121](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.get.ts#L120-L121 "Source code on GitHub")

</details>


#### `jenkins.nodes.exists`

<details><summary>Check whether node exists</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name. For the built-in node use parentheses: `(built-in)`

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>**

##### Examples

```javascript
const builtInNodeExists = await jenkins.nodes.exists('(built-in)');

const myNodeExists = await jenkins.nodes.exists('MyNode');
```

##### Code reference

[src/nodes/nodes.exists.ts:30-31](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.exists.ts#L30-L31 "Source code on GitHub")

</details>


#### `jenkins.nodes.list`

<details><summary>List nodes</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsNode](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L54-L74 "Source code on GitHub")>>**

##### Examples

```javascript
const nodes = await jenkins.nodes.list();
```

<details><summary>Example result</summary>

```javascript
[
  {
    _class: 'hudson.model.Hudson$MasterComputer',
    actions: [],
    assignedLabels: [
      {
        name: 'another',
      },
      {
        name: 'built-in',
      },
    ],
    description: 'the Jenkins controller's built-in node',
    displayName: 'Built-In Node',
    executors: [{}, {}],
    icon: 'computer.png',
    iconClassName: 'icon-computer',
    idle: true,
    jnlpAgent: false,
    launchSupported: true,
    loadStatistics: {
      _class: 'hudson.model.Label$1',
    },
    manualLaunchAllowed: true,
    monitorData: {
      'hudson.node_monitors.SwapSpaceMonitor': {
        _class: 'hudson.node_monitors.SwapSpaceMonitor$MemoryUsage2',
        availablePhysicalMemory: 5482885120,
        availableSwapSpace: 2147479552,
        totalPhysicalMemory: 8345554944,
        totalSwapSpace: 2147479552,
      },
      'hudson.node_monitors.TemporarySpaceMonitor': {
        _class: 'hudson.node_monitors.DiskSpaceMonitorDescriptor$DiskSpace',
        timestamp: 1649971986539,
        path: '/tmp',
        size: 5669896192,
      },
      'hudson.node_monitors.DiskSpaceMonitor': {
        _class: 'hudson.node_monitors.DiskSpaceMonitorDescriptor$DiskSpace',
        timestamp: 1649971986538,
        path: '/var/jenkins_home',
        size: 179406462976,
      },
      'hudson.node_monitors.ArchitectureMonitor': 'Linux (amd64)',
      'hudson.node_monitors.ResponseTimeMonitor': {
        _class: 'hudson.node_monitors.ResponseTimeMonitor$Data',
        timestamp: 1649971986539,
        average: 0,
      },
      'hudson.node_monitors.ClockMonitor': {
        _class: 'hudson.util.ClockDifference',
        diff: 0,
      },
    },
    numExecutors: 2,
    offline: false,
    offlineCause: null,
    offlineCauseReason: '',
    oneOffExecutors: [],
    temporarilyOffline: false,
  },
  {
    _class: 'hudson.slaves.SlaveComputer',
    actions: [],
    assignedLabels: [
      {
        name: 'testing',
      },
    ],
    description: '',
    displayName: 'testing',
    executors: [{}],
    icon: 'computer-x.png',
    iconClassName: 'icon-computer-x',
    idle: true,
    jnlpAgent: true,
    launchSupported: false,
    loadStatistics: {
      _class: 'hudson.model.Label$1',
    },
    manualLaunchAllowed: true,
    monitorData: {
      'hudson.node_monitors.SwapSpaceMonitor': null,
      'hudson.node_monitors.TemporarySpaceMonitor': null,
      'hudson.node_monitors.DiskSpaceMonitor': null,
      'hudson.node_monitors.ArchitectureMonitor': null,
      'hudson.node_monitors.ResponseTimeMonitor': null,
      'hudson.node_monitors.ClockMonitor': null,
    },
    numExecutors: 1,
    offline: true,
    offlineCause: null,
    offlineCauseReason: '',
    oneOffExecutors: [],
    temporarilyOffline: false,
    absoluteRemotePath: null,
  },
]
```
</details>

##### Code reference

[src/nodes/nodes.list.ts:131-132](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.list.ts#L131-L132 "Source code on GitHub")

</details>


#### `jenkins.nodes.create`

<details><summary>Create node</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** new node name
*   `options` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)?** options for node creation. See [Creating node with the REST API](https://support.cloudbees.com/hc/en-us/articles/115003896171-Creating-node-with-the-REST-API)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.create('default-node');
```

```javascript
await jenkins.nodes.create('my-node', {
  launcher: {
    '': '2',
    $class: 'hudson.plugins.sshslaves.SSHLauncher',
    credentialsId: 'd436fff1-af1c-45df-8cb6-3907d119b8fa',
    host: 'host',
    javaPath: '',
    jvmOptions: '',
    launchTimeoutSeconds: '',
    maxNumRetries: '',
    port: '22',
    prefixStartSlaveCmd: '',
    suffixStartSlaveCmd: '',
    retryWaitTime: '',
    sshHostKeyVerificationStrategy: {
      $class: 'hudson.plugins.sshslaves.verifiers.ManuallyTrustedKeyVerificationStrategy',
      requireInitialManualTrust: true,
      'stapler-class': 'hudson.plugins.sshslaves.verifiers.ManuallyTrustedKeyVerificationStrategy',
    },
    'stapler-class': 'hudson.plugins.sshslaves.SSHLauncher',
  },
  retentionStrategy: {
    $class: 'hudson.slaves.RetentionStrategy$Always',
    'stapler-class': 'hudson.slaves.RetentionStrategy$Always',
  },
  type: 'hudson.slaves.DumbSlave',
  mode: 'NORMAL',
  numExecutors: '1',
  remoteFS: '/home/jenkins',
  nodeDescription: 'Agent node description',
  labelString: 'agent-node-label',
  nodeProperties: {
    'stapler-class-bag': 'true',
  },
});
```

##### Code reference

[src/nodes/nodes.create.ts:70-80](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.create.ts#L70-L80 "Source code on GitHub")

</details>


#### `jenkins.nodes.copy`

<details><summary>Copy node - create new node from existing one</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name to copy from
*   `newName` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** new node name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.copy('my-existing-node', 'my-new-node');
```

##### Code reference

[src/nodes/nodes.copy.ts:29-39](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.copy.ts#L29-L39 "Source code on GitHub")

</details>


#### `jenkins.nodes.delete`

<details><summary>Delete node</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.delete('my-node');
```

##### Code reference

[src/nodes/nodes.delete.ts:28-30](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.delete.ts#L28-L30 "Source code on GitHub")

</details>


#### `jenkins.nodes.update`

<details><summary>Update node configuration</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name to update
*   `options` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** configuration for node. See [Creating node with the REST API](https://support.cloudbees.com/hc/en-us/articles/115003896171-Creating-node-with-the-REST-API)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.update('my-node', {
  numExecutors: '3',
  remoteFS: '/home/jenkins',
  nodeDescription: 'Agent node description',
});
```

##### Code reference

[src/nodes/nodes.update.ts:35-45](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.update.ts#L35-L45 "Source code on GitHub")

</details>


#### `jenkins.nodes.setConfig`

<details><summary>Update node configuration with xml config</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name
*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** xml configuration

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.setConfig(
  'my-node',
  `
<slave>
  <name>my-node</name>
  <numExecutors>1</numExecutors>
  <mode>NORMAL</mode>
  <retentionStrategy class="hudson.slaves.RetentionStrategy$Always"/>
  <launcher class="hudson.slaves.JNLPLauncher">
    <workDirSettings>
      <disabled>false</disabled>
      <internalDir>remoting</internalDir>
      <failIfWorkDirIsMissing>false</failIfWorkDirIsMissing>
    </workDirSettings>
    <webSocket>false</webSocket>
  </launcher>
  <label/>
  <nodeProperties/>
</slave>`,
);
```

##### Code reference

[src/nodes/nodes.setConfig.ts:48-54](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.setConfig.ts#L48-L54 "Source code on GitHub")

</details>


#### `jenkins.nodes.configJson`

<details><summary>Get node configuration as json object</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<any>**

##### Examples

```javascript
const config = await jenkins.nodes.configJson('my-node');
```

<details><summary>Example result</summary>

```javascript
{
  slave: {
    name: 'my-node',
    numExecutors: 1,
    mode: 'NORMAL',
    retentionStrategy: '',
    launcher: {
      workDirSettings: {
        disabled: false,
        internalDir: 'remoting',
        failIfWorkDirIsMissing: false,
      },
      webSocket: false,
    },
    label: '',
    nodeProperties: '',
  },
}
```
</details>

##### Code reference

[src/nodes/nodes.configJson.ts:49-53](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.configJson.ts#L49-L53 "Source code on GitHub")

</details>


#### `jenkins.nodes.configXml`

<details><summary>Get node configuration as xml string</summary>

##### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

##### Examples

```javascript
const configXml = await jenkins.nodes.configXml('my-node');
```

<details><summary>Example result</summary>

```javascript
<?xml version="1.1" encoding="UTF-8"?>
<slave>
    <name>NodeConfig</name>
    <numExecutors>1</numExecutors>
    <mode>NORMAL</mode>
    <retentionStrategy class="hudson.slaves.RetentionStrategy$Always"/>
    <launcher class="hudson.slaves.JNLPLauncher">
        <workDirSettings>
            <disabled>false</disabled>
            <internalDir>remoting</internalDir>
            <failIfWorkDirIsMissing>false</failIfWorkDirIsMissing>
        </workDirSettings>
        <webSocket>false</webSocket>
    </launcher>
    <label></label>
    <nodeProperties/>
</slave>
```
</details>

##### Code reference

[src/nodes/nodes.configXml.ts:47-48](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.configXml.ts#L47-L48 "Source code on GitHub")

</details>


#### `jenkins.nodes.markOffline`

<details><summary>Disable node - mark node as offline. Use this method to update offline reason as well.</summary>

##### Parameters

*   `node` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name
*   `reason` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** reason for disabling this node (optional, default `''`)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.markOffline('my-node', 'Disconnected because of network errors');
```

##### Code reference

[src/nodes/nodes.markOffline.ts:30-44](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.markOffline.ts#L30-L44 "Source code on GitHub")

</details>


#### `jenkins.nodes.bringOnline`

<details><summary>Enable node - bring node back to online state</summary>

##### Parameters

*   `node` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** node name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.nodes.bringOnline('my-node');
```

##### Code reference

[src/nodes/nodes.bringOnline.ts:29-38](https://github.com/parsable/jenkins-client-ts/blob/main/src/nodes/nodes.bringOnline.ts#L29-L38 "Source code on GitHub")

</details>

## Labels

#### `jenkins.labels.get`

<details><summary>Get node label information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `label` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** label name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsLabel](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L342-L355 "Source code on GitHub")>**

##### Examples

```javascript
const label = await jenkins.labels.get('my-label');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'hudson.model.labels.LabelAtom',
  actions: [{}],
  busyExecutors: 1,
  clouds: [
    {
      _class: 'org.csanchez.jenkins.plugins.kubernetes.NonConfigurableKubernetesCloud',
      actions: [{}],
    },
  ],
  description: null,
  idleExecutors: 0,
  loadStatistics: {
    _class: 'hudson.model.Label$1',
    availableExecutors: {},
    busyExecutors: {},
    connectingExecutors: {},
    definedExecutors: {},
    idleExecutors: {},
    onlineExecutors: {},
    queueLength: {},
    totalExecutors: {},
  },
  name: 'cypress-tests-1-productivity-develop-19',
  nodes: [
    {
      _class: 'org.csanchez.jenkins.plugins.kubernetes.KubernetesSlave',
      assignedLabels: [
        {
          name: 'cypress-tests-1-productivity-develop-19',
        },
        {
          name: 'cypress-tests-1-productivity-develop-19-mc4pv-s5803',
        },
      ],
      mode: 'EXCLUSIVE',
      nodeDescription: 'cypress-tests-1-productivity-develop-19-mc4pv',
      nodeName: 'cypress-tests-1-productivity-develop-19-mc4pv-s5803',
      numExecutors: 1,
    },
  ],
  offline: false,
  tiedJobs: [],
  totalExecutors: 1,
  propertiesList: [],
}
```
</details>

##### Code reference

[src/labels/labels.get.ts:81-82](https://github.com/parsable/jenkins-client-ts/blob/main/src/labels/labels.get.ts#L81-L82 "Source code on GitHub")

</details>

## Plugins

#### `jenkins.plugins.list`

<details><summary>List plugins</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsPlugin](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L359-L375 "Source code on GitHub")>>**

##### Examples

```javascript
const plugins = await jenkins.plugins.list();
```

<details><summary>Example result</summary>

```javascript
[
  {
    active: true,
    backupVersion: null,
    bundled: false,
    deleted: false,
    dependencies: [
      {
        optional: true,
        shortName: 'bouncycastle-api',
        version: '2.16.0',
      },
      {
        optional: true,
        shortName: 'command-launcher',
        version: '1.0',
      },
      {
        optional: true,
        shortName: 'jdk-tool',
        version: '1.0',
      },
      {
        optional: true,
        shortName: 'trilead-api',
        version: '1.0.4',
      },
      {
        optional: true,
        shortName: 'sshd',
        version: '3.0.1',
      },
    ],
    detached: false,
    downgradable: false,
    enabled: true,
    hasUpdate: false,
    longName: 'JavaScript GUI Lib: Moment.js bundle plugin',
    minimumJavaVersion: null,
    pinned: false,
    requiredCoreVersion: '1.580.1',
    shortName: 'momentjs',
    supportsDynamicLoad: 'YES',
    url: 'https://wiki.jenkins-ci.org/display/JENKINS/Moment.js',
    version: '1.1.1',
  },
]
```
</details>

##### Code reference

[src/plugins/plugins.list.ts:79-80](https://github.com/parsable/jenkins-client-ts/blob/main/src/plugins/plugins.list.ts#L79-L80 "Source code on GitHub")

</details>

## Credentials

#### `jenkins.credentials.<>.get`

<details><summary>Get credential information</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential id
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsCredential](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L379-L386 "Source code on GitHub")>**

##### Examples

```javascript
const credential = await jenkins.credentials.system().get('credential-name');
```

```javascript
const credential = await jenkins.credentials.folder('/my-folder').get('credential-name', 'my-domain');
```

```javascript
const credential = await jenkins.credentials.user('user').get('credential-name');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$CredentialsWrapper',
  description: 'some description',
  displayName: 'username/****** (some description)',
  fingerprint: null,
  fullName: 'my-folder/folder/my-domain/credential-name',
  id: 'credential-name',
  typeName: 'Username with password',
}
```
</details>

##### Code reference

[src/credentials/credentials.get.ts:56-63](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.get.ts#L56-L63 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.exists`

<details><summary>Check whether the credential exists</summary>

##### Parameters

*   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential id
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>**

##### Examples

```javascript
const credentialExists = await jenkins.credentials.system().exists('credential-name');
```

```javascript
const credentialExists = await jenkins.credentials.folder('/my-folder').exists('credential-name', 'my-domain');
```

```javascript
const credentialExists = await jenkins.credentials.user('user').exists('credential-name');
```

##### Code reference

[src/credentials/credentials.exists.ts:41-47](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.exists.ts#L41-L47 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.list`

<details><summary>List credentials</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsCredential](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L379-L386 "Source code on GitHub")>>**

##### Examples

```javascript
const credential = await jenkins.credentials.system().list();
```

```javascript
const credential = await jenkins.credentials.folder('/my-folder').list();
```

```javascript
const credential = await jenkins.credentials.user('user').list();
```

<details><summary>Example result</summary>

```javascript
[
  {
    description: 'some description',
    displayName: 'username/****** (some description)',
    fingerprint: null,
    fullName: 'my-folder/folder/my-domain/credential-name',
    id: 'credential-name',
    typeName: 'Username with password',
  }
]
```
</details>

##### Code reference

[src/credentials/credentials.list.ts:56-64](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.list.ts#L56-L64 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.create`

<details><summary>Create credential</summary>

##### Parameters

*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential configuration as xml string
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.credentials.system().create(`
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl plugin="credentials@2.6.1">
   <scope>GLOBAL</scope>
   <id>credential-name</id>
   <description>some description</description>
   <username>username</username>
   <password>password</password>
   <usernameSecret>false</usernameSecret>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>`
);
```

```javascript
await jenkins.credentials.folder('/my-folder').create(`...`);
```

```javascript
await jenkins.credentials.user('user').create(`...`);
```

##### Code reference

[src/credentials/credentials.create.ts:50-58](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.create.ts#L50-L58 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.delete`

<details><summary>Delete credential</summary>

##### Parameters

*   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential id
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.credentials.system().delete('credential-name');
```

```javascript
await jenkins.credentials.system().delete('credential-name', 'my-domain');
```

```javascript
await jenkins.credentials.folder('/my-folder').delete('credential-name');
```

```javascript
await jenkins.credentials.user('user').delete('credential-name');
```

##### Code reference

[src/credentials/credentials.delete.ts:45-53](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.delete.ts#L45-L53 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.setConfig`

<details><summary>Update credential configuration</summary>

##### Parameters

*   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential id
*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential configuration as xml string
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.credentials.system().setConfig('credential-name',
  `
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl plugin="credentials@2.6.1">
  <scope>GLOBAL</scope>
  <id>credential-name</id>
  <description>some description</description>
  <username>username_updated</username>
  <password>password</password>
  <usernameSecret>false</usernameSecret>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>`
);
```

```javascript
await jenkins.credentials.folder('/my-folder').setConfig('credential-name', `...`);
```

```javascript
await jenkins.credentials.user('user').setConfig('credential-name', `...`);
```

##### Code reference

[src/credentials/credentials.setConfig.ts:52-61](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.setConfig.ts#L52-L61 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.configJson`

<details><summary>Get credentials config as json object</summary>

##### Parameters

*   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential id
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<any>**

##### Examples

```javascript
const config = await jenkins.credentials.system().configJson('credential-name');
```

```javascript
const config = await jenkins.credentials.system().configJson('credential-name', 'my-domain');
```

```javascript
const config = await jenkins.credentials.folder('/my-folder').configJson('credential-name');
```

```javascript
const config = await jenkins.credentials.user('user').configJson('credential-name');
```

<details><summary>Example result</summary>

```javascript
{
  'com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl': {
    scope: 'GLOBAL',
    id: 'credential-name',
    description: 'some description',
    username: 'username',
    password: { 'secret-redacted': '' },
    usernameSecret: false,
  }
}
```
</details>

##### Code reference

[src/credentials/credentials.configJson.ts:60-70](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.configJson.ts#L60-L70 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.configXml`

<details><summary>Get credentials config as xml string</summary>

##### Parameters

*   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** credential id
*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** credential domain. Default `_`.

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

##### Examples

```javascript
const config = await jenkins.credentials.system().configXml('credential-name');
```

```javascript
const config = await jenkins.credentials.folder('/my-folder').configXml('credential-name');
```

```javascript
const config = await jenkins.credentials.user('user').configXml('credential-name');
```

<details><summary>Example result</summary>

```javascript
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl plugin="credentials@2.6.1">
    <scope>GLOBAL</scope>
    <id>credential-name</id>
    <description>some description</description>
    <username>username</username>
    <password>
        <secret-redacted/>
    </password>
    <usernameSecret>false</usernameSecret>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
```
</details>

##### Code reference

[src/credentials/credentials.configXml.ts:54-61](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/credentials.configXml.ts#L54-L61 "Source code on GitHub")

</details>

## Credentials domains

#### `jenkins.credentials.<>.domains.get`

<details><summary>Get credential domain</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[JenkinsCredentialDomain](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L390-L399 "Source code on GitHub")>**

##### Examples

```javascript
await jenkins.credentials.system().domains.get('github');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
  credentials: [],
  description: null,
  displayName: 'github',
  fullDisplayName: 'System » github',
  fullName: 'system/github',
  global: false,
  urlName: 'github',
};
```
</details>


```javascript
await jenkins.credentials.user('admin').domains.get('github');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
  credentials: [],
  description: null,
  displayName: 'github',
  fullDisplayName: 'User: admin » User » github',
  fullName: 'user:admin/user/github',
  global: false,
  urlName: 'github',
}
```
</details>


```javascript
await jenkins.credentials.folder('/my-folder').domains.get('github');
```

<details><summary>Example result</summary>

```javascript
{
  _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
  credentials: [],
  description: null,
  displayName: 'github',
  fullDisplayName: 'my-folder » Folder » github',
  fullName: 'my-folder/folder/github',
  global: false,
  urlName: 'github',
}
```
</details>

##### Code reference

[src/credentials/domains/domains.get.ts:82-88](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.get.ts#L82-L88 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.exists`

<details><summary>Check whether credential domain exists</summary>

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>**

##### Examples

```javascript
const domainExists = await jenkins.credentials.system().domains.exists('github');
```

```javascript
const domainExists = await jenkins.credentials.folder('/my-folder').domains.exists('github');
```

```javascript
const domainExists = await jenkins.credentials.user('user').domains.exists('github');
```

##### Code reference

[src/credentials/domains/domains.exists.ts:40-45](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.exists.ts#L40-L45 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.list`

<details><summary>List credential domains</summary>

##### Notes

This function allows usage of [`depth` and `tree` parameters](#depth-and-tree-parameters)

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[JenkinsCredentialDomain](https://github.com/parsable/jenkins-client-ts/blob/main/src/types.ts#L390-L399 "Source code on GitHub")>>**

##### Examples

```javascript
const domains = await jenkins.credentials.system().domains.list();
```

<details><summary>Example result</summary>

```javascript
[
  {
    _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
    credentials: [],
    description:
      'Credentials that should be available irrespective of domain specification to requirements matching.',
    displayName: 'Global credentials (unrestricted)',
    fullDisplayName: 'System » Global credentials (unrestricted)',
    fullName: 'system/_',
    global: true,
    urlName: '_',
  },
  {
    _class: 'com.cloudbees.plugins.credentials.CredentialsStoreAction$DomainWrapper',
    credentials: [],
    description: null,
    displayName: 'github',
    fullDisplayName: 'System » github',
    fullName: 'system/github',
    global: false,
    urlName: 'github',
  },
]
```
</details>


```javascript
const domains = await jenkins.credentials.folder('/my-folder').domains.list();
```

```javascript
const domains = await jenkins.credentials.user('user').domains.list();
```

##### Code reference

[src/credentials/domains/domains.list.ts:69-86](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.list.ts#L69-L86 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.create`

<details><summary>Create credential domain</summary>

##### Parameters

*   `xmlContent` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain configuration

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.credentials.system().domains.create(`
 <com.cloudbees.plugins.credentials.domains.Domain plugin="credentials@2.6.1">
     <name>github</name>
     <specifications>
         <com.cloudbees.plugins.credentials.domains.HostnameSpecification>
             <includes>github.com</includes>
             <excludes/>
         </com.cloudbees.plugins.credentials.domains.HostnameSpecification>
     </specifications>
 </com.cloudbees.plugins.credentials.domains.Domain>`
);
```

```javascript
await jenkins.credentials.folder('/my-folder').domains.create(`...`);
```

```javascript
await jenkins.credentials.user('user').domains.create(`...`);
```

##### Code reference

[src/credentials/domains/domains.create.ts:50-57](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.create.ts#L50-L57 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.delete`

<details><summary>Delete credential domain</summary>

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.credentials.system().domains.delete('github');
```

```javascript
await jenkins.credentials.folder('/my-folder').domains.delete('github');
```

```javascript
await jenkins.credentials.user('user').domains.delete('github');
```

##### Code reference

[src/credentials/domains/domains.delete.ts:40-47](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.delete.ts#L40-L47 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.setConfig`

<details><summary>Set credential domain configuration as xml string</summary>

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain name
*   `xmlConfig` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain xml configuration

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<void>**

##### Examples

```javascript
await jenkins.credentials.system().domains.setConfig('github', `
 <com.cloudbees.plugins.credentials.domains.Domain plugin="credentials@2.6.1">
     <name>github_updated</name>
     <specifications>
         <com.cloudbees.plugins.credentials.domains.HostnameSpecification>
             <includes>github.com</includes>
             <excludes/>
         </com.cloudbees.plugins.credentials.domains.HostnameSpecification>
     </specifications>
 </com.cloudbees.plugins.credentials.domains.Domain>`
);
```

```javascript
await jenkins.credentials.folder('/my-folder').domains.setConfig('github', `...`);
```

```javascript
await jenkins.credentials.user('user').domains.setConfig('github', `...`);
```

##### Code reference

[src/credentials/domains/domains.setConfig.ts:51-59](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.setConfig.ts#L51-L59 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.configJson`

<details><summary>Get credential domain configuration as json object</summary>

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<any>**

##### Examples

```javascript
const domain = await jenkins.credentials.system().domains.configJson('github');
```

```javascript
const domain = await jenkins.credentials.folder('/my-folder').domains.configJson('github');
```

```javascript
const domain = await jenkins.credentials.user('user').domains.configJson('github');
```

<details><summary>Example result</summary>

```javascript
{
  'com.cloudbees.plugins.credentials.domains.Domain': {
    name: 'github',
    specifications: {
      'com.cloudbees.plugins.credentials.domains.HostnameSpecification': {
        includes: 'github.com',
        excludes: '',
      }
    }
  }
}
```
</details>

##### Code reference

[src/credentials/domains/domains.configJson.ts:55-64](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.configJson.ts#L55-L64 "Source code on GitHub")

</details>


#### `jenkins.credentials.<>.domains.configXml`

<details><summary>Get credential domain configuration as xml string</summary>

##### Parameters

*   `domain` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** domain name

##### Returns

 **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>**

##### Examples

```javascript
const domain = await jenkins.credentials.system().domains.configXml('github');
```

```javascript
const domain = await jenkins.credentials.folder('/my-folder').domains.configXml('github');
```

```javascript
const domain = await jenkins.credentials.user('user').domains.configXml('github');
```

<details><summary>Example result</summary>

```javascript
<com.cloudbees.plugins.credentials.domains.Domain plugin="credentials@2.6.1">
    <name>github</name>
    <specifications>
        <com.cloudbees.plugins.credentials.domains.HostnameSpecification>
            <includes>github.com</includes>
            <excludes></excludes>
        </com.cloudbees.plugins.credentials.domains.HostnameSpecification>
    </specifications>
</com.cloudbees.plugins.credentials.domains.Domain>
```
</details>

##### Code reference

[src/credentials/domains/domains.configXml.ts:52-58](https://github.com/parsable/jenkins-client-ts/blob/main/src/credentials/domains/domains.configXml.ts#L52-L58 "Source code on GitHub")

</details>

