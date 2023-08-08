FROM node:18

WORKDIR /waknoti-bot
COPY ./package.json /waknoti-bot
COPY ./package-lock.json /waknoti-bot
RUN npm install

COPY . /waknoti-bot

CMD npm run start