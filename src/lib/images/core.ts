import sharp from 'sharp'
import fs from 'fs'
import utils from '../riot/utilities'
import Logger from '../logger'
import crypto from 'crypto'
import { matchData, profilePicture, rankedProfile } from '../../types/imageInputs'
import { lowerTier, QueueTypes, RankColors, Tiers } from '../../types/riotApi'
import Path from 'path'
import { queues, coopTitles } from '../../components/queues'

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
            this.composite(promosText, x + 1000 + 450, y)
        }

        if (userData.rankeds.length > 1) {
            //if first ranked is not solo/duo move second ranked to first
            if (userData.rankeds[0].queueType != QueueTypes.RANKED_SOLO) {
                let temp = userData.rankeds[0]
                userData.rankeds[0] = userData.rankeds[1]
                userData.rankeds[1] = temp
            }
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

                let center = x + 1000 + 450 + 220

                let startX = center - (progress.length / 2) * 88
                for (let prog of progress) {
                    this.composite(prog == 'W' ? win : prog == 'L' ? lose : notPlayed, startX, y + 100 + 40)
                    startX += 88
                }
            }

            y += 330
        }

        //generate random name using crypto and tostring hex and add .png
        let name = crypto.randomBytes(10).toString('hex') + '.png'

        this.l.log('Saving image...')
        let buffer = await this.compositeDone(image).toBuffer()
        fs.writeFileSync(`./temp/${name}`, buffer)
        this.l.stop('Done')

        return `./temp/${name}`
    }

    async generateMatch(matchData: matchData): Promise<string> {
        let background = fs.readFileSync('./images/matchBackground.png')

        this.l.start('Creating background...')
        let image = sharp(background)
        let win = matchData.wins.find((w) => w.id == matchData.userTeam)?.win

        this.l.log('Adding win or lose text...')
        let winOrLoseText = await this.createText({
            text: win ? (matchData.ff15 && matchData.length <= 195 ? 'Remake' : 'Victory') : 'Defeat',
            textSize: 100,
            width: 700,
            height: 135,
            bold: true,
            color: win ? (matchData.ff15 && matchData.length <= 195 ? '#7e857f' : '#1fed18') : '#ff0000',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(winOrLoseText, 858, 45)

        //add queue type under win or lose text
        this.l.log('Adding queue type...')
        let queue = matchData.queue

        let queueTypeText = await this.createText({
            text: queues[queue],
            textSize: 60,
            width: 700,
            height: 135,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(queueTypeText, 858, 45 + 80)

        if (queue >= 830 && queue <= 850) {
            let coopText = await this.createText({
                text: coopTitles[queue - 830],
                textSize: 60,
                width: 700,
                height: 135,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: true,
            })
            this.composite(coopText, 858, 45 + 80 + 60)
        }

        //add length
        this.l.log('Adding length...')
        let lengthText = await this.createText({
            //text 00:00 format (minutes:seconds)
            text: `${Math.floor(matchData.length / 60)}:${matchData.length % 60 < 10 ? '0' : ''}${
                matchData.length % 60
            }`,
            textSize: 60,
            width: 700,
            height: 135,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(lengthText, 858, 45 + 80 + 60 + (queue >= 830 && queue <= 850 ? 60 : 0))

        //add lp if ranked
        if ([420, 440].includes(queue)) {
            let yPos = 45 + 80 + 60 + (queue >= 830 && queue <= 850 ? 60 : 0) + 60

            this.l.log('Adding lp...')
            let lpText = await this.createText({
                text: matchData.lp ? matchData.lp + ' LP' : '? LP',
                textSize: 60,
                width: 700,
                height: 135,
                bold: true,
                color: matchData.lp ? (matchData.lp >= 0 ? '#1fed18' : '#ff0000') : '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: true,
            })
            this.composite(lpText, 858, yPos)
        }

        //add game creation time
        let startTimestamp = new Date(matchData.createTimestamp)
        //create string of HH:MM:ss DD.MM.YYYY with 0 if number is one digit
        let startString = `${startTimestamp.getHours() < 10 ? '0' : ''}${startTimestamp.getHours()}:${
            startTimestamp.getMinutes() < 10 ? '0' : ''
        }${startTimestamp.getMinutes()}:${startTimestamp.getSeconds() < 10 ? '0' : ''}${startTimestamp.getSeconds()} ${
            startTimestamp.getDate() < 10 ? '0' : ''
        }${startTimestamp.getDate()}.${startTimestamp.getMonth() < 9 ? '0' : ''}${
            startTimestamp.getMonth() + 1
        }.${startTimestamp.getFullYear()}`

        this.l.log('Adding game creation time...')
        let startText = await this.createText({
            text: startString,
            textSize: 45,
            width: 700,
            height: 135,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(startText, 858, 820 - 90)

        //add kills
        this.l.log('Adding kills...')
        let killTextTeam1 = await this.createText({
            text: matchData.teams[1].reduce((prev, curr) => prev + curr.kills, 0).toString(),
            textSize: 100,
            width: 700,
            height: 135,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(killTextTeam1, 858 - 300, 45)

        let killTextTeam2 = await this.createText({
            text: matchData.teams[2].reduce((prev, curr) => prev + curr.kills, 0).toString(),
            textSize: 100,
            width: 700,
            height: 135,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(killTextTeam2, 858 + 300, 45)

        let startY = 145
        this.l.log('Adding champions...')
        let imageWidth = 75
        //left team
        for (let champ of matchData.teams[1]) {
            let imageName = await utils.championtIdToImage(champ.champion)
            let champImage: string
            if (!imageName) {
                champImage = await utils.downloadProfilePicture(29)
            } else {
                champImage = await utils.getChampionImage(imageName)
            }
            champImage = await utils.resizeImage(champImage, imageWidth, imageWidth, true)

            this.composite(champImage, 50, startY)

            //add level image
            let levelText = await this.createText({
                text: champ.level.toString(),
                textSize: 32,
                width: imageWidth,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: true,
                outline: true,
            })

            this.composite(levelText, 50, startY + imageWidth - 40)

            let usernameText = await this.createText({
                text: champ.summoner,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: false,
            })
            this.composite(usernameText, 50 + imageWidth + 15, startY - 15)

            //summoner spells
            for (let i = 0; i <= 1; i++) {
                let x = 600 - 45
                let y = startY - 5 + 50 * i

                let spell = champ.summoners[i]

                let spellImage = await utils.getSummonerImage(spell)

                if (!spellImage) {
                    spellImage = await utils.downloadProfilePicture(29)
                }

                spellImage = await utils.resizeImage(spellImage, 40, 40, true)

                this.composite(spellImage, x, y)
            }

            //items
            for (let i = 0; i <= 6; i++) {
                let item = champ.items[i]
                //background - 130*130 for item, and full is 138*138
                let itemBackground = sharp('./images/itemBackground.png')
                itemBackground = itemBackground.resize(60, 60)

                let x = 600 + i * 60 + 3 * i
                let y = startY + 7

                this.composite(await itemBackground.toBuffer(), x, y)

                //item
                if (item) {
                    let itemImage = await utils.getItemImage(item.toString() + '.png')
                    itemImage = await utils.resizeImage(itemImage, 56, 56, true)
                    this.composite(itemImage, x + 2, y + 2)
                }

                if (i == 6) {
                    //add vision score
                    let visionScoreText = await this.createText({
                        text: champ.vision.toString(),
                        textSize: 32,
                        width: 56,
                        height: 56,
                        bold: true,
                        color: '#FFFFFF',
                        font: 'Beaufort for LOL Ja',
                        center: true,
                        outline: true,
                    })

                    this.composite(visionScoreText, x + 2, y + 15)
                }
            }

            //kda score
            let kdaText = await this.createText({
                text: `${champ.kills.toString()}/${champ.deaths.toString()}/${champ.asists.toString()}`,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: false,
            })

            this.composite(kdaText, 50 + imageWidth + 15, startY + 50 - 15)

            startY += imageWidth + 60
        }

        startY = 145
        //right team is mirrored and calculated from right side (2424px)
        for (let champ of matchData.teams[2]) {
            let imageName = await utils.championtIdToImage(champ.champion)

            let champImage: string
            if (!imageName) {
                champImage = await utils.downloadProfilePicture(29)
            } else {
                champImage = await utils.getChampionImage(imageName)
            }

            champImage = await utils.resizeImage(champImage, imageWidth, imageWidth, true)

            this.composite(champImage, 2424 - 50 - imageWidth, startY)

            //add level image
            let levelText = await this.createText({
                text: champ.level.toString(),
                textSize: 32,
                width: imageWidth,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: true,
                outline: true,
            })

            this.composite(levelText, 2424 - 50 - imageWidth, startY + imageWidth - 40)

            let usernameText = await this.createText({
                text: champ.summoner,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: 2,
            })

            this.composite(usernameText, 2424 - 50 - imageWidth - 15 - 700, startY - 15)

            //summoner spells
            for (let i = 0; i <= 1; i++) {
                let x = 2424 - 600 + 5
                let y = startY - 5 + 50 * i

                let spell = champ.summoners[i]

                let spellImage = await utils.getSummonerImage(spell)

                if (!spellImage) {
                    spellImage = await utils.downloadProfilePicture(29)
                }

                spellImage = await utils.resizeImage(spellImage, 40, 40, true)

                this.composite(spellImage, x, y)
            }

            //items
            for (let i = 0; i <= 6; i++) {
                let item = champ.items[i]
                //background - 130*130 for item, and full is 138*138
                let itemBackground = sharp('./images/itemBackground.png')
                itemBackground = itemBackground.resize(60, 60)

                // - 60 for item bg width
                let x = 2424 - 600 - i * 60 - 3 * i - 60
                let y = startY + 7

                this.composite(await itemBackground.toBuffer(), x, y)

                //item
                if (item) {
                    let itemImage = await utils.getItemImage(item.toString() + '.png')
                    itemImage = await utils.resizeImage(itemImage, 56, 56, true)
                    this.composite(itemImage, x + 2, y + 2)
                }

                if (i == 6) {
                    //add vision score
                    let visionScoreText = await this.createText({
                        text: champ.vision.toString(),
                        textSize: 32,
                        width: 56,
                        height: 56,
                        bold: true,
                        color: '#FFFFFF',
                        font: 'Beaufort for LOL Ja',
                        center: true,
                        outline: true,
                    })

                    this.composite(visionScoreText, x + 2, y + 15)
                }
            }

            //kda score
            let kdaText = await this.createText({
                text: `${champ.kills.toString()}/${champ.deaths.toString()}/${champ.asists.toString()}`,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: 2,
            })

            this.composite(kdaText, 2424 - 50 - imageWidth - 15 - 700, startY + 50 - 15)

            startY += imageWidth + 60
        }

        this.l.log('Finishing image...')
        let buffer = await this.compositeDone(image).toBuffer()
        let name = crypto.randomBytes(10).toString('hex') + '.png'

        this.l.log('Saving image...')
        fs.writeFileSync(`./temp/${name}`, buffer)
        this.l.stop('Done')

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
        outline = false,
    }: {
        text: string
        textSize: number
        width: number
        height: number
        color?: string
        center?: boolean | 2
        bold?: boolean
        font?: string
        outline?: boolean
    }) {
        let centerText = ''
        if (center == true) {
            centerText = `x="50%" text-anchor="middle"`
        }
        if (center == 2) {
            centerText = `x="100%" text-anchor="end"`
        }
        let txt = `<svg width="${width}" height="${height}">
            <style>
                .text {
                    font-family: '${font}';
                    font-size: ${textSize}px;
                    fill: ${color};
                    font-weight: ${bold ? 'bold' : 'normal'};
                }
                .outline {
                    paint-order: stroke;
                    stroke: #000000;
                    stroke-width: 6px;
                    stroke-linecap: butt;
                    stroke-linejoin: miter;
                }
            </style>
            <text y="50%" ${centerText} class="text${outline ? ' outline' : ''}">${text}</text>
        </svg>`

        return Buffer.from(txt)
    }
}

export default Images
