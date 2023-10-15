const { Client, GatewayIntentBits,ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    execute(client) {
        client.user.setActivity('message', { type: ActivityType.Listening });
      console.log(`${client.user.tag} is online!`);
    },
};