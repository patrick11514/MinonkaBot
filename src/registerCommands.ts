import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import * as dotenv from 'dotenv'
import JSONdb from 'simple-json-db'
import commands from './commands'
dotenv.config()

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)

const removeCommands = false
const guildsIds = ['713520402315608148']

;(async () => {
    if (removeCommands) {
        let data = (await rest.get(Routes.applicationCommands(process.env.DISCORD_ID.toString()))) as Array<{
            id: string
            name: string
        }>

        for (let command of data) {
            console.log(`Deleting command: ${command.name}`)
            await rest.delete(Routes.applicationCommand(process.env.DISCORD_ID.toString(), command.id))
        }

        for (let guildId of guildsIds) {
            let data = (await rest.get(
                Routes.applicationGuildCommands(process.env.DISCORD_ID.toString(), guildId),
            )) as Array<{
                id: string
                name: string
            }>

            for (let command of data) {
                console.log(`Deleting command: ${command.name}`)
                await rest.delete(
                    `${Routes.applicationGuildCommand(process.env.DISCORD_ID.toString(), guildId, command.id)}`,
                )
            }
        }
    } else {
        const rawCommands: Array<any> = []

        for (let command in commands) {
            let commandData = commands[command]
            let builder = new SlashCommandBuilder().setName(command).setDescription(commandData.description)

            if (commandData.options) {
                for (let option of commandData.options) {
                    switch (option.type) {
                        case 'STRING': {
                            builder.addStringOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                if (option.choices) {
                                    opt.addChoices(
                                        ...option.choices.map((choice) => {
                                            return {
                                                name: choice.name,
                                                value: (choice.value as string) || choice.name,
                                            }
                                        }),
                                    )
                                }
                                return opt
                            })
                            break
                        }
                        case 'INTEGER': {
                            builder.addIntegerOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                if (option.choices) {
                                    opt.addChoices(
                                        ...option.choices.map((choice) => {
                                            return {
                                                name: choice.name,
                                                value: (choice.value as number) || parseInt(choice.name),
                                            }
                                        }),
                                    )
                                }
                                return opt
                            })
                            break
                        }
                        case 'BOOLEAN': {
                            builder.addBooleanOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                return opt
                            })
                            break
                        }
                        case 'USER': {
                            builder.addUserOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                return opt
                            })
                            break
                        }
                        case 'CHANNEL': {
                            builder.addChannelOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                return opt
                            })
                            break
                        }
                        case 'ROLE': {
                            builder.addRoleOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                return opt
                            })
                            break
                        }
                        case 'MENTIONABLE': {
                            builder.addMentionableOption((o) => {
                                let opt = o
                                    .setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                return opt
                            })
                            break
                        }
                    }
                }
            }

            rawCommands.push(builder)
        }

        //

        const commandsJson = rawCommands.map((command) => command.toJSON())

        try {
            let cmds = (await rest.put(Routes.applicationCommands(process.env.DISCORD_ID.toString()), {
                body: commandsJson,
            })) as Array<{
                id: string
                application_id: string
                name: string
            }>

            console.log(`Successfully registered all commands.`)
            let db = new JSONdb('databases/commands.json')
            cmds.forEach((cmd) => {
                db.set(cmd.name, cmd.id)
            })
        } catch (e) {
            console.error(e)
        }
    }
})()
