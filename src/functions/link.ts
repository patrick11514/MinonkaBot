import { routingValues } from '$lib/RiotAPI'
import { MemoryStorage } from '$lib/memStorage'
import { getLanguageData } from '$lib/utils'
import {
    ActionRowBuilder,
    ModalBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { DiscordEvent } from '../hooks'

const tempStorage = new MemoryStorage<
    string,
    | {
          tempUsername: string
      }
    | {
          tempRiotUsername: string
          tempRiotTag: string
      }
>()

export default {
    events: [
        /**
         *
         * /link
         *
         */
        new DiscordEvent('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return
            if (interaction.commandName !== 'link') return

            const language = await getLanguageData(interaction.user.id)

            const select = new StringSelectMenuBuilder()
                .setCustomId('#LOL_LINK_TYPE')
                .setPlaceholder(language.link.method.title)
                .addOptions(
                    new StringSelectMenuOptionBuilder().setValue('riotId').setLabel(language.link.method.riotId),
                    new StringSelectMenuOptionBuilder().setValue('userReg').setLabel(language.link.method.userReg),
                )

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

            interaction.reply({
                ephemeral: true,
                components: [row],
            })
        }),
        /**
         *
         * MODAL
         *
         */
        new DiscordEvent('interactionCreate', async (interaction) => {
            if (!interaction.isStringSelectMenu()) return
            if (interaction.customId != '#LOL_LINK_TYPE') return

            const type = interaction.values[0]

            if (!['userReg', 'riotId'].includes(type)) return

            const language = await getLanguageData(interaction.user.id)

            const modal = new ModalBuilder()
                .setCustomId('#LOL_LINK_MODAL_' + (type == 'userReg' ? 'USERNAME' : 'RIOT'))
                .setTitle(language.link.modal.title)
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setStyle(TextInputStyle.Short)
                            .setLabel(language.link.modal.riotIdName)
                            .setPlaceholder(language.link.modal.riotIdNamePlaceholder)
                            .setCustomId('#LOL_LINK_USERNAME'),
                    ),
                )

            if (type == 'riotId') {
                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setStyle(TextInputStyle.Short)
                            .setLabel(language.link.modal.riotIdTag)
                            .setPlaceholder(language.link.modal.riotIdTagPlaceholder)
                            .setCustomId('#LOL_LINK_TAG'),
                    ),
                )
            }

            interaction.showModal(modal)
        }),
        /**
         *
         * Modal
         *
         */
        new DiscordEvent('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit()) return
            if (!interaction.customId.startsWith('#LOL_LINK_MODAL_')) return

            const select = new StringSelectMenuBuilder().setCustomId('#LOL_LINK_ADDITIONAL')
            const language = await getLanguageData(interaction.user.id)
            let message = ''

            if (interaction.customId == '#LOL_LINK_MODAL_RIOT') {
                //select with routing values
                select.setPlaceholder(language.link.regionOrServer.placeholder)
                message = language.link.regionOrServer.message

                select.addOptions(
                    routingValues.map((value) => {
                        return new StringSelectMenuOptionBuilder()
                            .setValue(value)
                            .setLabel(language.global.routingValues[value])
                    }),
                )

                tempStorage.add(interaction.user.id, {
                    tempRiotUsername: interaction.fields.getTextInputValue('#LOL_LINK_USERNAME'),
                    tempRiotTag: interaction.fields.getTextInputValue('#LOL_LINK_TAG'),
                })
            } else {
                //select with regions
            }

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

            interaction.reply({
                ephemeral: true,
                content: message,
                components: [row],
            })
        }),
    ],
}
