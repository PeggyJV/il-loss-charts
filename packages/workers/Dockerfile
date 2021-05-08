# Dockerfile
FROM node:14

WORKDIR /app

RUN apt-get update
RUN apt-get install -y vim
RUN apt-get install -y cron

RUN yarn global add lerna
RUN yarn global add pm2

COPY package.json lerna.json yarn.lock /app/
COPY packages/sommelier-types/package.json /app/packages/sommelier-types/package.json
COPY packages/server/package.json /app/packages/server/package.json
COPY packages/workers/package.json /app/packages/workers/package.json

RUN yarn install --frozen-lockfile --non-interactive --silent --production=false

COPY . /app/

ENV GENERATE_SOURCEMAP=false

# Run separately to take advantage of caching when only one package is changed
WORKDIR /app/il-loss-charts/packages/sommelier-types
RUN yarn build
WORKDIR /app/il-loss-charts/packages/server
RUN yarn build
WORKDIR /app/il-loss-charts/packages/workers
RUN yarn build

WORKDIR /app
ENTRYPOINT ["/app/il-loss-charts/worker-entrypoint.sh"]
CMD ["sh"]