const fs = require('fs')
module.exports = {
    name: 'reload',
    arguments: [],
    subcommands: [],
    description: 'Reload command commands',
    admin: true,
    execute: function (message, args) {
        if (!args.length) {
            return message.reply('Please specify a command to reload')
        }

        if (args.length > 1) {
            return message.reply('Please specify only one command to reload')
        }

        const commands = message.client.commands

        let command = args[0]

        if (command.includes('@')) {
            let list = command.split('@')
            if (!commands.get(list[0])) {
                return message.reply(
                    `Command \`${list[0]}\` not found. Use ${message.client.config.prefix}help to see all commands.`
                )
            }

            if (!commands.get(list[0])?.subcommands.includes(list[1])) {
                return message.reply(
                    `Subcommand \`${list[1]}\` for command \`${list[0]}\` not found. Use ${message.client.config.prefix}help to see all commands.`
                )
            }

            try {
                let path = `${message.client.wf}/assets/commands/subcommands/${list[1]}.js`
                delete require.cache[require.resolve(path)]

                let command_to_execute = require(path)

                message.client.commands.get(list[0]).subcommandsExec.set(list[1], command_to_execute)
                return message.reply(`Subcommand \`${list[1]}\` for command \`${list[0]}\` reloaded.`)
            } catch (e) {
                return message.reply(e.message)
            }
        }

        if (!commands.get(command)) {
            return message.reply(
                `Command \`${command}\` not found. Use ${message.client.config.prefix}help to see all commands.`
            )
        }

        try {
            let path = `${message.client.wf}/assets/commands/${command}.js`
            delete require.cache[require.resolve(path)]

            let command_to_execute = require(path)

            message.client.commands.set(command, command_to_execute)
            return message.reply(`Command \`${command}\` reloaded.`)
        } catch (e) {
            return message.reply(e.message)
        }
    },
}
