
const Util = require('./Util');
const fs = require('fs');
const uuid = require('uuid/v4');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const Fib = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

function minutes(i) {
    return Fib[i] * MINUTE;
}

function updateIntervals(ws) {
    if (!ws.last3Intervals) {
        ws.last3Intervals = {val: [0, 0, 0], index: 0, lastTs: Date.now(), cnt: 0, moreThan3Msg: false};
    }

    const intervals = ws.last3Intervals;
    const now = Date.now();
    intervals.val[intervals.index % 3] = now - intervals.lastTs;
    intervals.lastTs = now;
    intervals.index = (intervals.index + 1) % 3;
    // console.log(intervals.val[0] + ' ' + intervals.val[1] + ' ' + intervals.val[2]);
    
    if (!intervals.moreThan3Msg) {
        intervals.cnt++;
        if (intervals.cnt > 3) {
            intervals.moreThan3Msg = true;
        }
    }
}

function needUpgradeBuffer(ws) {
    if (!ws.last3Intervals.moreThan3Msg) return false;
    const val = ws.last3Intervals.val;
    return val[0] + val[1] + val[2] < 3 * 5 * SECOND;
}

function createChunkBuffer(ws) {
    const fileId = ws.userId + '_' + uuid();
    const bufStream = fs.createWriteStream('out/' + fileId);
    bufStream.on('finish', function(){
        const payload = Util.toJson({type: 'multi-chunk', data: {url: fileId, fileId: fileId}});
        console.log(new Date().toISOString() + ' =========== [multi-chunk] ' + payload + '\n');
        ws.send(payload);
    });
    ws.bufStream = bufStream;
}

function bufferChunk(stream, message) {
    const msg = Util.toJson(message);
    console.log(new Date().toISOString() + '          . [   buf] ' + msg);
    stream.write(msg);
}

function sendMultiChunk(i, ws) {
    return function() {
        const oldStream = ws.bufStream;

        if (needUpgradeBuffer(ws)) {
            if ((i + 1) === Fib.length) i--;
            console.log(new Date().toISOString() + ' ********** [Upgrade]^^^^ size: ' + Fib[i + 1]);
            createChunkBuffer(ws);
            setTimeout(sendMultiChunk(i + 1, ws), minutes(i + 1));
        } else {
            if (i > 1) {
                console.log(new Date().toISOString() + ' ********** [Degrade].... size: ' + Fib[i - 1]);
                createChunkBuffer(ws);
                setTimeout(sendMultiChunk(i - 1, ws), minutes(i - 1));
            }
        }
        oldStream.end();
    }
}

const Sender = {
    send: function(ws, message) {
        if (message.type === 'chunk') {
            updateIntervals(ws);
            if (ws && ws.bufStream && ws.bufStream.writable) {
                try {
                    bufferChunk(ws.bufStream, message);
                } catch (e) {
                    setTimeout(function(){this.send(ws, message)}); // retry
                }
            } else {
                if (needUpgradeBuffer(ws)) {
                    createChunkBuffer(ws);
                    setTimeout(sendMultiChunk(1, ws), minutes(1));

                    bufferChunk(ws.bufStream, message);
                } else {
                    ws.send(Util.toJson(message.data));
                }
            }
        } else {
            ws.send(Util.toJson(message.data));
        }
    }
}

module.exports = Sender;
