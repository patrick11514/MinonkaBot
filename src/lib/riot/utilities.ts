import fetch, { Response } from 'node-fetch'
import fs from 'fs'
import dotenv from 'dotenv'
import { Challenge, championsData, itemsData } from '../../types/riotApi'
import Logger from '../logger'
import sharp from 'sharp'
import crypto from 'crypto'
//@ts-ignore
import isXml from 'is-xml'
import { XMLParser } from 'fast-xml-parser'
dotenv.config()

class Utilities {
    l: Logger

    constructor() {
        this.l = new Logger('Utils', 'magenta')
    }

    async downloadImage(url: string, resize: boolean | string = true): Promise<string> {
        //check if file named url without process.env.DDRAGON_URL and removed first / in folder cache exists and replace all other / with _
        //if exists, return its path if not download it and return its path
        let path = url.replace(process.env.DDRAGON_URL, '').substring(1).replace(/\//g, '_')
        if (fs.existsSync(`./cache/${path}`)) {
            //write to console using cached file
            this.l.log('Using cached file.')
            return `./cache/${path}`
        }

        let response: Response
        try {
            response = await fetch(url)

            if (response.headers.get('content-type') == 'application/xml') {
                let copy = response.clone()
                let text = await copy.text()
                if (isXml(text)) {
                    let parser = new XMLParser()
                    let xml: {
                        Error: {
                            Code: string
                            Message: string
                        }
                    } = parser.parse(text)
                    if (xml.Error) {
                        this.l.error(`Error ${xml.Error.Code}: ${xml.Error.Message}`)
                        return this.downloadProfilePicture(29)
                    }
                }
            }

            let data = await response.buffer()

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

            fs.writeFileSync(`./cache/${path}`, data)

            return `./cache/${path}`
        } catch (e) {
            return this.downloadImage(url, resize)
        }
    }

    async resizeImage(imagePath: string, x: number, y: number) {
        let data = await sharp(imagePath).resize(x, y).toBuffer()
        let randomName = crypto.randomBytes(10).toString('hex')
        fs.writeFileSync(`./temp/${randomName}.png`, data)
        return `./temp/${randomName}.png`
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

    firstUpper(s: string) {
        return s.charAt(0).toUpperCase() + s.slice(1)
    }

    async getChampionImage(filename: string) {
        let path = await this.downloadImage(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/img/champion/' + filename,
            false
        )

        return path
    }

    async championtIdToImage(id: number, language: string = 'cs_CZ') {
        let data = await this.getChampions(language)

        let champion = Object.values(data.data).find((el) => el.key == id.toString())

        if (!champion) {
            return null
        }

        return champion.image.full
    }

    async championIdToName(id: number, language: string = 'cs_CZ') {
        let data = await this.getChampions(language)

        let champion = Object.values(data.data).find((el) => el.key == id.toString())

        if (!champion) {
            return null
        }

        return champion.name
    }

    async getChampions(language: string = 'cs_CZ'): Promise<championsData> {
        //check if file is in chace name: champions_{language}.json if yes, return its content
        //if not, download it and return its content
        let path = `./cache/champions_${language}.json`
        if (fs.existsSync(path)) {
            this.l.log('Using cached file.')
            return JSON.parse(fs.readFileSync(path).toString())
        }

        let response = await fetch(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/data/' + language + '/champion.json'
        )

        let data = await response.json()

        fs.writeFileSync(path, JSON.stringify(data))

        return data
    }

    async getItemImage(filename: string) {
        let path = await this.downloadImage(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/img/item/' + filename,
            false
        )

        return path
    }

    async getItems(language: string = 'cs_CZ'): Promise<itemsData> {
        let path = `./cache/items_${language}.json`
        if (fs.existsSync(path)) {
            this.l.log('Using cached file.')
            return JSON.parse(fs.readFileSync(path).toString())
        }

        let response = await fetch(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/data/' + language + '/item.json'
        )

        let data = await response.json()

        fs.writeFileSync(path, JSON.stringify(data))

        return data
    }

    fixItemName(name: string) {
        return name.replaceAll(' ', '').replaceAll("'", '').replaceAll('-', '').replaceAll('.', '').replaceAll(',', '')
    }

    getRoutingValue(region: string) {
        region = region.toUpperCase()
        region = process.client.config.regionTranslates[region]

        let routes = Object.keys(process.client.config.routes)
        let route = routes.find((route: string) => process.client.config.routes[route].includes(region))
        if (!route) return null
        return route
    }
}

export default new Utilities()
