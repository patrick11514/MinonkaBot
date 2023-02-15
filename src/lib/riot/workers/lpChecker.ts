import JSONdb from 'simple-json-db'
import user from '../../../types/LPDB'
import Logger from '../../logger'
import Riot from '../core'
import utilities from '../utilities'

class LPChecker {
    private id: string
    private puuid: string
    private region: string
    private db: JSONdb
    private l: Logger

    constructor(id: string, puuid: string, region: string, db: JSONdb, l: Logger) {
        this.id = id
        this.puuid = puuid
        this.region = region
        this.db = db
        this.l = l
    }

    async check() {
        this.l.start(`Checking ${this.id}`)
        await checkUser(this.id, this.puuid, this.region, this.db)
        //check every 5 minutes
        setTimeout(() => {
            this.check()
        }, 1000 * 60 * 5)

        this.l.stop(`Done checking ${this.id}`)
    }
}

async function startLPChecker(db: JSONdb) {
    let json = db.JSON() as {
        [key: string]: user
    }

    let log = new Logger('Start LPChecker', 'yellow')
    let l = new Logger('LPChecker', 'green')
    log.start('Starting LPChecker with intervals of 0.5 seconds')

    for (let key in json) {
        let user = json[key]
        let checker = new LPChecker(key, user.puuid, user.region, db, l)
        checker.check()
        await utilities.sleep(500)
    }
    log.stop('Done starting ' + Object.keys(json).length + ' LPCheckers')
}

async function checkUser(id: string, puuid: string, region: string, db: JSONdb) {
    let riot = new Riot()
    let data = await riot.getRankedData(id, region)
    if (!data) return

    if (!db.has(id)) {
        db.set(id, {
            puuid: puuid,
            region: region,
            lp: data.map((d) => {
                return {
                    queue: d.queueType,
                    rank: d.rank,
                    tier: d.tier,
                    lp: d.leaguePoints,
                }
            }),
            lastUpdate: Date.now(),
            matches: [{}, {}],
        })

        //stack checker
        let checker = new LPChecker(id, puuid, region, db, new Logger('LPChecker', 'green'))
        checker.check()
        return
    }

    let route = utilities.getRoutingValue(region)

    for (let d of data) {
        let queueId = d.queueType == 'RANKED_SOLO_5x5' ? '420' : '440'
        let queueArrId = d.queueType == 'RANKED_SOLO_5x5' ? 0 : 1

        let matches = await riot.getMatches(puuid, route as string, '2', queueId)

        if (matches.length > 0) {
            let data = db.get(id) as user
            let currentMatches = data.matches[queueArrId]

            let foundMatch = matches[0]
            let prevMatch = matches[1]

            let match = currentMatches[foundMatch]

            if (!match && match != 0) {
                //check if prev match is checked
                let pMatch = currentMatches[prevMatch]
                if (pMatch || pMatch == 'NULL') {
                    let prevLp = data.lp.find((l) => l.queue == d.queueType)?.lp as number
                    let currentLp = d.leaguePoints

                    data.lp[queueArrId].lp = currentLp
                    data.lp[queueArrId].rank = d.rank
                    data.lp[queueArrId].tier = d.tier

                    if (prevLp == currentLp) {
                        currentMatches[foundMatch] = 0
                    } else if (prevLp == 100) {
                        currentMatches[foundMatch] = currentLp
                    } else {
                        currentMatches[foundMatch] = currentLp - prevLp
                    }
                } else {
                    currentMatches[foundMatch] = 'NULL'
                }
            }

            data.lastUpdate = Date.now()
            db.set(id, data)
        }
    }
}

async function getLP(id: string, queue: number, matchId: string, db: JSONdb): Promise<number | null> {
    let data = db.get(id) as user
    let queueArrId = queue == 420 ? 0 : 1

    let match = data.matches[queueArrId][matchId]

    if (match == 'NULL') {
        return null
    } else {
        return match as number
    }
}

export { startLPChecker, LPChecker, checkUser, getLP }
