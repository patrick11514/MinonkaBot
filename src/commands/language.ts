import { Client, CommandInteraction } from 'discord.js'
import Logger from '../lib/logger'
import User from '../types/usersDB'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('Language', 'cyanBright')

    e.on('command', async (interaction: CommandInteraction) => {
        let db = client.usersDB

        if (interaction.commandName === 'language') {
            let language = interaction.options.get('language', false)
            let language2 = interaction.options.get('language2', false)

            if (!language && !language2) {
                if (await db.has(interaction.user.id)) {
                    let data: User = await db.get(interaction.user.id)
                    if (data.language) {
                        let translate = client.config.languageTranslates[data.language]

                        return interaction.reply({
                            content: `Váš jazyk je nastaven na: ${translate}`,
                        })
                    }
                }
                let translate = client.config.languageTranslates['cs_CZ']

                return interaction.reply({
                    content: `Váš jazyk je nastaven na: ${translate}`,
                })
            }
            //language is primary than language2, because both cant be set
            let lang: string = ''
            if (language) {
                //if language or language and language2 is set

                lang = language.value as string
            } else if (language2) {
                //if only language 2 is set
                lang = language2.value as string
            }

            let translate = client.config.languageTranslates[lang]

            if (!(await db.has(interaction.user.id))) {
                await db.set(interaction.user.id, {
                    language: lang,
                })
            } else {
                let data: User = await db.get(interaction.user.id)
                data.language = lang
                await db.set(interaction.user.id, data)
            }

            return interaction.reply({
                content: `Váš jazyk byl nastaven na: ${translate}`,
            })
        }
    })
}

export async function command() {}
