const { Client, Message } = require('discord.js')

module.exports = {
    name: 'nameOfCommand',
    subcommands: ['subcommand1', 'subcommand2', '...'],
    description: 'Description of command',
    arguments: ['arg1', 'arg2', '...'],
    /**
     * Optional function
     * @param {Client} client
     */
    setup: function (client) {
        //do something
    },
    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        //do something
    },
}
