const { EmbedBuilder, MessageActionRow, MessageButton,ButtonBuilder,ActionRowBuilder, InteractionCollector , AttachmentBuilder} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isCommand() && !interaction.isModalSubmit() && !interaction.isButton()) return;

    // Handle command interactions
    if (interaction.isCommand()) {
      try {
        const command = require(`../commands/${interaction.commandName}.js`);
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
      }
    }
  }
}