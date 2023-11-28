import { DiscordEvent } from '$/hooks'
import { Profile } from '$/lib/Profile'
import { region } from '$/lib/RiotAPI'

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

        if (mention !== null) {
            //handle mention
        } else if (riotId !== null) {
            //handle riotId
        } else if (summonerName !== null && region !== null) {
            //handle summonerName and region
        } else {
            //Handle myself
            Profile.getUserProfile(interaction)
        }
    }),
)
