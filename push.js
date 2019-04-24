const WebSocket = require('ws');
const Util = require('./Util');
const Config = require('./Config');

const hash = process.argv[2];
const listen = Config.ports[hash];
const server = new WebSocket.Server({ port: listen });
const mq = new WebSocket(Config.mq.url);

const Clients = {};
const EMPTYSET = new Set();

function getUserId(message, register) {
    //DB.getUserId(message, callback); // TODO user/pass cookie
    register(message.data.userId);
}

function cleanup(client) {
    if (client && client.userId !== undefined && Clients[client.userId]) {
        Clients[client.userId].delete(client);
    }
}

function redirect(userId, client) {
    const url = Config.urls[Util.hash(userId)];
    client.send(Util.toJson({type: 'redirect', data: {url: url}}));
    client.close();
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
        if (client && client.userId === undefined) { // anonymous
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
    if (message.type === 'direct') {
        let clients = Clients[message.data.userId];
        console.log('clients: ', message.data.userId, clients && JSON.stringify(clients.size));
        if (clients instanceof Set) return clients;
    } else {
        console.error('Unimplemented message.type: ', message.type);
    }
    return EMPTYSET;
}

mq.on('open', function() {
    message = {type: 'register-push-client', data: {hash: hash}};
    mq.send(Util.toJson(message));
    console.log(new Date().toISOString() + ' send message: ' + JSON.stringify(message));
});

mq.on('message', function(msg) {
    console.log(new Date().toISOString() + ' mq msg: ' + msg + " clients.size " + server.clients.size);
    let message = Util.fromJson(msg);
    let payload = Util.toJson(message.data);
    getClients(message).forEach(ws => {
        if (ws.readyState === 1) {
            ws.send(payload);
            console.log(new Date().toISOString() + ' send message: ' + payload);
        }
    })
});

console.log('server listen: ', listen);
