require('keypress')(process.stdin);
const Bacon = require('baconjs');

function handleKeypress(args) {
  console.log('ch: ', args.ch, '; key: ', args.key);
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

keystream.onValue(handleKeypress);
keystream.log();

process.stdin.setRawMode(true);
