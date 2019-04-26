ps -ef|grep mq.js|grep -v grep|awk '{print $2}'|xargs kill -9
ps -ef|grep push.js|grep -v grep|awk '{print $2}'|xargs kill -9
docker ps |grep push-service|awk '{print $1}'|xargs docker stop
