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
