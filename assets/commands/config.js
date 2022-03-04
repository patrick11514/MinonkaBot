module.exports = {
    name: 'config',
    arguments: [],
    subcommands: ['reload'],
    description: 'Config for bot',
    admin: true,
    execute: function (message, args) {
        message.reply('Please use argument.')
    },
}
