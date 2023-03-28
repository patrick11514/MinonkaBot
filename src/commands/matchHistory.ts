import { ButtonInteraction, Client, CommandInteraction, User } from 'discord.js'
import handleInteraction from '../components/core'
import Logger from '../lib/logger'
import Riot from '../lib/riot/core'
import utilities from '../lib/riot/utilities'
import { SummonerBy, teamMember } from '../types/riotApi'
import fs from 'fs'
import Images from '../lib/images/core'
import { checkUser, getLP } from '../lib/riot/workers/lpChecker'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('command', 'color')

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'matchhistory') {
            let queue = interaction.options.get('queue', false)
            let limit = interaction.options.get('limit', false)
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)
            let mention = interaction.options.getUser('mention', false)

            matchHistory(
                username?.value as string,
                region?.value as string,
                mention,
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
    mention: User | null,
    interaction: CommandInteraction | ButtonInteraction,
    queue: string | null,
    limit: string | null
) {
    handleInteraction(
        interaction,
        username,
        region,
        mention,
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

            let matchIds = await riot.getMatches(data.puuid, route, limit, queue)

            if (matchIds.length == 0) {
                return interaction.editReply({
                    content: `Nepovedlo se načíst match history pro ${data.name}!`,
                })
            }

            //get match info
            let matchesInfo = []

            //check user
            await checkUser(data.id, data.puuid, region, interaction.client.LPDB)

            for (let match of matchIds) {
                let matchData = await riot.getMatch(match, route)
                if (!matchData) continue

                let userTeam = matchData.info.participants.find((p) => p.puuid == data.puuid)?.teamId

                let ff15 = matchData.info.participants.find((p) => p.puuid == data.puuid)?.gameEndedInEarlySurrender

                let teams: Array<Array<teamMember>> = []

                matchData.info.participants.forEach((participant) => {
                    let teamId = participant.teamId / 100
                    if (!teams[teamId]) {
                        teams[teamId] = []
                    }

                    teams[teamId].push({
                        id: participant.teamId,
                        champion: participant.championId,
                        summoner: participant.summonerName,
                        role: participant.teamPosition,
                        summoners: [...Array(2).keys()].map((i) => {
                            let summoner = `summoner${i + 1}Id` as keyof typeof participant
                            return participant[summoner] as number
                        }),
                        items: [...Array(7).keys()].map((i) => {
                            let item = `item${i}` as keyof typeof participant
                            return participant[item] as number
                        }),
                        kills: participant.kills,
                        asists: participant.assists,
                        deaths: participant.deaths,
                        vision: participant.visionScore,
                        level: participant.champLevel,
                        perks: participant.perks,
                    })
                })

                //sort team mebers
                teams = teams.map((team) => {
                    return utilities.sortTeam(team)
                })

                let lp = undefined

                if ([420, 440].includes(matchData.info.queueId)) {
                    lp = await getLP(
                        data.id,
                        matchData.info.queueId,
                        matchData.metadata.matchId,
                        interaction.client.LPDB
                    )
                }

                matchesInfo.push({
                    length: matchData.info.gameDuration,
                    ff15: ff15 as boolean,
                    queue: matchData.info.queueId,
                    userTeam: userTeam as number,
                    lp: lp,
                    createTimestamp: matchData.info.gameStartTimestamp,
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
                    teams: teams,
                })
            }

            let promises = []

            for (let match of matchesInfo) {
                promises.push(new Images().generateMatch(match))
            }

            Promise.all(promises).then(async (images) => {
                await interaction.editReply('Nahrávání...')
                await interaction.editReply({
                    content: '',
                    files: images,
                })
                //clear cache
                images.forEach((image) => {
                    fs.unlinkSync(image)
                })
            }) //zatím nefunguje
        },
        matchHistory,
        [queue, limit],
        [queue, limit]
    )
}
