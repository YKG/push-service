#!/bin/bash

# turn on bash's job control
set -m

mkdir -p out
node mq.js &
sleep .5
node push.js anonymous &
node push.js 0 &
node push.js 1 &

# now we bring the primary process back into the foreground
# and leave it there
fg %1
