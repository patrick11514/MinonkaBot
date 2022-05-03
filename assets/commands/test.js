const { Message } = require('discord.js')
const Profile = require('../functions/profile')

module.exports = {
    name: 'test',
    subcommands: [],
    description: 'Test command',
    admin: true,
    arguments: [],

    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        let profile = new Profile(message.client.db, message.client.fc)
        profile.getAccount(message.author.id, "TEST", "Text", message, true)
    },
}
