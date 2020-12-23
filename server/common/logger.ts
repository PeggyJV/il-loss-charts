import pino from 'pino';

const l = pino({
    // name: process.env.APP_ID,
    base: null,
    level: process.env.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime
});

export default l;
