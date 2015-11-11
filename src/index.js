import ConsoleListener from './listeners/ConsoleListener'
import EventEmitter from 'events'

export const LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace'
]

export const DEFAULT_LEVEL = 'info'

export function isValidLevel (level) {
  return LEVELS.indexOf(level) !== -1
}

export function compareLevels (a, b) {
  const aVal = LEVELS.indexOf(a) 
  const bVal = LEVELS.indexOf(b) 
  if (aVal < bVal) {
    return 1
  } else if (aVal === bVal) {
    return 0
  } else {
    return -1
  }
}

export class LogEmitter extends EventEmitter {
  emitLog (level, name, data) {
    if (isValidLevel(level)) {
      this.emit('log', { level, name, data })
    } else {
      throw new Error(`Invalid log level '${level}'`)
    }
  }

  use (minLevel, listener) {
    this.on(event => {
      if (compareLevels(event.level, minLevel) >= 0) {
        listener(event)
      }
    })
  }
}

export const defaultEmitter = new LogEmitter()

export default function (name, emitter = defaultEmitter) {
  const fn = (...args) => {
    emitter.emitLog(DEFAULT_LEVEL, name, args)
  }

  fn.fatal = (...args) => {
    emitter.emitLog('fatal', name, args)
  }

  fn.error = (...args) => {
    emitter.emitLog('error', name, args)
  }

  fn.warn = (...args) => {
    emitter.emitLog('warn', name, args)
  }

  fn.info = (...args) => {
    emitter.emitLog('info', name, args)
  }

  fn.debug = (...args) => {
    emitter.emitLog('debug', name, args)
  }

  fn.trace = (...args) => {
    emitter.emitLog('trace', name, args)
  }

  return fn
}

export function use (minLevel, listener, emitter = defaultEmitter) {
  emitter.use(minLevel, listener)
}

export function useConsole (minLevel = 'info', emitter = defaultEmitter) {
  use(minLevel, ConsoleListener, emitter)
}
