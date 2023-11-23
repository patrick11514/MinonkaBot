import { db } from '$/types/connection'
import { languageData, regionTranslates } from '$data/translates'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'
import { z } from 'zod'
import { RiotAPI, errorSchema, regions, routingValues, type region, type routingValue } from './RiotAPI'
import { MemoryStorage } from './memStorage'
import { getLanguageData } from './utils'

export class Link {
    /**
     * Temporary storage in memory for linking accounts
     */
    private tempStorage = new MemoryStorage<
        string,
        | {
              tempUsername: string
          }
        | {
              tempRiotUsername: string
              tempRiotTag: string
          }
    >()

    /**
     * Hadle /link command interaction
     * @param interaction Command Interaction
     * @returns Promise<void>
     */
    public async handleCommand(interaction: ChatInputCommandInteraction) {
        const value = interaction.options.getString('action', false)

        if (value === null) {
            return this.startLinking(interaction)
        }

        if (value === 'manage') {
            return this.manageAccounts(interaction)
        }
    }

    /**
     * Start linking by sending select menu with linking methods
     * @param interaction Interaction from /link command or from add button in manage accounts section
     */
    public async startLinking(interaction: ChatInputCommandInteraction | ButtonInteraction) {
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
    }

    /**
     * Send modal for linking with username field for old summoner name method or username and tag for riot id method
     * @param interaction Select Menu Interaction from startLinking method
     * @returns Promise<void>
     */
    public async sendModal(interaction: StringSelectMenuInteraction) {
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
    }

    /**
     * Handle output of modal with username and tag or just username
     * Sends select menu with regions or routing values based on user's linking method
     * @param interaction Modal Interaction from sendModal method
     */
    public async handleModal(interaction: ModalSubmitInteraction) {
        const language = await getLanguageData(interaction.user.id)
        const select = new StringSelectMenuBuilder()
            .setCustomId('#LOL_LINK_ADDITIONAL')
            .setPlaceholder(language.link.regionOrServer.placeholder)

        let message = language.link.regionOrServer.message

        if (interaction.customId == '#LOL_LINK_MODAL_RIOT') {
            //select with routing values
            select.addOptions(
                routingValues
                    .filter((r) => r != 'SEA')
                    .map((value) => {
                        return new StringSelectMenuOptionBuilder()
                            .setValue(value)
                            .setLabel(language.global.routingValues[value] as string)
                    }),
            )

            this.tempStorage.add(interaction.user.id, {
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

            this.tempStorage.add(interaction.user.id, {
                tempUsername: interaction.fields.getTextInputValue('#LOL_LINK_USERNAME'),
            })
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

        interaction.reply({
            ephemeral: true,
            content: message,
            components: [row],
        })
    }

    /**
     * Check if account is already linked with someone
     * @param interaction Intearction from select menu with region or routing value
     * @param language Users langauge data
     * @param puuid Account's puuid
     * @returns true if account is already linked, false if not
     */
    private async checkLinked(
        interaction: StringSelectMenuInteraction,
        language: languageData,
        puuid: string,
    ): Promise<boolean> {
        const alreadyLinkedRiot = await db
            .selectFrom('riot_link')
            .select('id')
            .where('puuid', '=', puuid)
            .executeTakeFirst()

        const alreadyLinkedUsername = await db
            .selectFrom('user_link')
            .select('id')
            .where('puuid', '=', puuid)
            .executeTakeFirst()

        if (alreadyLinkedRiot !== undefined || alreadyLinkedUsername !== undefined) {
            interaction.reply({
                ephemeral: true,
                content: language.link.process.alreadyLinked,
            })

            return true
        }

        return false
    }

    /**
     * Send error base of data from RiotAPI
     * @param interaction Interaction from select menu with region or routing value
     * @param message Message to be send
     */
    private sendError(interaction: StringSelectMenuInteraction, message: string) {
        this.tempStorage.delete(interaction.user.id)

        interaction.reply({
            ephemeral: true,
            content: message,
        })
    }

    /**
     * Check which error will be sent to user
     * @param data Data from RiotAPI
     * @param interaction Interaction from select menu with region or routing value
     * @param language Users language data
     * @returns void
     */
    private checkError(
        data:
            | {
                  status: false
                  errorSchema: true
                  data: z.infer<typeof errorSchema>
              }
            | {
                  status: false
                  errorSchema: false
              },
        interaction: StringSelectMenuInteraction,
        language: languageData,
    ) {
        if (!data.errorSchema) {
            return this.sendError(interaction, language.link.process.error)
        } else {
            const { status_code } = data.data.status

            if (status_code === 404) {
                return this.sendError(interaction, language.link.process.unknownUser)
            } else {
                return this.sendError(interaction, language.link.process.adminError)
            }
        }
    }

    /**
     * Asks RiotAPI for account data and saves it to database
     * @param interaction Select menu interaction with region or routing value
     * @returns Promise<void>
     */
    public async performLink(interaction: StringSelectMenuInteraction) {
        const language = await getLanguageData(interaction.user.id)

        const savedData = this.tempStorage.get(interaction.user.id)

        if (savedData === undefined) return

        /**
         * @todo get random pfp and promt user to change his profile picture to it and then check it
         */

        if ('tempUsername' in savedData) {
            const region = interaction.values[0] as region

            if (!regions.includes(region)) return

            const endpoint = RiotAPI.getAccountByUsername(region, savedData.tempUsername)

            const data = await endpoint.fetchSafe()

            if (data.status === false) {
                this.checkError(data, interaction, language)
                return
            } else {
                const { puuid, name } = data.data

                //check if user already linked
                if (await this.checkLinked(interaction, language, puuid)) {
                    return
                }

                await db
                    .insertInto('user_link')
                    .values({
                        user_id: interaction.user.id,
                        puuid,
                        name,
                        region,
                    })
                    .executeTakeFirst()

                interaction.reply({
                    ephemeral: true,
                    content: language.link.process.success,
                })
            }
        } else {
            const routingValue = interaction.values[0] as routingValue

            if (!routingValues.includes(routingValue)) return

            const endpoint = RiotAPI.getAccountByRiotId(routingValue, savedData.tempRiotUsername, savedData.tempRiotTag)

            const data = await endpoint.fetchSafe()

            if (data.status === false) {
                this.checkError(data, interaction, language)
                return
            } else {
                const { puuid, gameName, tagLine } = data.data

                //check if user already linked

                if (await this.checkLinked(interaction, language, puuid)) {
                    return
                }

                await db
                    .insertInto('riot_link')
                    .values({
                        user_id: interaction.user.id,
                        gameName,
                        tagLine,
                        puuid,
                    })
                    .executeTakeFirst()

                interaction.reply({
                    ephemeral: true,
                    content: language.link.process.success,
                })
            }

            this.tempStorage.delete(interaction.user.id)
        }
    }

    /**
     * Send's text with all user's linked accounts and buttons to manage them
     * Add button - starts linking
     * Remove button - removes account
     * @param interaction ChatInputCommandInteraction from /link command
     * @returns Promise<void>
     */
    public async manageAccounts(interaction: ChatInputCommandInteraction) {
        const language = await getLanguageData(interaction.user.id)

        const riotAccounts = await db
            .selectFrom('riot_link')
            .select(['gameName', 'tagLine', 'puuid'])
            .where('user_id', '=', interaction.user.id)
            .execute()

        const userAccounts = await db
            .selectFrom('user_link')
            .select(['name', 'puuid', 'region'])
            .where('user_id', '=', interaction.user.id)
            .execute()

        if (riotAccounts.length === 0 && userAccounts.length === 0) {
            interaction.reply({
                ephemeral: true,
                content: language.link.manage.noAccounts,
            })
            return
        }

        let text = `# ${language.link.manage.title}\n`

        if (riotAccounts.length > 0) {
            text += `## ${language.link.manage.riotIdAccounts}\n`
            riotAccounts.forEach((account) => {
                text += `- ${account.gameName}#${account.tagLine}\n`
            })
        }

        if (userAccounts.length > 0) {
            text += `## ${language.link.manage.userRegAccounts}\n`
            userAccounts.forEach((account) => {
                text += `- ${account.name}#${regionTranslates[account.region as region]}\n`
            })
        }

        text += `\n# ${language.link.manage.manage}\n`

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('#LOL_LINK_ADD_ACCOUNT')
                .setEmoji('➕')
                .setLabel(language.link.manage.add)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('#LOL_LINK_REMOVE_ACCOUNT')
                .setEmoji('➖')
                .setLabel(language.link.manage.remove)
                .setStyle(ButtonStyle.Danger),
        )

        interaction.reply({
            ephemeral: true,
            content: text,
            components: [row],
        })
    }

    /**
     * Show select menu with all user's accounts to remove
     * @param interaction Remove button interaction from manageAccounts method
     * @returns Promise<void>
     */
    public async removeAccount(interaction: ButtonInteraction) {
        const language = await getLanguageData(interaction.user.id)

        const riotAccounts = await db
            .selectFrom('riot_link')
            .select(['gameName', 'tagLine', 'puuid'])
            .where('user_id', '=', interaction.user.id)
            .execute()

        const userAccounts = await db
            .selectFrom('user_link')
            .select(['name', 'puuid', 'region'])
            .where('user_id', '=', interaction.user.id)
            .execute()

        if (riotAccounts.length === 0 && userAccounts.length === 0) {
            interaction.reply({
                ephemeral: true,
                content: language.link.remove.noAccounts,
            })
            return
        }

        const select = new StringSelectMenuBuilder().setCustomId('#LOL_LINK_REMOVE_ACCOUNT_SELECT').setOptions(
            ...riotAccounts.map((account) => {
                return new StringSelectMenuOptionBuilder()
                    .setValue(account.puuid)
                    .setLabel(`${account.gameName}#${account.tagLine} (Riot)`)
            }),
            ...userAccounts.map((account) => {
                return new StringSelectMenuOptionBuilder()
                    .setValue(account.puuid)
                    .setLabel(`${account.name}#${regionTranslates[account.region as region]}`)
            }),
        )

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

        interaction.reply({
            ephemeral: true,
            content: language.link.remove.title,
            components: [row],
        })
    }

    /**
     * Remove selected account from database
     * @param interaction Select menu interaction from removeAccount method
     * @returns Promise<void>
     */
    public async removeAccountSelect(interaction: StringSelectMenuInteraction) {
        const puuid = interaction.values[0]

        const langauge = await getLanguageData(interaction.user.id)

        const delRiot = await db
            .deleteFrom('riot_link')
            .where('puuid', '=', puuid)
            .where('user_id', '=', interaction.user.id)
            .executeTakeFirst()

        const delUser = await db
            .deleteFrom('user_link')
            .where('puuid', '=', puuid)
            .where('user_id', '=', interaction.user.id)
            .executeTakeFirst()

        if (Number(delRiot.numDeletedRows) == 0 && Number(delUser.numDeletedRows) == 0) {
            interaction.reply({
                ephemeral: true,
                content: langauge.link.remove.error,
            })
            return
        }

        interaction.reply({
            ephemeral: true,
            content: langauge.link.remove.success,
        })
    }
}
