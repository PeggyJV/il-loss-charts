import appConfig from '@config';
const config = appConfig.telegramBot;

import Mixpanel from 'mixpanel';
let mixpanel: Mixpanel.Mixpanel;

import TelegramBot from 'node-telegram-bot-api';
let sommBot: TelegramBot | undefined;

export default function getTelegramDataForMixpanel(): void {
    if (config.telegramToken.length > 0) {
        sommBot = new TelegramBot(config.telegramToken);
    } else {
        throw new Error(
            `Cannot start telegram mixpanel stat bot without stat bot token.`,
        );
    }

    if (config.mixpanelToken.length > 0) {
        mixpanel = Mixpanel.init(config.mixpanelToken);
    } else {
        throw new Error(
            `Cannot start telegram mixpanel stat bot without mixpanel token.`,
        );
    }

    sommBot.on('message', (msg: TelegramBot.Message) => {
        console.log('sommBot.on message');
        console.log(msg);
        mixpanel.track('telegram:message', {
            distinct_id: msg?.from?.id,
            user: msg?.from?.username,
        });
    });

    sommBot.on('channel_post', (msg: TelegramBot.Message) => {
        console.log('sommBot.on channel_post');
        console.log(msg);
        mixpanel.track('telegram:message', {
            distinct_id: msg.message_id,
        });
    });

    sommBot.on('new_chat_members', (msg: TelegramBot.Message) => {
        mixpanel.track('telegram:user:join', {
            distinct_id: msg?.from?.id,
            user: msg?.from?.username,
        });
    });

    sommBot.on('left_chat_member', (msg: TelegramBot.Message) => {
        console.log('sommBot.on left_chat_member');
        console.log(msg);
        mixpanel.track('telegram:user:leave', {
            distinct_id: msg?.from?.id,
            user: msg?.from?.username,
        });
    });

    sommBot.on('error', (error: Error) => {
        console.log('sommBot.on error');
        console.log(error);
        mixpanel.track('telegram:error', {
            error: error,
        });
    });

    sommBot.on('polling_error', (error: Error) => {
        console.log('sommBot.on polling_error');
        console.log(error);
        mixpanel.track('telegram:polling_error', {
            error: error,
        });
    });

    sommBot.on('webhook_error', (error: Error) => {
        console.log('sommBot.on webhook_error');
        console.log(error);
        mixpanel.track('telegram:webhook_error', {
            error: error,
        });
    });
}

if (require.main === module) {
    void getTelegramDataForMixpanel();
}
