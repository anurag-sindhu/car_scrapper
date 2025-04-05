require('dotenv').config();

const config = {
    slack: {
        url: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_CHANNEL_ID || '',
        username: process.env.SLACK_USERNAME || 'Cars 24'
    },
    server: {
        port: process.env.PORT || 3015,
        isDevelopment: process.env.IS_DEVELOPMENT === 'true'
    }
};

module.exports = config; 