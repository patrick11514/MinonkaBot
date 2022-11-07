import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import handleInteraction from '../components/core'
import Logger from '../lib/logger'
import Riot from '../lib/riot/core'
import utilities from '../lib/riot/utilities'
import { SummonerBy } from '../types/riotApi'
import fs from 'fs'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('command', 'color')

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'matchhistory') {
            let queue = interaction.options.get('queue', false)
            let limit = interaction.options.get('limit', false)
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)

            matchHistory(
                username?.value as string,
                region?.value as string,
                interaction,
                queue?.value as string,
                limit?.value as string
            )
        }
    })
}

export async function matchHistory(
    username: string | null,
    region: string | null,
    interaction: CommandInteraction | ButtonInteraction,
    queue: string | null,
    limit: string | null
) {
    handleInteraction(
        interaction,
        username,
        region,
        'handleInteraction',
        async function (
            username: string,
            region: string,
            data: SummonerBy,
            riot: Riot,
            interaction: CommandInteraction | ButtonInteraction,
            queue: string | null,
            limit: string | null
        ) {
            //Get route
            let route = utilities.getRoutingValue(region)

            if (!route) {
                return interaction.editReply({
                    content: `Nepovedlo se najít route pro region ${region}!`,
                })
            }

            let matchIds = await riot.getMatches(data.puuid, route, limit)

            console.log(matchIds)

            //get match info
            let matchInfo = []
            for (let match of matchIds) {
                let matchData = await riot.getMatch(match, route)
                matchInfo.push(matchData)
                fs.writeFileSync('match' + match + '.json', JSON.stringify(matchData))
            }
        },
        matchHistory,
        [queue, limit],
        [queue, limit]
    )
}
