import sharp from 'sharp'
import fs from 'fs'
import utils from '../riot/utilities'
import Logger from '../logger'
import crypto from 'crypto'
import { profilePicture, rankedProfile } from '../../types/imageInputs'
import { lowerTier, QueueTypes, RankColors, Tiers } from '../../types/riotApi'
import Path from 'path'

class Images {
    l: Logger
    compositeList: Array<{
        input: Buffer | string
        top: number
        left: number
    }> = []

    constructor() {
        this.l = new Logger('Images', 'yellow')
    }

    async generateProfilePicture(userData: profilePicture, language = 'cs_CZ'): Promise<string> {
        let background = fs.readFileSync('./images/profileBackground.png')

        let levelBackground = fs.readFileSync('./images/levelBackground.png')

        let profileImage = await utils.downloadProfilePicture(userData.iconId)

        let title = await utils.getTitleById(userData.title, language)

        //background
        this.l.start('Creating background...')
        let image = sharp(background)

        //add profileicon
        this.l.log('Adding profileicon...')
        this.composite(profileImage, 125, 400)

        //add username
        this.l.log('Adding username...')
        let nameText = await this.createText({
            text: userData.username,
            textSize: 80,
            width: 700,
            height: 120,
            bold: true,
            color: '#eae1cf',
            font: 'Beaufort for LOL Ja',
        })
        this.composite(nameText, 0, 400 + 480)

        //add level
        this.l.log('Adding level...')
        //add background
        this.composite(levelBackground, 239, 220)
        //add number
        let levelText = await this.createText({
            text: userData.level.toString(),
            textSize: 60,
            width: 222,
            height: 88 + 40,
            bold: true,
        })
        this.composite(levelText, 239, 220)

        if (title) {
            //add title
            this.l.log('Adding title...')
            let titleText = await this.createText({
                text: title,
                textSize: 50,
                width: 700,
                height: 80,
                bold: false,
                color: '#9c9688',
                font: 'Beaufort for LOL Ja',
            })
            this.composite(titleText, 0, 400 + 480 + 80)
        }

        //add challenges
        if (userData.challenges?.length > 0) {
            //get challenge images
            let images: Array<string> = []

            let foundChallenges = userData.challenges.filter((challenge) => challenge.id != 0)

            for (let challenge of foundChallenges) {
                let image = await utils.downloadChallengePicture(challenge.id, challenge.tier)
                images.push(image)
            }

            this.l.log('Adding challenges...')
            if (images.length == 1 || images.length == 3) {
                let first, second, third

                if (images.length == 1) {
                    //one challenge
                    first = null
                    second = images[0]
                    third = null
                } else {
                    //three challenges
                    first = images[0]
                    second = images[1]
                    third = images[2]
                }

                if (first) {
                    this.composite(first, 262 - 176 - 16, 1100)
                }
                if (second) {
                    this.composite(second, 262, 1100)
                }
                if (third) {
                    this.composite(third, 262 + 176 + 16, 1100)
                }
            } else {
                this.composite(images[0], 166, 1100)
                this.composite(images[1], 166 + 176 + 16, 1100)
            }
        }

        //finalize image
        this.l.log('Finalizing image...')
        let buffer = await this.compositeDone(image).toBuffer()

        let name = crypto.randomBytes(10).toString('hex')
        fs.writeFileSync(`./temp/${name}.png`, buffer)

        this.l.stop('Finished!')
        return `./temp/${name}.png`
    }

    async generateRankedProfile(userData: rankedProfile): Promise<string> {
        let background = fs.readFileSync('./images/rankBackground.png')

        let levelBackground = fs.readFileSync('./images/levelBackground.png')

        let profileImage = await utils.downloadProfilePicture(userData.profileIconId)

        //background
        this.l.start('Creating background...')
        let image = sharp(background)

        //add profileicon
        this.l.log('Adding profileicon...')
        this.composite(profileImage, 125, 185)

        //add username
        this.l.log('Adding username...')
        let nameText = await this.createText({
            text: userData.summonerName,
            textSize: 80,
            width: 700,
            height: 120,
            bold: true,
            color: '#eae1cf',
            font: 'Beaufort for LOL Ja',
        })
        this.composite(nameText, 0, 185 + 480)

        //Add level
        this.l.log('Adding level...')
        //add background
        this.composite(levelBackground, 239, 49)
        //add number
        let levelText = await this.createText({
            text: userData.level.toString(),
            textSize: 60,
            width: 222,
            height: 88 + 40,
            bold: true,
        })
        this.composite(levelText, 239, 49)

        //add ranks
        this.l.log('Adding ranks...')
        //set default coords
        let x = 650
        let y = 80

        if (
            userData.rankeds
                .map((queue) => {
                    if (queue.miniSeries) {
                        return true
                    } else {
                        return false
                    }
                })
                .includes(true)
        ) {
            x = 450

            //add text Promos
            let promosText = await this.createText({
                text: 'Promos',
                textSize: 65,
                width: 432,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
            })
            this.composite(promosText, x + 1000 + 350, y)
        }
        for (let queue of userData.rankeds) {
            //add name of queue
            this.l.log(`Adding ${queue.queueType}...`)
            let queueText = await this.createText({
                text: queue.queueType == QueueTypes.RANKED_SOLO ? 'Solo/Duo' : 'Flex',
                textSize: 65,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
            })

            this.composite(queueText, x + 500, y)

            //add rank icon
            this.l.log('Adding rank icon...')
            let rankIcon = fs.readFileSync(Path.join('./images/ranks', queue.tier.toLowerCase() + '_resized_rank.png'))
            this.composite(rankIcon, x + 225, y + 40)

            //add rank
            this.l.log('Adding tier and rank...')
            let rankText = await this.createText({
                text:
                    utils.firstUpper(queue.tier.toLowerCase()) +
                    ' ' +
                    (queue.tier != Tiers.Master && queue.tier != Tiers.Grandmaster && queue.tier != Tiers.Challenger
                        ? queue.rank
                        : ''),
                textSize: 65,
                width: 700,
                height: 90,
                bold: true,
                color: RankColors[utils.firstUpper(queue.tier.toLowerCase()) as lowerTier],
                font: 'Beaufort for LOL Ja',
                center: false,
            })

            this.composite(rankText, x + 225 + 250 + 10, y + 100)

            //add lp
            this.l.log('Adding lp...')
            let lpText = await this.createText({
                text: queue.leaguePoints.toString() + ' LP',
                textSize: 65,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: false,
            })

            this.composite(lpText, x + 225 + 250 + 10, y + 100 + 90)

            //add winrate
            //winrate with 2 numbers on the right
            let winrate = Math.round((queue.wins / (queue.wins + queue.losses)) * 10000) / 100

            this.l.log('Adding winrate...')
            let winrateText = await this.createText({
                text: winrate + '%',
                textSize: 65,
                width: 700,
                height: 90,
                bold: true,
                color: winrate >= 50 ? '#1fed18' : '#ff0000',
                font: 'Beaufort for LOL Ja',
                center: 2,
            })

            this.composite(winrateText, x + 225 + 250 + 10 + 200, y + 100)

            //add wins and loses
            this.l.log('Adding wins...')
            let winsText = await this.createText({
                text: queue.wins.toString() + ' Wins',
                textSize: 65,
                width: 700,
                height: 90,
                bold: true,
                color: '#1fed18',
                font: 'Beaufort for LOL Ja',
                center: true,
            })

            this.composite(winsText, x + 225 + 250 + 10, y + 100 + 90)

            this.l.log('Adding loses...')
            let losesText = await this.createText({
                text: queue.losses.toString() + ' Loses',
                textSize: 65,
                width: 700,
                height: 90,
                bold: true,
                color: '#ff0000',
                font: 'Beaufort for LOL Ja',
                center: 2,
            })

            this.composite(losesText, x + 225 + 250 + 10 + 200, y + 100 + 90)

            //generate series
            if (queue.miniSeries) {
                this.l.log('Adding series...')
                let progress = queue.miniSeries.progress.split('') as Array<'W' | 'L' | 'N'>

                //load images
                let win = fs.readFileSync('./images/seriesWin_resized.png')
                let lose = fs.readFileSync('./images/seriesLose_resized.png')
                let notPlayed = fs.readFileSync('./images/seriesEmpty_resized.png')

                let startX = x + 1000 + 350
                for (let prog of progress) {
                    this.composite(prog == 'W' ? win : prog == 'L' ? lose : notPlayed, startX, y + 100 + 40)
                    startX += 88
                }
            }

            y += 330
        }

        //generate random name using crypto and tostring hex and add .png
        let name = crypto.randomBytes(10).toString('hex') + '.png'

        let buffer = await this.compositeDone(image).toBuffer()
        fs.writeFileSync(`./temp/${name}`, buffer)

        return `./temp/${name}`
    }

    composite(image: Buffer | string, x: number, y: number) {
        this.compositeList.push({
            input: image,
            top: y,
            left: x,
        })
    }

    compositeDone(image: sharp.Sharp) {
        let final = image.composite(this.compositeList)
        this.compositeList = []
        return final
    }

    async createText({
        text,
        textSize,
        width,
        height,
        color = '#fff',
        center = true,
        bold = false,
        font = 'Beaufort for LOL Ja',
    }: {
        text: string
        textSize: number
        width: number
        height: number
        color?: string
        center?: boolean | 2
        bold?: boolean
        font?: string
    }) {
        let centerText = ''
        if (center == true) {
            centerText = `x="50%" text-anchor="middle"`
        }
        if (center == 2) {
            centerText = `x="50%" text-anchor="right"`
        }
        let txt = `<svg width="${width}" height="${height}">
            <style>
                .text {
                    font-family: '${font}';
                    font-size: ${textSize}px;
                    fill: ${color};
                    font-weight: ${bold ? 'bold' : 'normal'};
                }
            </style>
            <text y="50%" ${centerText} class="text">${text}</text>
        </svg>`

        return Buffer.from(txt)
    }
}

export default Images
