const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const mqs = new WebSocket.Server({ port: 29081 });

mqs.on('connection', function incoming(client) {
    client.on('message', function(message) {
        console.log(new Date().toISOString() + ' broadcast: ' + message + " clients.size " + mqs.clients.size);
        mqs.clients.forEach(ws => {
            if (ws.readyState === 1 && ws !== client) {
                ws.send(message);
                console.log(new Date().toISOString() + ' broadcast: ' + message);
            }
        })
    })
});
