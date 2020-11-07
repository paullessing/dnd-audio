FROM node:14-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

COPY package.json yarn.lock decorate-angular-cli.js ./

# Installing on digitalocean often hits the default 5s timeout
# see https://github.com/DSpace/dspace-angular/issues/604 and https://github.com/DSpace/dspace-angular/pull/605
RUN yarn install --frozen-lockfile --network-timeout 300000
COPY . .
RUN yarn build api

FROM node:14-alpine AS server

WORKDIR /usr/src/app
RUN mkdir -p /home/db

COPY --from=builder /usr/src/app/dist/apps/api .
RUN yarn install --frozen-lockfile --network-timeout 300000

EXPOSE 3333

CMD ["node", "main.js"]
