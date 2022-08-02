import { JenkinsError } from '../src/error';

describe('jenkins error', () => {
  it('should create detailed error', () => {
    const error = new JenkinsError({
      message: 'Something wrong',
      response: {
        status: 500,
      },
      config: {
        method: 'Put',
        url: 'https://jenkins.com',
      },
    });
    expect(error.message).toEqual(
      'PUT request for url "https://jenkins.com" failed with status "500" and error: "Something wrong"',
    );
  });

  it('should create unknown error', () => {
    const error = new JenkinsError({});
    expect(error.status).toEqual('unknown');
    expect(error.message).toEqual(
      ' request for url "unknown" failed with status "unknown" and error: "Unknown error"',
    );
    expect(error.error).toEqual({});
  });

  it('should use statusText if no message', () => {
    const error = new JenkinsError({
      response: {
        statusText: 'messagehere',
      },
    });
    expect(error.status).toEqual('unknown');
    expect(error.message).toEqual(
      ' request for url "unknown" failed with status "unknown" and error: "messagehere"',
    );
    expect(error.error).toEqual({
      response: {
        statusText: 'messagehere',
      },
    });
  });

  it('should use x-error header if no message', () => {
    const error = new JenkinsError({
      response: {
        headers: {
          'x-error': 'MyError',
        },
        statusText: 'messagehere',
      },
    });
    expect(error.status).toEqual('unknown');
    expect(error.message).toEqual(
      ' request for url "unknown" failed with status "unknown" and error: "MyError"',
    );
    expect(error.error).toEqual({
      response: {
        statusText: 'messagehere',
        headers: {
          'x-error': 'MyError',
        },
      },
    });
  });
});
