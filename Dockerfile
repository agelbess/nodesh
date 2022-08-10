FROM node:latest

COPY /src /src

RUN apt-get update && apt-get install -y wget && \
    wget https://downloads.mongodb.com/compass/mongodb-mongosh_1.5.4_amd64.deb && \
    dpkg -i mongodb-mongosh_1.5.4_amd64.deb

# ENTRYPOINT ["mongosh", "-f",  "mongo-script.js"]
# ENTRYPOINT ["node", "script.js"]
ENTRYPOINT ["tail", "-f", "/dev/null"]

