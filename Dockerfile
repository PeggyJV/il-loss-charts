# Dockerfile, not used for production
FROM node:14

WORKDIR /app

RUN apt-get update
RUN apt-get install -y vim

# Datadog Agent
# COPY ./etc /etc
# COPY ./etc/dd-agent-install.sh /
# COPY ./etc/dd-agent-init-v2.sh /
# RUN /bin/bash /dd-agent-install.sh

# Set nodejs app log paths
ENV APP_LOG="/var/log/app/out.log"
ENV APP_ERR_LOG="/var/log/app/err.log"

RUN yarn global add lerna
RUN yarn global add pm2

COPY package.json lerna.json yarn.lock dev.ecosystem.config.js /app/il-loss-charts/
COPY packages/sommelier-types/package.json /app/il-loss-charts/packages/sommelier-types/package.json
COPY packages/server/package.json /app/il-loss-charts/packages/server/package.json
COPY packages/workers/package.json /app/il-loss-charts/packages/workers/package.json
COPY packages/client/package.json /app/il-loss-charts/packages/client/package.json

WORKDIR /app/il-loss-charts

RUN yarn install --frozen-lockfile --non-interactive --silent --production=false

COPY . /app/il-loss-charts

ENV GENERATE_SOURCEMAP=false

# Run separately to take advantage of caching when only one package is changed
WORKDIR /app/il-loss-charts/packages/sommelier-types
RUN yarn build
WORKDIR /app/il-loss-charts/packages/server
RUN yarn build
WORKDIR /app/il-loss-charts/packages/workers
RUN yarn build
WORKDIR /app/il-loss-charts/packages/client
RUN yarn build

EXPOSE 3001

WORKDIR /app/il-loss-charts
CMD ["sh"]
