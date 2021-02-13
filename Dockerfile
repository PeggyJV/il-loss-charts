# Dockerfile
FROM node:14

WORKDIR /app

RUN yarn global add lerna

COPY package.json lerna.json yarn.lock /app/
COPY packages/client/package.json /app/packages/client/package.json
COPY packages/server/package.json /app/packages/server/package.json
COPY packages/sommelier-types/package.json /app/packages/sommelier-types/package.json
COPY packages/workers/package.json /app/packages/workers/package.json

RUN yarn install --frozen-lockfile --non-interactive --silent --production=false

RUN ["echo", "$NODE_ENV"]
COPY . /app/
RUN yarn build

CMD ["yarn", "prod"]