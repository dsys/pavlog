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

function logger (level, name, emitter) {
  return function (...args) {
    emitter.emitLog(level, name, args)
  }
}

export default function (name, emitter = defaultEmitter) {
  return logger(DEFAULT_LEVEL, name, emitter)
}

export function fatal (name, emitter = defaultEmitter) {
  return logger('fatal', name, emitter)
}

export function error (name, emitter = defaultEmitter) {
  return logger('error', name, emitter)
}

export function warn (name, emitter = defaultEmitter) {
  return logger('warn', name, emitter)
}

export function info (name, emitter = defaultEmitter) {
  return logger('info', name, emitter)
}

export function debug (name, emitter = defaultEmitter) {
  return logger('debug', name, emitter)
}

export function trace (name, emitter = defaultEmitter) {
  return logger('trace', name, emitter)
}

export function use (minLevel, listener, emitter = defaultEmitter) {
  emitter.use(minLevel, listener)
}

export function useConsole (minLevel = 'info', emitter = defaultEmitter) {
  use(minLevel, ConsoleListener, emitter)
}
