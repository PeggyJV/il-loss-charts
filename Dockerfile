# Dockerfile, not used for production
FROM node:14

WORKDIR /app

RUN apt-get update
RUN apt-get install -y vim

RUN yarn global add lerna

COPY package.json lerna.json yarn.lock /app/
COPY packages/sommelier-types/package.json /app/packages/sommelier-types/package.json
COPY packages/server/package.json /app/packages/server/package.json
COPY packages/workers/package.json /app/packages/workers/package.json
COPY packages/client/package.json /app/packages/client/package.json

RUN yarn install --frozen-lockfile --non-interactive --silent --production=false

COPY . /app/

ENV GENERATE_SOURCEMAP=false

# Run separately to take advantage of caching when only one package is changed
WORKDIR /app/packages/sommelier-types
RUN yarn build
WORKDIR /app/packages/server
RUN yarn build
WORKDIR /app/packages/workers
RUN yarn build
WORKDIR /app/packages/client
RUN yarn build

EXPOSE 3001

WORKDIR /app
CMD ["yarn", "prod"]