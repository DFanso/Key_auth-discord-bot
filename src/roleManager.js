const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const {guidId,roleId} = require('./config.json')
const expirationFilePath = path.join(__dirname, 'roleExpirations.json');


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent] });

function ensureFileExists() {
    if (!fs.existsSync(expirationFilePath)) {
        fs.writeFileSync(expirationFilePath, '{}', 'utf8');
    }
}

function readExpirationsFromFile() {
    ensureFileExists();
    const rawData = fs.readFileSync(expirationFilePath, 'utf8');
    return JSON.parse(rawData);
}

function writeExpirationsToFile(data) {
    ensureFileExists();
    const jsonData = JSON.stringify(data, null, 4);
    fs.writeFileSync(expirationFilePath, jsonData, 'utf8');
}

async function assignRoleWithExpiration(member, roleId, days) {
    // Add the role to the user
    await member.roles.add(roleId);

    // Calculate the expiration timestamp
    const expirationTimestamp = Date.now() + (days * 24 * 60 * 60 * 1000);

    // Save the expiration in the JSON file
    const expirations = readExpirationsFromFile();
    expirations[member.id] = expirationTimestamp;
    writeExpirationsToFile(expirations);
}

function checkRoleExpirations() {
    const now = Date.now();
    const expirations = readExpirationsFromFile();

    for (let userId in expirations) {
        if (expirations[userId] <= now) {
            const guild = client.guilds.cache.get(guidId); // Replace with your guild ID
            const member = guild.members.cache.get(userId);

            if (member) {
                member.roles.remove(roleId) // Replace with your role ID
                    .then(() => {
                        console.log(`Removed role from user ${userId}.`);
                    })
                    .catch(err => {
                        console.error(`Failed to remove role from user ${userId}: `, err);
                    });
            }

            // Remove this user from the expirations data
            delete expirations[userId];
        }
    }

    // Write updated expirations back to the file
    writeExpirationsToFile(expirations);
}

// Start the interval to check role expirations
setInterval(checkRoleExpirations, 86400000); // Check every 24 hours

module.exports = {
    assignRoleWithExpiration
};
