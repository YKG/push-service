const WebSocket = require('ws');
const uuidv1 = require('uuid/v1');
const Redis = require("redis"),
    redis = Redis.createClient();
const http = require('http');
const fs = require('fs');

const {promisify} = require('util');
const getAsync = promisify(redis.get).bind(redis);
const smembersAsync = promisify(redis.smembers).bind(redis);

redis.on("error", function (err) {
    console.log("Error " + err);
});

const wss = new WebSocket.Server({ port: 2080 });
const mq = new WebSocket('ws://127.0.0.1:2081');
const monitor = new WebSocket.Server({ port: 3082 });

const Util = {
    getUserInfo: function (msg) {
        msg = JSON.parse(msg);
        return msg.user;
    },
    isAuth: function (msg) {
        msg = JSON.parse(msg);
        return msg.type === 'auth';
    },
    uuid: function () {
        return uuidv1();
    },
    hash: function(ws) {
        return 
    }
}

const DB = {
    get: function(topic, callback) {
        const users = [];
        callback(users);
    }
}

const Connections = {};

const Registry = {
    registerInternal: function(key, ws) {
        console.log(new Date().toISOString() + ' Register: ' + JSON.stringify(key));
        ws.userid = key;
        Connections[ws.uuid] = ws;
        redis.sadd(key, ws.uuid);
        ws.send('registered');
    },
    register: function(userInfo, ws) {
        this.registerInternal('u_' + userInfo.userId, ws);
    },
    registerAnonymous: function(ws) {
        this.registerInternal('anonymous', ws);
    },
    delete: function(ws) {
        redis.srem(ws.userid, ws.uuid);
        delete Connections[ws.uuid];
    },
    findConnByUserId: function(userId, callback) {
        console.log('::findConnByUserId ', userId);
        smembersAsync('u_' + userId).then(callback).catch((error) => {
            console.log(error);
        });
    },
    findConnByTopic: function(topic, callback) {
        smembersAsync(topic + ':topic').then(function(res){
            if (set === null) {
                DB.get(topic, function(users) {
                    users.forEach(userId => {
                        Registry.findConnByUserId(userId, callback);
                    });
                    Registry.sunionstore(topic + ':topic', users);
                });
            } else {
                res.forEach(userId => {
                    Registry.findConnByUserId(userId, callback);
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    },
    getRouter: function(json, callback) {
        const routerFunc = {
            user: function(msg) {
                // debugger
                Registry.findConnByUserId(msg.userId, callback);
            },
            topic: function(msg) {
                Registry.findConnByTopic(msg.topic, callback);
            }
        };
        let msg = JSON.parse(json);
        routerFunc[msg.type](msg, callback);
    }
}
// ----------------------------------------------------------------

mq.on('message', function incoming(message) {
    Registry.getRouter(message, function(set) {
        console.log('send: ', set)
        if (!set) return;
        set.forEach(uuid => {
            const ws = Connections[uuid];
            if (!ws) return;
            if (ws.readyState === 3) {
                Registry.delete(ws);
            } else if (ws.readyState === 1) {
                ws.send(message);
                console.log('sending... ' + ws.uuid + ' ' + message);
            }
        });
    });
});

// ----------------------------------------------------------------

wss.on('connection', function connection(ws) {
    console.log(new Date().toISOString() + ' new conn: ');

    ws.uuid = Util.uuid();
    Registry.registerAnonymous(ws);
    ws.on('message', function incoming(message) {
        if (Util.isAuth(message)) {
            const userInfo = Util.getUserInfo(message);
            Registry.register(userInfo, ws);
        }
        //console.log('received: %s', message);
    });

    ws.on('close', function incoming(message) {
        Registry.delete(ws);
    });

    ws.on('error', function incoming(message) {
        Registry.delete(ws);
    });
});

// ----------------------------------------------------------------
http.createServer(function (request, response) {
    if (request.method === 'POST' && request.url === '/') {
        let body = [];
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            // sync(body);
            response.end(body);
        });
    } else {
        response.statusCode = 404;
        response.end();
    }
}).listen(20078);

// 终端打印如下信息
console.log('Server running at http://127.0.0.1:20078/');

// ----------------------------------------------------------------

function report() {
    monitor.clients.forEach(function(ws){
        //Object.keys(Connections).length
        ws.send(Object.keys(Connections).length);
    });
    console.log('report' + new Date().toISOString());
}
setInterval(report, 1000);

monitor.on('connection', function connection(ws) {
    console.log(new Date().toISOString() + '22222 new conn: ');
});