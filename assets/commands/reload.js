const fs = require('fs')
module.exports = {
    name: 'reload',
    arguments: [],
    subcommands: [],
    description: 'Reload command commands',
    admin: true,
    execute: function (message, args) {
        if (!args.length) {
            message.reply('Please specify a command to reload')
            return
        }

        if (args.length > 1) {
            message.reply('Please specify only one command to reload')
            return
        }

        const commands = message.client.commands

        let command = args[0]

        if (command.includes('@')) {
            let list = command.split('@')
            if (!commands.get(list[0])) {
                message.reply(
                    `Command \`${list[0]}\` not found. Use ${message.client.config.prefix}help to see all commands.`
                )
                return
            }

            if (!commands.get(list[0])?.subcommands.includes(list[1])) {
                message.reply(
                    `Subcommand \`${list[1]}\` for command \`${list[0]}\` not found. Use ${message.client.config.prefix}help to see all commands.`
                )
                return
            }

            try {
                let path = `${message.client.wf}/assets/commands/subcommands/${list[1]}.js`
                delete require.cache[require.resolve(path)]

                let command_to_execute = require(path)

                message.client.commands.get(list[0]).subcommandsExec.set(list[1], command_to_execute)
                return message.reply(`Subcommand \`${list[1]}\` for command \`${list[0]}\` reloaded.`)
            } catch (e) {
                message.reply(e.message)
                return
            }
        }

        if (!commands.get(command)) {
            message.reply(
                `Command \`${command}\` not found. Use ${message.client.config.prefix}help to see all commands.`
            )
            return
        }

        try {
            let path = `${message.client.wf}/assets/commands/${command}.js`
            delete require.cache[require.resolve(path)]

            let command_to_execute = require(path)

            message.client.commands.set(command, command_to_execute)
            return message.reply(`Command \`${command}\` reloaded.`)
        } catch (e) {
            message.reply(e.message)
            return
        }
    },
}
