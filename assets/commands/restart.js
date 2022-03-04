module.exports = {
    name: 'restart',
    arguments: [],
    subcommands: [],
    description: 'Restart the bot',
    admin: true,
    execute: async function (message, args) {
        //send text to console
        console.log('✔️  Restarting...')
        //reply to user with text
        await message.reply('Restarting...')
        //exit process
        process.exit(0)
    },
}
