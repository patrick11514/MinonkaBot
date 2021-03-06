const { Message } = require('discord.js')

module.exports = {
    mainCommand: 'restart',
    name: 'bot',
    arguments: [],
    description: 'Restart the bot',
    admin: true,
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        //send text to console
        console.log('✔️  Restarting...')
        //reply to user with text
        await message.reply('Restarting...')
        //exit process
        process.exit(0)
    },
}
