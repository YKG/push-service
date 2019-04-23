const WebSocket = require('ws');

function high(port, localAddress, localPort) {
    return function() {
        const ws = new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '192.168.199.172', localPort: localPort});
        ws.onerror = function(err) {
            console.log(err.message);
        }
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

let t = 50000;
for (let n = 1; n < 200; n++) {
    function delay() {
        for (let i = 0; i < 50; i++) {
            setTimeout(high(base, 0, t));
            t++;
        }
    }
    setTimeout(delay, n * 1000);
}
