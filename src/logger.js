import consoleListener from './listeners/console'
import EventEmitter from 'events'
import _ from 'lodash'
import { LEVELS, DEFAULT_LEVEL, isValidLevel, compareLevels } from './levels'

const NAME_REGEXP = /^([\w-]+(:[\w-]+)*)?$/

function isValidName (name) {
  return NAME_REGEXP.test(name)
}

function combineNames (...names) {
  return _(names)
    .map(n => n.split(':'))
    .flatten()
    .compact()
    .join(':')
}

const LOGGERS = {}

function createLogger (name = '', parentEmitter = null) {
  if (!isValidName(name)) {
    throw new Error(`Invalid log name '${name}'`)
  } else if (name in LOGGERS) {
    return LOGGERS[name]
  } else {
    const emitter = new EventEmitter()

    if (parentEmitter) {
      emitter.on('log', ev => parentEmitter.emit('log', ev))
    }

    function emitLog (level, name, data) {
      emitter.emit('log', { level, name, data })
    }

    function logger (...args) {
      emitLog(DEFAULT_LEVEL, name, args)
    }

    for (let level of LEVELS) {
      logger[level] = (...args) => emitLog(level, name, args)
    }

    logger.use = (minLevel, listener) => {
      if (isValidLevel(minLevel)) {
        emitter.on('log', ev => {
          if (compareLevels(ev.level, minLevel) >= 0) {
            listener(ev)
          }
        })
      } else {
        throw new Error(`Invalid log level '${minLevel}'`)
      }
    }

    logger.useConsole = (minLevel = DEFAULT_LEVEL) => {
      return logger.use(minLevel, consoleListener)
    }

    logger.child = namePart => {
      const childName = combineNames(name, namePart)
      return createLogger(childName, emitter)
    }

    LOGGERS[name] = logger
    return logger
  }
}

export default createLogger
