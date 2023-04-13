import { ChatInputCommandInteraction, Client } from 'discord.js'
import User from '../types/usersDB'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        let db = client.usersDB

        if (interaction.commandName === 'language') {
            let language = interaction.options.getString('language', false)
            let language2 = interaction.options.getString('language2', false)

            if (!language && !language2) {
                if (await db.has(interaction.user.id)) {
                    let data: User = await db.get(interaction.user.id)
                    if (data.language) {
                        let translate = client.config.languageTranslates[data.language]

                        return interaction.editReply({
                            content: `Váš jazyk je nastaven na: ${translate}`,
                        })
                    }
                }
                let translate = client.config.languageTranslates['cs_CZ']

                return interaction.editReply({
                    content: `Váš jazyk je nastaven na: ${translate}`,
                })
            }
            //language is primary than language2, because both cant be set
            let lang: string = ''
            if (language) {
                //if language or language and language2 is set

                lang = language
            } else if (language2) {
                //if only language 2 is set
                lang = language2
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

            return interaction.editReply({
                content: `Váš jazyk byl nastaven na: ${translate}`,
            })
        }
    })
}
