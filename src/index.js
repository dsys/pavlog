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

function combineNames (...names) {
  const nameParts = names.map(n => n.split(':'))
  return [].concat(...nameParts).join(':')
}

function createLogger (name, parentEmitter = null) {
  const emitter = new EventEmitter()

  if (parentEmitter) {
    emitter.on('log', event => parentEmitter.emit(event))
  }

  function emitLog (level, name, data) {
    if (isValidLevel(level)) {
      emitter.emit('log', { level, name, data })
    } else {
      throw new Error(`Invalid log level '${level}'`)
    }
  }

  function use (minLevel, listener) {
    emitter.on(event => {
      if (compareLevels(event.level, minLevel) >= 0) {
        listener(event)
      }
    })
  }

  return Object.assign(...args => {
    emitLog(DEFAULT_LEVEL, name, args)
  }, {
    fatal (...args) {
      emitLog('fatal', name, args)
    },

    error (...args) {
      emitLog('error', name, args)
    },

    warn (...args) {
      emitLog('warn', name, args)
    },

    info (...args) {
      emitLog('info', name, args)
    },

    debug (...args) {
      emitLog('debug', name, args)
    },

    trace (...args) {
      emitLog('trace', name, args)
    },

    use (minLevel, listener) {
      use(minLevel, listener)
    },

    useConsole (minLevel = 'info') {
      use(minLevel, ConsoleListener)
    },

    subLogger (subName) {
      return createLogger(combineNames(name, subName), emitter)
    }
  })
}

export default createLogger([])
