import { DiscordEvent } from '$/hooks'
import { Accounts } from '$/lib/Accounts'
import { Link } from '$/lib/Link'
import { Profile } from '$/lib/Profile'
import { RiotAPI, region } from '$/lib/RiotAPI'
import { getLanguageData, getRoutingValue } from '$/lib/utils'

const events: DiscordEvent<any>[] = []

export default {
    events,
}

events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return
        if (interaction.commandName !== 'profile') return

        const mention = interaction.options.getMentionable('mention')
        const riotId = interaction.options.getString('riot_id')
        const summonerName = interaction.options.getString('summoner_name')
        const region = interaction.options.getString('region') as region | null

        const language = await getLanguageData(interaction.user.id)

        if (mention !== null) {
            const role = interaction.options.getRole('mention')
            const user = interaction.options.getMember('mention')

            if (role || !user) {
                interaction.reply({
                    ephemeral: true,
                    content: language.profile.roleMention,
                })
                return
            }

            if (!('user' in user)) {
                interaction.reply({
                    ephemeral: true,
                    content: language.profile.missing,
                })
                return
            }

            //handle mention
            Profile.getProfileById(interaction, user.id)
        } else if (riotId !== null && region !== null) {
            //handle riotId

            if (!riotId.includes('#')) {
                interaction.reply({
                    ephemeral: true,
                    content: language.profile.invalidRiotId,
                })
                return
            }

            const [gameName, tagLine] = riotId.split('#')

            const endpoint = RiotAPI.getAccountByRiotId(getRoutingValue(region), gameName, tagLine)
            const data = await endpoint.fetchSafe()

            const link = new Link()

            if (!data.status) {
                link.checkError(data, interaction, language)
                return
            }

            const { puuid } = data.data

            Profile.getUserProfileByPuuid(interaction, puuid, region)
        } else if (summonerName !== null && region !== null) {
            //handle summonerName and region

            const endpoint = RiotAPI.getAccountByUsername(region, summonerName)
            const data = await endpoint.fetchSafe()

            const account = new Accounts(interaction.user.id, language)

            if (!data.status) {
                const error = account.getError(data)

                interaction.reply({
                    ephemeral: true,
                    content: error,
                })
                return
            }

            const { puuid } = data.data

            Profile.getUserProfileByPuuid(interaction, puuid, region)
        } else if (mention === null && riotId === null && summonerName === null && region === null) {
            //Handle myself
            Profile.getUserProfile(interaction)
        } else {
            await interaction.reply({
                ephemeral: true,
                content: language.profile.badArguments,
            })
        }
    }),
)
