module.exports = {
    name: 'help',
    arguments: [],
    subcommands: [],
    description: 'Displays all commands',

    execute: function (message, args) {
        let text = '-----===== **COMMANDS** ======-----'
        message.client.commands.forEach((command) => {
            let line = `- ${message.client.config.prefix}${command.name}`
            if (command.arguments.length) {
                command.arguments.forEach((argument) => {
                    line += ` <${argument}>`
                })
            }
            line += ` - ${command.description}`
            if (!command.subcommands.length) {
                text += `\n${line}`
                return
            }
            line += `:`
            command.subcommandsExec.forEach((subcommand) => {
                line += `\n  - ${subcommand.name}`
                if (subcommand.arguments.length) {
                    subcommand.arguments.forEach((argument) => {
                        line += ` <${argument}>`
                    })
                }
                if (subcommand.description) line += ` - ${subcommand.description}`
            })
            text += `\n${line}`
        })

        message.reply(text)
    },
}
