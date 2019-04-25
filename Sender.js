
const Util = require('./Util');
const fs = require('fs');
const uuid = require('uuid/v4');

const Fib = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
// const Fib = [0, 1, 1, 1, 1, 1, 13, 21, 34, 55, 89];

function shouldStartMerging(ws) {
    if (!ws.last3Intervals.moreThan3Msg) return false;
    const val = ws.last3Intervals.val;
    console.log(val[0], val[1], val[2]);    
    if (val[0] + val[1] + val[2] < 15 * 100) {
        console.log('******* Buffer....');
    } else {
        // console.log(val[0], val[1], val[2]);
    }
    return val[0] + val[1] + val[2] < 15 * 100;
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

function startStreaming(ws) {
    const fileId = ws.userId + '_' + uuid();
    const bufferstream = fs.createWriteStream('out/' + fileId);
    bufferstream.on('finish', function(){
        console.log(new Date().toISOString() + ' ======= [multi-chunk] ' + fileId);
        ws.send(Util.toJson({type: 'multi-chunk', data: {url: fileId, fileId: fileId}}));
    });
    ws.bufferstream = bufferstream;
}

function minutes(i) {
    // return Fib[i + 1] * 60 * 1000;
    return Fib[i + 1] * 5 * 100;
}

function getNFunc(i, ws) {
    return function() {
        const prev = ws.bufferstream;

        if (shouldStartMerging(ws)) {
            if (Fib[i] === 89) i--;
            console.log('**** [Upgrade]^^^^: ' + Fib[i + 1]);
            startStreaming(ws);
            setTimeout(getNFunc(i + 1, ws), minutes(i + 1));
        } else {
            if (i > 1) {
                console.log('**** [Degrade]____: ' + Fib[i - 1]);
                startStreaming(ws);
                setTimeout(getNFunc(i - 1, ws), minutes(i - 1));
            }
        }
        prev.end();
    }
}

function apppendToSteam(stream, message) {
    const msg = Util.toJson(message);
    console.log(new Date().toISOString() + ' ....... [buffer] ' + msg);
    stream.write(msg);
}

const Sender = {
    send: function(ws, message) {
        if (message.type === 'chunk') {
            // console.log(new Date().toISOString() + ' <<<<<<< [chunk] ' + Util.toJson(message));
            updateIntervals(ws);
            if (ws.bufferstream) {
                // console.log('writeable: ', ws.bufferstream.writable);
            }
            if (ws && ws.bufferstream && ws.bufferstream.writable) {
                try {
                    apppendToSteam(ws.bufferstream, message);
                } catch (e) {
                    setTimeout(function(){this.send(ws, message)}); // retry
                }
            } else {
                if (shouldStartMerging(ws)) {
                    startStreaming(ws);

                    setTimeout(getNFunc(1, ws), minutes(1));

                    apppendToSteam(ws.bufferstream, message);
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

// -------------- test
let msgNo = 1;
let task;
ws = {
    send: function(msg){
        console.log(new Date().toISOString() + ' > > > > [send ] ' + msg + '\n');
    },
    userId: 1001
}
function gen() {
    Sender.send(ws, {type: 'chunk', data: {msg: 'MSG [[ #' + msgNo + ' ]] ' + new Date().toISOString()}});
    msgNo++;

    if (msgNo === 50) {
        clearInterval(task);
        setTimeout(function(){
            setInterval(gen, 3000);
        }, 5000);
    }
}

// setTimeout(gen, 3000);
// setTimeout(gen, 6000);
// setTimeout(gen, 9000);

// setTimeout(function(){
//     setInterval(gen, 1000);
// }, 10000);

task = setInterval(gen, 100);