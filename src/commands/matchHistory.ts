import {
    ButtonInteraction,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Team,
    TeamMemberMembershipState,
} from 'discord.js'
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

            if (matchIds.length == 0) {
                return interaction.editReply({
                    content: `Nepovedlo se načíst match history pro ${data.name}!`,
                })
            }

            //get match info
            let matchInfo = []
            interaction.editReply(matchIds.length.toString())
            for (let match of matchIds) {
                let matchData = await riot.getMatch(match, route)
                if (!matchData) continue

                let userTeam = matchData.info.participants.find((p) => p.puuid == data.puuid)?.teamId

                matchInfo.push({
                    queue: matchData.info.queueId,
                    userTeam: userTeam,
                    bans: matchData.info.teams.map((team) => {
                        return {
                            id: team.teamId,
                            bans: team.bans.map((ban) => {
                                return {
                                    champion: ban.championId,
                                    pickTurn: ban.pickTurn,
                                }
                            }),
                        }
                    }),
                    wins: matchData.info.teams.map((team) => {
                        return {
                            id: team.teamId,
                            win: team.win,
                        }
                    }),
                    teams: matchData.info.participants.map((participant) => {
                        return {
                            id: participant.teamId,
                            champion: participant.championId,
                            summoner: participant.summonerName,
                            role: participant.teamPosition,
                            items: [...Array(6).keys()].map((i) => {
                                let item = `item${i}` as keyof typeof participant
                                return participant[item]
                            }),
                            kills: participant.kills,
                            asists: participant.assists,
                            deaths: participant.deaths,
                        }
                    }),
                })
            }
        },
        matchHistory,
        [queue, limit],
        [queue, limit]
    )
}
