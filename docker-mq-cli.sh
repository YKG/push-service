cid=`docker ps|grep push-service|awk '{print $1}'`
docker exec -it $cid node mq-cli.js $@
