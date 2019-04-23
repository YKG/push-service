const WebSocket = require('ws');
// const wss = new WebSocket.Server({ port: 3000});
var errCnt = 0;
var okCnt = 0;
var closedCnt = 0;
function login(ws) {
    const uesrInfo = {type: 'auth', user: {userId: 'ykg'}};
    ws.send(JSON.stringify(uesrInfo));
}

var msgCnt = 0;
var reportStr;
function report() {
    reportStr = new Date().toISOString() + ' total ' + okCnt + "  " + errCnt + "   " + closedCnt + ' ' + msgCnt + JSON.stringify(ccnt);
    console.log(reportStr);
}

setInterval(report, 1000);

function high(port, i, j) {
    return function() {
            // console.log('ws://192.168.199.167:' + port + ' ' + i + " " + j);
            // const ws = new WebSocket('ws://192.168.199.167:' + port);
            // const ws = new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '192.168.199.168'});
            const ws = new WebSocket('ws://ahk.altx.top:' + port, {localAddress: '192.168.199.167'});
    
            ws.onmessage = function(msg){
                // console.log(msg.data);
                if (msg.data.charAt(0) !== '{') return;
                msg = JSON.parse(msg.data);
                if (msg.type === 'user') {
                    msgCnt++;
                }
            };
    
            ws.onerror = function(err) {
                errCnt++;
                if (errCnt > 10) {
                    console.log(err);
                    Object.keys(task).forEach(k =>{
                        // clearInterval(task[k]);
                    });
                }
                // console.log('err');
            }
    
            ws.onopen = function(msg){
                okCnt++;
                ccnt[port]++;
                if (okCnt > 10000) {
                    clearInterval(task[port]);
                }
                // n = getNext();
                // high(21500 + n)();
                //document.write('open');
                // console.log('open');
                login(ws);
            };
    
            ws.onclose = function(msg){
                closedCnt++;
            };
    }
}

// const base = 21500;
const base = 29081;
const ccnt = {};
const task = {}
for (let i = 0; i < 1; i++) {
    let port = base + i;
    ccnt[port] = 0;
    task[port] = setInterval(high(port, i, 0), 1);
}
