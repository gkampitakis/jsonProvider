FROM node:latest

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN npm install

COPY . /usr/src/app

RUN chmod +x ./scripts/emailTemplates.sh

EXPOSE 5000

CMD ["npm","run","prod"]

RUN ./scripts/emailTemplates.sh