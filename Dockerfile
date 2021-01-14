FROM node:10.9.0

# Create app directory
WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 5050
CMD [ "node", "src/index.js" ]