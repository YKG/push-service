const WebSocket = require('ws');
const Util = require('./Util');
const Config = require('./Config');

const userId = process.argv[2] || 'anonymous';
const mq = new WebSocket(Config.mq.url);

connect(Config.urls.anonymous, userId);

function connect(url, userId) {
    const client = new WebSocket(url);

    function login(userId, client) {
        const payload = {type: 'auth', data: {userId: userId, ts: Date.now()}};
        client.send(Util.toJson(payload));
    }
    
    client.on('open', function() {
        console.log(new Date().toISOString() + '          : Connection opened   ' + url);
        if (userId !== 'anonymous') {
            login(userId, client);
        }
    });
    
    client.on('message', function(msg) {
        console.log(new Date().toISOString() + ' >>>>>>>>>: ' + msg);
        if (Util.fromJson(msg).type === 'redirect') {
            connect(Util.fromJson(msg).data.url, userId);
        }
    });
    
    client.on('error', function() {
        console.log(new Date().toISOString() + '          : Connection error    ' + url);
    });
    
    client.on('close', function() {
        console.log(new Date().toISOString() + '          : Connection closed   ' + url);
    });
}
