const fs = require('fs');
const path = require('path');
const {guildId,roleId} = require('../config.json')
const expirationFilePath = path.join(__dirname, 'roleExpirations.json');

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

    if (expirations[key]) {
        if (expirations[key].userId === member.id) {
            throw new Error('This key has already been used by you.');
        } else {
            throw new Error('This key has already been used by another user.');
        }
    }
    
    expirations[key] = {
        userId: member.id,
        expiration: expirationTimestamp
    };

    writeExpirationsToFile(expirations);
}

async function checkRoleExpirations(client) {
    console.log(client.guilds.cache.size)
    const now = Date.now();
    const expirations = readExpirationsFromFile();

    for (let key in expirations) {
        const userData = expirations[key];
        if (userData.expiration <= now) {
            try {
                // Fetch the guild directly from the API
                const guild = await client.guilds.fetch(guildId);
                if (!guild) {
                    console.error(`Failed to find a guild with the ID: ${guildId}`);
                    continue; // Skip this iteration and proceed with the next key
                }
                
                const member = guild.members.cache.get(userData.userId);
                if (member) {
                    await member.roles.remove(roleId);
                    console.log(`Removed role from user ${userData.userId}.`);
                } else {
                    console.warn(`User ${userData.userId} not found in guild ${guildId}.`);
                }

                // Remove this key from the expirations data
                delete expirations[key];

            } catch (error) {
                console.error(`Failed to process role expiration for user ${userData.userId}. Error:`, error);
            }
        }
    }

    // Write updated expirations back to the file
    writeExpirationsToFile(expirations);
}




module.exports = {
    assignRoleWithExpiration,
    checkRoleExpirations
};
