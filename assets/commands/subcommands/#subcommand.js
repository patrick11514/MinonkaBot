module.exports = {
    mainCommand: 'nameOfMainCommand',
    name: 'nameOfSubcommand',
    arguments: ['arg1', 'arg2', '...'],
    description: 'Description of subcommand',
    /**
     * Optional function
     */
    setup: function (client) {
        //do something
    },
    /*
     * Required functionm
     * message - sent message object
     * args - array of arguments
     */
    execute: function (message, args) {
        //do something
    },
}
