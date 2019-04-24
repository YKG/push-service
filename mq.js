const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const Util = require('./Util');

const dummyClient = {send: function(msg){ console.log('dummy', msg)}};

const NClient = 2;
const Clients = {0: dummyClient, 1: dummyClient};
Clients[NaN] = dummyClient;
const mqs = new WebSocket.Server({ port: 25673 });

mqs.on('connection', function incoming(client) {
    client.on('message', function(msg) {
        
        message = Util.fromJson(msg);
        if (message.type === 'register-push-client') { // MQ <--- push client
            Clients[message.data.remainder % 2] = client;
            client.on('message', function(){});
            console.log(new Date().toISOString() + ' msg: ' + msg + " clients.size " + mqs.clients.size);
        } else {  // msg source ---> MQ
            try {
                Clients[message.data.userId % 2].send(msg);
            } catch (e) {
                console.log(Util.toJson(Object.keys(Clients)), e);
            }
            // console.log(new Date().toISOString() + ' route message: ' + msg);
        }
    });
});

const mqClient = new WebSocket('ws://127.0.0.1:25673');
function toYKG() {
    const ws = mqClient;
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify({type: 'direct', data: {userId: "anonymous", msg: new Date().toISOString(), ts: Date.now()}}));
    ws.send(JSON.stringify({type: 'direct', data: {userId: 1001, msg: new Date().toISOString(), ts: Date.now()}}));
    ws.send(JSON.stringify({type: 'direct', data: {userId: 1002, msg: new Date().toISOString(), ts: Date.now()}}));
}
setInterval(toYKG, 3000);
