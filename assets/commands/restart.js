module.exports = {
    name: 'restart',
    arguments: [],
    subcommands: [],
    description: 'Restart the bot',
    admin: true,
    execute: async function (message, args) {
        console.log('✔️  Restarting...')
        await message.reply('Restarting...')
        process.exit(0)
    },
}
