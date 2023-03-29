import fetch, { Response } from 'node-fetch'
import fs from 'fs'
import dotenv from 'dotenv'
import { Challenge, championsData, itemsData, runeData, summoners, teamMember } from '../../types/riotApi'
import Logger from '../logger'
import sharp from 'sharp'
import crypto from 'crypto'
//@ts-ignore
import isXml from 'is-xml'
import { XMLParser } from 'fast-xml-parser'
import path from 'path'
import { Client } from 'discord.js'
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

    async resizeImage(imagePath: string, x: number, y: number, cache = false) {
        //get filename and extension separately
        let basename = path.basename(imagePath)

        let parts = basename.split('.')
        let extension = parts[parts.length - 1]
        let filename = parts.slice(0, parts.length - 1).join('.')

        //create filename: originalName-XxY.extension
        let newFilename = `${filename}-${x}x${y}.${extension}`

        if (cache) {
            //check if file exists in cache folder
            if (fs.existsSync(`./cache/${newFilename}`)) {
                return `./cache/${newFilename}`
            }
        }

        let data = await sharp(imagePath).resize(x, y).toBuffer()
        let randomName = crypto.randomBytes(10).toString('hex')

        if (!cache) {
            fs.writeFileSync(`./temp/${randomName}.png`, data)
            return `./temp/${randomName}.png`
        } else {
            fs.writeFileSync(`./cache/${newFilename}`, data)
            return `./cache/${newFilename}`
        }
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

    async championIdToImage(id: number, language: string = 'cs_CZ') {
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

    async championIdToObject(id: number, language: string = 'cs_CZ') {
        let data = await this.getChampions(language)

        let champion = Object.values(data.data).find((el) => el.key == id.toString())

        if (!champion) {
            return null
        }

        return champion
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

    async getSummoners(language: string = 'cs_CZ'): Promise<summoners> {
        let path = `./cache/summoners_${language}.json`
        if (fs.existsSync(path)) {
            this.l.log('Using cached file.')
            return JSON.parse(fs.readFileSync(path).toString())
        }

        let response = await fetch(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/data/' + language + '/summoner.json'
        )

        let data = await response.json()

        fs.writeFileSync(path, JSON.stringify(data))

        return data
    }

    async getSummonerImage(id: number) {
        let data = await this.getSummoners()

        let find = Object.values(data.data).find((el) => el.key == id.toString())

        if (!find) {
            return null
        }

        let path = await this.downloadImage(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/img/spell/' + find.image.full,
            false
        )

        return path
    }

    async getRunes(language: string = 'cs_CZ'): Promise<runeData[]> {
        //check if file is in cache name: runesReforged_{language}.json if yes, return its content
        //if not, download it and return its content
        let path = `./cache/runesReforged_${language}.json`
        if (fs.existsSync(path)) {
            this.l.log('Using cached file.')
            return JSON.parse(fs.readFileSync(path).toString())
        }

        let response = await fetch(
            process.env.DDRAGON_URL + '/cdn/' + process.client.LOL_VERSION + '/data/' + language + '/runesReforged.json'
        )

        let data = await response.json()

        fs.writeFileSync(path, JSON.stringify(data))

        return data
    }

    async getRuneById(style: number, id: number, language: string = 'cs_CZ') {
        let data = await this.getRunes(language)

        let runeStyle = Object.values(data).find((el) => el.id == style)

        if (!runeStyle) {
            return null
        }

        let rune:
            | {
                  id: number
                  key: string
                  icon: string
                  name: string
                  shortDesc: string
                  longDesc: string
              }
            | undefined

        runeStyle.slots.forEach((set) => {
            let current = set.runes.find((rune) => rune.id == id)
            if (current) {
                rune = current
            }
        })

        if (!rune) {
            return null
        }

        return rune.icon
    }

    async getRuneCategoryById(id: number, language: string = 'cs_CZ') {
        let data = await this.getRunes(language)

        let runeStyle = Object.values(data).find((el) => el.id == id)

        if (!runeStyle) {
            return null
        }

        return runeStyle.icon
    }

    async getRuneImage(filename: string) {
        let path = await this.downloadImage(process.env.DDRAGON_URL + '/cdn/img/' + filename, false)

        return path
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

    async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    mentionCommand(name: string, client: Client) {
        let db = client.commandsDB
        if (db.has(name)) {
            let id = db.get(name)
            return `</${name}:${id}>`
        } else {
            return `/${name}`
        }
    }

    sortTeam(team: Array<teamMember>): Array<teamMember> {
        let roles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

        let sorted: Array<teamMember> = []

        for (let i = 0; i < roles.length; i++) {
            let role = roles[i]
            let member = team.find((el) => el.role == role)
            if (member) {
                sorted.push(member)
            }
        }

        return sorted
    }
}

export default new Utilities()
