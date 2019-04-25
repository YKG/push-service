const WebSocket = require('ws');
const Util = require('./Util');
const Config = require('./Config');
const Sender = require('./Sender');

const hash = process.argv[2];
const listen = Config.ports[hash];
const server = new WebSocket.Server({ port: listen });
const mq = new WebSocket(Config.mq.url);

const Clients = {};
const EMPTYSET = new Set();

function getUserId(message, register) {
    //rest.getUserId(message, callback); // TODO user/pass cookie
    if (message && message.data && message.data.userId && message.data.userId > 1000) {
        register(message.data.userId);
    } else {
        register(null); // fake auth failed
    }
}

function cleanup(client) {
    if (client && client.userId !== undefined && Clients[client.userId]) {
        Clients[client.userId].delete(client);
    }
}

function redirect(userId, client) {
    const url = Config.urls[Util.hash(userId)];
    console.log(new Date().toISOString() + ' >>>>>>>>>: ' + Util.toJson({type: 'redirect', data: {url: url}}));
    // client.on('message', function(){});
    try {
        client.send(Util.toJson({type: 'redirect', data: {url: url}}));
        client.close();
    } catch (e) {
        console.error(new Date().toISOString() + e);
    }
}

function needRedirect(userId) {
    return hash !== Util.hash(userId);
}

function addClient(userId, client) {
    if (Clients[userId] === undefined) {
        Clients[userId] = new Set();
    }
    Clients[userId].add(client);
    client.userId = userId;
}

function register(userId, client) {
    if (userId === null) {
        client.close();
    } else {
        if (needRedirect(userId)) {
            redirect(userId, client);
        } else {
            addClient(userId, client);
            console.log(Util.toJson(Clients));
        }
    }
}

function auth(message, client) {
    console.log('auth msg: ', Util.toJson(message));
    if (client && client.userId && client.userId !== 'anonymous') {
        client.send(Util.toJson({error: { message: 're-Auth'}}));
        client.close();
        return;
    }
    
    getUserId(message, function(userId) {
        register(userId, client);
    });
}

server.on('connection', function incoming(client) {
    console.log(new Date().toISOString() + ' new conn: ');

    client.on('error', function(err) {
        console.log(new Date().toISOString() + ' error conn: ' + err);
    });
    client.on('close', function(msg) {
        console.log(new Date().toISOString() + ' close conn: ' + msg);
        cleanup(client);
    });
    client.on('message', function(msg) {
        let message = Util.fromJson(msg);
        message.type === 'auth' ? auth(message, client) : client.close();
    });

    setTimeout(function() {
        if (client && client.readyState === 1 && client.userId === undefined) { // anonymous
            register('anonymous', client);
        }
    }, 5000);
});

// msg strcucture
// 
// {
//     type: 'user',
//     data: {
//         userId: 12345
//         msg: 'hello'
//         ts: 1556005966716
//     }
// }
function getClients(message) {
    if (message.type === 'direct' || message.type === 'chunk') {
        let clients = Clients[message.data.userId];
        console.log('Clients[', message.data.userId, '].size', clients && JSON.stringify(clients.size));
        if (clients instanceof Set) return clients;
    } else {
        console.error('Unimplemented message.type: ', message.type);
    }
    return EMPTYSET;
}

mq.on('open', function() {
    message = {type: 'register-push-client', data: {hash: hash}};
    mq.send(Util.toJson(message));
    console.log(new Date().toISOString() + ' [MQ] >>>>: ' + JSON.stringify(message));
});

mq.on('message', function(msg) {
    console.log(new Date().toISOString() + ' [MQ] <<<<: ' + msg + ' ' + server.clients.size);
    let message = Util.fromJson(msg);
    let payload = Util.toJson(message.data);
    getClients(message).forEach(ws => {
        if (ws.readyState === 1) {
            Sender.send(ws, message);
            console.log(new Date().toISOString() + ' >>>>>>>>>: ' + payload);
        }
    })
});

console.log('server listen: ', listen);
