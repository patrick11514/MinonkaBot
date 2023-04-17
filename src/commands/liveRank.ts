import { ButtonInteraction, ChatInputCommandInteraction, Client, User } from 'discord.js'
import Logger from '$lib/logger'
import handleInteraction from '$components/core'
import { SummonerBy } from '$types/riotApi'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('LiveRank', 'blue')

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'liverank') {
            //let queue = interaction.options.getString('queue', true)
            let username = interaction.options.getString('username', false)
            let region = interaction.options.getString('region', false)
            let mention = interaction.options.getUser('mention', false)

            liveRank(username, region, mention, interaction /*queue*/)
        }
    })
}

export async function liveRank(
    username: string | null,
    region: string | null,
    mention: User | null,
    interaction: ChatInputCommandInteraction | ButtonInteraction
    //queue: string
) {
    handleInteraction(
        interaction,
        username,
        region,
        mention,
        'liveRank',
        async function (
            username: string,
            region: string,
            data: SummonerBy,
            interaction: ChatInputCommandInteraction | ButtonInteraction
            //queue: string
        ) {
            const prettyRegion = process.client.config.regionTranslates[region]
            interaction.editReply(
                `Tvůj aktuální rank nalezneš na\n${process.env.WEB_PATH}/profile/${prettyRegion}/${username}`
            )
        },
        liveRank,
        [
            /*queue*/
        ],
        [
            /*queue*/
        ]
    )
}
