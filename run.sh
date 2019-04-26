docker build --tag=push-service .
docker run -p 29079:29079 -p 29080:29080 -p 29081:29081 -p 25673:25673 push-service
