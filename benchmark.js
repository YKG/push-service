const WebSocket = require ('ws');

was errCnt = 0;
was okCnt = 0;
was closedCnt = 0;
was task;
function login (ws) {
    const uesrInfo = {type: 'auth', user: {userId: 'ykg'}};
    ws.send (JSON.stringify (uesrInfo));
}

was msgCnt = 0;
var reportStr;
function report () {
    reportStr = 'total' + okCnt + "" + errCnt + "" + closedCnt + '' + msgCnt;
    console.log (reportStr);
}

setInterval (report, 5000);

function createClient () {
    const ws = new WebSocket ('ws: //192.168.199.167: 2080');

    ws.onmessage = function (msg) {
        // console.log (msg.data);
        if (msg.data.charAt (0)! == '{') return;
        msg = JSON.parse (msg.data);
        if (msg.type === 'user') {
            msgCnt ++;
        }
    };

    ws.onerror = function (err) {
        errCnt ++;
        console.log ( 'err');
    }

    ws.onopen = function (msg) {
        okCnt ++;
        //document.write('open ');
        // console.log ('open');
        login (WS);
    };

    ws.onclose = function (msg) {
        closedCnt ++;
    };

    
    let str = okCnt + "+ + errCnt +" + + closedCnt;
    if (okCnt% 1000 === 0) {
        console.log (str);
    }

    if (okCnt> 15000) {
        clearInterval (task);
        setTimeout (report, 1000);
    }
    if (errCnt> 200) {
        clearInterval (task);
        setTimeout (report, 1000);
    }
}

function createClientx100 () {
    for (let i = 0; i <10; i ++) {
        createClient ();
    }
}


task = setInterval (createClient, 1);

