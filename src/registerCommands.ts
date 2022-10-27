import { REST, SlashCommandBuilder, Routes } from 'discord.js'
import * as dotenv from 'dotenv'
import commands from './commands'
dotenv.config()

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)

const removeCommands = false
const guildsIds = ['713520402315608148']

;(async () => {
    if (removeCommands) {
        let data = (await rest.get(Routes.applicationCommands(process.env.DISCORD_ID))) as Array<{
            id: string
            name: string
        }>

        for (let command of data) {
            console.log(`Deleting command: ${command.name}`)
            await rest.delete(Routes.applicationCommand(process.env.DISCORD_ID, command.id))
        }

        for (let guildId of guildsIds) {
            let data = (await rest.get(Routes.applicationGuildCommands(process.env.DISCORD_ID, guildId))) as Array<{
                id: string
                name: string
            }>

            for (let command of data) {
                console.log(`Deleting command: ${command.name}`)
                await rest.delete(`${Routes.applicationGuildCommand(process.env.DISCORD_ID, guildId, command.id)}`)
            }
        }
    } else {
        const rawCommands: Array<any> = []

        for (let command in commands) {
            let commandData = commands[command]
            let builder = new SlashCommandBuilder().setName(command).setDescription(commandData.description)

            if (commandData.options) {
                for (let option of commandData.options) {
                    builder.addStringOption((o) => {
                        let opt = o.setName(option.name).setDescription(option.description).setRequired(option.required)
                        if (option.choices) {
                            opt.addChoices(
                                ...option.choices.map((choice) => {
                                    return {
                                        name: choice.name,
                                        value: choice.value || choice.name,
                                    }
                                })
                            )
                        }
                        return opt
                    })
                }
            }

            rawCommands.push(builder)
        }

        //

        const commandsJson = rawCommands.map((command) => command.toJSON())

        rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: commandsJson })
            .then(() => console.log(`Successfully registered all commands.`))
            .catch(console.error)
    }
})()
