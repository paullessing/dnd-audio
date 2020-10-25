FROM node:14

# Create app directory
WORKDIR /usr/src/app

COPY package.json yarn.lock decorate-angular-cli.js ./

# Installing on digitalocean often hits the default 5s timeout
# see https://github.com/DSpace/dspace-angular/issues/604 and https://github.com/DSpace/dspace-angular/pull/605
RUN yarn install --frozen-lockfile --network-timeout 300000

COPY . .

RUN yarn build api && yarn build frontend

EXPOSE 4200 3333

CMD ["yarn", "serve:prod"]
