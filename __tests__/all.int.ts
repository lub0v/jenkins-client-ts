import { JenkinsClient } from '../src/client';
import { getJenkinsClient } from './helpers/getClient';
import { createFolder, createJob } from './helpers/createJobs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getXmlConfig } from './helpers/getConfigXml';
import {
  BaseJenkinsJob,
  JenkinsBuildResult,
  JenkinsJob,
  JenkinsJobWorkflow,
  JenkinsQueueItem,
} from '../src/types';
import { waitWhile } from '../src/utils/waitWhile';
import { LogReadableStream } from '../src/builds/builds.logStream';
import Stream from 'stream';
import {
  isBackupProject,
  isExternalJob,
  isFolder,
  isFreestyleProject,
  isMavenProject,
  isMultiConfigurationProject,
  isOrganizationFolder,
  isWorkflowJob,
  isWorkflowMultiBranchProject,
} from '../src/typeguards';

const JENKINS_VERSION = '2.332.2';

describe('jenkins client', () => {
  const jenkins: JenkinsClient = getJenkinsClient();
  let folder;
  let folder2;
  let folder3;

  let jobSimple;
  let jobSimpleQueueId;

  let jobWithWait;
  let jobWithWaitPromise: Promise<number>;

  let jobToAbort;
  let jobToAbortPromise: Promise<number>;

  let jobParams;
  let jobParamsQueueId;
  let jobParamsBuildNumber;

  let jobLogStreamStart;
  let jobLogStreamStartPromise: Promise<number>;

  let jobParamsAndToken;
  let jobParamsAndTokenQueueId;

  beforeAll(async () => {
    folder = await createFolder(uuidv4());
  });

  afterAll(async () => {
    await jenkins.jobs.delete(folder);
  });

  it('create folder2 & folder3', async () => {
    folder2 = await createFolder('folder2', path.resolve(__dirname), folder);
    expect(await jenkins.jobs.exists(folder2)).toBeTruthy();
    folder3 = await createFolder('folder3', path.resolve(__dirname), folder);
    expect(await jenkins.jobs.exists(folder3)).toBeTruthy();
  });

  it('job does not exist', async () => {
    expect(await jenkins.jobs.exists(jobSimple)).toBeFalsy();
  });

  it('create job', async () => {
    jobSimple = await createJob(folder, {
      name: 'jobSimple',
      script: 'echo "Hi!"',
    });
    expect(jobSimple).toBeTruthy();
    expect(jobSimple).toEqual(`${folder}/jobSimple`);
  });

  it('job exists', async () => {
    expect(await jenkins.jobs.exists(jobSimple)).toBeTruthy();
  });

  it('get job info', async () => {
    const job: JenkinsJob = await jenkins.jobs.get(jobSimple);
    expect(job).toBeTruthy();
    expect(job.name).toEqual('jobSimple');
    expect(job.fullDisplayName).toEqual(`${folder} » jobSimple`);
    expect(job.fullName).toEqual(`${folder}/jobSimple`);
    expect(job.actions.length).toBeGreaterThanOrEqual(5);
  });

  it('get job config xml', async () => {
    const config = await jenkins.jobs.configXml(jobSimple);
    expect(config).toBeTruthy();
    expect(config).toEqual(
      `<?xml version="1.0" encoding="UTF-8"?><flow-definition plugin="workflow-job@2.40">
    <actions/>
    <description>My Job description</description>
    <keepDependencies>false</keepDependencies>
    <properties/>
    <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.87">
        <script>echo "Hi!"</script>
        <sandbox>true</sandbox>
    </definition>
    <triggers/>
    <disabled>false</disabled>
</flow-definition>`,
    );
  });

  it('get job config json', async () => {
    const config = await jenkins.jobs.configJson(jobSimple);
    expect(config).toBeTruthy();
    expect(config).toEqual({
      'flow-definition': {
        actions: '',
        description: 'My Job description',
        keepDependencies: false,
        properties: '',
        definition: {
          script: 'echo "Hi!"',
          sandbox: true,
        },
        triggers: '',
        disabled: false,
      },
    });
  });

  it('copy job', async () => {
    jobParams = `${folder}/jobParams`;
    await jenkins.jobs.copy(jobSimple, jobParams);
    expect(await jenkins.jobs.exists(jobParams)).toBeTruthy();
    const configJobSimple = await jenkins.jobs.configJson(jobSimple);
    const configJobParams = await jenkins.jobs.configJson(jobParams);
    expect(configJobParams).toEqual(configJobSimple);
  });

  it('copy jobSimple to jobWithWait', async () => {
    jobWithWait = `${folder}/jobWithWait`;
    await jenkins.jobs.copy(jobSimple, jobWithWait);
    expect(await jenkins.jobs.exists(jobWithWait)).toBeTruthy();
    const configJobSimple = await jenkins.jobs.configJson(jobSimple);
    const configJobSimple2 = await jenkins.jobs.configJson(jobWithWait);
    expect(configJobSimple2).toEqual(configJobSimple);
  });

  it('update job config', async () => {
    const jobParamsConfig = getXmlConfig('job-with-params.xml', path.resolve(__dirname));
    await jenkins.jobs.setConfig(jobParams, jobParamsConfig);
    const config = await jenkins.jobs.configJson(jobParams);
    const flowDefinition = config['flow-definition'];
    expect(flowDefinition.description).toEqual('Job with parameters');
    expect(flowDefinition.properties).toEqual({
      'hudson.model.ParametersDefinitionProperty': {
        parameterDefinitions: {
          'hudson.model.StringParameterDefinition': {
            defaultValue: 'Default Value',
            description: '',
            name: 'param',
            trim: false,
          },
        },
      },
    });
  });

  it('create job for log stream with start', async () => {
    jobLogStreamStart = await createJob(folder, {
      script: 'echo "Hi"; sleep 5; echo "first"; sleep 1; echo "second"; echo "Bye!"',
      name: 'jobLogStreamStart',
    });
    const job = await jenkins.jobs.get(jobLogStreamStart);
    expect(job).toBeTruthy();
  });

  it('copy job to jobParamsAndToken and update config', async () => {
    jobParamsAndToken = `${folder}/jobParamsAndToken`;
    await jenkins.jobs.copy(jobSimple, jobParamsAndToken);
    expect(await jenkins.jobs.exists(jobParamsAndToken)).toBeTruthy();

    const jobParamsAndTokenConfig = getXmlConfig(
      'job-with-params-and-token.xml',
      path.resolve(__dirname),
    );
    await jenkins.jobs.setConfig(jobParamsAndToken, jobParamsAndTokenConfig);
    const config = await jenkins.jobs.configJson(jobParamsAndToken);
    expect(config).toBeTruthy();
    expect(config['flow-definition'].description).toEqual('Job params and token');
  });

  it('create and build jobToAbort', async () => {
    jobToAbort = await createJob(folder2, {
      name: 'jobToAbort',
      script: 'sleep 1000',
    });
    jobToAbortPromise = jenkins.jobs.build(jobToAbort);
    expect(jobToAbortPromise).toBeTruthy();
  });

  it('build jobSimple without wait', async () => {
    jobSimpleQueueId = await jenkins.jobs.build(jobSimple);
    expect(jobSimpleQueueId).toBeGreaterThanOrEqual(1);
    const job = await jenkins.jobs.get(jobSimple);
    expect(job).toBeTruthy();
    expect(isWorkflowJob(job)).toBeTruthy();
    expect((job as JenkinsJobWorkflow).color).toEqual('notbuilt');
    expect((job as JenkinsJobWorkflow).buildable).toEqual(true);
    expect((job as JenkinsJobWorkflow).nextBuildNumber).toEqual(1);
  });

  it('build jobWithWait with wait', async () => {
    jobWithWaitPromise = jenkins.jobs.build(jobWithWait, undefined, { wait: true });
    expect(jobWithWaitPromise).toBeTruthy();
  });

  it('build jobParams without wait', async () => {
    jobParamsQueueId = await jenkins.jobs.build(jobParams, { param: 'MyValue' });
    expect(jobParamsQueueId).toBeGreaterThanOrEqual(2);
    const job = await jenkins.jobs.get(jobParams);
    expect(job).toBeTruthy();
    expect(isWorkflowJob(job)).toBeTruthy();
    expect((job as JenkinsJobWorkflow).color).toEqual('notbuilt');
    expect((job as JenkinsJobWorkflow).buildable).toEqual(true);
    expect((job as JenkinsJobWorkflow).nextBuildNumber).toEqual(1);
  });

  it('build jobParamsAndToken with wrong token should fail', async () => {
    let error;
    try {
      await jenkins.jobs.build(
        jobParamsAndToken,
        { param: 'MyParam' },
        { token: 'MY_TOKEN_WRONG' },
      );
    } catch (err) {
      error = err;
    }
    expect(error).toBeTruthy();
    expect(error.status).toEqual(403);
    expect(error.message).toEqual(
      `POST request for url "/job/${folder}/job/jobParamsAndToken/buildWithParameters" failed with status "403" and error: "Request failed with status code 403"`,
    );
    expect(error.error).toBeTruthy();
    expect(error.error.config.url).toBeTruthy();
  });

  it('build jobParamsAndToken without token should fail for unauthenticated user', async () => {
    let error;
    try {
      await new JenkinsClient().jobs.build(jobParamsAndToken, { param: 'MyParam' });
    } catch (err) {
      error = err;
    }
    expect(error).toBeTruthy();
    expect(error.status).toEqual(403);
    expect(error.message).toEqual(
      `POST request for url "/job/${folder}/job/jobParamsAndToken/buildWithParameters" failed with status "403" and error: "Request failed with status code 403"`,
    );
    expect(error.error).toBeTruthy();
    expect(error.error.config.url).toBeTruthy();
  });

  it('build job with token should succeed for unauthenticated user', async () => {
    jobParamsAndTokenQueueId = await new JenkinsClient().jobs.build(
      jobParamsAndToken,
      { param: 'MyParam' },
      { token: 'MY_TOKEN' },
    );
    expect(jobParamsAndTokenQueueId).toBeGreaterThanOrEqual(3);
  });

  it('get queue item for jobSimple', async () => {
    const queueItem = await jenkins.queue.get(jobSimpleQueueId);
    expect(queueItem).toBeTruthy();
    expect(queueItem.task.name).toEqual('jobSimple');
    expect((queueItem.task as JenkinsJobWorkflow).color).toEqual('notbuilt');
    expect(queueItem.why).toContain('In the quiet period');
  });

  it('list all queue items', async () => {
    const queue = await jenkins.queue.list();
    expect(queue).toBeTruthy();
    expect(queue.items.length).toEqual(5);
    const jobSimpleQueueItem = queue.items.find(q => q.id === jobSimpleQueueId);
    const jobParamsQueueItem = queue.items.find(q => q.id === jobParamsQueueId);

    expect(jobSimpleQueueItem).toBeTruthy();
    expect(jobSimpleQueueItem!.why).toContain('In the quiet period');

    expect(jobParamsQueueItem).toBeTruthy();
    expect(jobParamsQueueItem!.why).toContain('In the quiet period');
  });

  it('list queue item for jobSimple', async () => {
    const queue = await jenkins.queue.list(jobSimple);
    expect(queue).toBeTruthy();
    expect(queue.items.length).toEqual(1);
    expect(queue.items[0].id).toEqual(jobSimpleQueueId);
  });

  it('cancel queue item', async () => {
    await jenkins.queue.cancel(jobSimpleQueueId);
    const queueItem = await jenkins.queue.get(jobSimpleQueueId);
    expect(queueItem).toBeTruthy();
    expect(queueItem.task.name).toEqual('jobSimple');
    expect(queueItem.why).toEqual(null);
    expect(queueItem.cancelled).toBeTruthy();
  });

  it('build jobLogStreamStart with waitForStart', async () => {
    jobLogStreamStartPromise = jenkins.jobs.build(jobLogStreamStart, undefined, {
      waitForStart: true,
    });
    expect(jobLogStreamStartPromise).toBeTruthy();
  });

  it('get plugins list', async () => {
    const res = await jenkins.plugins.list();
    expect(res).toBeTruthy();
    expect(res.length).toBeGreaterThanOrEqual(10);
  });

  describe('nodes and labels', () => {
    const NODE_NAME = 'MyNewNode';
    const NODE_NAME_WITH_OPTIONS = 'NODE_NAME_WITH_OPTIONS';
    const NODE_NAME_COPY = 'MyNodeCopy';
    const NODE_NAME_UPDATED = 'MyNodeCopy_Updated';
    const NODE_NAME_UPDATED_AGAIN = 'MyNodeCopy_Updated_AGAIN';

    it('get built-in node', async () => {
      const node = await jenkins.nodes.get('(built-in)');
      expect(node).toBeTruthy();
    });

    it('should get "built-in" label', async () => {
      const res = await jenkins.labels.get('built-in');
      expect(res).toBeTruthy();
      expect(res.name).toEqual('built-in');
      expect(res.totalExecutors).toEqual(2);
      expect(res.offline).toBeFalsy();
    });

    it('should get "built-in" label with more data when depth is 1', async () => {
      const res = await jenkins.depth(1).labels.get('built-in');
      expect(res).toBeTruthy();
      expect(res.name).toEqual('built-in');
      expect(res.totalExecutors).toEqual(2);
      expect(res.offline).toBeFalsy();
      expect(res.nodes.length).toEqual(1);
      expect(res.nodes[0].assignedLabels[0].name).toEqual('built-in');
    });

    it('should return only some label data when tree provided', async () => {
      const res = await jenkins.depth(2).tree('name,offline,nodes[mode]').labels.get('built-in');
      expect(res).toBeTruthy();
      expect(res.name).toEqual('built-in');
      expect(res.offline).toEqual(false);
      expect(res.totalExecutors).toBeUndefined();
      expect(res.nodes.length).toEqual(1);
      expect(res.nodes[0].assignedLabels).toBeUndefined();
      expect(res.nodes[0].mode).toEqual('NORMAL');
    });

    it('node should not exist', async () => {
      expect(await jenkins.nodes.exists(NODE_NAME)).toBeFalsy();
    });

    it('create and get node', async () => {
      await jenkins.nodes.create(NODE_NAME);
      const node = await jenkins.nodes.get(NODE_NAME);
      expect(node).toBeTruthy();
      expect(node.offline).toBeTruthy();
      expect(node.assignedLabels).toEqual([{ name: NODE_NAME }]);
    });

    it('create node with options', async () => {
      await jenkins.nodes.create(NODE_NAME_WITH_OPTIONS, {
        numExecutors: 2,
        type: 'hudson.slaves.DumbSlave',
      });
      expect(await jenkins.nodes.exists(NODE_NAME_WITH_OPTIONS)).toBeTruthy();
    });

    it('node should exist', async () => {
      expect(await jenkins.nodes.exists(NODE_NAME)).toBeTruthy();
    });

    it('get node label', async () => {
      const label = await jenkins.labels.get(NODE_NAME);
      expect(label.offline).toBeTruthy();
    });

    it('copy node', async () => {
      await jenkins.nodes.copy(NODE_NAME, NODE_NAME_COPY);

      expect(await jenkins.nodes.exists(NODE_NAME_COPY)).toBeTruthy();

      const node = await jenkins.nodes.get(NODE_NAME_COPY);
      expect(node).toBeTruthy();
      expect(node.offline).toBeTruthy();
      expect(node.assignedLabels).toEqual([{ name: NODE_NAME_COPY }]);
    });

    it('list nodes', async () => {
      const nodes = await jenkins.nodes.list();
      expect(nodes.length).toEqual(4);
      expect(nodes.find(n => n.displayName === NODE_NAME)).toBeTruthy();
      expect(nodes.find(n => n.displayName === NODE_NAME_COPY)).toBeTruthy();
      expect(nodes.find(n => n.displayName === NODE_NAME_WITH_OPTIONS)).toBeTruthy();
    });

    it('update copied node', async () => {
      await jenkins.nodes.update(NODE_NAME_COPY);
      await jenkins.nodes.update(NODE_NAME_COPY, { name: NODE_NAME_UPDATED, numExecutors: 2 });

      expect(await jenkins.nodes.exists(NODE_NAME_COPY)).toBeFalsy();

      const node = await jenkins.nodes.get(NODE_NAME_UPDATED);
      expect(node).toBeTruthy();
      expect(node.displayName).toEqual(NODE_NAME_UPDATED);
      expect(node.numExecutors).toEqual(2);
    });

    it('get node config xml', async () => {
      const configXml = await jenkins.nodes.configXml(NODE_NAME);
      expect(configXml).toBeTruthy();
      expect(configXml).toContain(`<name>${NODE_NAME}</name>`);
      expect(configXml).toContain(`<numExecutors>1</numExecutors>`);
    });

    it('get node config json', async () => {
      const configJson = await jenkins.nodes.configJson(NODE_NAME);
      expect(configJson).toBeTruthy();
      expect(configJson.slave.name).toEqual(NODE_NAME);
      expect(configJson.slave.numExecutors).toEqual(1);
      expect(configJson.slave.mode).toEqual('NORMAL');
    });

    it('set updated node config', async () => {
      await jenkins.nodes.setConfig(
        NODE_NAME_UPDATED,
        `
          <slave>
            <name>${NODE_NAME_UPDATED_AGAIN}</name>
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
      expect(await jenkins.nodes.exists(NODE_NAME_UPDATED)).toBeFalsy();
      expect(await jenkins.nodes.exists(NODE_NAME_UPDATED_AGAIN)).toBeTruthy();

      await expect(jenkins.nodes.delete(NODE_NAME_UPDATED)).rejects.toThrow(
        `POST request for url "/computer/${NODE_NAME_UPDATED}/doDelete" failed with status "404" and error: "Not Found"`,
      );
    });

    it('mark node as offline', async () => {
      await jenkins.nodes.markOffline(NODE_NAME);
      const res = await jenkins.nodes.get(NODE_NAME);
      expect(res).toBeTruthy();
      expect(res.temporarilyOffline).toBeTruthy();
      expect(res.offlineCauseReason).toEqual('');
    });

    it('update offline reason', async () => {
      await jenkins.nodes.markOffline(NODE_NAME, 'Networking issues');
      const res = await jenkins.nodes.get(NODE_NAME);
      expect(res).toBeTruthy();
      expect(res.temporarilyOffline).toBeTruthy();
      expect(res.offlineCauseReason).toEqual('Networking issues');
    });

    it('bring node back online', async () => {
      await jenkins.nodes.bringOnline(NODE_NAME);
      const node = await jenkins.nodes.get(NODE_NAME);
      expect(node.temporarilyOffline).toBeFalsy();
    });

    it('bring node back online second time should succeed', async () => {
      await jenkins.nodes.bringOnline(NODE_NAME);
      const node = await jenkins.nodes.get(NODE_NAME);
      expect(node.temporarilyOffline).toBeFalsy();
    });

    it('delete nodes', async () => {
      await jenkins.nodes.delete(NODE_NAME);
      await jenkins.nodes.delete(NODE_NAME_UPDATED_AGAIN);
      await jenkins.nodes.delete(NODE_NAME_WITH_OPTIONS);
      expect(await jenkins.nodes.exists(NODE_NAME)).toBeFalsy();
      expect(await jenkins.nodes.exists(NODE_NAME_UPDATED_AGAIN)).toBeFalsy();
      expect(await jenkins.nodes.exists(NODE_NAME_WITH_OPTIONS)).toBeFalsy();
    });
  });

  it('log stream should start from defined start', async () => {
    const queueId = await jobLogStreamStartPromise;
    const buildNumber = (await jenkins.queue.get(queueId)).executable.number;
    const logLinesPipe: string[] = [];
    const endFunc = jest.fn();
    const logStream: LogReadableStream = jenkins.builds.logStream(jobLogStreamStart, buildNumber, {
      start: 1846,
      interval: 100,
    });
    const write = (arr: string[], chunk: any) => {
      arr.push(...chunk.toString().split('\n').filter(Boolean));
    };
    logStream.pipe(
      new Stream.Writable({
        write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
          write(logLinesPipe, chunk);
          callback();
        },
      }),
    );
    logStream.on('end', endFunc);
    await logStream.promise();
    expect(endFunc).toBeCalledTimes(1);
    const expected = [
      '[Pipeline] echo\r',
      'second\r',
      '[Pipeline] echo\r',
      'Bye!\r',
      '[Pipeline] End of Pipeline\r',
      'Finished: SUCCESS\r',
    ];
    expect(logLinesPipe).toEqual(expected);
  });

  describe('users', () => {
    let tokenUuid;
    let tokenValue;

    it('user should not exist', async () => {
      expect(await jenkins.users.exists('myTestUser')).toBeFalsy();
    });

    it('create user', async () => {
      await jenkins.users.create({
        username: 'JohnDoe',
        fullname: 'john.doe',
        password: 'Pass1234',
        email: 'john.doe@gmail.com',
      });
      expect(await jenkins.users.exists('JohnDoe')).toBeTruthy();
    });

    it('create user with minimal info', async () => {
      await jenkins.users.create({
        username: 'JaneDoe',
        password: 'Pass',
        email: 'jane.doe@gmail.com',
      });
      expect(await jenkins.users.exists('JaneDoe')).toBeTruthy();
    });

    it('get user', async () => {
      const user = await jenkins.users.get('JohnDoe');
      expect(user.fullName).toEqual('john.doe');
    });

    it('list users', async () => {
      const users = await jenkins.users.list();
      expect(users.find(u => u.fullName === 'john.doe')).toBeTruthy();
      expect(users.find(u => u.fullName === 'JaneDoe')).toBeTruthy();
    });

    it('delete users', async () => {
      await jenkins.users.delete('JohnDoe');
      await jenkins.users.delete('JaneDoe');
      expect(await jenkins.users.exists('JohnDoe')).toBeFalsy();
      expect(await jenkins.users.exists('JaneDoe')).toBeFalsy();
    });

    it('whoAmI should return info for admin', async () => {
      const user = await jenkins.users.whoAmI();
      expect(user.name).toEqual('admin');
      expect(user.anonymous).toBeFalsy();
      expect(user.authorities).toEqual(['authenticated']);
    });

    it('whoAmI should return anonymous info for unauthenticated user', async () => {
      const anon = await new JenkinsClient().users.whoAmI();
      expect(anon.name).toEqual('anonymous');
      expect(anon.anonymous).toBeTruthy();
      expect(anon.authorities).toEqual(['anonymous']);
    });

    it('generate token', async () => {
      const tokenRes = await jenkins.users.generateToken('MyToken');
      expect(tokenRes).toBeTruthy();
      expect(tokenRes.tokenUuid).toBeTruthy();
      tokenUuid = tokenRes.tokenUuid;
      tokenValue = tokenRes.tokenValue;
    });

    it('use token', async () => {
      const client = new JenkinsClient({
        username: 'admin',
        password: tokenValue,
      });
      await client.views.create('/', 'MyTestViewWithToken', 'ListView');
      await client.views.delete('/', 'MyTestViewWithToken');
      expect(true).toBeTruthy();
    });

    it('revoke token should invalidate user permissions', async () => {
      await jenkins.users.revokeToken(tokenUuid);
      const client = new JenkinsClient({
        username: 'admin',
        password: tokenValue,
      });
      await expect(client.views.create('/', 'MyTestViewWithToken', 'ListView')).rejects.toThrow(
        'POST request for url "createView" failed with status "401" and error: "Unauthorized"',
      );
    });
  });

  it('get build for jobParams and wait for completion', async () => {
    const queueItem: JenkinsQueueItem = (await waitWhile<JenkinsQueueItem>(
      () => jenkins.queue.get(jobParamsQueueId),
      r => !r.data || !r.data.executable,
    ))!;
    jobParamsBuildNumber = queueItem.executable.number;
    expect(queueItem).toBeTruthy();

    await jenkins.builds.waitForStart(queueItem.executable.url, jobParamsBuildNumber);
    const build = await jenkins.builds.get(queueItem.executable.url, jobParamsBuildNumber);
    expect(build).toBeTruthy();
    expect(build.building).toBeTruthy();

    const paramAction = build.actions.find(a => a._class === 'hudson.model.ParametersAction');
    expect(paramAction).toBeTruthy();
    expect(paramAction!.parameters[0]).toBeTruthy();
    expect(paramAction!.parameters[0].name).toEqual('param');
    expect(paramAction!.parameters[0].value).toEqual('MyValue');
  });

  it('wait until should throw timeout', async () => {
    await expect(
      waitWhile<JenkinsQueueItem>(
        () => jenkins.queue.get(jobParamsQueueId),
        r => r.ok,
        { timeout: 1000, interval: 10 },
      ),
    ).rejects.toThrow(' request for url "unknown" failed with status "408" and error: "Timeout"');
  });

  it('get build log stream', async () => {
    const logLinesPipe: string[] = [];
    const logLinesData: string[] = [];
    const endFunc = jest.fn();
    let counter = 0;
    jenkins.builds.logStream(jobParams, jobParamsBuildNumber);
    jenkins.builds.logStream(jobParams, jobParamsBuildNumber, {});
    const logStream: LogReadableStream = jenkins.builds.logStream(jobParams, jobParamsBuildNumber, {
      interval: 200,
    });
    const write = (arr: string[], chunk: any) => {
      arr.push(...chunk.toString().split('\n').filter(Boolean));
    };
    const writable = new Stream.Writable({
      write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        write(logLinesPipe, chunk);
        callback();
      },
    });
    logStream.pipe(writable);
    logStream.on('data', async (chunk: any) => {
      write(logLinesData, chunk);
      counter += 1;
    });
    logStream.on('end', endFunc);
    await logStream.promise();
    expect(endFunc).toBeCalledTimes(1);
    const expected = [
      'Started by user admin\r',
      '[Pipeline] Start of Pipeline\r',
      '[Pipeline] echo\r',
      'Hi\r',
      '[Pipeline] sleep\r',
      'Sleeping for 13 sec\r',
      '[Pipeline] echo\r',
      'first\r',
      '[Pipeline] sleep\r',
      'Sleeping for 1 sec\r',
      '[Pipeline] echo\r',
      'second\r',
      '[Pipeline] echo\r',
      'Bye!\r',
      '[Pipeline] End of Pipeline\r',
      'Finished: SUCCESS\r',
    ];
    expect(logLinesData).toEqual(expected);
    expect(logLinesPipe).toEqual(expected);
    expect(counter).toBeGreaterThanOrEqual(2);
  });

  it('get jobParams log text', async () => {
    const log = await jenkins.builds.log(jobParams, jobParamsBuildNumber);
    expect(log.text).toBeTruthy();
    expect(log.text.split('\n')).toEqual([
      'Started by user admin\r',
      '[Pipeline] Start of Pipeline\r',
      '[Pipeline] echo\r',
      'Hi\r',
      '[Pipeline] sleep\r',
      'Sleeping for 13 sec\r',
      '[Pipeline] echo\r',
      'first\r',
      '[Pipeline] sleep\r',
      'Sleeping for 1 sec\r',
      '[Pipeline] echo\r',
      'second\r',
      '[Pipeline] echo\r',
      'Bye!\r',
      '[Pipeline] End of Pipeline\r',
      'Finished: SUCCESS\r',
      '',
    ]);
    expect(log.size).toEqual(2785);
    expect(log.more).toBeFalsy();
  });

  it('get jobParams log html', async () => {
    const log = await jenkins.builds.log(jobParams, jobParamsBuildNumber, { html: true });
    expect(log.text).toBeTruthy();
    expect(log.text.split('\n')).toEqual([
      "Started by user <a href='/user/admin' class='model-link'>admin</a>\r",
      '<span class="pipeline-new-node" nodeId="2" startId="2">[Pipeline] Start of Pipeline\r',
      '</span><span class="pipeline-new-node" nodeId="3" enclosingId="2">[Pipeline] echo\r',
      '</span><span class="pipeline-node-3">Hi\r',
      '</span><span class="pipeline-new-node" nodeId="4" enclosingId="2">[Pipeline] sleep\r',
      '</span><span class="pipeline-node-4">Sleeping for 13 sec\r',
      '</span><span class="pipeline-new-node" nodeId="5" enclosingId="2">[Pipeline] echo\r',
      '</span><span class="pipeline-node-5">first\r',
      '</span><span class="pipeline-new-node" nodeId="6" enclosingId="2">[Pipeline] sleep\r',
      '</span><span class="pipeline-node-6">Sleeping for 1 sec\r',
      '</span><span class="pipeline-new-node" nodeId="7" enclosingId="2">[Pipeline] echo\r',
      '</span><span class="pipeline-node-7">second\r',
      '</span><span class="pipeline-new-node" nodeId="8" enclosingId="2">[Pipeline] echo\r',
      '</span><span class="pipeline-node-8">Bye!\r',
      '</span><span class="pipeline-new-node" nodeId="9" startId="2">[Pipeline] End of Pipeline\r',
      '</span>Finished: SUCCESS\r',
      '',
    ]);
    expect(log.size).toEqual(2785);
    expect(log.more).toBeFalsy();
  });

  it('log stream should error if no job', async () => {
    const errorFunc = jest.fn();
    const logStream: LogReadableStream = jenkins.builds.logStream('notExisting', 1);
    logStream.pipe(process.stdout);
    logStream.on('error', errorFunc);
    const error = `POST request for url "/job/notExisting/1/logText/progressiveText" failed with status "404" and error: "Not Found"`;
    await expect(logStream.promise()).rejects.toThrow(error);
    expect(errorFunc).toBeCalledWith(new Error(error));
  });

  it('jobWithWait should be completed', async () => {
    const queueId = await jobWithWaitPromise;
    expect(queueId).toBeTruthy();
    const queueItem = await jenkins.depth(2).queue.get(queueId);
    expect(queueItem.executable.result).toEqual(JenkinsBuildResult.SUCCESS);
    expect((queueItem.task as BaseJenkinsJob).lastBuild.result).toEqual(JenkinsBuildResult.SUCCESS);
  });

  it('disable job should be successful', async () => {
    await jenkins.jobs.disable(jobSimple);
    const config = await jenkins.jobs.configJson(jobSimple);
    expect(config).toBeTruthy();
    expect(config['flow-definition'].disabled).toBeTruthy();
  });

  it('enable job should be successful', async () => {
    await jenkins.jobs.enable(jobSimple);
    const config = await jenkins.jobs.configJson(jobSimple);
    expect(config).toBeTruthy();
    expect(config['flow-definition'].disabled).toBeFalsy();
  });

  it('stop jobToAbort should be successful', async () => {
    const queueId = await jobToAbortPromise;
    const buildNumber = (await jenkins.queue.get(queueId)).executable.number;
    await jenkins.builds.abort(jobToAbort, buildNumber);
    await jenkins.builds.wait(jobToAbort, buildNumber);
    const job = await jenkins.depth(2).jobs.get(jobToAbort);
    expect(job).toBeTruthy();
    expect((job as BaseJenkinsJob).lastBuild.result).toEqual(JenkinsBuildResult.ABORTED);
    expect((job as BaseJenkinsJob).lastBuild.duration).toBeLessThan(30000);
  });

  it('delete build', async () => {
    const job = await jenkins.depth(2).jobs.get(jobToAbort);
    expect(job).toBeTruthy();
    expect((job as BaseJenkinsJob).firstBuild).toBeTruthy();
    await jenkins.builds.delete(jobToAbort, (job as BaseJenkinsJob).firstBuild.number);

    const jobAfterDelete = await jenkins.depth(1).jobs.get(jobToAbort);
    expect(jobAfterDelete).toBeTruthy();
    expect((jobAfterDelete as BaseJenkinsJob).firstBuild).toBeFalsy();
  });

  describe('jenkins client', () => {
    async function createFolderInternal(name: string, client: JenkinsClient) {
      const config = getXmlConfig('folder.xml', path.resolve(__dirname));
      await client.jobs.create('/', name, config);
    }

    it('get jenkins version', async () => {
      const result = await jenkins.getVersion();
      expect(result).toBeTruthy();
      expect(result).toStrictEqual(JENKINS_VERSION);
    });

    it('should throw error if invalid credentials', async () => {
      const jenkinsClient = new JenkinsClient({
        username: 'admin',
        password: 'test',
      });
      await expect(jenkinsClient.getVersion()).rejects.toThrow(
        'GET request for url "/api" failed with status "401" and error: "Unauthorized"',
      );
    });

    it('use custom crumb issuer and reissue when invalid', async () => {
      const func = jest.fn();
      const jenkinsClient = new JenkinsClient({
        username: 'admin',
        password: 'admin',
        crumbIssuer: requests => {
          func();
          return requests.get('/crumbIssuer/api/json').then(res => ({
            crumbRequestField: res.data.crumbRequestField,
            crumb: res.data.crumb,
          }));
        },
      });
      const folder1 = uuidv4();
      await createFolderInternal(folder1, jenkinsClient);
      expect(func).toBeCalledTimes(1);
      await jenkinsClient.jobs.delete(folder1);
      expect(func).toBeCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      jenkinsClient.requests.crumbHeaders = {
        'Jenkins-Crumb': '123',
      };
      const folderTwo = uuidv4();
      await createFolderInternal(folderTwo, jenkinsClient);
      expect(func).toBeCalledTimes(2);
      await jenkinsClient.jobs.delete(folderTwo);
      expect(func).toBeCalledTimes(2);
    });
  });

  it('wait for jobParamsAndToken', async () => {
    const buildNumber = (await jenkins.queue.get(jobParamsAndTokenQueueId)).executable.number;
    const build = await jenkins.builds.wait(jobParamsAndToken, buildNumber);
    expect(build.result).toEqual('SUCCESS');
  });

  it('list job should return', async () => {
    const jobs = await jenkins.jobs.list(folder);
    const urlStart = `http://localhost:8080/job/${folder}/job`;
    expect(jobs).toEqual([
      {
        _class: 'com.cloudbees.hudson.plugins.folder.Folder',
        name: 'folder2',
        url: `${urlStart}/folder2/`,
      },
      {
        _class: 'com.cloudbees.hudson.plugins.folder.Folder',
        name: 'folder3',
        url: `${urlStart}/folder3/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobLogStreamStart',
        url: `${urlStart}/jobLogStreamStart/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobParams',
        url: `${urlStart}/jobParams/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobParamsAndToken',
        url: `${urlStart}/jobParamsAndToken/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'notbuilt',
        name: 'jobSimple',
        url: `${urlStart}/jobSimple/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobWithWait',
        url: `${urlStart}/jobWithWait/`,
      },
    ]);
  });

  it('list jobs recursive should return', async () => {
    const jobs = await jenkins.jobs.list(folder, true);
    const urlStart = `http://localhost:8080/job/${folder}/job`;
    expect(jobs).toEqual([
      {
        _class: 'com.cloudbees.hudson.plugins.folder.Folder',
        name: 'folder2',
        url: `${urlStart}/folder2/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'notbuilt',
        name: 'jobToAbort',
        url: `${urlStart}/folder2/job/jobToAbort/`,
      },
      {
        _class: 'com.cloudbees.hudson.plugins.folder.Folder',
        name: 'folder3',
        url: `${urlStart}/folder3/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobLogStreamStart',
        url: `${urlStart}/jobLogStreamStart/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobParams',
        url: `${urlStart}/jobParams/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobParamsAndToken',
        url: `${urlStart}/jobParamsAndToken/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'notbuilt',
        name: 'jobSimple',
        url: `${urlStart}/jobSimple/`,
      },
      {
        _class: 'org.jenkinsci.plugins.workflow.job.WorkflowJob',
        color: 'blue',
        name: 'jobWithWait',
        url: `${urlStart}/jobWithWait/`,
      },
    ]);
  });

  describe('typeguards', () => {
    let workflowJob;
    let orgFolder;
    let freestyleProjectJob;
    let multiConfigJob;
    let workflowMultiBranchJob;
    beforeAll(async () => {
      workflowJob = await createJob(folder, {
        name: 'workflow',
      });
      orgFolder = await createJob(folder, {
        name: 'orgFolder',
        config: 'org-folder.xml',
      });
      freestyleProjectJob = await createJob(folder, {
        name: 'freestyle',
        config: 'freestyle-job.xml',
      });
      multiConfigJob = await createJob(folder, {
        name: 'multi',
        config: 'multi-config-job.xml',
      });
      workflowMultiBranchJob = await createJob(folder, {
        name: 'multibranch',
        config: 'workflow-multibranch-job.xml',
      });
    });

    it('should properly recognize folder', async () => {
      const folderInfo = await jenkins.jobs.get(folder);
      expect(folderInfo).toBeTruthy();
      expect(isFolder(folderInfo)).toBeTruthy();
      expect(isOrganizationFolder(folderInfo)).toBeFalsy();
    });

    it('should properly recognize org folder', async () => {
      const job = await jenkins.jobs.get(orgFolder);
      expect(job).toBeTruthy();
      expect(isFolder(job)).toBeFalsy();
      expect(isOrganizationFolder(job)).toBeTruthy();
    });

    it('should properly recognize workflow job', async () => {
      const job = await jenkins.jobs.get(workflowJob);
      expect(job).toBeTruthy();
      expect(isWorkflowJob(job)).toBeTruthy();
      expect(isFreestyleProject(job)).toBeFalsy();
      expect(isMultiConfigurationProject(job)).toBeFalsy();
      expect(isWorkflowMultiBranchProject(job)).toBeFalsy();
      expect(isMavenProject(job)).toBeFalsy();
      expect(isExternalJob(job)).toBeFalsy();
      expect(isBackupProject(job)).toBeFalsy();
    });

    it('should properly recognize freestyle project', async () => {
      const job = await jenkins.jobs.get(freestyleProjectJob);
      expect(job).toBeTruthy();
      expect(isWorkflowJob(job)).toBeFalsy();
      expect(isFreestyleProject(job)).toBeTruthy();
      expect(isMultiConfigurationProject(job)).toBeFalsy();
      expect(isWorkflowMultiBranchProject(job)).toBeFalsy();
      expect(isMavenProject(job)).toBeFalsy();
      expect(isExternalJob(job)).toBeFalsy();
      expect(isBackupProject(job)).toBeFalsy();
    });

    it('should properly multi-configuration job', async () => {
      const job = await jenkins.jobs.get(multiConfigJob);
      expect(job).toBeTruthy();
      expect(isWorkflowJob(job)).toBeFalsy();
      expect(isFreestyleProject(job)).toBeFalsy();
      expect(isMultiConfigurationProject(job)).toBeTruthy();
      expect(isWorkflowMultiBranchProject(job)).toBeFalsy();
      expect(isMavenProject(job)).toBeFalsy();
      expect(isExternalJob(job)).toBeFalsy();
      expect(isBackupProject(job)).toBeFalsy();
    });

    it('should properly multi-branch workflow job', async () => {
      const job = await jenkins.jobs.get(workflowMultiBranchJob);
      expect(job).toBeTruthy();
      expect(isWorkflowJob(job)).toBeFalsy();
      expect(isFreestyleProject(job)).toBeFalsy();
      expect(isMultiConfigurationProject(job)).toBeFalsy();
      expect(isWorkflowMultiBranchProject(job)).toBeTruthy();
      expect(isMavenProject(job)).toBeFalsy();
      expect(isExternalJob(job)).toBeFalsy();
      expect(isBackupProject(job)).toBeFalsy();
    });
  });
});
