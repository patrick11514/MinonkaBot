const fs = require('fs')
module.exports = {
    name: 'reload',
    arguments: [],
    subcommands: [],
    description: 'Reload command commands',
    admin: true,
    execute: function (message, args) {
        // if command don't have arguments, then reply with error message
        if (!args.length) {
            return message.reply('Please specify a command to reload')
        }

        //if user provice more than 1 argument then reply with error message
        if (args.length > 1) {
            return message.reply('Please specify only one command to reload')
        }

        //get all command from global scope
        const commands = message.client.commands

        //get command name from arguments
        let command = args[0]

        //if command includes @
        if (command.includes('@')) {
            //split them
            let list = command.split('@')
            //if command is not loaded, then reply with error message
            if (!commands.get(list[0])) {
                return message.reply(
                    `Command \`${list[0]}\` not found. Use ${message.client.config.prefix}help to see all commands.`
                )
            }

            //if command don't have provided subcommand then reply with error message
            if (!commands.get(list[0])?.subcommands.includes(list[1])) {
                return message.reply(
                    `Subcommand \`${list[1]}\` for command \`${list[0]}\` not found. Use ${message.client.config.prefix}help to see all commands.`
                )
            }

            //try to load command
            try {
                //get path to command file
                let path = `${message.client.wf}/assets/commands/subcommands/${list[0]}@${list[1]}.js`
                //delete command from cache
                delete require.cache[require.resolve(path)]
                //require command
                let command_to_execute = require(path)
                //and save it to global scope
                message.client.commands.get(list[0]).subcommandsExec.set(list[1], command_to_execute)
                //execute setup function for subcommand
                command_to_execute.setup(message.client, true)
                //reply with success message
                return message.reply(`Subcommand \`${list[1]}\` for command \`${list[0]}\` reloaded.`)
            } catch (e) {
                //reply with error message
                return message.reply(e.message)
            }
        }

        //if command is "GLOBAL", then reload glob.js
        if (command == 'GLOBAL') {
            //try to load global functions
            try {
                //get path to global functions file
                let path = `${message.client.wf}/assets/glob.js`
                //delete global functions from cache
                delete require.cache[require.resolve(path)]
                //require global functions
                let command_to_execute = require(path)
                //and save it to global scope
                message.client.fc = command_to_execute
                //load config to modules
                message.client.fc.config = message.client.config
                //reply with success message
                return message.reply('Global functions reloaded.')
            } catch (e) {
                //reply with error message
                return message.reply(e.message)
            }
        }

        //if command is not loaded, then reply with error message
        if (!commands.get(command)) {
            return message.reply(
                `Command \`${command}\` not found. Use ${message.client.config.prefix}help to see all commands.`
            )
        }
        //try to load command
        try {
            //get path to command file
            let path = `${message.client.wf}/assets/commands/${command}.js`
            //delete command from cache
            delete require.cache[require.resolve(path)]
            //require command
            let command_to_execute = require(path)
            //and save it to global scope
            message.client.commands.set(command, command_to_execute)
            //execute setup function for command
            command_to_execute.setup(message.client, true)
            //reply with success message
            return message.reply(`Command \`${command}\` reloaded.`)
        } catch (e) {
            //reply with error message
            return message.reply(e.message)
        }
    },
}
