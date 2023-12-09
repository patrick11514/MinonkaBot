import { RankedData } from '$/types/riotTypes'
import { RepliableInteraction } from 'discord.js'
import { Accounts } from './Accounts'
import { RiotAPI, region } from './RiotAPI'
import { getLanguage, getLanguageDataFromLang, makeThread } from './utils'

export type userData = {
    username: string
    level: number
    pfp: number
    region: region
    ranks: RankedData[]
}

export class Rank {
    private static async generateImage(data: userData): Promise<Buffer> {
        return makeThread('rank', data)
    }

    static async getUserProfileByPuuid(interaction: RepliableInteraction, puuid: string, region: region) {
        const languageId = await getLanguage(interaction.user.id)
        const language = getLanguageDataFromLang(languageId)

        const endpoint = RiotAPI.getAccountByPuuid(region, puuid)
        const rawAccountData = await endpoint.fetchSafe()

        const account = new Accounts(interaction.user.id, language)

        if (!rawAccountData.status) {
            const error = account.getError(rawAccountData)

            interaction.reply({
                ephemeral: true,
                content: error,
            })

            return
        }

        const accountData = rawAccountData.data

        const rankEndpoint = RiotAPI.getAccountRanks(region, accountData.id)
        const rawRankData = await rankEndpoint.fetchSafe()

        if (!rawRankData.status) {
            const error = account.getError(rawRankData)

            interaction.reply({
                ephemeral: true,
                content: error,
            })

            return
        }

        await interaction.deferReply()

        //we don't want to show the cherry (arenas) queue, in this command
        const rankData = rawRankData.data.filter((queue) => queue.queueType !== 'CHERRY')

        const userData: userData = {
            username: accountData.name,
            level: accountData.summonerLevel,
            pfp: accountData.profileIconId,
            region,
            ranks: rankData,
        }

        const data = await Rank.generateImage(userData)

        interaction.editReply({
            files: [
                {
                    attachment: data,
                    name: `LOLRank.png`,
                },
            ],
        })
    }
}
