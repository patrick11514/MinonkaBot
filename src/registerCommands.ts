import { langaugeList, languageTranslations, regionTranslates } from '$/data/translates'
import Logger from '$/lib/logger'
import { env } from '$/types/env'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { regions } from './lib/RiotAPI'

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
    new SlashCommandBuilder()
        .setName('profile')
        .setNameLocalization('cs', 'profil')
        .setDescription('Shows information about your League of Legends profile.')
        .setDescriptionLocalization('cs', 'Zobrazí informace o tvém League of Legends profilu.')
        .addMentionableOption((option) => {
            return option
                .setName('mention')
                .setNameLocalization('cs', 'oznaceni')
                .setDescription('Mention someone to show their profile')
                .setDescriptionLocalization('cs', 'Označ někoho, aby se zobrazil jeho profil')
                .setRequired(false)
        })
        .addStringOption((option) => {
            return option
                .setName('riot_id')
                .setNameLocalization('cs', 'riot_id')
                .setDescription('Shows profile of someone by their riot id (Name#Tag)')
                .setDescriptionLocalization('cs', 'Zobrazí profil někoho podle jeho riot id (Jméno#Tag)')
                .setRequired(false)
        })
        .addStringOption((option) => {
            return option
                .setName('summoner_name')
                .setNameLocalization('cs', 'summoner_name')
                .setDescription('Shows profile of someone by their summoner name + region')
                .setDescriptionLocalization('cs', 'Zobrazí profil někoho podle jeho summoner name + regionu')
                .setRequired(false)
        })
        .addStringOption((option) => {
            return option
                .setName('region')
                .setNameLocalization('cs', 'region')
                .setDescription('Shows profile of someone by their region + summoner name')
                .setDescriptionLocalization('cs', 'Zobrazí profil někoho podle jeho regionu + summoner name')
                .setChoices(
                    ...regions.map((region) => {
                        return {
                            name: regionTranslates[region],
                            value: region,
                        }
                    }),
                )
                .setRequired(false)
        }),
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
