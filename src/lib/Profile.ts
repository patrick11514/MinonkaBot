import { ChatInputCommandInteraction, RepliableInteraction } from 'discord.js'
import { Accounts } from './Accounts'
import { RiotAPI, region } from './RiotAPI'
import { getLanguageData } from './utils'

export class Profile {
    static async getUserProfile(interaction: ChatInputCommandInteraction) {
        const language = await getLanguageData(interaction.user.id)

        const account = new Accounts(interaction.user.id, language)

        const accounts = await account.getAllAccounts()

        if (accounts.length > 1) {
            account.selectAccount(interaction, Profile.getUserProfileByPuuid)
        }
    }

    static async getUserProfileByPuuid(interaction: RepliableInteraction, puuid: string, region: region) {
        const language = await getLanguageData(interaction.user.id)

        const endpoint = RiotAPI.getAccountByPuuid(region, puuid)
        const accountData = await endpoint.fetchSafe()

        if (!accountData.status) {
            const account = new Accounts(interaction.user.id, language)
            const error = account.getError(accountData)

            interaction.reply({
                ephemeral: true,
                content: error,
            })

            return
        }

        interaction.reply({
            content: JSON.stringify(accountData.data),
        })
    }
}
