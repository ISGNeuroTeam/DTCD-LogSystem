import { LogSystem } from '../src/LogSystem';

let ls = new LogSystem();

describe('LogSystem:getRegistrationMeta', () => {
  test('should be defined', () => {
    expect(LogSystem.getRegistrationMeta).toBeDefined();
  });

  test('should return proper data', () => {
    expect(LogSystem.getRegistrationMeta()).toEqual({
      type: 'core',
      title: 'Система логирования',
      name: 'LogSystem',
    });
  });
});

describe('LogSystem:log', () => {
  afterEach(() => {
    ls = new LogSystem();
  });
  test('should be defined', () => {
    expect(ls.log).toBeDefined();
  });

  test('add log record to array', () => {
    expect(ls.logs.length).toBe(0);
    expect(ls.log('1', 'testPlugin', 'test record')).toBe(true);
    expect(ls.logs.length).toBe(1);

    expect(ls.logs[0]).toEqual({
      timestamps: expect.any(Number),
      plugin: 'testPlugin',
      message: 'test record',
      guid: '1',
    });
  });

  test('empty string are not accepted', () => {
    expect(ls.log('', '', '')).toBe(false);
    expect(ls.logs.length).toBe(0);
  });

  test('wrong types are not accepted', () => {
    expect(ls.log(1, [], {})).toBe(false);
    expect(ls.logs.length).toBe(0);
  });
});
