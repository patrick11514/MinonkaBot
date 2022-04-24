const { Client, Message } = require('discord.js')

module.exports = {
    name: 'mastery',
    subcommands: ['champion'],
    description: 'Show masteries of champions',
    arguments: ['name', 'region'],
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

    },
}
