FROM node:14

# Create app directory
WORKDIR /usr/src/app

COPY package.json yarn.lock decorate-angular-cli.js ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build api && yarn build frontend

EXPOSE 4200 3333

CMD ["yarn", "serve:prod"]
