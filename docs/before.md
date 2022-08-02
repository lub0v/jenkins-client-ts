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
