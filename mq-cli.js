const WebSocket = require('ws');
const Util = require('./Util');
const Config = require('./Config');

const SECOND = 1000;

const userId = process.argv[2] || 'anonymous';
const msg = process.argv[3] || 'Hello World!';
const type = process.argv[4] || 'direct';
const chunkInterval = process.argv[5] || 2;

const url = Config.mq.url;
const mq = new WebSocket(url);



function buildPayload(text) {
    const message = {type: type, data: {userId: userId, msg: text, ts: Date.now()}};
    return Util.toJson(message);
}

function sendDirect(payload) {
    console.log(new Date().toISOString() + ' >>>>>>>>>: ' + payload);
    mq.send(payload);
}

let msgSeq = 1;
function sendChunk() {
    const payload = buildPayload(msg + '  #' +(msgSeq++));
    sendDirect(payload);
}

function sendMsgToMQ() {
    if (type === 'chunk') {
        console.log('interval: ' + chunkInterval * SECOND);
        setInterval(sendChunk, chunkInterval * SECOND);
    } else {
        const payload = buildPayload(msg);
        sendDirect(payload);
        mq.close();
    }
}

mq.on('open', function() {
    console.log(new Date().toISOString() + '          : Connection opened   ' + url);
    sendMsgToMQ();
});

mq.on('message', function(msg) {
    console.log(new Date().toISOString() + ' <<<<<<<<<: ' + msg);
});

mq.on('error', function() {
    console.log(new Date().toISOString() + '          : Connection error    ' + url);
});

mq.on('close', function() {
    console.log(new Date().toISOString() + '          : Connection closed   ' + url);
});