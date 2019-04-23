const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 29080 });
const mq = new WebSocket('ws://127.0.0.1:29081');

const Clients = {};
const Users = {};

function getUserId(message, callback) {
    //DB.getUserId(message, callback);
    callback(message.data.userId);
}

const Util = {
    fromJson: function(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            return {};
        }
    },
    toJson: function(obj) {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            console.log(e);
            return "(JSON.stringify ERROR)";
        }
    }
}

function cleanup(client) {
    if (Users[client] !== undefined) {
        Clients[Users[client]].delete(client);
        delete Users[client];
    }
}

function auth(message, client) {
    console.log('auth msg: ', Util.toJson(message));
    if (Users[client] !== undefined) {
        client.send('ERR: re-Auth');
        client.close();
        return;
    }
    getUserId(message, function(userId){
        if (userId !== null) {
            if (Clients[userId] === undefined) {
                Clients[userId] = new Set();
            }
            Clients[userId].add(client);
            Users[client] = userId;
        } else {
            client.close();
        }
    });
}

server.on('connection', function incoming(client) {
    console.log(new Date().toISOString() + ' new conn: ');

    client.on('error', function(err) {
        console.log(new Date().toISOString() + ' close conn: ' + err);
    });
    client.on('close', function(msg) {
        console.log(new Date().toISOString() + ' close conn: ' + msg);
        cleanup(client);
    });
    client.on('message', function(message) {
        message = Util.fromJson(message);
        message.type === 'auth' ? auth(message, client) : client.close();
    })
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
    if (message.type === 'user') {
        let clients = Clients[message.data.userId];
        if (clients instanceof Set) return clients;
    } else {
        console.error('Unimplemented message.type: ', message.type);
    }
    return new Set();
}

mq.on('message', function(message) {
    // console.log(new Date().toISOString() + ' mq msg: ' + message + " clients.size " + server.clients.size);
    message = Util.fromJson(message);
    
    getClients(message).forEach(ws => {
        if (ws.readyState === 1) {
            ws.send(Util.toJson(message.data));
            console.log(new Date().toISOString() + ' send message: ' + JSON.stringify(message.data));
        }
    })
})