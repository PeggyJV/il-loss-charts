#!/bin/sh

# Prod entrypoint for the application
# Fetch secrets from docker and set environment variables

# export INFURA_PROJECT_ID=$(gcloud secrets versions access latest --secret=INFURA_PROJECT_ID)
# export MIXPANEL_TOKEN=$(gcloud secrets versions access latest --secret=MIXPANEL_TOKEN)
# export ETHERSCAN_API_KEY=$(gcloud secrets versions access latest --secret=ETHERSCAN_API_KEY)
# export ALCHEMY_API_KEY=$(gcloud secrets versions access latest --secret=ALCHEMY_API_KEY)
# export TELEGRAM_BOT_TOKEN=$(gcloud secrets versions access latest --secret=TELEGRAM_BOT_TOKEN)
# export DISCORD_BOT_TOKEN=$(gcloud secrets versions access latest --secret=DISCORD_BOT_TOKEN)
# export ETHPLORER_API_KEY=$(gcloud secrets versions access latest --secret=ETHPLORER_KEY)
# export MIXPANEL_SECRET=$(gcloud secrets versions access latest --secret=MIXPANEL_SECRET)
# export SOMM_STATS_BOT_TOKEN=$(gcloud secrets versions access latest --secret=SOMM_STATS_BOT_TOKEN)

# export REDIS_AUTH=$(gcloud secrets versions access latest --secret=REDIS_AUTH)

mkdir -p /var/log/app

if [[ -f "$APP_LOG" ]]; then
  touch "$APP_LOG"
  touch "$APP_ERR_LOG"
fi

/dd-agent-init-v2.sh
pm2-runtime ecosystem.config.js --only app-worker