const STDERR_LEVELS = ['fatal', 'error', 'warn']

export default function (data) {
  const json = JSON.stringify(data)
  if (STDERR_LEVELS.indexOf(data.level) === -1) {
    console.log(json)
  } else {
    console.error(json)
  }
}
