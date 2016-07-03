var Promise = require('bluebird');
var ZWave = require('openzwave-shared');

module.exports = function (device) {
  if (!device) {
    device = "/dev/ttyACM0";
  }

  return new Promise(function (resolve, reject) {
    var zwave = new ZWave();
    var nodes = [];

    zwave.connect(device);

    zwave.on('scan complete', function() {
        console.log('ZWave scan complete.');
        resolve(zwave);
    });

    zwave.on('driver failed', function() {
        console.log('failed to start driver');
        zwave.disconnect();
        reject('failed to start driver');
    });

    zwave.on('node added', function(nodeid) {
      nodes[nodeid] = {
        manufacturer: '',
        manufacturerid: '',
        product: '',
        producttype: '',
        productid: '',
        type: '',
        name: '',
        loc: '',
        classes: {},
        ready: false,
      };
    });

    zwave.on('value added', function(nodeid, comclass, value) {
        if (!nodes[nodeid]['classes'][comclass])
            nodes[nodeid]['classes'][comclass] = {};
        nodes[nodeid]['classes'][comclass][value.index] = value;
    });

    zwave.on('value changed', function(nodeid, comclass, value) {
        if (nodes[nodeid]['ready']) {
            console.log('node%d: changed: %d:%s:%s->%s', nodeid, comclass,
                    value['label'],
                    nodes[nodeid]['classes'][comclass][value.index]['value'],
                    value['value']);
        }
        nodes[nodeid]['classes'][comclass][value.index] = value;
    });

    zwave.on('value removed', function(nodeid, comclass, index) {
        if (nodes[nodeid]['classes'][comclass] &&
            nodes[nodeid]['classes'][comclass][index])
            delete nodes[nodeid]['classes'][comclass][index];
    });

    zwave.on('node ready', function(nodeid, nodeinfo) {
        nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
        nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
        nodes[nodeid]['product'] = nodeinfo.product;
        nodes[nodeid]['producttype'] = nodeinfo.producttype;
        nodes[nodeid]['productid'] = nodeinfo.productid;
        nodes[nodeid]['type'] = nodeinfo.type;
        nodes[nodeid]['name'] = nodeinfo.name;
        nodes[nodeid]['loc'] = nodeinfo.loc;
        nodes[nodeid]['ready'] = true;
        console.log('node%d: %s, %s', nodeid,
                nodeinfo.manufacturer ? nodeinfo.manufacturer
                          : 'id=' + nodeinfo.manufacturerid,
                nodeinfo.product ? nodeinfo.product
                         : 'product=' + nodeinfo.productid +
                           ', type=' + nodeinfo.producttype);
        console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
                nodeinfo.name,
                nodeinfo.type,
                nodeinfo.loc);
        for (comclass in nodes[nodeid]['classes']) {
            switch (comclass) {
            case 0x25: // COMMAND_CLASS_SWITCH_BINARY
            case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
                zwave.enablePoll(nodeid, comclass);
                break;
            }
            var values = nodes[nodeid]['classes'][comclass];
            console.log('node%d: class %d', nodeid, comclass);
            for (idx in values)
                console.log('node%d:   %s=%s', nodeid, values[idx]['label'], values[idx]['value']);
        }
    });
  });
}

