import createLogger from './logger'
import middleware from './middleware'

const rootLogger = createLogger()
rootLogger.middleware = middleware
export default rootLogger
