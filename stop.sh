ps -ef|grep mq.js|grep -v grep|awk '{print $2}'|xargs kill -9
ps -ef|grep push.js|grep -v grep|awk '{print $2}'|xargs kill -9
