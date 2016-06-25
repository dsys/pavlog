import consoleListener from '../listeners/console'
import jsonListener from '../listeners/json'
import createLogger from '../logger'
import http from 'http'
import supertest from 'supertest'
import MockDate from 'mockdate'
import { LEVELS } from '../levels'

jest.disableAutomock()
jest.mock('../listeners/console')
jest.mock('../listeners/json')

MockDate.set(0)

describe('logger', () => {
  it('emits log events at the INFO level when called directly', () => {
    const logger = createLogger()
    const listener = jest.genMockFunction()

    logger.use('info', listener)
    logger('foobar', { test: 'data' })

    expect(listener).toBeCalledWith({
      pavlog: '',
      level: 'info',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'foobar',
      format: 'foobar',
      test: 'data'
    })
  })

  it('emits log events at a specified level', () => {
    for (let level of LEVELS) {
      const logger = createLogger()
      const listener = jest.genMockFunction()

      logger.use(level, listener)

      const logFn = logger[level]
      logFn('foobar', { test: level })

      expect(listener).toBeCalledWith({
        pavlog: '',
        level,
        timestamp: '1970-01-01T00:00:00.000Z',
        message: 'foobar',
        format: 'foobar',
        test: level
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
      pavlog: '',
      level: 'info',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'infoEvent',
      format: 'infoEvent'
    }

    const fatalEvent = {
      pavlog: '',
      level: 'fatal',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'fatalEvent',
      format: 'fatalEvent'
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
      pavlog: 'sam:marc',
      level: 'info',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'infoEvent',
      format: 'infoEvent',
      test: 'data'
    }

    const fatalEvent = {
      pavlog: 'sam:marc:alex',
      level: 'fatal',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'fatalEvent',
      format: 'fatalEvent',
      test: 'data'
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
    expect(() => createLogger('$')).toThrow()
    expect(() => createLogger(' ')).toThrow()
    expect(() => createLogger('a*c')).toThrow()
  })

  it('has a helper for using a human-friendly console listener', () => {
    const logger = createLogger('console')

    logger.useConsole()
    logger('foobar')

    expect(consoleListener.mock.calls.length).toBe(1)
    expect(consoleListener.mock.calls[0]).toEqual([{
      pavlog: 'console',
      level: 'info',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'foobar',
      format: 'foobar'
    }])
  })

  it('has a helper for using a JSON console listener', () => {
    const logger = createLogger('console')

    logger.useConsole({ json: true })
    logger('foobar')

    expect(jsonListener.mock.calls.length).toBe(1)
    expect(jsonListener.mock.calls[0]).toEqual([{
      pavlog: 'console',
      level: 'info',
      timestamp: '1970-01-01T00:00:00.000Z',
      message: 'foobar',
      format: 'foobar'
    }])
  })

  it('memoizes loggers with the same name', () => {
    expect(createLogger('foo')).toBe(createLogger('foo'))
  })

  it('throws an error for unknown log levels', () => {
    expect(() => createLogger().use('foo', () => {})).toThrow()
  })

  it('formats errors nicely', () => {
    const logger = createLogger()
    const listener = jest.genMockFunction()

    logger.use('error', listener)
    const err = new Error('all your base are belong to us')
    logger.error(err)

    expect(listener).toBeCalledWith({
      pavlog: '',
      level: 'error',
      timestamp: '1970-01-01T00:00:00.000Z',
      err,
      message: err.message,
      stack: err.stack
    })
  })

  it('throws an error for invalid formats', () => {
    const logger = createLogger()
    expect(() => logger({ foo: 'bar' }))
      .toThrow(new Error('invalid format'))
  })

  it('throws an error for invalid details', () => {
    const logger = createLogger()
    expect(() => logger('foo', 'bar'))
      .toThrow(new Error('invalid details object'))
  })

  it('applies the format using the provided details', () => {
    const logger = createLogger()
    const listener = jest.genMockFunction()

    logger.use('info', listener)
    logger('one {two} three { four } five', { two: 2, four: 'FOUR' })

    expect(listener).toBeCalledWith({
      pavlog: '',
      level: 'info',
      timestamp: '1970-01-01T00:00:00.000Z',
      format: 'one {two} three { four } five',
      message: 'one 2 three FOUR five',
      two: 2,
      four: 'FOUR'
    })
  })

  it('throws an error if the format contains unknown keys', () => {
    const logger = createLogger()
    expect(() => logger('one {two} three {four} five', { two: 2 }))
      .toThrow(new Error('four is not defined'))
  })

  it('logs HTTP requests via middleware', async () => {
    const logger = createLogger()
    const listener = jest.genMockFunction()
    logger.use('info', listener)

    const mw = logger.middleware()
    const server = http.createServer((req, res) => {
      mw(req, res, () => {
        res.statusCode = 200
        res.setHeader('Content-Length', '6')
        res.write('foobar')
        res.end()
      })
    })

    await supertest(server)
      .get('/nice-path-yo')
      .expect(200)

    jest.runAllTicks()

    expect(listener.mock.calls.length).toBe(1)
    expect(listener.mock.calls[0][0].pavlog).toEqual('')
    expect(listener.mock.calls[0][0].level).toEqual('info')
    expect(listener.mock.calls[0][0].contentLength).toEqual('6')
    expect(listener.mock.calls[0][0].format).toEqual('{method} {url} {status} {responseTime} ms - {contentLength}')
    expect(listener.mock.calls[0][0].message).toMatch(/GET \/nice-path-yo 200/)
    expect(listener.mock.calls[0][0].method).toEqual('GET')
    expect(listener.mock.calls[0][0].remoteAddress).toMatch(/127.0.0.1/)
    expect(listener.mock.calls[0][0].responseTime).toMatch(/[\d\.]+/)
    expect(listener.mock.calls[0][0].status).toMatch('200')
    expect(listener.mock.calls[0][0].url).toMatch('/nice-path-yo')
  })
})
