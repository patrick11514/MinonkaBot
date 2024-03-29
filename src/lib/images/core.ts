import { cherryMatchData, matchData, profilePicture, rankedProfile } from '$types/imageInputs'
import { QueueTypes, RankColors, Tiers, lowerTier, teamMember } from '$types/riotApi'
import crypto from 'crypto'
import fs from 'node:fs'
import Path from 'path'
import sharp from 'sharp'
import { coopTitles, queues } from '../../components/queues'
import Logger from '../logger'
import utils from '../riot/utilities'

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

        //add server
        this.l.log('Adding server...')
        let serverText = await this.createText({
            text: userData.region,
            textSize: 60,
            width: 700,
            height: 90,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
        })
        this.composite(serverText, 0, 140)

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
        this.composite(profileImage, 165, 185)

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
        this.composite(nameText, 40, 185 + 480)

        //Add level
        this.l.log('Adding level...')
        //add background
        this.composite(levelBackground, 279, 49)
        //add number
        let levelText = await this.createText({
            text: userData.level.toString(),
            textSize: 60,
            width: 222,
            height: 88 + 40,
            bold: true,
        })
        this.composite(levelText, 279, 49)

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
            if (queue.queueType === QueueTypes.ARENAS) {
                continue
            }

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
                let center = x + 1000 + 450 + 220
                this.generateMiniSeries(queue.miniSeries.progress, center, y + 100 + 40)
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
        const backgroundWidth = 2424
        ///const backgroundHeight = 820

        let background = fs.readFileSync('./images/matchBackground.png')

        this.l.start('Creating background...')
        let image = sharp(background)
        let win = matchData.wins.find((w) => w.id == matchData.userTeam)?.win

        this.l.log('Adding win or lose text...')
        let winOrLoseText = await this.createText({
            text: matchData.ff15 && matchData.length <= 195 ? 'Remake' : win ? 'Victory' : 'Defeat',
            textSize: 100,
            width: 700,
            height: 165,
            bold: true,
            color: matchData.ff15 && matchData.length <= 195 ? '#7e857f' : win ? '#1fed18' : '#ff0000',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(winOrLoseText, 858, 35)

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
            if (matchData.lp && typeof matchData.lp == 'string') {
                let center = 1212
                let y = yPos + 20

                this.generateMiniSeries(matchData.lp, center, y, [
                    'seriesWin2_resized.png',
                    'seriesLose2_resized.png',
                    'seriesEmpty2_resized.png',
                ])
            } else {
                let lpText = await this.createText({
                    text: matchData.lp ? matchData.lp + ' LP' : '? LP',
                    textSize: 60,
                    width: 700,
                    height: 135,
                    bold: true,
                    color: matchData.lp ? ((matchData.lp as number) >= 0 ? '#1fed18' : '#ff0000') : '#ffffff',
                    font: 'Beaufort for LOL Ja',
                    center: true,
                })
                this.composite(lpText, 858, yPos)
            }
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
            height: 165,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(killTextTeam1, 858 - 300, 35)

        let killTextTeam2 = await this.createText({
            text: matchData.teams[2].reduce((prev, curr) => prev + curr.kills, 0).toString(),
            textSize: 100,
            width: 700,
            height: 165,
            bold: true,
            color: '#ffffff',
            font: 'Beaufort for LOL Ja',
            center: true,
        })
        this.composite(killTextTeam2, 858 + 300, 35)

        this.l.log('Adding champion bans...')
        //bans
        //lefts
        let bans = matchData.bans.find((ban) => ban.id === matchData.teams[1][0].id)

        if (!bans) return ''

        let banY = 55
        let banX = 450

        for (let ban of bans?.bans) {
            let imageName = await utils.championIdToImage(ban.champion)
            let champImage: string
            if (!imageName) {
                champImage = await utils.downloadProfilePicture(29)
            } else {
                champImage = await utils.getChampionImage(imageName)
            }

            champImage = await utils.resizeImage(champImage, 60, 60, true)

            this.composite(champImage, banX, banY)

            banX += 70
        }

        //right

        bans = matchData.bans.find((ban) => ban.id === matchData.teams[2][0].id)

        if (!bans) return ''

        banX += 832

        for (let ban of bans?.bans) {
            let imageName = await utils.championIdToImage(ban.champion)
            let champImage: string
            if (!imageName) {
                champImage = await utils.downloadProfilePicture(29)
            } else {
                champImage = await utils.getChampionImage(imageName)
            }
            champImage = await utils.resizeImage(champImage, 60, 60, true)

            this.composite(champImage, banX, banY)

            banX += 70
        }
        this.l.log('Adding champions...')
        const imageWidth = 75

        //functions
        const addChampion = async (champ: teamMember, x: number, y: number, multiplier: 1 | -1) => {
            const fromName = 600

            //champion image
            let imageName = await utils.championIdToImage(champ.champion)
            let champImage: string
            if (!imageName) {
                champImage = await utils.downloadProfilePicture(29)
            } else {
                champImage = await utils.getChampionImage(imageName)
            }
            champImage = await utils.resizeImage(champImage, imageWidth, imageWidth, true)

            this.composite(champImage, x + (50 + (multiplier == -1 ? imageWidth : 0)) * multiplier, y)

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

            this.composite(levelText, x + (50 + (multiplier == -1 ? imageWidth : 0)) * multiplier, y + imageWidth - 40)

            const offset = imageWidth + 15 * 2 + fromName

            //username
            let usernameText = await this.createText({
                text: champ.summoner,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: champ.summonerId === matchData.userId ? '#fff000' : '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: multiplier == -1 ? 2 : false,
            })
            this.composite(
                usernameText,
                x + (50 + imageWidth + 15 + (multiplier == -1 ? offset : 0)) * multiplier,
                y - 15,
            )

            //kda score
            let kdaText = await this.createText({
                text: `${champ.kills.toString()}/${champ.deaths.toString()}/${champ.asists.toString()}`,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: multiplier == -1 ? 2 : false,
            })

            this.composite(
                kdaText,
                x + (50 + imageWidth + 15 + (multiplier == -1 ? offset : 0)) * multiplier,
                y + 50 - 15,
            )

            const spacing = 5

            //summoner spells
            for (let i = 0; i <= 1; i++) {
                const summonerSpellSize = 40
                const spellsY = y + (spacing + summonerSpellSize) * i

                let spell = champ.summoners[i]

                let spellImage = await utils.getSummonerImage(spell)

                if (!spellImage) {
                    spellImage = await utils.downloadProfilePicture(29)
                }

                spellImage = await utils.resizeImage(spellImage, summonerSpellSize, summonerSpellSize, true)

                this.composite(
                    spellImage,
                    x + (fromName - (multiplier == 1 ? summonerSpellSize + spacing : 0)) * multiplier,
                    spellsY,
                )
            }

            //runes
            for (let i = 0; i < 2; i++) {
                const runeSize = 40
                const runeX = x + (fromName - (spacing + runeSize) * (multiplier == 1 ? 2 : 1)) * multiplier
                const runeY = y + (runeSize + spacing) * i

                let style = champ.perks.styles[i]

                let image
                if (i == 0) {
                    image = await utils.getRuneById(style.style, style.selections[0].perk)
                } else {
                    image = await utils.getRuneCategoryById(style.style)
                }

                if (!image) {
                    image = await utils.downloadProfilePicture(29)
                } else {
                    image = await utils.getRuneImage(image)
                }

                image = await utils.resizeImage(image, runeSize - 10 * i, runeSize - 10 * i, true)

                this.composite(image, runeX + 5 * i, runeY + 5 * i)
            }

            const itemBackgroundSize = 60

            //items
            for (let i = 0; i <= 6; i++) {
                const itemSpacing = 3

                const item = champ.items[i]
                //background - 130*130 for item, and full is 138*138
                const itemBackground = sharp('./images/itemBackground.png').resize(
                    itemBackgroundSize,
                    itemBackgroundSize,
                )

                const itemX =
                    x + (fromName + (itemBackgroundSize + itemSpacing) * (i + (multiplier == -1 ? 1 : 0))) * multiplier
                const itemY = y - spacing

                this.composite(await itemBackground.toBuffer(), itemX, itemY)

                //item
                if (item) {
                    let itemImage = await utils.getItemImage(item.toString() + '.png')
                    itemImage = await utils.resizeImage(itemImage, 56, 56, true)
                    this.composite(itemImage, itemX + 2, itemY + 2)
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

                    this.composite(visionScoreText, itemX + 2, itemY + 15)
                }
            }

            const dataY = y + imageWidth - spacing * 3
            const imageSize = 25

            //minions
            const minionX = x + (fromName + spacing * 2 + (multiplier == -1 ? imageSize : 0)) * multiplier

            const minionImage = await utils.resizeImage('./images/minion.png', imageSize, imageSize, true)
            this.composite(minionImage, minionX, dataY)

            const minionText = await this.createText({
                text: (champ.minions + champ.neutralMinions).toString(),
                textSize: 22,
                width: 100,
                height: 40,
                bold: true,
                color: '#FFFFFF',
                font: 'Beaufort for LOL Ja',
                center: multiplier == 1 ? false : 2,
                outline: true,
            })

            this.composite(
                minionText,
                minionX + (imageSize + spacing + (multiplier == -1 ? 75 : 0)) * multiplier,
                dataY,
            )

            const intl = new Intl.NumberFormat('cs-cz')

            //damage
            const damageX = x + (fromName + spacing * 2 + 100 + (multiplier == -1 ? imageSize : 0)) * multiplier

            const damageImage = await utils.resizeImage('./images/sword.png', imageSize, imageSize, true)
            this.composite(damageImage, damageX, dataY)

            const damageText = await this.createText({
                text: intl.format(champ.totalDamage),
                textSize: 22,
                width: 100,
                height: 40,
                bold: true,
                color: '#FFFFFF',
                font: 'Beaufort for LOL Ja',
                center: multiplier == 1 ? false : 2,
                outline: true,
            })

            this.composite(
                damageText,
                damageX + (imageSize + spacing + (multiplier == -1 ? 75 : 0)) * multiplier,
                dataY,
            )

            //golds
            const goldsX = x + (fromName + spacing * 2 + 230 + (multiplier == -1 ? imageSize : 0)) * multiplier

            const goldsImage = await utils.resizeImage('./images/coins.png', imageSize, imageSize, true)
            this.composite(goldsImage, goldsX, dataY)

            const goldsText = await this.createText({
                text: intl.format(champ.golds),
                textSize: 22,
                width: 100,
                height: 40,
                bold: true,
                color: '#FFFFFF',
                font: 'Beaufort for LOL Ja',
                center: multiplier == 1 ? false : 2,
                outline: true,
            })

            this.composite(goldsText, goldsX + (imageSize + spacing + (multiplier == -1 ? 75 : 0)) * multiplier, dataY)
        }

        const promises: Promise<void>[] = []

        //team
        for (let i = 1; i <= 2; i++) {
            for (let champId in matchData.teams[i]) {
                let champ = matchData.teams[i][champId]
                promises.push(
                    addChampion(
                        champ,
                        i == 1 ? 0 : backgroundWidth,
                        145 + (imageWidth + 60) * parseInt(champId),
                        i == 1 ? 1 : -1,
                    ),
                )
            }
        }

        await Promise.all(promises)

        this.l.log('Finishing image...')
        let buffer = await this.compositeDone(image).toBuffer()
        let name = crypto.randomBytes(10).toString('hex') + '.png'

        this.l.log('Saving image...')
        fs.writeFileSync(`./temp/${name}`, buffer)
        this.l.stop('Done')

        return `./temp/${name}`
    }

    async generateMatchCherry(data: cherryMatchData): Promise<string> {
        const backgroundWidth = 2424
        ///const backgroundHeight = 820

        let background = fs.readFileSync('./images/matchBackground.png')

        this.l.start('Creating background...')
        let image = sharp(background)

        this.l.log('Adding bans...')
        const bans = data.bans[0].bans

        const banY = 35
        for (const banId in bans) {
            const id = parseInt(banId)
            const ban = bans[banId]
            const fileName = await utils.championIdToImage(ban.champion)
            let image: string
            if (!fileName) {
                image = await utils.downloadProfilePicture(29)
            } else {
                image = await utils.getChampionImage(fileName)
            }

            image = await utils.resizeImage(image, 70, 70, true)

            // <-----> 2424px // (70 + 10) * 8
            this.composite(image, 892 + id * (70 + 10), banY)
        }

        this.l.log('Adding teams')
        for (const teamId in data.teams) {
            const id = parseInt(teamId)
            const team = data.teams[teamId]

            const teamName = team[0].team
            const player = team.find((p) => p.summonerId === data.userId)
            const inTeam = player ? true : false

            console.log(id, team)
            const startY = id % 2 == 0 ? 120 + 330 : 120
            const startX = id < 3 ? 80 : backgroundWidth / 2 + 40
            //team icon
            const path = `./images/arenas/${teamName}.png`
            const icon = await utils.resizeImage(path, 75, 75, true)
            this.composite(icon, startX, startY)

            //team name + position
            const teamNameText = await this.createText({
                text: `${id}. - ${teamName}`,
                textSize: 40,
                width: 700,
                height: 90,
                bold: true,
                color: inTeam ? '#fff000' : '#ffffff',
                font: 'Beaufort for LOL Ja',
                center: false,
            })
            this.composite(teamNameText, startX + 75 + 10, startY + 10)

            const iconOffset = startY + 75

            //players
            for (const playerId in team) {
                const data = team[playerId]

                //champion icon
                const fileName = await utils.championIdToImage(data.champion)
                let image: string
                if (!fileName) {
                    image = await utils.downloadProfilePicture(29)
                } else {
                    image = await utils.getChampionImage(fileName)
                }

                image = await utils.resizeImage(image, 75, 75, true)

                this.composite(image, startX, iconOffset + parseInt(playerId) * 120 + 15 /*15 - offset to match text */)

                //level
                const levelText = await this.createText({
                    text: data.level.toString(),
                    textSize: 32,
                    width: 75,
                    height: 90,
                    bold: true,
                    color: '#ffffff',
                    font: 'Beaufort for LOL Ja',
                    center: true,
                    outline: true,
                })
                this.composite(levelText, startX, iconOffset + parseInt(playerId) * 120 + 15 + 75 - 40)

                //username
                const usernameText = await this.createText({
                    text: data.summoner,
                    textSize: 40,
                    width: 700,
                    height: 90,
                    bold: true,
                    color: data.summonerId === player?.summonerId ? '#fff000' : '#ffffff',
                    font: 'Beaufort for LOL Ja',
                    center: false,
                })
                this.composite(usernameText, startX + 75 + 10, iconOffset + parseInt(playerId) * 120)

                //kda
                const kdaText = await this.createText({
                    text: `${data.kills.toString()}/${data.deaths.toString()}/${data.asists.toString()}`,
                    textSize: 40,
                    width: 700,
                    height: 90,
                    bold: true,
                    color: '#ffffff',
                    font: 'Beaufort for LOL Ja',
                    center: false,
                })
                this.composite(kdaText, startX + 75 + 10, iconOffset + parseInt(playerId) * 120 + 50)

                const fromText = 600

                const spellStartX = startX + fromText

                //summoner spells
                for (let i = 0; i <= 1; i++) {
                    const summonerSpellSize = 40
                    const spellsY = iconOffset + parseInt(playerId) * 120 + (summonerSpellSize + 5) * i + 10

                    let spell = data.summoners[i]

                    let spellImage = await utils.getSummonerImage(spell)

                    if (!spellImage) {
                        spellImage = await utils.downloadProfilePicture(29)
                    }

                    spellImage = await utils.resizeImage(spellImage, summonerSpellSize, summonerSpellSize, true)

                    this.composite(spellImage, spellStartX, spellsY)
                }

                const itemStartX = spellStartX + 40 + 10

                //items
                for (let i = 0; i <= 6; i++) {
                    const itemSpacing = 3

                    const item = data.items[i]
                    //background - 130*130 for item, and full is 138*138
                    const itemBackground = sharp('./images/itemBackground.png').resize(60, 60)

                    const itemX = itemStartX + (itemSpacing + 60) * i
                    const itemY = iconOffset + parseInt(playerId) * 120 + 10

                    this.composite(await itemBackground.toBuffer(), itemX, itemY)

                    //item
                    if (item) {
                        let itemImage = await utils.getItemImage(item.toString() + '.png')
                        itemImage = await utils.resizeImage(itemImage, 56, 56, true)
                        this.composite(itemImage, itemX + 2, itemY + 2)
                    }
                }

                const intl = new Intl.NumberFormat('cs-cz')

                //damage
                const damageX = spellStartX + 40 + 10 + 55 /*55 - +-center under items, not ward */
                const damageY = iconOffset + parseInt(playerId) * 120 + 60 + 10

                const damageImage = await utils.resizeImage('./images/sword.png', 25, 25, true)
                this.composite(damageImage, damageX, damageY)

                const damageText = await this.createText({
                    text: intl.format(data.totalDamage),
                    textSize: 22,
                    width: 100,
                    height: 40,
                    bold: true,
                    color: '#FFFFFF',
                    font: 'Beaufort for LOL Ja',
                    center: false,
                    outline: true,
                })

                this.composite(damageText, damageX + 25 + 10, damageY)

                //golds
                const goldsX = damageX + 150
                const goldsY = iconOffset + parseInt(playerId) * 120 + 60 + 10

                const goldsImage = await utils.resizeImage('./images/coins.png', 25, 25, true)
                this.composite(goldsImage, goldsX, goldsY)

                const goldsText = await this.createText({
                    text: intl.format(data.golds),
                    textSize: 22,
                    width: 100,
                    height: 40,
                    bold: true,
                    color: '#FFFFFF',
                    font: 'Beaufort for LOL Ja',
                    center: false,
                    outline: true,
                })

                this.composite(goldsText, goldsX + 25 + 10, goldsY)
            }
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

    async generateMiniSeries(
        string: string,
        center: number,
        y: number,
        images = ['seriesWin_resized.png', 'seriesLose_resized.png', 'seriesEmpty_resized.png'],
    ) {
        let progress = string.split('') as Array<'W' | 'L' | 'N'>

        //load images
        let win = fs.readFileSync('./images/' + images[0])
        let lose = fs.readFileSync('./images/' + images[1])
        let notPlayed = fs.readFileSync('./images/' + images[2])

        let startX = center - (progress.length / 2) * 88
        for (let prog of progress) {
            this.composite(prog == 'W' ? win : prog == 'L' ? lose : notPlayed, startX, y)
            startX += 88
        }
    }
}

export default Images
