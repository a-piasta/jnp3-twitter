FROM node:14
WORKDIR /usr/src/front

COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 80
CMD [ "npm", "start" ]
