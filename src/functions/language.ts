import { language, languageTranslations } from '$/data/translates'
import { DiscordEvent } from '$/hooks'
import { getLanguage, getLanguageData } from '$/lib/utils'
import { db } from '$/types/connection'

export default {
    events: [
        new DiscordEvent('interactionCreate', async (interaction) => {
            if (!interaction.isChatInputCommand()) return
            if (interaction.commandName !== 'language') return

            const currentLanguage = await getLanguageData(interaction.user.id)

            const language = interaction.options.getString('language', false) as language | undefined

            if (!language) {
                const currentUserLanguage = await getLanguage(interaction.user.id)

                interaction.reply({
                    ephemeral: true,
                    content: `${currentLanguage.language.info} ${languageTranslations[currentUserLanguage]}`,
                })
                return
            } else {
                //Check for existing record
                const data = await db
                    .selectFrom('languages')
                    .select('user_id')
                    .where('user_id', '=', interaction.user.id)
                    .executeTakeFirst()

                if (!data) {
                    await db
                        .insertInto('languages')
                        .values({
                            user_id: interaction.user.id,
                            language,
                        })
                        .execute()

                    interaction.reply({
                        ephemeral: true,
                        content: `${currentLanguage.language.success} ${languageTranslations[language]}`,
                    })
                    return
                }

                await db
                    .updateTable('languages')
                    .set({
                        language,
                    })
                    .where('user_id', '=', interaction.user.id)
                    .execute()

                interaction.reply({
                    ephemeral: true,
                    content: `${currentLanguage.language.success} ${languageTranslations[language]}`,
                })
                return
            }
        }),
    ],
}
