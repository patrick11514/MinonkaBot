import sharp from 'sharp'
import fs from 'fs'
import utils from '../riot/utilities'
import Logger from '../logger'
import crypto from 'crypto'

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

    async generateProfilePicture(
        userData: {
            username: string
            level: number
            iconId: number
            title: string
            challenges: Array<{
                id: number
                tier: string
            }>
        },
        language = 'cs_CZ'
    ) {
        let background = await fs.readFileSync('./images/profileBackground.png')

        let levelBackground = await fs.readFileSync('./images/levelBackground.png')

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
        center?: boolean
        bold?: boolean
        font?: string
    }) {
        let centerText = ''
        if (center) {
            centerText = `x="50%" text-anchor="middle"`
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
