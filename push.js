const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 2080 });
const mq = new WebSocket('ws://127.0.0.1:2081');

function auth(msg) {
    return true;
}

const Util = {
    getUserInfo: function (msg) {
        msg = JSON.parse(msg);
        return msg.user;
    }
}

const DB = {
    get: function(topic, callback) {
        const users = [];
        callback(users);
    }
}

const Redis = {
    kv: {},
    get: function(key) {
        // Redis.get
        console.log('::Redis.get ');
        return Redis.kv[key];
    },
    put: function(k, v) {
        // Redis.put
        console.log('::Redis.put ');
        Redis.kv[k] = v;
    },
    remove: function(k) {
        delete Redis.kv[k];
    }
};

const Registry = {
    register: function(userInfo, ws) {
        console.log(new Date().toISOString() + ' Register: ' + JSON.stringify(userInfo));
        
        let list = Redis.get(userInfo.userId);
        list = list ? list : new Set();
        list.add(ws);
        Redis.put(userInfo.userId, list);

        Redis.put(ws, userInfo.userId);
        ws.send('registered');
    },
    delete: function(ws) {
        const userId = Redis.remove(ws);
        let list = Redis.get(userId);
        if (list) {
            list.delete(ws);
            Redis.put(userInfo.userId, list);
        }
    },
    findConnByUserId: function(userId) {
        console.log('::findConnByUserId ', userId);
        return Redis.get(userId);
    },
    findConnByTopic: function(topic) {
        let list = Redis.get(topic);
        if (list === null) {
            DB.get(topic, function(users) {
                list = [];
                users.forEach(user => {
                    list.addAll(findConnByUserId());
                })
                Redis.put(topic, list);
            });
            
        }
        return list;
    },
    getRouter: function(msg) {
        const routerFunc = {
            user: function(msg) {
                return Registry.findConnByUserId(msg.userId);
            },
            topic: function(msg) {
                return Registry.findConnByTopic(msg.topic);
            }
        };
        msg = JSON.parse(msg);
        const list = routerFunc[msg.type](msg);
        console.log('::getRouter ' + msg.type, JSON.stringify(msg), list.size);
        return list ? list : new Set();
    }
}
// ----------------------------------------------------------------

mq.on('message', function incoming(message) {
    const list = Registry.getRouter(message);
    list.forEach(ws => {
        if (ws.readyState === 3) {
            Registry.delete(ws);
        } else if (ws.readyState === 1) {
            ws.send(message);
        }
    });
});

// ----------------------------------------------------------------

function unused() {
    let t;
    function notify() {
        if (ws.readyState === 1) {
            ws.send(new Date().toISOString());
        } else if (ws.readyState === 3) {
            clearInterval(t);
        }
    }
    t = setInterval(notify, 300);
}

wss.on('connection', function connection(ws) {
    console.log(new Date().toISOString() + ' new conn: ');

    ws.on('message', function incoming(message) {
        if (auth(message)) {
            const userInfo = Util.getUserInfo(message);
            Registry.register(userInfo, ws);
        }
        //console.log('received: %s', message);
    });

    ws.on('close', function incoming(message) {
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
