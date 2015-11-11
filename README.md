# pavlog

Unified logging for npm modules.

## Installation

    $ npm install pavlog --save

## Usage

```javascript
import pavlog from 'pavlog'
pavlog.useConsole()

const log = pavlog.subLogger('olive')

log('Start logging...') // default level: info
log.fatal('All your base are belong to us!')
```

## TODO

* Advanced console pretty-printing (esp. for errors)
* Listeners for other logging services
* More documentation
* Unit tests

## License

[BSD 3-Clause](https://github.com/pavlovml/pavlog/blob/master/LICENSE)
