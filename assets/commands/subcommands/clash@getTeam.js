const { Message } = require('discord.js')

module.exports = {
    mainCommand: 'clash',
    name: 'getTeam',
    arguments: [],
    description: 'Get clash team of player',
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: function (message, args) {
        message.reply('TEST')
    },
}
