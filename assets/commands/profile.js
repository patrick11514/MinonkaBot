const { Message } = require('discord.js')

module.exports = {
    name: 'profile',
    subcommands: ['add', 'list', 'remove'],
    description: 'Link lol profile with discord',
    arguments: [],
    /**
     * Required function
     * @param {Message} message
     */
    execute: async function (message) {
        message.reply('Please use argument.')
    },
}
