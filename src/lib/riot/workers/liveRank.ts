import JSONdb from 'simple-json-db'
import Logger from '$lib/logger'
import user from '$types/LRDB'
import utilities from '../utilities'
import { EncryptedSummonerId } from '$types/riotApi'
import Riot from '../core'

class liveRankUser {
    private id: string
    private puuid: string
    private region: string
    private db: JSONdb
    private l: Logger
    private timeout: NodeJS.Timeout | null

    constructor(id: string, puuid: string, region: string, db: JSONdb, l: Logger) {
        this.id = id
        this.puuid = puuid
        this.region = region
        this.db = db
        this.l = l
        this.timeout = null
    }

    async check() {
        this.l.start(`Checking ${this.id}`)
        await checkUser(this.id, this.puuid, this.region, this.db)
        //check every 5 minutes
        this.timeout = setTimeout(() => {
            this.check()
        }, 1000 * 60 * 5)

        this.l.stop(`Done checking ${this.id}`)
    }

    cancel() {
        this.timeout ? clearTimeout(this.timeout) : ''
    }
}

export class LiveRank {
    private instances: Array<liveRankUser> = []
    public files: {
        [key: EncryptedSummonerId]: string | null
    } = {}
    private db: JSONdb<user>

    constructor(db: JSONdb) {
        this.db = db
    }

    async startLiveRank() {
        let json = this.db.JSON() as {
            [key: EncryptedSummonerId]: user
        }

        let log = new Logger('Start Live Rank', 'blackBright')
        log.start('Starting LPChecker with intervals of 0.5 seconds')

        for (let key in json) {
            let user = json[key]
            let checker = new liveRankUser(
                key,
                user.puuid,
                user.region,
                this.db,
                new Logger('LiveProfile', 'cyanBright')
            )
            checker.check()
            this.instances.push(checker)
            await utilities.sleep(500)
        }
        log.stop('Done starting ' + Object.keys(json).length + ' LPCheckers')
    }

    async reset() {
        for (let c of this.instances) c.cancel()
        this.startLiveRank()
    }

    has(id: EncryptedSummonerId) {
        return this.db.has(id)
    }

    async add(id: EncryptedSummonerId, puuid: string, region: string) {
        this.db.set(id, { puuid, region, data: [] })
        let checker = new liveRankUser(id, puuid, region, this.db, new Logger('LiveProfile', 'green'))
        await checker.check()
        this.instances.push(checker)
    }

    get(id: EncryptedSummonerId) {
        return this.db.get(id)
    }
}

async function checkUser(id: string, puuid: string, region: string, db: JSONdb<user>) {
    let data = await Riot.getRankedData(id, region)
    if (!data) return

    let currentData = db.get(id)?.data

    if (currentData) {
        if (currentData.length > 0) {
            let changed = false
            for (let i in currentData) {
                let d = currentData[i]
                if (d.rank != data[i].rank) {
                    changed = true
                    break
                }
                if (d.leaguePoints != data[i].leaguePoints) {
                    changed = true
                    break
                }
            }

            if (changed) {
                const liveRank = process.client.liveRank
                if (liveRank.files.hasOwnProperty(id)) {
                    liveRank.files[id] = null
                }
            }
        }
    }

    db.set(id, {
        puuid,
        region,
        data,
    })
}
