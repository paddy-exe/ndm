/*global require,process,Buffer*/
import NpmOperations from './npm-operations.js';

const npm = require('npm')
  , stream = require('stream')
  , writable = new stream.Writable({
    'write': (chunk, encoding, next) => {
      const thisLogBuffer = new Buffer(chunk)
        , thisLog = thisLogBuffer
          .toString()
          .trim();

      if (thisLog) {

        process.send({
          'type': 'log',
          'payload': thisLog
        });
      }

      next();
    }
  })
  , npmDefaultConfiguration = {
    'loglevel': 'info',
    'progress': false,
    'logstream': writable
  }
  , exec = (folder, isGlobal, command, param1, param2) => {
    const confObject = Object.assign({},
          npmDefaultConfiguration,
          {
            'prefix': folder,
            'global': isGlobal
          });

    process.send({folder, isGlobal, command, param1, param2});
    return npm.load(confObject, (err, configuredNpm) => {
      if (err) {

        process.send({
          'type': 'error',
          'payload': err
        });
      }
      const npmOperations = new NpmOperations(folder, configuredNpm, isGlobal);

      npmOperations[command](param1, param2).then(resolved => process.send({
        'type': command,
        'payload': resolved
      }));
    });
  }
  , inputs = process.argv
     .slice(2)
     .map(element => {
      try {

        return JSON.parse(element);
      } catch (err) {

        if (element === 'undefined') {

          return undefined;
        }

        return element;
      }
    });

exec(...inputs);
