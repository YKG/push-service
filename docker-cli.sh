cid=`docker ps|grep push-service|awk '{print $1}'`
echo $cid
docker exec -it $cid node cli.js $@
