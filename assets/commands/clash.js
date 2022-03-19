const { Message } = require('discord.js')

module.exports = {
    name: 'clash',
    arguments: [],
    subcommands: ['getTeam', 'lookupTeam'],
    description: 'Core command for Clash',
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: function (message, args) {
        if (!args.length) {
            message.reply('Please use a subcommand')
        } else {
            message.reply('Please use valid subcommand')
        }
    },
}
