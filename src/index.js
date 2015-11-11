import ConsoleListener from './listeners/ConsoleListener'
import EventEmitter from 'events'
import _ from 'lodash'

const LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace'
]

const DEFAULT_LEVEL = 'info'

function isValidLevel (level) {
  return LEVELS.indexOf(level) !== -1
}

function compareLevels (a, b) {
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
  return _(names)
    .map(n => n.split(':'))
    .flatten()
    .compact()
    .join(':')
}

function createLogger (name = '', parentEmitter = null) {
  const emitter = new EventEmitter()

  if (parentEmitter) {
    emitter.on('log', ev => parentEmitter.emit('log', ev))
  }

  function emitLog (level, name, data) {
    if (isValidLevel(level)) {
      emitter.emit('log', { level, name, data })
    } else {
      throw new Error(`Invalid log level '${level}'`)
    }
  }

  function use (minLevel, listener) {
    emitter.on('log', ev => {
      if (compareLevels(ev.level, minLevel) >= 0) {
        listener(ev)
      }
    })
  }

  function logger (...args) {
    emitLog(DEFAULT_LEVEL, name, args)
  }

  const loggerFns = {
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
  }

  for (let fnName in loggerFns) {
    logger[fnName] = loggerFns[fnName]
  }

  return logger
}

export default createLogger()
