import { DiscordEvent } from '$/hooks'
import { Profile } from '$/lib/Profile'
import { region } from '$/lib/RiotAPI'
import { getLanguageData } from '$/lib/utils'

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
        } else if (summonerName !== null && region !== null) {
            //handle summonerName and region
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
