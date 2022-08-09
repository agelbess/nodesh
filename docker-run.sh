docker stop node-aggregation-and-restructure
docker rm node-aggregation-and-restructure
docker image rm node-aggregation-and-restructure
docker build -f Dockerfile-node-aggregation-and-restructure -t node-aggregation-and-restructure .
