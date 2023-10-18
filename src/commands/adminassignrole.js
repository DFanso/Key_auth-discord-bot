const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const roleManager = require('../services/roleManager');

const { apiKey, roleId } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminassignrole')
    .setDescription('Assign customer role to a user based on their license key!')
    .addUserOption(option => 
      option.setName('target_user')
            .setDescription('Select a user to assign the role')
            .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('license_key')
            .setDescription('Enter the license key for the user')
            .setRequired(true)
    ),
  async execute(interaction) {
    // Ensure the command caller has administrative privileges
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('target_user');
    const licenseKey = interaction.options.getString('license_key');

    const apiUrl = `https://keyauth.win/api/seller/?sellerkey=${apiKey}&type=info&key=${licenseKey}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      const secondsInADay = 24 * 60 * 60;
      let daysLeft;

      if (data.success) {
        if (data.status === "Not Used") {
          daysLeft = Math.round(parseInt(data.duration, 10) / secondsInADay);
        } else if (data.status === "Used") {
          const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
          const expiryTime = parseInt(data.usedon, 10) + parseInt(data.duration, 10);
          daysLeft = Math.round((expiryTime - currentTime) / secondsInADay);
        }
        
        daysLeft += 3; // Adding 3 days grace

        // Assign the role using roleManager
        const member = interaction.guild.members.cache.get(targetUser.id);
        await roleManager.assignRoleWithExpiration(member, roleId, daysLeft, licenseKey);

        await interaction.reply({ content: `Role assigned to ${targetUser.tag} for ${daysLeft} days.`, ephemeral: true });
      } else {
        await interaction.reply({ content: 'Sorry, that key is invalid or already used.', ephemeral: true });
      }
    } catch (error) {
      if (error.message === 'This key has already been used by you.') {
        await interaction.reply({ content: 'You have already used this key.', ephemeral: true });
      } 
      else if (error.message === 'This key has already been used by another user.') {
        await interaction.reply({ content: 'This key has already been used by another user.', ephemeral: true });
      } else {
        console.error('Error in adminassignrole command:', error);
        await interaction.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
      }
    }
  }
};
