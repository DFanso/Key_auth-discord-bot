const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const roleManager = require('../services/roleManager');

const {apiKey,roleId} = require('../config.json')


module.exports = {
  data: new SlashCommandBuilder()
  .setName('claimrole')
  .setDescription('Claim your customer role based on your license key!')
  .addStringOption(option => 
      option.setName('license_key')
            .setDescription('Enter your license key')
            .setRequired(true)
  ),
  async execute(interaction) {
    const licenseKey = interaction.options.getString('license_key');

    //dfanso-test-key
    
    const apiUrl = `https://keyauth.win/api/seller/?sellerkey=${apiKey}&type=info&key=${licenseKey}`;
    
    try {
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        if (data.success) {
          const secondsInADay = 24 * 60 * 60;
          let daysLeft = 0;
      
          if (data.status === "Not Used") {
              daysLeft = Math.round(parseInt(data.duration, 10) / secondsInADay);
          } else if (data.status === "Used") {
              const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
              const expiryTime = parseInt(data.usedon, 10) + parseInt(data.duration, 10);
              daysLeft = Math.round((expiryTime - currentTime) / secondsInADay);
          }
      
          // Add the grace period
          daysLeft += 3;
      
          if (daysLeft > 0) {
              const member = interaction.guild.members.cache.get(interaction.user.id);
              await roleManager.assignRoleWithExpiration(member, roleId, daysLeft, licenseKey);
              await interaction.reply({ content: `Role assigned for ${daysLeft} days.`, ephemeral: true });
          } else {
              await interaction.reply({ content: 'Sorry, that key has expired.', ephemeral: true });
          }
      
      } else {
          await interaction.reply({ content: 'Sorry, that key is invalid or already used.', ephemeral: true });
      }
      
    } catch (error) {
      if (error.message === 'This key has already been used by you.') {
          await interaction.reply({ content: 'You have already used this key.', ephemeral: true });
      } 
      else if (error.message === 'This key has already been used by another user.') {
        await interaction.reply({ content: 'This key has already been used by another user.', ephemeral: true });
      }else {
          console.error('Error in claimrole command:', error);
          await interaction.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
      }
  }
}

};

