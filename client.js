const WebSocket = require('ws');

const mq = new WebSocket('ws://ahk.altx.top:29081', {localAddress: '192.168.199.167', localPort: 55555});
const mq2 = new WebSocket('ws://ahk.altx.top:29081', {localAddress: '192.168.199.168', localPort: 55555});
