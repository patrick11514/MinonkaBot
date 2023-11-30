import { language } from '$/data/translates'
import { RiotAPILanguages } from '$/types/types'
import { ChatInputCommandInteraction, RepliableInteraction } from 'discord.js'
import { Accounts } from './Accounts'
import { RiotAPI, region } from './RiotAPI'
import { getLanguage, getLanguageData, getLanguageDataFromLang, getTitle, makeThread } from './utils'

export type userData = {
    username: string
    region: region
    level: number
    challenges: number[]
    title: string
    pfp: number
}
export class Profile {
    static async getUserProfile(interaction: ChatInputCommandInteraction) {
        const language = await getLanguageData(interaction.user.id)

        const account = new Accounts(interaction.user.id, language)

        const accounts = await account.getAllAccounts()

        if (accounts.length > 1) {
            account.selectAccount(interaction, Profile.getUserProfileByPuuid)
        } else {
            const account = accounts[0]
            Profile.getUserProfileByPuuid(interaction, account.puuid, account.region)
        }
    }

    private static async generateImage(data: userData): Promise<Buffer> {
        return makeThread('profile', data)
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

        const challengeEndpoint = RiotAPI.getAccountChallenges(region, puuid)
        const rawChallengeData = await challengeEndpoint.fetchSafe()

        if (!rawChallengeData.status) {
            const error = account.getError(rawChallengeData)

            interaction.reply({
                ephemeral: true,
                content: error,
            })

            return
        }

        await interaction.deferReply()

        const challengeData = rawChallengeData.data

        const translates: Record<language, RiotAPILanguages> = {
            en: 'en_US',
            cs: 'cs_CZ',
        }

        const title = await getTitle(challengeData.preferences.title, translates[languageId])

        const userData: userData = {
            username: accountData.name,
            region,
            level: accountData.summonerLevel,
            challenges: challengeData.preferences.challengeIds,
            title,
            pfp: accountData.profileIconId,
        }

        const data = await Profile.generateImage(userData)

        console.log('DATA:')
        console.log(data)
        console.log('=============')

        interaction.editReply({
            files: [
                {
                    attachment: data,
                    name: `LOLprofile.png`,
                },
            ],
        })
    }
}
