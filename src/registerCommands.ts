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

        rawCommands.push(
            new SlashCommandBuilder()
                .setName('language')
                .setDescription('Změní jazyk riot API (později i bota)')
                .addStringOption((option) =>
                    option
                        .setName('language')
                        .setDescription('Jazyk, na který chceš změnit bota')
                        .addChoices(
                            { value: 'cs_CZ', name: 'Czech (Czech Republic)' },
                            { value: 'el_GR', name: 'Greek (Greece)' },
                            { value: 'pl_PL', name: 'Polish (Poland)' },
                            { value: 'ro_RO', name: 'Romanian (Romania)' },
                            { value: 'hu_HU', name: 'Hungarian (Hungary)' },
                            { value: 'en_GB', name: 'English (United Kingdom)' },
                            { value: 'de_DE', name: 'German (Germany)' },
                            { value: 'es_ES', name: 'Spanish (Spain)' },
                            { value: 'it_IT', name: 'Italian (Italy)' },
                            { value: 'fr_FR', name: 'French (France)' },
                            { value: 'ja_JP', name: 'Japanese (Japan)' },
                            { value: 'ko_KR', name: 'Korean (Korea)' },
                            { value: 'es_MX', name: 'Spanish (Mexico)' },
                            { value: 'es_AR', name: 'Spanish (Argentina)' },
                            { value: 'pt_BR', name: 'Portuguese (Brazil)' },
                            { value: 'en_US', name: 'English (United States)' },
                            { value: 'en_AU', name: 'English (Australia)' },
                            { value: 'ru_RU', name: 'Russian (Russia)' },
                            { value: 'tr_TR', name: 'Turkish (Turkey)' },
                            { value: 'ms_MY', name: 'Malay (Malaysia)' },
                            { value: 'en_PH', name: 'English (Republic of the Philippines)' },
                            { value: 'en_SG', name: 'English (Singapore)' }
                        )
                )
                .addStringOption((option) =>
                    option
                        .setName('language2')
                        .setDescription('Jazyk, na který chceš změnit bota')
                        .addChoices(
                            { value: 'th_TH', name: 'Thai (Thailand)' },
                            { value: 'vn_VN', name: 'Vietnamese (Viet Nam)' },
                            { value: 'id_ID', name: 'Indonesian (Indonesia)' },
                            { value: 'zh_MY', name: 'Chinese (Malaysia)' },
                            { value: 'zh_CN', name: 'Chinese (China)' },
                            { value: 'zh_TW', name: 'Chinese (Taiwan)' }
                        )
                )
        )

        //

        const commands = rawCommands.map((command) => command.toJSON())

        rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: commands })
            .then(() => console.log(`Successfully registered all commands.`))
            .catch(console.error)
    }
})()
