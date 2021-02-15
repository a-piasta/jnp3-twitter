FROM node:14
WORKDIR /usr/src/relations

COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 5000
CMD [ "node", "bin/www" ]
