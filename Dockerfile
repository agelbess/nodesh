FROM node:latest

# the scripts
COPY /src /src

# npm packages
COPY /package.json /package.json

# helpers for environment vars
COPY /aggregationAndRestructure.sh /aggregationAndRestructure.sh
COPY /copyJourneyState.sh /copyJourneyState.sh

RUN npm install

RUN apt-get update && apt-get install -y wget && \
    wget https://downloads.mongodb.com/compass/mongodb-mongosh_1.5.4_amd64.deb && \
    dpkg -i mongodb-mongosh_1.5.4_amd64.deb

# an entry point to run mongosh scripts
# ENTRYPOINT ["mongosh", "-f",  "mongo-script.js"]

# an entry potint to run javascript with node
# ENTRYPOINT ["node", "script.js"]

# an entry potint to run javascript with npm
# ENTRYPOINT ["npm", "run", "start"]

# using tail -f /dev/null will cause the service to wait
ENTRYPOINT ["tail", "-f", "/dev/null"]

