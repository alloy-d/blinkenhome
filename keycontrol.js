require('keypress')(process.stdin);
const Bacon = require('baconjs');

const ZWave = require('./zwave-init')();

function logKeypress(args) {
  console.log('ch: ', args.ch, '; key: ', args.key);
}

function parseValue(str) {
  var int = parseInt(str);
  return !Number.isNaN(int) ? int : null;
}

const keystream = Bacon.fromBinder(function (sink) {
  process.stdin.on('keypress', function (ch, key) {
    if (key && key.ctrl && key.name === 'c') {
      process.stdin.pause();
      sink(new Bacon.End());
    } else {
      sink(new Bacon.Next({ch: ch, key: key}));
    }
  });
  return function unsubscribe() {};
});

const lightLevel = keystream
  .map('.ch')
  .map(parseValue)
  .filter(function (val) { return val !== null; })
  .map(function (num) { return num * 11; });

lightLevel.log();

ZWave.then(function (zwave) {
  lightLevel.onValue(function (value) {
    zwave.setValue(5, 38, 1, 0, value);
  });
});

process.stdin.setRawMode(true);
