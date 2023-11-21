import { RiotAPI, region, regions, routingValue, routingValues } from '$lib/RiotAPI'
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

            const language = await getLanguageData(interaction.user.id)
            const select = new StringSelectMenuBuilder()
                .setCustomId('#LOL_LINK_ADDITIONAL')
                .setPlaceholder(language.link.regionOrServer.placeholder)

            let message = language.link.regionOrServer.message

            if (interaction.customId == '#LOL_LINK_MODAL_RIOT') {
                //select with routing values
                select.addOptions(
                    routingValues.map((value) => {
                        return new StringSelectMenuOptionBuilder()
                            .setValue(value)
                            .setLabel(language.global.routingValues[value] as string)
                    }),
                )

                tempStorage.add(interaction.user.id, {
                    tempRiotUsername: interaction.fields.getTextInputValue('#LOL_LINK_USERNAME'),
                    tempRiotTag: interaction.fields.getTextInputValue('#LOL_LINK_TAG'),
                })
            } else {
                //select with regions
                select.addOptions(
                    regions.map((value) => {
                        return new StringSelectMenuOptionBuilder()
                            .setValue(value)
                            .setLabel(language.global.regions[value] as string)
                    }),
                )

                tempStorage.add(interaction.user.id, {
                    tempUsername: interaction.fields.getTextInputValue('#LOL_LINK_USERNAME'),
                })
            }

            const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

            interaction.reply({
                ephemeral: true,
                content: message,
                components: [row],
            })
        }),

        /**
         *
         * Select region
         *
         */
        new DiscordEvent('interactionCreate', async (interaction) => {
            if (!interaction.isStringSelectMenu()) return
            if (interaction.customId != '#LOL_LINK_ADDITIONAL') return

            const savedData = tempStorage.get(interaction.user.id)
            if ('tempUsername' in savedData) {
                const region = interaction.values[0] as region

                if (!regions.includes(region)) return
            } else {
                const routingValue = interaction.values[0] as routingValue

                if (!routingValues.includes(routingValue)) return

                const endpoint = RiotAPI.getAccountByRiotId(
                    routingValue,
                    savedData.tempRiotUsername,
                    savedData.tempRiotTag,
                )
                console.log(await endpoint.fetchSafe())
            }
        }),
    ],
}
