const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const {guidId,roleId} = require('../config.json')
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

async function assignRoleWithExpiration(member, roleId, days, key) {
    // Add the role to the user
    await member.roles.add(roleId);

    // Calculate the expiration timestamp
    const expirationTimestamp = Date.now() + (days * 24 * 60 * 60 * 1000);

    // Save the expiration and the key in the JSON file
    const expirations = readExpirationsFromFile();

    if (expirations[member.id] && expirations[member.id].key === key) {
        throw new Error('This key has already been used by the user.');
    }

    expirations[member.id] = {
        key: key,
        expiration: expirationTimestamp
    };

    writeExpirationsToFile(expirations);
}

function checkRoleExpirations() {
    const now = Date.now();
    const expirations = readExpirationsFromFile();

    for (let userId in expirations) {
        if (expirations[userId] <= now) {
            if (expirations[userId].expiration <= now){
            const guild = client.guilds.cache.get(guidId); 
            const member = guild.members.cache.get(userId);

            if (member) {
                member.roles.remove(roleId) 
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
    }

    // Write updated expirations back to the file
    writeExpirationsToFile(expirations);
}

// Start the interval to check role expirations
setInterval(checkRoleExpirations, 86400000); // Check every 24 hours

module.exports = {
    assignRoleWithExpiration
};
