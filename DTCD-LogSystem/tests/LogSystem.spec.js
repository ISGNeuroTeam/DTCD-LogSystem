import { LogSystem } from '../src/LogSystem';
import sizeof from './../src/utils/sizeof';

describe('LogSystem:getRegistrationMeta()', () => {
  test('should be defined', () => {
    expect(LogSystem.getRegistrationMeta).toBeDefined();
  });

  test('should return proper data', () => {
    expect(LogSystem.getRegistrationMeta()).toEqual({
      type: 'core',
      title: 'Система логирования',
      name: 'LogSystem',
      init: true,
    });
  });
});

describe('LogSystem:init()', () => {
  let ls = new LogSystem();

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    ls = new LogSystem();
    localStorage.clear();
  });

  test('should be defined', () => {
    expect(ls.init).toBeDefined();
  });
  test('inicializes correct params from localStorage', async () => {
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({ BufferSize: 22222, SendInterval: 111, GlobalLogLevel: 'warn' })
    );
    await ls.init();
    expect(ls.bufferSize).toBe(22222);
    expect(ls.intervalSeconds).toBe(111);
    expect(ls.globalLogLevel).toBe('warn');
    expect(fetch).toBeCalledTimes(0);
  });

  test('inicializes correct params to system from API', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ BufferSize: 11111, SendInterval: 150, GlobalLogLevel: 'fatal' }),
      })
    );
    await ls.init();
    expect(ls.bufferSize).toBe(11111);
    expect(ls.intervalSeconds).toBe(150);
    expect(ls.globalLogLevel).toBe('fatal');
    expect(fetch).toBeCalledTimes(1);
    expect(localStorage.length).toBe(1);
  });

  test('inicializes default parameters in system', async () => {
    fetch.mockImplementationOnce(() => Promise.reject('API is down'));
    await ls.init();
    expect(ls.bufferSize).toBe(10000);
    expect(ls.intervalSeconds).toBe(150);
    expect(ls.globalLogLevel).toBe('fatal');
    expect(fetch).toBeCalledTimes(1);
    expect(localStorage.length).toBe(1);
  });

  test('second init inicializes params from localStorage', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({ BufferSize: 11111, SendInterval: 150, GlobalLogLevel: 'fatal' }),
      })
    );
    await ls.init();
    expect(ls.bufferSize).toBe(11111);
    expect(ls.intervalSeconds).toBe(150);
    expect(ls.globalLogLevel).toBe('fatal');
    expect(fetch).toBeCalledTimes(1);
    expect(localStorage.length).toBe(1);
    await ls.init();
    expect(fetch).toBeCalledTimes(1);
  });

  test('scheduler sends logs to back-end and cleans buffer', async () => {
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({ BufferSize: 22222, SendInterval: 10, GlobalLogLevel: 'warn' })
    );
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    jest.useFakeTimers();
    await ls.init();
    ls.warn('1', 'test', 'fake message');
    expect(ls.logs.length).toBe(1);
    jest.advanceTimersByTime(10000);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(1);
  });

  test('scheduler does nothing if buffer is empty', async () => {
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({ BufferSize: 22222, SendInterval: 10, GlobalLogLevel: 'warn' })
    );

    jest.useFakeTimers();
    await ls.init();
    expect(ls.logs.length).toBe(0);
    jest.advanceTimersByTime(10000);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(0);
  });
});

describe('LogSystem:fatal()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.config = {};
    ls.globalLogLevel = 'fatal';
    ls.bufferSize = 15000;
    ls.sendInterval = 200;

    global.fetch = jest.fn();
  });

  test('should be defined', () => {
    expect(ls.fatal).toBeDefined();
  });

  test('adds fatal log record to buffer', () => {
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record')).toBe(true);
    expect(ls.logs.length).toBe(1);

    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      plugin: 'testPlugin',
      message: 'test record',
      guid: '1',
      logLevel: 'fatal',
      caller: expect.any(String),
    });
  });

  test('empty string are not accepted', () => {
    expect(ls.fatal('', '', '')).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('wrong type arguments are not accepted', () => {
    expect(ls.fatal(1, [], {})).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('if new log message will overfill buffer it shoul first send logs and clean itself ', () => {
    ls.bufferSize = 300;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(sizeof(ls.logs)).toBe(220);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(fetch).toBeCalledTimes(1);
  });

  test('if new log message size is more than buffer size it will be dropped', () => {
    ls.bufferSize = 150;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(false);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(0);
  });
});

describe('LogSystem:error()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.config = {};
    ls.globalLogLevel = 'error';
    ls.bufferSize = 15000;
    ls.sendInterval = 200;
    global.fetch = jest.fn();
  });

  test('should be defined', () => {
    expect(ls.error).toBeDefined();
  });

  test('adds error log record to buffer', () => {
    expect(ls.logs.length).toBe(0);
    expect(ls.error('1', 'testPlugin', 'test record')).toBe(true);
    expect(ls.logs.length).toBe(1);

    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      plugin: 'testPlugin',
      message: 'test record',
      guid: '1',
      logLevel: 'error',
      caller: expect.any(String),
    });
  });

  test(`doen't add error log record to buffer if current level below error`, () => {
    expect(ls.setGlobalLogLevel('fatal')).toBe(true);
    expect(ls.logs.length).toBe(0);
    ls.error('1', 'testPlugin', 'test record');
    expect(ls.logs.length).toBe(0);
  });

  test('empty string are not accepted', () => {
    expect(ls.error('', '', '')).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('wrong type arguments are not accepted', () => {
    expect(ls.error(1, [], {})).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('if new log message will overfill buffer it shoul first send logs and clean itself ', () => {
    ls.bufferSize = 300;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(sizeof(ls.logs)).toBe(220);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(fetch).toBeCalledTimes(1);
  });

  test('if new log message size is more than buffer size it will be dropped', () => {
    ls.bufferSize = 150;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(false);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(0);
  });
});

describe('LogSystem:warn()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.config = {};
    ls.globalLogLevel = 'warn';
    ls.bufferSize = 15000;
    ls.sendInterval = 200;
    global.fetch = jest.fn();
  });

  test('should be defined', () => {
    expect(ls.warn).toBeDefined();
  });

  test('adds warn log record to buffer', () => {
    expect(ls.logs.length).toBe(0);
    expect(ls.warn('1', 'testPlugin', 'test record')).toBe(true);
    expect(ls.logs.length).toBe(1);

    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      plugin: 'testPlugin',
      message: 'test record',
      guid: '1',
      logLevel: 'warn',
      caller: expect.any(String),
    });
  });

  test(`doen't add warn log record to buffer if current level below warn`, () => {
    expect(ls.setGlobalLogLevel('error')).toBe(true);
    expect(ls.logs.length).toBe(0);
    ls.warn('1', 'testPlugin', 'test record');
    expect(ls.logs.length).toBe(0);
  });

  test('empty string are not accepted', () => {
    expect(ls.warn('', '', '')).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('wrong type arguments are not accepted', () => {
    expect(ls.warn(1, [], {})).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('if new log message will overfill buffer it shoul first send logs and clean itself ', () => {
    ls.bufferSize = 300;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(sizeof(ls.logs)).toBe(220);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(fetch).toBeCalledTimes(1);
  });

  test('if new log message size is more than buffer size it will be dropped', () => {
    ls.bufferSize = 150;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(false);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(0);
  });
});

describe('LogSystem:info()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.config = {};
    ls.globalLogLevel = 'info';
    ls.bufferSize = 15000;
    ls.sendInterval = 200;
    global.fetch = jest.fn();
  });

  test('should be defined', () => {
    expect(ls.info).toBeDefined();
  });

  test('adds info log record to buffer', () => {
    expect(ls.logs.length).toBe(0);
    expect(ls.info('1', 'testPlugin', 'test record')).toBe(true);
    expect(ls.logs.length).toBe(1);

    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      plugin: 'testPlugin',
      message: 'test record',
      guid: '1',
      logLevel: 'info',
      caller: expect.any(String),
    });
  });

  test(`doen't add info log record to buffer if current level below info`, () => {
    expect(ls.setGlobalLogLevel('warn')).toBe(true);
    expect(ls.logs.length).toBe(0);
    ls.info('1', 'testPlugin', 'test record');
    expect(ls.logs.length).toBe(0);
  });

  test('empty string are not accepted', () => {
    expect(ls.info('', '', '')).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('wrong type arguments are not accepted', () => {
    expect(ls.info(1, [], {})).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('if new log message will overfill buffer it shoul first send logs and clean itself ', () => {
    ls.bufferSize = 300;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(sizeof(ls.logs)).toBe(220);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(fetch).toBeCalledTimes(1);
  });

  test('if new log message size is more than buffer size it will be dropped', () => {
    ls.bufferSize = 150;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(false);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(0);
  });
});

describe('LogSystem:debug()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.config = {};
    ls.globalLogLevel = 'debug';
    ls.bufferSize = 15000;
    ls.sendInterval = 200;
    global.fetch = jest.fn();
  });

  test('should be defined', () => {
    expect(ls.debug).toBeDefined();
  });

  test('adds debug log record to buffer', () => {
    expect(ls.logs.length).toBe(0);
    expect(ls.debug('1', 'testPlugin', 'test record')).toBe(true);
    expect(ls.logs.length).toBe(1);

    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      plugin: 'testPlugin',
      message: 'test record',
      guid: '1',
      logLevel: 'debug',
      caller: expect.any(String),
    });
  });

  test(`doen't add debug log record to buffer if current level below debug`, () => {
    expect(ls.setGlobalLogLevel('info')).toBe(true);
    expect(ls.logs.length).toBe(0);
    ls.debug('1', 'testPlugin', 'test record');
    expect(ls.logs.length).toBe(0);
  });

  test('empty string are not accepted', () => {
    expect(ls.debug('', '', '')).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('wrong type arguments are not accepted', () => {
    expect(ls.debug(1, [], {})).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('if new log message will overfill buffer it shoul first send logs and clean itself ', () => {
    ls.bufferSize = 300;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(sizeof(ls.logs)).toBe(220);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(true);
    expect(ls.logs.length).toBe(1);
    expect(fetch).toBeCalledTimes(1);
  });

  test('if new log message size is more than buffer size it will be dropped', () => {
    ls.bufferSize = 150;
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve('success'),
      })
    );
    expect(ls.logs.length).toBe(0);
    expect(ls.fatal('1', 'testPlugin', 'test record test record test record')).toBe(false);
    expect(ls.logs.length).toBe(0);
    expect(fetch).toBeCalledTimes(0);
  });
});

describe('LogSystem:invokeOnLevel()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.config = {};
    ls.globalLogLevel = 'debug';
    ls.bufferSize = 15000;
    ls.sendInterval = 200;
  });

  test('should be defined', () => {
    expect(ls.invokeOnLevel).toBeDefined();
  });

  test('invokes if current level is above or equal to given as argument', function testInvoke() {
    let testCallback = jest.fn(function testCallback() {
      return 'testMessage';
    });
    expect(ls.invokeOnLevel('1', 'testPlugin', 'debug', testCallback)).toBe(true);
    expect(testCallback).toBeCalledTimes(1);
    expect(ls.logs.length).toBe(1);
    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      logLevel: 'debug',
      guid: '1',
      plugin: 'testPlugin',
      caller: 'testInvoke',
      message: 'testMessage',
    });
  });

  test(`doesn't invoke if current level below given`, () => {
    let testCallback = jest.fn(function testCallback() {
      return 'testMessage';
    });
    expect(ls.setGlobalLogLevel('fatal')).toBe(true);
    expect(ls.invokeOnLevel('1', 'testPlugin', 'debug', testCallback)).toBe(false);
    expect(testCallback).toBeCalledTimes(0);
    expect(ls.logs.length).toBe(0);
  });

  test(`doesn't invoke if callback argument is not a function`, () => {
    expect(ls.invokeOnLevel('1', 'testPlugin', 'debug', 123)).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test(`doesn't invoke if log level argument is wrong `, () => {
    let testCallback = jest.fn(function testCallback() {
      return 'testMessage';
    });
    expect(ls.invokeOnLevel('1', 'testPlugin', 'debug123', testCallback)).toBe(false);
    expect(ls.logs.length).toBe(0);
  });
});

describe('LogSystem:getGlobalLogLevel()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
    ls.globalLogLevel = 'debug';
  });

  test('should be defined', () => {
    expect(ls.getGlobalLogLevel).toBeDefined();
  });

  test('returns correct global log level', () => {
    expect(ls.getGlobalLogLevel()).toBe('debug');
    expect(ls.setGlobalLogLevel('warn')).toBe(true);
    expect(ls.getGlobalLogLevel()).toBe('warn');
  });
});

describe('LogSystem:setGlobalLogLevel()', () => {
  let ls;

  beforeEach(() => {
    ls = new LogSystem();
  });

  test('should be defined', () => {
    expect(ls.setGlobalLogLevel).toBeDefined();
  });

  test('sets correct global log level', () => {
    expect(ls.setGlobalLogLevel('warn')).toBe(true);
    expect(ls.getGlobalLogLevel()).toBe('warn');
  });

  test('accepts both string and numbers ', () => {
    expect(ls.setGlobalLogLevel('fatal')).toBe(true);
    expect(ls.getGlobalLogLevel()).toBe('fatal');
    expect(ls.setGlobalLogLevel(5)).toBe(true);
    expect(ls.getGlobalLogLevel()).toBe('debug');
  });

  test('doesn not accept wrong string or number ', () => {
    expect(ls.setGlobalLogLevel('error')).toBe(true);
    expect(ls.setGlobalLogLevel('super fatal')).toBe(false);
    expect(ls.getGlobalLogLevel()).toBe('error');
    expect(ls.setGlobalLogLevel(10)).toBe(false);
    expect(ls.getGlobalLogLevel()).toBe('error');
  });
});

describe('LogSystem:getPluginLogLevel()', () => {
  let ls;

  beforeEach(async () => {
    ls = new LogSystem();
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
        guid1TestPlugin: 'debug',
      })
    );
    await ls.init();
  });

  test('should be defined', () => {
    expect(ls.getPluginLogLevel).toBeDefined();
  });

  test('return correct plugin log level if it exists in configuration', () => {
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('debug');
  });

  test(`return system log level if plugin's one doesn't exist in configuration`, () => {
    expect(ls.getPluginLogLevel('guid2', 'TestPlugin')).toBe('warn');
  });
});

describe('LogSystem:setPluginLogLevel()', () => {
  let ls;

  beforeEach(async () => {
    ls = new LogSystem();
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    await ls.init();
  });

  test('should be defined', () => {
    expect(ls.setPluginLogLevel).toBeDefined();
  });

  test('sets correct log level for given plugin in configuration', () => {
    expect(ls.config['guid1TestPlugin']).toBeUndefined();
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('warn');
    expect(ls.setPluginLogLevel('guid1', 'TestPlugin', 'debug')).toBe(true);
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('debug');
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
        guid1TestPlugin: 'debug',
      })
    );
    expect(ls.config['guid1TestPlugin']).toBeDefined();
    expect(ls.config['guid1TestPlugin']).toBe('debug');
  });

  test('accept both strings and numbers as log level for plugin', () => {
    expect(ls.config['guid1TestPlugin']).toBeUndefined();
    expect(ls.setPluginLogLevel('guid1', 'TestPlugin', 'debug')).toBe(true);
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('debug');
    expect(ls.setPluginLogLevel('guid1', 'TestPlugin', 4)).toBe(true);
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('info');
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
        guid1TestPlugin: 'info',
      })
    );
    expect(ls.config['guid1TestPlugin']).toBeDefined();
    expect(ls.config['guid1TestPlugin']).toBe('info');
  });

  test('does not accept wrong log level argument', () => {
    expect(ls.config['guid1TestPlugin']).toBeUndefined();
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('warn');
    expect(ls.setPluginLogLevel('guid1', 'TestPlugin', 'de234bug')).toBe(false);
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('warn');
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    expect(ls.config['guid1TestPlugin']).toBeUndefined();
  });
});

describe('LogSystem:removePluginLogLevel()', () => {
  let ls;

  beforeEach(async () => {
    ls = new LogSystem();
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
        guid1TestPlugin: 'debug',
      })
    );
    await ls.init();
  });

  test('should be defined', () => {
    expect(ls.removePluginLogLevel).toBeDefined();
  });

  test('removes plugin log level from configuration correctly', () => {
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
        guid1TestPlugin: 'debug',
      })
    );

    expect(ls.config['guid1TestPlugin']).toBeDefined();
    expect(ls.config['guid1TestPlugin']).toBe('debug');
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('debug');
    expect(ls.removePluginLogLevel('guid1', 'TestPlugin')).toBe(true);
    expect(ls.getPluginLogLevel('guid1', 'TestPlugin')).toBe('warn');

    expect(ls.config['guid1TestPlugin']).toBeUndefined();
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
  });
});

describe('LogSystem:setSendInerval()', () => {
  let ls;

  beforeEach(async () => {
    ls = new LogSystem();
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    await ls.init();
  });

  test('should be defined', () => {
    expect(ls.setSendInerval).toBeDefined();
  });

  test('sets new send inverval value to configuration', () => {
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    expect(ls.intervalSeconds).toBe(111);
    expect(ls.setSendInerval(99)).toBe(true);
    // must be the same, changed only after page reload!
    expect(ls.intervalSeconds).toBe(111);
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 99,
        GlobalLogLevel: 'warn',
      })
    );
  });
  test('accepts only numbers', () => {
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    expect(ls.intervalSeconds).toBe(111);
    expect(ls.setSendInerval('123')).toBe(false);
    expect(ls.setSendInerval({})).toBe(false);
    expect(ls.setSendInerval(true)).toBe(false);
    expect(ls.intervalSeconds).toBe(111);
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
  });
});

describe('LogSystem:setBufferSize()', () => {
  let ls;

  beforeEach(async () => {
    ls = new LogSystem();
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    await ls.init();
  });

  test('should be defined', () => {
    expect(ls.setBufferSize).toBeDefined();
  });

  test('sets new buffer size value to configuration', () => {
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    expect(ls.bufferSize).toBe(22222);
    expect(ls.setBufferSize(2000)).toBe(true);
    // must be the same, changed only after page reload!
    expect(ls.bufferSize).toBe(22222);
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 2000,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
  });

  test('accepts only numbers', () => {
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    expect(ls.bufferSize).toBe(22222);
    expect(ls.setBufferSize('123')).toBe(false);
    expect(ls.setBufferSize({})).toBe(false);
    expect(ls.setBufferSize(true)).toBe(false);
    expect(ls.bufferSize).toBe(22222);
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
  });
});

describe('LogSystem:resetConfiguration()', () => {
  let ls;

  beforeEach(async () => {
    ls = new LogSystem();
    localStorage.setItem(
      'logSystemConfig',
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    await ls.init();
  });

  test('should be defined', () => {
    expect(ls.resetConfiguration).toBeDefined();
  });

  test('resets current configuration in localStorage', () => {
    expect(localStorage.getItem('logSystemConfig')).toEqual(
      JSON.stringify({
        BufferSize: 22222,
        SendInterval: 111,
        GlobalLogLevel: 'warn',
      })
    );
    ls.resetConfiguration();
    expect(localStorage.getItem('logSystemConfig')).toBeNull();
  });
});
