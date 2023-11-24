import { langaugeList, languageTranslations } from '$data/translates'
import Logger from '$lib/logger'
import { env } from '$types/env'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'

const rest = new REST({ version: '10' }).setToken(env.BOT_SECRET)

//beacuse SlashCommandBuilder[] is throwing error
const rawCommands = [
    new SlashCommandBuilder()
        .setName('link')
        .setNameLocalization('cs', 'propojit')
        .setDescription('Links your league of legends account with your discord account.')
        .setDescriptionLocalizations({
            cs: 'Propojí tvůj league of legends účet s discord účtem.',
        })
        .addStringOption((option) => {
            return option
                .setName('action')
                .setNameLocalization('cs', 'akce')
                .setDescription('What do you want to do with your account? (manage)')
                .setDescriptionLocalization('cs', 'Co chceš udělat se svým účtem? (spravovat)')
                .addChoices({
                    name: 'manage',
                    value: 'manage',
                    name_localizations: {
                        cs: 'spravovat',
                    },
                })
                .setRequired(false)
        }),
    new SlashCommandBuilder()
        .setName('language')
        .setNameLocalization('cs', 'jazyk')
        .setDescription('Changes your language')
        .setDescriptionLocalization('cs', 'Nastaví tvůj jazyk')
        .addStringOption((option) => {
            return option
                .setName('language')
                .setNameLocalization('cs', 'jazyk')
                .setDescription('Select your language')
                .setDescriptionLocalization('cs', 'Nastav si jazyk')
                .addChoices(
                    ...langaugeList.map((lang) => {
                        return {
                            name: languageTranslations[lang],
                            value: lang,
                        }
                    }),
                )
        }),
    new SlashCommandBuilder().setName('profile'),
] as SlashCommandBuilder[]

const json = rawCommands.map((command) => command.toJSON())

const l = new Logger('RegisterCommands', 'yellow')
l.start('Registering commands...')

rest.put(Routes.applicationCommands(env.BOT_ID), { body: json })
    .then(() => {
        l.stop('Successfully registered commands')
    })
    .catch((err) => {
        l.error('Failed to register commands')
        l.stopError(err)
    })
