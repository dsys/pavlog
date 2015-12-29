import createLogger from './logger'
import morgan from 'morgan'
import through2 from 'through2'

export default function (logger, format) {
  const stream = through2(function (output, enc, callback) {
    logger(output.toString('utf8').trim())
    this.push(output)
    callback()
  })

  return morgan(format, { stream })
}
