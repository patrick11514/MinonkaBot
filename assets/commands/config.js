const { Message } = require('discord.js')

module.exports = {
    name: 'config',
    arguments: [],
    subcommands: ['reload'],
    description: 'Config for bot',
    admin: true,
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: function (message) {
        message.reply('Please use argument.')
    },
}
