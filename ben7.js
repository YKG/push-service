const WebSocket = require('ws');
const host = '10.140.0.2';
const port = 29081;

function high(localAddress) {
    return function() {
        const addr = ('ws://' + host + ':' + port + '  ' + localAddress);
        console.log(addr);

        const ws = new WebSocket('ws://' + host + ':' + port);
        ws.onerror = function(err) {
            console.log(err.message);
        }
        ws.onclose = function(err) {
            console.log(err.message);
        }
        ws.onopen = function() {
            // console.log(ws);
        }
        // new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '10.0.140.168', localPort: localPort});
    }
}

function high1(localAddress) {
    return function() {
        const addr = ('ws://' + host + ':' + port + '  ' + localAddress);
        console.log(addr);
    }
}

const ConnPerSec = 1;
const SecondsPerHost = 5;
const Hosts = 1;

for (let k = 0; k < Hosts; k++) {
    let host = '10.0.140.' + (k + 167);

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
