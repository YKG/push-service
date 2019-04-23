const WebSocket = require('ws');

function high(port, localAddress, localPort) {
    return function() {
        const ws = new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '192.168.199.168', localPort: localPort});
        ws.onerror = function(err) {}
        ws.onclose = function(err) {}
        ws.onopen = function() {
            console.log(localPort);
        }
        // new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '192.168.199.168', localPort: localPort});
    }
}

const base = 29081;
const ccnt = {};
const task = {}
for (let i = 50000; i < 60000; i++) {
    setTimeout(high(base, 0, i));
}
