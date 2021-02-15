FROM node:14
WORKDIR /usr/src/users

COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 8000
CMD [ "node", "bin/www" ]
