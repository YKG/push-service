# 如何使用

## 服务端
- 启动所有服务
    ```shell
    ./run.sh
    ```

- 停止所有服务(docker/本机 都可以)
    ```shell
    ./stop.sh
    ```

- 不在docker中运行，在本机运行，需要node环境
    ```shell
    npm install ws uuid
    ./start.sh
    ```

## 客户端

- 启动客户端（docker）
    ```shell
    ./docker-cli.sh [userId]
    
    # Sample:
    #
    # ./docker-cli.sh 1002                   # 用户 1002 的客户端
    #
    # ./docker-cli.s                         # 匿名用户客户端
    ```

- 启动本地客户端
    ```shell
    node cli.js [userId]
    ```

- 也可使用 `client/client.html` 通过浏览器访问

## 模拟消息源给 MQ 发消息

- docker
    ```shell
    ./docker-mq-cli.sh [userId] [msg] [type] [chunkInterval]
    
    # type: direct/chunk
    # 
    #
    # Sample:
    #
    # ./docker-mq-cli.sh 1003 Hello chunk 3  # 每 3s 钟向 1003 用户发送 'Hello' 
    #
    # ./docker-mq-cli.sh 1004 World chunk    # 每 3s 钟向 1004 用户发送 'World'  
    # 
    # ./docker-mq-cli.sh 1005                # 向 1005 用户发送默认消息 'Hello World'
    ```

- 本地
    ```shell
    node mq-cli.js [userId] [msg] [type] [chunkInterval]
    ```

# 文件说明

- `push.js` 推送服务器，接受客户端连接
- `mq.js`   模拟 MQ

- `Sender.js` 合并消息算法实现
- `Config.js` 服务器端口配置信息
- `Util.js`   JSON包装，hash函数

- `cli.js` 客户端
- `mq-cli.js` 向MQ发消息的客户端

#

- 同一个用户的每个连接都会使用一个独立的缓冲区来缓存chunk

#

- 消息推送给客户端后是否要求确认
- 用户不在线的时候消息如何处理，补发策略
- 所有消息是否留存副本


#
- 如何做 benchmark
