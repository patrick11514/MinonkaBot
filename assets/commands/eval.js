const { Message } = require('discord.js')

module.exports = {
    name: 'eval',
    subcommands: [],
    description: 'Execute code',
    arguments: ['cide'],
    admin: true,
    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        let command = args.join(" ")
        try {
            let result = eval(command)
            if (result instanceof Promise) {
                result = await result
            }
            if (typeof result !== 'string') {
                result = require('util').inspect(result)
            }
            message.channel.send(`\`\`\`JS\n${result}\n\`\`\``)
        } catch (e) {
            message.channel.send(`\`\`\`JS\n${e}\n\`\`\``)
        }
    }
}
