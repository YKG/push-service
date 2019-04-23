const WebSocket = require('ws');
// const host = '10.0.140.2';
const host = 'ahk.altx.top';
const port = 29081;

function run() {
    const addr = ('ws://' + host + ':' + port + '  ');
    console.log(addr);

    const ws = new WebSocket('ws://' + host + ':' + port);
    ws.onerror = function(err) {
        console.log(err.message);
    }
    ws.onclose = function(err) {
        console.log(err.message);
    }
    ws.onopen = function() {
        console.log(ws);
    }
}
run();
