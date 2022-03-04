module.exports = {
    name: 'nameOfCommand',
    subcommands: ['subcommand1', 'subcommand2', '...'],
    description: 'Description of command',
    arguments: ['arg1', 'arg2', '...'],
    /**
     * Optional function
     */
    setup: function (client) {
        //do something
    },
    /**
     * Required function
     * message - sent message object
     * args - array of arguments
     */
    execute: async function (message, args) {
        //do something
    },
}
