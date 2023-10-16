const { checkRoleExpirations } = require('../services/roleManager');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
      console.log(`${client.user.tag} is online!`);
      setTimeout(() => {
          checkRoleExpirations(client);
          //setInterval(() => checkRoleExpirations(client), 86400000); // Check every 24 hours
          setInterval(() => checkRoleExpirations(client), 600000); // Check every 10 minute

      }, 5000); // 5 seconds delay
  },
};