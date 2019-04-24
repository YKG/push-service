
const Config = {
    NClient: 2,
    urls: {
        'anonymous': 'ws://127.0.0.1:29079',
        '0': 'ws://127.0.0.1:29080',
        '1': 'ws://127.0.0.1:29081',
    },
    ports: {
        'anonymous': 29079,
        '0': 29080,
        '1': 29081,
    },
    mq: {
        url: 'ws://127.0.0.1:25673',
        port: 25673
    }
}

module.exports = Config;
