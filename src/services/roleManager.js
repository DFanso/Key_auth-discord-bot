const fs = require('fs');
const path = require('path');
const {guildId,roleId} = require('../config.json');
const { Console } = require('console');
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
    console.log("Checking Role Expirations...");
    const now = Date.now();
    const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    const expirations = readExpirationsFromFile();

    for (let key in expirations) {
        const userData = expirations[key];
        const timeLeft = userData.expiration - now;

        // If the expiration date is within the next 3 days and not yet expired
        if (timeLeft <= threeDaysInMilliseconds && timeLeft > 0) {
            try {
                const guild = await client.guilds.fetch(guildId);
                let member = guild.members.cache.get(userData.userId);
                if (!member) {
                    member = await guild.members.fetch(userData.userId);
                }
                if (member) {
                    // Send the warning message to the user
                    await member.send("Your access will expire in less than 3 days. Please renew if necessary.");
                }
            } catch (error) {
                console.error(`Failed to send expiration warning to user ${userData.userId}. Error:`, error);
            }
        }

        // If the role has expired
        if (userData.expiration <= now) {
            try {
                const guild = await client.guilds.fetch(guildId);
                let member = guild.members.cache.get(userData.userId);
                if (!member) {
                    member = await guild.members.fetch(userData.userId).catch(err => console.error(err));
                }
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
