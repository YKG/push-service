const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const wss = new WebSocket.Server({ port: 2080 });
const mq = new WebSocket('127.0.0.1:2081');

function auth(msg) {
    return true;
}

function getUSerInfo(msg) {
    return msg.user;
}

const Redis = {
    get: function(key) {
        // Redis.get
    },
    put: function(k, v) {
        // Redis.put
    }
};

const Registry = {
    register: function(userInfo, ws) {
        let list = Redis.get(userInfo.userId);
        list.add(ws);
        Redis.put(userInfo.userId, list);

        Redis.put(ws, userInfo.userId);
    },
    delete: function(ws) {
        const userId = Redis.remove(ws);
        let list = Redis.get(userId);
        list.remove(ws);
        Redis.put(userInfo.userId, list);
    },
    findConnByUserId: function(userId) {
        return Redis.get(userId);
    },
    findConnByTopic: function(topic) {
        let list = Redis.get(topic);
        if (list === null) {
            list = [];
            const users = DB.get(topic);
            users.forEach(user => {
                list.addAll(findConnByUserId());
            })
            Redis.put(topic, list);
        }
        return list;
    },
    getRouter: function(msg) {
        return routerFunc[msg.type](msg);
    },
    routerFunc: {
        user: function(msg) {
            return findConnByUserId(msg.userId);
        },
        topic: function(msg) {
            return findConnByTopic(msg.topic);
        }
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

wss.on('connection', function connection(ws) {
    let t;
    function notify() {
        if (ws.readyState === 1) {
            ws.send(new Date().toISOString());
        } else if (ws.readyState === 3) {
            clearInterval(t);
        }
    }
    t = setInterval(notify, 300);

    ws.on('message', function incoming(message) {
        if (auth(msg)) {
            const userInfo = getUserInfo(msg);
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

