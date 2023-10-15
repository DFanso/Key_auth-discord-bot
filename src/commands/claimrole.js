const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const roleManager = require('../roleManager');

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
        
        if (data.success && data.status === "Not Used") {
            const daysLeft = parseInt(data.duration, 10);
            
            // Assign the role using roleManager
            const member = interaction.guild.members.cache.get(interaction.user.id);
            await roleManager.assignRoleWithExpiration(member, roleId, daysLeft);
            
            await interaction.reply(`Role assigned for ${daysLeft} days.`);
        } else {
            await interaction.reply('Sorry, that key is invalid or already used.');
        }
    } catch (error) {
        console.error('Error in claimrole command:', error);
        await interaction.reply('An error occurred while processing your request. Please try again later.');
    }
}

};

