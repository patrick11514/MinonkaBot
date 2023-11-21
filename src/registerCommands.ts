import Logger from '$lib/logger'
import { env } from '$types/env'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'

const rest = new REST({ version: '10' }).setToken(env.BOT_SECRET)

//beacuse SlashCommandBuilder[] is throwing error
const rawCommands = [
    new SlashCommandBuilder()
        .setName('link')
        .setDescription('Links your league of legends account with your discord account.')
        .setDescriptionLocalizations({
            cs: 'Propojí tvůj league of legends účet s discord účtem.',
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
