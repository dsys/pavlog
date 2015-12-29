jest.dontMock('../console')
jest.dontMock('debug')
jest.dontMock('lodash')

const consoleListener = require('../console')

function stripColors (str) {
  return str.replace(/\033\[[0-9;]*m/g, '')
}

describe('console listener', () => {
  let stdoutOriginal = null
  let stderrOriginal = null

  beforeEach(() => {
    stdoutOriginal = console.log
    stdoutOriginal = console.log
    console.log = jest.genMockFunction()
    console.error = jest.genMockFunction()
  })

  it('prints logs using node-debug', () => {
    consoleListener({ level: 'info', name: '', data: ['foo'] })
    consoleListener({ level: 'debug', name: 'test', data: ['bar'] })
    consoleListener({ level: 'fatal', name: 'a:b:c', data: ['baz'] })

    expect(console.log.mock.calls.length).toBe(2)
    expect(stripColors(console.log.mock.calls[0][0])).toMatch(/info foo/)
    expect(stripColors(console.log.mock.calls[1][0])).toMatch(/test:debug bar/)

    expect(console.error.mock.calls.length).toBe(1)
    expect(stripColors(console.error.mock.calls[0][0])).toMatch(/a:b:c:fatal baz/)
  })

  afterEach(() => {
    console.log = stdoutOriginal
    console.error = stderrOriginal
  })
})
