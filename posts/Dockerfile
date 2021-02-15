FROM node:14
WORKDIR /usr/src/posts

COPY package*.json ./

# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && npm install
RUN npm install
COPY . .

EXPOSE 4000
CMD [ "node", "bin/www" ]
# CMD ["sh"]
