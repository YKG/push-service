const WebSocket = require('ws');
const host = 'ahk.altx.top';
const port = 29081;

function high2(port, localAddress, localPort) {
    return function() {
        const ws = new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '192.168.199.172'});
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

function high(localAddress) {
    return function() {
        const addr = ('ws://' + host + ':' + port + '  ' + localAddress);
        console.log(addr);
    }
}

const ConnPerSec = 5;
const SecondsPerHost = 3;
const Hosts = 3;

for (let k = 0; k < Hosts; k++) {
    let host = '192.168.199.' + (k + 167);

    function run() {
        for (let n = 1; n <= SecondsPerHost; n++) {
            function delay() {
                for (let i = 0; i < ConnPerSec; i++) {
                    setTimeout(high(host));
                }
            }
            setTimeout(delay, n * 1000);
        }
    }
    setTimeout(run, k * SecondsPerHost * 1000);
}
