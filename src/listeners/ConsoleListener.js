import debug from 'debug'

const STDERR_LEVELS = ['fatal', 'error', 'warn']
const STDOUT_LEVELS = ['info', 'debug', 'trace']
const DEBUG_FNS = {}

function findOrCreateDebugFn (level, name) {
  const debugName = `${name}:${level}`
  if (debugName in DEBUG_FNS) {
    return debugName
  } else {
    const debugFn = debug(debugName)
    debug.enable(debugName)

    if (STDERR.indexOf(level) === -1) {
      debugFn.log = console.log.bind(console)
    } else {
      debugFn.log = console.error.bind(console)
    }

    DEBUG_FNS[debugName] = debugFn
    return debugFn
  }
}

export default function ({ level, name, data }) {
  const debugFn = findOrCreateDebugFn(level, name)
  debugFn(...data)
}
