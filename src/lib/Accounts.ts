import { phrases, regionTranslates } from '$/data/translates'
import { db } from '$/types/connection'
import { errorResponse } from '$/types/types'
import {
    ActionRowBuilder,
    Interaction,
    RepliableInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from 'discord.js'
import crypto from 'node:crypto'
import { region } from './RiotAPI'

export type Account =
    | {
          type: 'riot'
          name: string
          tag: string
          region: region
          puuid: string
      }
    | {
          type: 'username'
          name: string
          region: region
          puuid: string
      }

export class Accounts {
    private userId: string
    private accountList: Account[] = []
    private phrases: phrases

    constructor(userId: string, languageData: phrases) {
        this.userId = userId
        this.phrases = languageData
    }

    public async getAllAccounts(): Promise<Account[]> {
        const riotAccounts = await db
            .selectFrom('riot_link')
            .select(['gameName', 'tagLine', 'puuid', 'region'])
            .where('user_id', '=', this.userId)
            .execute()
        const userAccounts = await db
            .selectFrom('user_link')
            .select(['name', 'region', 'puuid'])
            .where('user_id', '=', this.userId)
            .execute()

        this.accountList = [
            ...riotAccounts.map((account) => {
                return {
                    type: 'riot' as const,
                    name: account.gameName,
                    tag: account.tagLine,
                    region: account.region as region,
                    puuid: account.puuid,
                }
            }),

            ...userAccounts.map((account) => {
                return {
                    type: 'username' as const,
                    name: account.name,
                    region: account.region as region,
                    puuid: account.puuid,
                }
            }),
        ]

        return this.accountList
    }

    public async selectAccount(
        interaction: RepliableInteraction,
        callback: (interaction: RepliableInteraction, puuid: string, region: region) => void,
    ) {
        const bytes = crypto.randomBytes(8).toString('hex')

        const select = new StringSelectMenuBuilder().setCustomId(`#LOL_${bytes}`).setOptions(
            ...this.accountList.map((account) => {
                return new StringSelectMenuOptionBuilder()
                    .setValue(`${account.puuid}##${account.region}`)
                    .setLabel(
                        account.type === 'riot'
                            ? `${account.name}#${account.tag} (${this.phrases.account.riot})`
                            : `${account.name}#${regionTranslates[account.region]} (${this.phrases.account.username})`,
                    )
            }),
        )

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)

        interaction.reply({
            ephemeral: true,
            content: this.phrases.account.title,
            components: [row],
        })

        const localCallback = async (interaction: Interaction) => {
            if (!interaction.isStringSelectMenu()) return
            if (interaction.customId !== `#LOL_${bytes}`) return

            const data = interaction.values[0].split('##')

            //call callback
            callback(interaction, data[0], data[1] as region)

            //remove listener
            process.client.removeListener('interactionCreate', localCallback)
        }

        //Register the callback for select menu
        process.client.on('interactionCreate', localCallback)
    }

    public getError(data: errorResponse) {
        if (!data.errorSchema) {
            return this.phrases.global.adminError
        }

        const { status } = data.data

        if (status.status_code === 400) {
            return this.phrases.global.unknownUser
        } else {
            return this.phrases.global.error
        }
    }
}
