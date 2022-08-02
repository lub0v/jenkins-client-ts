import { JenkinsClient } from '../src/client';
import { waitWhile } from '../src/utils/waitWhile';

export default async () => {
  const start = new Date().getTime();
  console.log('\nWaiting for jenkins to be up and running...');
  const client = new JenkinsClient();
  await waitWhile<string>(
    () => client.getVersion(),
    r => !r.ok,
    { interval: 50, timeout: 20000 },
  );
  const diff = new Date().getTime() - start;
  console.log(`Jenkins running after ${diff} ms`);
};
