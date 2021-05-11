#!/bin/sh

# Prod entrypoint for the application
# Fetch secrets from docker and set environment variables

export INFURA_PROJECT_ID=$(gcloud secrets versions access latest --secret=INFURA_PROJECT_ID)
export MIXPANEL_TOKEN=$(gcloud secrets versions access latest --secret=MIXPANEL_TOKEN)
export ETHERSCAN_API_KEY=$(gcloud secrets versions access latest --secret=ETHERSCAN_API_KEY)
export ALCHEMY_API_KEY=$(gcloud secrets versions access latest --secret=ALCHEMY_API_KEY)
export TELEGRAM_BOT_TOKEN=$(gcloud secrets versions access latest --secret=TELEGRAM_BOT_TOKEN)
export DISCORD_BOT_TOKEN=$(gcloud secrets versions access latest --secret=DISCORD_BOT_TOKEN)
export ETHPLORER_API_KEY=$(gcloud secrets versions access latest --secret=ETHPLORER_API_KEY)
export BITQUERY_API_KEY=$(gcloud secrets versions access latest --secret=BITQUERY_API_KEY)

export REDIS_AUTH=$(gcloud secrets versions access latest --secret=REDIS_AUTH)

mkdir -p /var/log/app

touch "$APP_LOG"
touch "$APP_ERR_LOG"

/bin/bash /dd-agent-init-v2.sh
pm2-runtime /app/il-loss-charts/ecosystem.config.js --only app-server