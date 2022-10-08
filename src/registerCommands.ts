import { REST, SlashCommandBuilder, Routes } from 'discord.js'
import * as dotenv from 'dotenv'
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

        //new commands
        rawCommands.push(
            new SlashCommandBuilder()
                .setName('profile')
                .setDescription('Zobrazí tvůj league of legends profil')
                .addStringOption((option) =>
                    option.setName('username').setDescription('Jméno vyvolávače').setRequired(false)
                )
                .addStringOption((option) =>
                    option
                        .setName('region')
                        .setDescription('Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)')
                        .addChoices(
                            { name: 'EUNE', value: 'EUN1' },
                            { name: 'EUW', value: 'EUW1' },
                            { name: 'BR', value: 'BR1' },
                            { name: 'JP', value: 'JP1' },
                            { name: 'KR', value: 'KR' },
                            { name: 'LAN', value: 'LA1' },
                            { name: 'LAS', value: 'LA2' },
                            { name: 'NA', value: 'NA1' },
                            { name: 'OCE', value: 'OC1' },
                            { name: 'TR', value: 'TR1' },
                            { name: 'RU', value: 'RU' }
                        )
                        .setRequired(false)
                )
        )

        //

        const commands = rawCommands.map((command) => command.toJSON())

        rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: commands })
            .then(() => console.log(`Successfully registered all commands.`))
            .catch(console.error)
    }
})()
