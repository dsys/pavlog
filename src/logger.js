import EventEmitter from 'events'
import _ from 'lodash'
import consoleListener from './listeners/console'
import morgan from 'morgan'
import { LEVELS, DEFAULT_LEVEL, isValidLevel, compareLevels } from './levels'

const DEFAULT_MIDDLEWARE_FORMAT = '{method} {url} {status} {responseTime} ms - {contentLength}'
const FORMAT_REGEXP = /{([\s\S]+?)}/g
const NAME_REGEXP = /^([\w-]+(:[\w-]+)*)?$/

function isValidName (name) {
  return NAME_REGEXP.test(name)
}

function combineNames (...names) {
  return _.compact(_.flatten(names.map(n => n.split(':')))).join(':')
}

function applyFormat (format, details) {
  const compiled = _.template(format, { interpolate: FORMAT_REGEXP })
  return compiled(details)
}

const LOGGERS = {}

/**
 * Creates a logger function-object.
 * @param {string} name
 * @param {?EventEmitter} parentEmitter
 * @returns {Object}
 */
function createLogger (name = '', parentEmitter = null) {
  if (!isValidName(name)) {
    throw new Error(`invalid log name '${name}'`)
  } else if (name in LOGGERS) {
    return LOGGERS[name]
  } else {
    const emitter = new EventEmitter()

    if (parentEmitter) {
      emitter.on('log', ev => parentEmitter.emit('log', ev))
    }

    const emitLog = (level, name, formatOrErr, details = {}) => {
      if (typeof details !== 'object') {
        throw new Error('invalid details object')
      }

      const data = Object.assign({}, details)

      if (_.isError(formatOrErr)) {
        Object.assign(data, {
          err: formatOrErr,
          stack: formatOrErr.stack,
          message: formatOrErr.message
        })
      } else if (typeof formatOrErr === 'string') {
        Object.assign(data, {
          format: formatOrErr,
          message: applyFormat(formatOrErr, details)
        })
      } else {
        throw new Error('invalid format')
      }

      emitter.emit('log', { level, name, data })
    }

    const logger = (...args) => emitLog(DEFAULT_LEVEL, name, ...args)
    for (let level of LEVELS) {
      logger[level] = (...args) => emitLog(level, name, ...args)
    }

    logger.use = (minLevel, listener) => {
      if (isValidLevel(minLevel)) {
        emitter.on('log', ev => {
          if (compareLevels(ev.level, minLevel) >= 0) {
            listener(ev)
          }
        })
      } else {
        throw new Error(`invalid log level '${minLevel}'`)
      }
    }

    logger.useConsole = (minLevel = DEFAULT_LEVEL) => {
      return logger.use(minLevel, consoleListener)
    }

    logger.child = (namePart) => {
      const childName = combineNames(name, namePart)
      return createLogger(childName, emitter)
    }

    logger.middleware = ({
      level = DEFAULT_LEVEL,
      format = DEFAULT_MIDDLEWARE_FORMAT
    } = {}) => {
      return morgan((tokens, req, res) => {
        const details = {
          remoteAddress: tokens['remote-addr'](req, res),
          method: tokens['method'](req, res),
          url: tokens['url'](req, res),
          status: tokens['status'](req, res),
          responseTime: tokens['response-time'](req, res),
          contentLength: tokens['res'](req, res, 'content-length')
        }

        logger(format, details)
      })
    }

    LOGGERS[name] = logger
    return logger
  }
}

export default createLogger
