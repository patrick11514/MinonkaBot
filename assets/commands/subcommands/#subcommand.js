const { Client, Message } = require('discord.js')

module.exports = {
    mainCommand: 'nameOfMainCommand',
    name: 'nameOfSubcommand',
    arguments: ['arg1', 'arg2', '...'],
    description: 'Description of subcommand',
    /**
     * Optional function
     * @param {Client} client
     */
    setup: function (client) {
        //do something
    },
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: function (message, args) {
        //do something
    },
}
