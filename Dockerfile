FROM node:10.9.0

# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 5050

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait
# Entrypoint. Todo test before start. 
# Must wait DB, IPFS Node already start before running test
CMD /wait && npm test && node src/index.js
