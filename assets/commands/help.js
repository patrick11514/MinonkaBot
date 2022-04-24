const { Message } = require('discord.js')

module.exports = {
    name: 'help',
    arguments: [],
    subcommands: [],
    description: 'Displays all commands',

    /**
     *
     * @param {Message} message
     */
    execute: function (message) {
        //Variable with text to send
        let text = '-----===== **COMMANDS** ======-----'

        //foreach all loaded comamnds
        message.client.commands.forEach((command) => {
            //if command command is for admin and user is not admin, then skip
            if (command?.admin && !message.author?.owner) return

            //add comamnd with prefix to text
            let line = `- ${message.client.config.prefix}${command.name}`
            //check if comamnd have arguments
            if (command.arguments.length) {
                //loop arguments and add it to text
                command.arguments.forEach((argument) => {
                    line += ` <${argument}>`
                })
            }
            //if command have description add it to text
            if (command.description) {
                line += ` - ${command.description}`
            }

            //if command is for admin add information text to end of command
            if (command?.admin) {
                line += ` - **Admin Command**`
            }

            //if command dont have any subcommands, then add a new line to text and continue
            if (!command.subcommands.length) {
                text += `\n${line}`
                return
            }
            //if command have subcommands, then add colon to end of line
            line += `:`
            //loop subcommands and add it to text
            command.subcommandsExec.forEach((subcommand) => {
                line += `\n  - ${subcommand.name}`
                //if subcommand have arguments, then add it to text
                if (subcommand.arguments.length) {
                    subcommand.arguments.forEach((argument) => {
                        line += ` <${argument}>`
                    })
                }
                //if subcommand have description, then add it to text
                if (subcommand.description) line += ` - ${subcommand.description}`
            })
            //add subcommand to text
            text += `\n${line}`
        })

        //reply to user message with text
        message.reply(text)
    },
}
