#!/bin/sh

# Prod entrypoint for the application
# Fetch secrets from docker and set environment variables

export INFURA_PROJECT_ID=$(gcloud secrets versions access latest --secret=INFURA_PROJECT_ID)
export MIXPANEL_TOKEN=$(gcloud secrets versions access latest --secret=MIXPANEL_TOKEN)
export ETHERSCAN_API_KEY=$(gcloud secrets versions access latest --secret=ETHERSCAN_API_KEY)
export ALCHEMY_API_KEY=$(gcloud secrets versions access latest --secret=ALCHEMY_API_KEY)
export TELEGRAM_BOT_TOKEN=$(gcloud secrets versions access latest --secret=TELEGRAM_BOT_TOKEN)
export DISCORD_BOT_TOKEN=$(gcloud secrets versions access latest --secret=DISCORD_BOT_TOKEN)
export ETHPLORER_API_KEY=$(gcloud secrets versions access latest --secret=ETHPLORER_KEY)
export BITQUERY_API_KEY=$(gcloud secrets versions access latest --secret=APP_PROD_BITQUERY_API_KEY)

export REDIS_AUTH=$(gcloud secrets versions access latest --secret=REDIS_AUTH)
export REDIS_URL=$(gcloud secrets versions access latest --secret=APP_PROD_REDIS_URL)

export V3_SUBGRAPH_URL=$(gcloud secrets versions access latest --secret=APP_PROD_V3_SUBGRAPH_URL)
export FIREBASE_SERVICE_ACCOUNT="$(gcloud secrets versions access latest --secret=APP_PROD_FIREBASE_SERVICE_ACCOUNT)"

mkdir -p /var/log/app

touch "$APP_LOG"
touch "$APP_ERR_LOG"

/bin/bash /dd-agent-init.sh
pm2-runtime /app/il-loss-charts/ecosystem.config.js --only app-server