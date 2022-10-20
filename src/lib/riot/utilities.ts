import fetch from 'node-fetch'
import crypto from 'crypto'
import fs from 'fs'
import dotenv from 'dotenv'
import { Challenge } from '../../types/riotApi'
import Logger from '../logger'
import sharp from 'sharp'
dotenv.config()

class Utilities {
    l: Logger

    constructor() {
        this.l = new Logger('Utils', 'magenta')
    }

    async downloadImage(url: string, resize: boolean | string = true) {
        let response = await fetch(url)
        let data = await response.buffer()
        let name = crypto.randomBytes(10).toString('hex')
        try {
            if (resize) {
                if (typeof resize == 'string') {
                    let [x, y] = resize.split('x')
                    if (!y) {
                        this.l.log(`Resizing to ${x}x?...`)
                        data = await sharp(data).resize(parseInt(x)).toBuffer()
                    } else {
                        this.l.log(`Resizing to ${x}x${y}...`)
                        data = await sharp(data).resize(parseInt(x), parseInt(y)).toBuffer()
                    }
                } else {
                    this.l.log('Resizing to 450x450...')
                    data = await sharp(data).resize(450, 450).toBuffer()
                }
            }
        } catch (e) {
            this.l.error("Can't resize image: " + data.toString('base64'))
        }
        await fs.writeFileSync(`./temp/${name}.${url.split('.').pop()}`, data)

        return `./temp/${name}.${url.split('.').pop()}`
    }

    async downloadProfilePicture(id: number) {
        let url = process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/img/profileicon/' + id + '.png'
        this.l.start('Downloading profile picture...')
        let file = await this.downloadImage(url)
        this.l.stop('Done.')
        return file
    }

    async downloadChallengePicture(id: number, tier: string) {
        let url = process.env.DDRAGON_URL + '/cdn/img/challenges-images/' + id + '-' + tier + '.png'

        this.l.start('Downloading challenge picture...')
        let file = await this.downloadImage(url, '176')
        this.l.stop('Done.')
        return file
    }

    async getTitleById(id: string, language: string = 'cs_CZ') {
        if (id == '') {
            return null
        }

        let newId = parseInt(id)

        let response = await fetch(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/data/' + language + '/challenges.json'
        )

        let data: Array<Challenge> = await response.json()

        //id is number of length 8
        //first 6 digits are challenge id
        //last 2 digits are tier id
        let challengeId: number, tierId: number
        if (newId == 1) {
            challengeId = 0
            tierId = 0
        } else {
            challengeId = Math.floor(newId / 100)
            tierId = newId - challengeId * 100
        }

        let challenge = data.find((el) => el.id == challengeId)

        if (!challenge) {
            return null
        }

        let tier = this.tierIdToString(tierId)
        let title = challenge.thresholds[tier].rewards?.find((el) => el.category == 'TITLE')?.title

        if (!title) {
            return null
        }

        return title
    }
    tierIdToString(
        tierId: number
    ): 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER' {
        let tiers: Array<string> = [
            'IRON',
            'BRONZE',
            'SILVER',
            'GOLD',
            'PLATINUM',
            'DIAMOND',
            'MASTER',
            'GRANDMASTER',
            'CHALLENGER',
        ]

        return tiers[tierId] as
            | 'IRON'
            | 'BRONZE'
            | 'SILVER'
            | 'GOLD'
            | 'PLATINUM'
            | 'DIAMOND'
            | 'MASTER'
            | 'GRANDMASTER'
            | 'CHALLENGER'
    }
}

export default new Utilities()
