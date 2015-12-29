jest.dontMock('../levels')
jest.dontMock('../logger')
jest.dontMock('events')
jest.dontMock('lodash')

const consoleListener = require('../listeners/console')
const createLogger = require('../logger')
const { LEVELS } = require('../levels')

describe('logger', () => {
  it('emits log events at the INFO level when called directly', () => {
    const logger = createLogger()
    const listener = jest.genMockFunction()

    logger.use('info', listener)
    logger('foobar', { test: 'data' })

    expect(listener).toBeCalledWith({
      level: 'info',
      name: '',
      data: ['foobar', { test: 'data' }]
    })
  })

  it('emits log events at a specified level', () => {
    for (let level of LEVELS) {
      const logger = createLogger()
      const listener = jest.genMockFunction()

      logger.use(level, listener)

      const logFn = logger[level]
      logFn({ level, test: 'data' })

      expect(listener).toBeCalledWith({
        level: level,
        name: '',
        data: [{ level, test: 'data' }]
      })
    }
  })

  it('invokes listeners for logs at or above their minimum level', () => {
    const logger = createLogger()
    const fatalListener = jest.genMockFunction()
    const infoListener = jest.genMockFunction()

    logger.use('info', infoListener)
    logger.use('fatal', fatalListener)

    logger('infoEvent')
    logger.fatal('fatalEvent')

    const infoEvent = {
      level: 'info',
      name: '',
      data: ['infoEvent']
    }

    const fatalEvent = {
      level: 'fatal',
      name: '',
      data: ['fatalEvent']
    }

    expect(infoListener.mock.calls.length).toBe(2)
    expect(infoListener.mock.calls[0]).toEqual([infoEvent])
    expect(infoListener.mock.calls[1]).toEqual([fatalEvent])

    expect(fatalListener.mock.calls.length).toBe(1)
    expect(fatalListener.mock.calls[0]).toEqual([fatalEvent])
  })

  it('spawns child loggers whose logs bubble up', () => {
    const grandparentLog = createLogger('sam')
    const parentLog = grandparentLog.child('marc')
    const childLog = parentLog.child('alex')

    const grandparentListener = jest.genMockFunction()
    const parentListener = jest.genMockFunction()
    const childListener = jest.genMockFunction()

    grandparentLog.use('info', grandparentListener)
    parentLog.use('fatal', parentListener)
    childLog.use('info', childListener)

    parentLog('infoEvent', { test: 'data' })
    childLog.fatal('fatalEvent', { test: 'data' })

    const infoEvent = {
      level: 'info',
      name: 'sam:marc',
      data: ['infoEvent', { test: 'data' }]
    }

    const fatalEvent = {
      level: 'fatal',
      name: 'sam:marc:alex',
      data: ['fatalEvent', { test: 'data' }]
    }

    expect(childListener.mock.calls.length).toBe(1)
    expect(childListener.mock.calls[0]).toEqual([fatalEvent])

    expect(parentListener.mock.calls.length).toBe(1)
    expect(parentListener.mock.calls[0]).toEqual([fatalEvent])

    expect(grandparentListener.mock.calls.length).toBe(2)
    expect(grandparentListener.mock.calls[0]).toEqual([infoEvent])
    expect(grandparentListener.mock.calls[1]).toEqual([fatalEvent])
  })

  it('validates logger names only contain alphanumeric, colon, dash, or underscore characters', () => {
    expect(() => createLogger('abc')).not.toThrow()
    expect(() => createLogger('ABC')).not.toThrow()
    expect(() => createLogger('123')).not.toThrow()
    expect(() => createLogger('-abc-')).not.toThrow()
    expect(() => createLogger('_abc_')).not.toThrow()
    expect(() => createLogger('a:b:c')).not.toThrow()
    expect(() => createLogger('$')).toThrow("Invalid log name '$'")
    expect(() => createLogger(' ')).toThrow("Invalid log name ' '")
    expect(() => createLogger('a*c')).toThrow("Invalid log name 'a*c'")
  })

  it('has a helper for using a console listener', () => {
    const logger = createLogger('console')

    logger.useConsole()
    logger('foobar')

    expect(consoleListener.mock.calls.length).toBe(1)
    expect(consoleListener.mock.calls[0]).toEqual([{
      level: 'info',
      name: 'console',
      data: ['foobar']
    }])
  })

  it('memoizes loggers with the same name', () => {
    expect(createLogger('foo')).toBe(createLogger('foo'))
  })

  it('throws an error for unknown log levels', () => {
    expect(() => createLogger().use('foo', () => {})).toThrow()
  })
})
