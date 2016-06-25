jest.unmock('../json')
jest.unmock('debug')
jest.unmock('lodash')

const jsonListener = require('../json')

function stripColors (str) {
  return str.replace(/\033\[[0-9;]*m/g, '')
}

describe('JSON listener', () => {
  let stdoutOriginal = null
  let stderrOriginal = null

  beforeEach(() => {
    stdoutOriginal = console.log
    stdoutOriginal = console.log
    console.log = jest.genMockFunction()
    console.error = jest.genMockFunction()
  })

  it('prints logs as JSON', () => {
    const infoEvent = { level: 'info', pavlog: '', message: 'foo' }
    const debugEvent = { level: 'debug', pavlog: 'test', message: 'bar' }
    const fatalEvent = { level: 'fatal', pavlog: 'a:b:c', message: 'baz' }

    jsonListener(infoEvent)
    jsonListener(debugEvent)
    jsonListener(fatalEvent)

    expect(console.log.mock.calls.length).toBe(2)
    expect(stripColors(console.log.mock.calls[0][0])).toBe(JSON.stringify(infoEvent))
    expect(stripColors(console.log.mock.calls[1][0])).toBe(JSON.stringify(debugEvent))

    expect(console.error.mock.calls.length).toBe(1)
    expect(stripColors(console.error.mock.calls[0][0])).toBe(JSON.stringify(fatalEvent))
  })

  afterEach(() => {
    console.log = stdoutOriginal
    console.error = stderrOriginal
  })
})
