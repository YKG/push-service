const WebSocket = require('ws');
const Util = require('./Util');
const Config = require('./Config');

const dummyClient = {send: function(msg){ console.log('dummy', msg)}};

const NClient = Config.NClient;
const Clients = {};
for (let i = 0; i < NClient; i++) {
    Clients[i] = dummyClient;
}
Clients[NaN] = dummyClient;

const mqs = new WebSocket.Server({ port: Config.mq.port });

mqs.on('connection', function incoming(client) {
    client.on('message', function(msg) {
        message = Util.fromJson(msg);
        if (message.type === 'register-push-client') { // MQ <--- push client
            let index = message.data.hash % NClient;
            Clients[index] = client;
            client.on('message', function(){});
            client.on('close', function(){
                Clients[index] = dummyClient;
            });
            console.log(new Date().toISOString() + ' msg: ' + msg + " clients.size " + mqs.clients.size);
        } else {  // msg source ---> MQ
            try {
                Clients[message.data.userId % NClient].send(msg);
            } catch (e) {
                console.log(Util.toJson(Object.keys(Clients)), e.message);
            }
        }
    });
});
// ---------- message generator -----------------------------------
const mqClient = new WebSocket(Config.mq.url);
function toYKG() {
    const ws = mqClient;
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify({type: 'direct', data: {userId: "anonymous", msg: new Date().toISOString(), ts: Date.now()}}));
    ws.send(JSON.stringify({type: 'direct', data: {userId: 1001, msg: new Date().toISOString(), ts: Date.now()}}));
    ws.send(JSON.stringify({type: 'direct', data: {userId: 1002, msg: new Date().toISOString(), ts: Date.now()}}));
    ws.send(JSON.stringify({type: 'chunk', data: {userId: 1002, msg: '[[chunk]] ' + new Date().toISOString(), ts: Date.now()}}));
    ws.send(JSON.stringify({type: 'chunk', data: {userId: 1003, msg: '[[chunk]] ' + new Date().toISOString(), ts: Date.now()}}));
}
setInterval(toYKG, 3000);
