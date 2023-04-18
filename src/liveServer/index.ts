import express, { NextFunction, Request, Response } from 'express'
import Logger from '$lib/logger'
import Riot from '$lib/riot/core'
import Images from '$lib/images/core'
import path, { basename } from 'path'
import fs from 'fs'

const l = new Logger('LIVE SERVER', 'magentaBright')
l.start('Starting live server...')
const app = express()

function logRequest(req: Request, res: Response, next: NextFunction) {
    //get user ip
    //if forwareder for, get forwarded for ip
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    if (typeof ip === 'object') {
        ip = ip.join(', ')
    }

    if (!ip) {
        ip = 'Unknown'
    }

    if (ip.includes('::ffff:')) {
        ip = ip.replace('::ffff:', '')
    }

    l.log(`[${ip}] [${req.method}] ${req.url}`)
    next()
}

app.use(logRequest)

app.get('/', (_, res: Response) => {
    res.send(
        'Hello :3, this is a server for serving live profile images of user\'s league of legends\'s profiles within my discord bot, check <a href="https://patrick115.eu">https://patrick115.eu</a> for more info. ^^'
    )
})

app.get('/raw/:region/:summonerName', async (req: Request, res: Response) => {
    let { region, summonerName } = req.params

    const config = process.client.config

    if (!config.regions.includes(region)) {
        const translate = Object.entries(config.regionTranslates).find(([_, translate]) => translate === region)
        if (!translate) {
            res.status(400).json({
                status: false,
                error: 'Invalid region',
            })
            return
        }
        region = translate[0]
    }
    const profile = await Riot.getSummonerByName(summonerName, region)
    if (!profile) {
        res.status(400).json({
            status: false,
            error: 'Invalid username',
        })
        return
    }
    res.json({
        status: true,
        data: {
            name: profile.name,
            profileIconId: profile.profileIconId,
            revisionDate: profile.revisionDate,
            summonerLevel: profile.summonerLevel,
        },
    })
})

app.get('/profile/:region/:summonerName', async (req: Request, res: Response) => {
    let { region, summonerName } = req.params

    const config = process.client.config

    if (!config.regions.includes(region)) {
        const translate = Object.entries(config.regionTranslates).find(([_, translate]) => translate === region)
        if (!translate) {
            res.status(400).json({
                status: false,
                error: 'Invalid region',
            })
            return
        }
        region = translate[0]
    }
    const profile = await Riot.getSummonerByName(summonerName, region)
    if (!profile) {
        res.status(400).json({
            status: false,
            error: 'Invalid username',
        })
        return
    }

    const liveRank = process.client.liveRank
    if (!liveRank.has(profile.id)) {
        await liveRank.add(profile.id, profile.puuid, region)
    }

    if (liveRank.files.hasOwnProperty(profile.id)) {
        let file = liveRank.files[profile.id]
        if (file) {
            const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')

            res.send(
                HTML.replaceAll('%USER%', profile.name)
                    .replaceAll('%REGION%', region)
                    .replaceAll('%IMG%', basename(file))
            )
            return
        }
    }

    const rank = liveRank.get(profile.id)

    if (!rank) {
        res.json({
            status: false,
            error: 'No rank data found',
        })
        return
    }

    let images = new Images()
    let imagePath = await images.generateRankedProfile({
        summonerName: profile.name,
        level: profile.summonerLevel,
        profileIconId: profile.profileIconId,
        rankeds: rank.data,
    })

    liveRank.files[profile.id] = imagePath

    const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')

    res.send(
        HTML.replaceAll('%USER%', profile.name).replaceAll('%REGION%', region).replaceAll('%IMG%', basename(imagePath))
    )
})

app.get('/image/:path', (req: Request, res: Response) => {
    let p = path.join(process.cwd(), 'temp', req.params.path)

    if (!fs.existsSync(p)) {
        res.status(404)
    }
    res.sendFile(p)
})

app.get('/api/:region/:summonerName', async (req: Request, res: Response) => {
    let { region, summonerName } = req.params

    const config = process.client.config

    if (!config.regions.includes(region)) {
        const translate = Object.entries(config.regionTranslates).find(([_, translate]) => translate === region)
        if (!translate) {
            res.status(400).json({
                status: false,
                error: 'Invalid region',
            })
            return
        }
        region = translate[0]
    }
    const profile = await Riot.getSummonerByName(summonerName, region)
    if (!profile) {
        res.status(400).json({
            status: false,
            error: 'Invalid username',
        })
        return
    }

    const liveRank = process.client.liveRank
    if (!liveRank.has(profile.id)) {
        res.send({
            status: false,
            error: 'No rank data found',
        })
        return
    }

    if (liveRank.files.hasOwnProperty(profile.id)) {
        let file = liveRank.files[profile.id]
        if (file) {
            res.send({
                status: true,
                url: file,
            })
            return
        }
    }
    res.send({
        status: false,
        error: 'No rank data found',
    })
})

app.listen(process.env.PORT, () => {
    l.stop(`Server started on port ${process.env.PORT}`)
})
