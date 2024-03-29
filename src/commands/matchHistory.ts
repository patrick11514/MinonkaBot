import handleInteraction from '$components/core'
import Images from '$lib/images/core'
import Logger from '$lib/logger'
import Riot from '$lib/riot/core'
import utilities from '$lib/riot/utilities'
import { checkUser, getLP } from '$lib/riot/workers/lpChecker'
import { cherryMatchData, matchData } from '$types/imageInputs'
import { SummonerBy, cherryTeamMember, queues, teamMember } from '$types/riotApi'
import { FakeInteraction } from '$types/types'
import { ButtonInteraction, ChatInputCommandInteraction, Client, User } from 'discord.js'
import fs from 'node:fs'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('command', 'color')

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'matchhistory') {
            let queue = interaction.options.getString('queue', false)
            let limit = interaction.options.getString('limit', false)
            let username = interaction.options.getString('username', false)
            let region = interaction.options.getString('region', false)
            let mention = interaction.options.getUser('mention', false)
            let offset = interaction.options.getInteger('offset', false)

            matchHistory(username, region, mention, interaction, queue, limit, offset)
        }
    })
}

export async function matchHistory(
    username: string | null,
    region: string | null,
    mention: User | null,
    interaction: ChatInputCommandInteraction | ButtonInteraction | FakeInteraction,
    queue: string | null,
    limit: string | null,
    offset: number | null,
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
            interaction: ChatInputCommandInteraction | ButtonInteraction | FakeInteraction,
            queue: string | null,
            limit: string | null,
            offset: number | null,
        ) {
            //Get route
            let route = utilities.getRoutingValue(region)

            if (!route) {
                return interaction.editReply({
                    content: `Nepovedlo se najít route pro region ${region}!`,
                })
            }

            let matchIds = await Riot.getMatches(data.puuid, route, limit, queue, offset)

            if (matchIds.length == 0) {
                return interaction.editReply({
                    content: `Nepovedlo se načíst match history pro ${data.name}!`,
                })
            }

            //get match info
            let matchesInfo: (matchData | cherryMatchData)[] = []

            //check user
            await checkUser(data.id, data.puuid, region, interaction.client.LPDB)

            const cherryTeams: ('Poro' | 'Minion' | 'Scuttle' | 'Krug')[] = ['Poro', 'Minion', 'Scuttle', 'Krug']

            for (let match of matchIds) {
                const matchData = await Riot.getMatch(match, route)
                if (!matchData) continue

                const userTeam = matchData.info.participants.find((p) => p.puuid == data.puuid)?.teamId

                const ff15 = matchData.info.participants.find((p) => p.puuid == data.puuid)?.gameEndedInEarlySurrender

                let teams: (teamMember | cherryTeamMember)[][] = []

                if (matchData.info.gameMode === 'CHERRY') {
                    matchData.info.participants.forEach((participant) => {
                        if (!teams[participant.playerSubteamId]) {
                            teams[participant.playerSubteamId] = []
                        }

                        teams[participant.playerSubteamId].push({
                            id: participant.teamId,
                            champion: participant.championId,
                            summoner: participant.summonerName,
                            summonerId: participant.summonerId,
                            kills: participant.kills,
                            asists: participant.assists,
                            deaths: participant.deaths,
                            level: participant.champLevel,
                            totalDamage: participant.totalDamageDealtToChampions,
                            golds: participant.goldEarned,
                            team: cherryTeams[participant.playerSubteamId - 1],
                            position: participant.playerSubteamId,
                            summoners: [...Array(2).keys()].map((i) => {
                                let summoner = `summoner${i + 1}Id` as keyof typeof participant
                                return participant[summoner] as number
                            }),
                            items: [...Array(7).keys()].map((i) => {
                                let item = `item${i}` as keyof typeof participant
                                return participant[item] as number
                            }),
                            subteamPlacement: participant.subteamPlacement,
                        })
                    })
                } else {
                    matchData.info.participants.forEach((participant) => {
                        let teamId = participant.teamId / 100
                        if (!teams[teamId]) {
                            teams[teamId] = []
                        }

                        teams[teamId].push({
                            id: participant.teamId,
                            champion: participant.championId,
                            summoner: participant.summonerName,
                            summonerId: participant.summonerId,
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
                            minions: participant.totalMinionsKilled,
                            neutralMinions: participant.neutralMinionsKilled,
                            totalDamage: participant.totalDamageDealtToChampions,
                            golds: participant.goldEarned,
                        })
                    })
                }

                //sort team mebers
                if (matchData.info.gameMode === 'CHERRY') {
                    teams = utilities.sortCherryTeam(teams as cherryTeamMember[][])
                } else {
                    teams = teams.map((team) => {
                        return utilities.sortTeam(team as teamMember[])
                    })
                }

                let lp = undefined

                if ([420, 440].includes(matchData.info.queueId)) {
                    lp = await getLP(
                        data.id,
                        matchData.info.queueId,
                        matchData.metadata.matchId,
                        interaction.client.LPDB,
                    )
                }

                matchesInfo.push({
                    userId: data.id,
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
                    teams: teams as Array<Array<teamMember>>,
                })
            }

            let promises: Promise<string>[] = []

            for (let match of matchesInfo) {
                if (match.queue === queues.Cherry) {
                    promises.push(new Images().generateMatchCherry(match as cherryMatchData))
                } else {
                    promises.push(new Images().generateMatch(match as matchData))
                }
            }

            if (promises.length === 0) {
                return interaction.editReply({
                    content: `Nepovedlo se načíst žádnou hru`,
                })
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
            })
        },
        matchHistory,
        [queue, limit, offset],
        [queue, limit, offset],
    )
}
