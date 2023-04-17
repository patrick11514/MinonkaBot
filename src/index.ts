//imports
import { ActivityType, Client, GatewayIntentBits } from 'discord.js'
import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'
import Logger from './lib/logger'
import config from './config'
import fetch from 'node-fetch'
import JSONdb from 'simple-json-db'
import utilities from './lib/riot/utilities'
import sharp from 'sharp'
import crypto from 'crypto'

//dotenv
import * as dotenv from 'dotenv'
import { startLPChecker } from './lib/riot/workers/lpChecker'
import { LiveRank } from '$lib/riot/workers/liveRank'
dotenv.config()

//intents
const intents = []
intents.push(GatewayIntentBits.Guilds)

//creating client
const client = new Client({
    intents: intents,
})
process.client = client

//variables
const emitter = new EventEmitter()
client.emitter = emitter
client.config = config
const dir = __dirname
const l = new Logger('Client', 'cyan')

//give client to commands
const files = fs
    .readdirSync(path.join(dir, 'commands'))
    .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'))

for (let file of files) {
    let filePath = path.join(dir, 'commands', file)
    //give client to command
    require(filePath).default(client)
}

const usersDB = new JSONdb('databases/users.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.usersDB = usersDB

const nameHistoryDB = new JSONdb('databases/nameHistory.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.nameHistoryDB = nameHistoryDB

const emotesDB = new JSONdb('databases/emotes.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.emotesDB = emotesDB

const commandsDB = new JSONdb('databases/commands.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.commandsDB = commandsDB

const LPDB = new JSONdb('databases/lp.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.LPDB = LPDB
startLPChecker(LPDB)

const LRDB = new JSONdb('databases/liveRank.json', {
    syncOnWrite: true,
    asyncWrite: true,
})

client.LRDB = LRDB
client.liveRank = new LiveRank(LRDB)
client.liveRank.startLiveRank()

//statuses
const status: Array<{
    text: string
    status:
        | ActivityType.Competing
        | ActivityType.Playing
        | ActivityType.Streaming
        | ActivityType.Watching
        | ActivityType.Listening
}> = [
    {
        text: 'si s baronem',
        status: ActivityType.Playing,
    },
    {
        text: 'si s krabem',
        status: ActivityType.Playing,
    },
    {
        text: 'na harfu od Sony',
        status: ActivityType.Playing,
    },
    {
        text: 'si s Ostřím Nekonečna',
        status: ActivityType.Playing,
    },
    {
        text: 'rychlosti přebíjení s Jhinem',
        status: ActivityType.Competing,
    },
    {
        text: 'novou písničku od Seraphine',
        status: ActivityType.Listening,
    },
    {
        text: 'STAR WALKING',
        status: ActivityType.Listening,
    },
    {
        text: 'jak si Nunu s Willumpem hrajou',
        status: ActivityType.Watching,
    },
    {
        text: 'Worlds',
        status: ActivityType.Watching,
    },
]

//change status
function changeStatus() {
    let l = new Logger('Change status', 'blue')
    //pick random status
    let option = Math.floor(Math.random() * status.length)

    l.log('Changing status to: ' + config.statuses[status[option].status] + ' ' + status[option].text)
    client.user?.setActivity(status[option].text, {
        type: status[option].status,
    })
    //chanmge status in 5 minutes
    setTimeout(changeStatus, 5 * 60 * 1000)
}

//update version
async function updateVersion() {
    let l = new Logger('Update version', 'blue')
    l.start('Checking for new version...')
    let response = await fetch(process.env.DDRAGON_URL + '/api/versions.json')
    let json = await response.json()

    let prevVersion = client.LOL_VERSION
    let currentVer = json[0]

    if (!prevVersion) {
        if (fs.existsSync('./cache/lolver')) {
            prevVersion = fs.readFileSync('./cache/lolver').toString()
        }
    }

    //check if dragon data is uploaded
    response = await fetch(process.env.DDRAGON_URL + '/cdn/' + currentVer + '/data/en_US/champions.json')
    if (!response.ok) {
        client.LOL_VERSION = json[0]

        if (prevVersion && prevVersion != currentVer) {
            l.log('New version found: ' + currentVer)
            //if yes, delete png files in cache folder and log
            let l2 = new Logger('Cache', 'blue')
            l2.start('Deleting cache...')
            let files = fs.readdirSync('./cache').filter((file) => file.endsWith('.png') || file.endsWith('.json'))
            for (let file of files) {
                fs.unlinkSync('./cache/' + file)
            }
            l2.stop('Cache deleted')
        }

        if (prevVersion != currentVer) {
            //check emotes
            let l3 = new Logger('Check emotes', 'blue')
            await checkEmotes(currentVer, l3)
            fs.writeFileSync('./cache/lolver', currentVer)
        }
    } else {
        client.LOL_VERSION = json[1]
    }

    l.stop('Done.')

    //update version in an hour
    setTimeout(updateVersion, 60 * 60 * 1000)
}

const forceLoadEmojis = true

async function checkEmotes(version: string, l: Logger) {
    {
        l.start('Checking champion emotes emotes...')
        //champions
        let championsData = await utilities.getChampions()

        //calculate number of emotes
        let emotes = 0
        for (let _ of Object.values(championsData.data)) {
            emotes++
        }

        let championDiscords = config.emotes.champions

        //on one discord server we can upload 50 emotes, so emotes / 50 = number of servers needed for emotes of champions
        //if not enough servers, logger.error to console and return

        if (championDiscords.length < emotes / 50) {
            l.stopError(
                'Not enough servers for emotes of champions. You need at least ' + Math.ceil(emotes / 50) + ' servers.'
            )
        } else {
            let i = 1

            if (!emotesDB.has('championsCount') && !forceLoadEmojis) {
                //Delete all emotes
                let l2 = new Logger('Delete emotes', 'blue')
                l2.start('Deleting emotes...')
                for (let discord of championDiscords) {
                    let l = 1
                    let guild = await client.guilds.fetch(discord)
                    let emotes = await guild.emojis.fetch()
                    let count = emotes.size
                    process.stdout.write('0/' + count)
                    for (let emote of emotes.values()) {
                        process.stdout.clearLine(0)
                        process.stdout.cursorTo(0)
                        process.stdout.write(l + '/' + count)
                        await emote.delete()
                        l++
                    }
                }
                l2.stop('\nEmotes deleted')
            } else if (!emotesDB.has('championsCount') && forceLoadEmojis) {
                let emojisCount = 0

                for (let discord of championDiscords) {
                    let guild = await client.guilds.fetch(discord)
                    let emotes = await guild.emojis.fetch()
                    emojisCount += emotes.size

                    for (let emote of emotes.values()) {
                        emotesDB.set('champ@' + emote.name, emote.identifier)
                    }
                }

                emotesDB.set('championsCount', emojisCount)
            }

            for (let champion of Object.values(championsData.data)) {
                if (!emotesDB.has(`champ@${champion.id}`)) {
                    let filename = await utilities.getChampionImage(champion.image.full)
                    //resize image to 105x105px
                    let randomName = crypto.randomBytes(16).toString('hex')
                    l.log('Resizing image to 105x105px')
                    await sharp(filename)
                        .resize(105, 105)
                        .toFile('./temp/' + randomName + '.png')

                    l.log('Resizing done')

                    //upload emote
                    //check if is space for emote
                    let discordServerId = championDiscords[Math.ceil(i / 50) - 1]

                    let guild = await client.guilds.fetch(discordServerId)
                    if (!guild) {
                        l.stopError('Guild with id ' + discordServerId + ' not found.')
                        return
                    }

                    let emotes = await guild.emojis.fetch()

                    if (emotes.size >= 50) {
                        //find new server
                        for (let discord of championDiscords) {
                            guild = await client.guilds.fetch(discord)
                            let emotes = await guild.emojis.fetch()
                            if (emotes.size < 50) {
                                discordServerId = discord
                                break
                            }
                        }
                    }

                    let emoji = await guild.emojis.create({
                        name: champion.id,
                        attachment: './temp/' + randomName + '.png',
                    })

                    //Delete temp file
                    fs.unlinkSync('./temp/' + randomName + '.png')

                    emotesDB.set(`champ@${champion.id}`, emoji.identifier)
                }
                i++
            }

            emotesDB.set('championsCount', emotes)
        }

        l.stop('Done')
    }
    {
        l.start('Checking item emotes...')

        let itemsData = await utilities.getItems('en_US')

        //calculate number of emotes
        let emotes = 0
        for (let item of Object.values(itemsData.data)) {
            if (Object.hasOwn(item, 'inStore') && !item.inStore) continue
            emotes++
        }

        let itemDiscords = config.emotes.items

        //on one discord server we can upload 50 emotes, so emotes / 50 = number of servers needed for emotes of champions
        //if not enough servers, logger.error to console and return

        if (itemDiscords.length < emotes / 50) {
            l.stopError(
                'Not enough servers for emotes of items. You need at least ' + Math.ceil(emotes / 50) + ' servers.'
            )
        } else {
            let i = 1

            if (!emotesDB.has('itemsCount') && !forceLoadEmojis) {
                //Delete all emotes
                let l2 = new Logger('Delete emotes', 'blue')
                l2.start('Deleting emotes...')
                for (let discord of itemDiscords) {
                    let l = 1
                    let guild = await client.guilds.fetch(discord)
                    let emotes = await guild.emojis.fetch()
                    let count = emotes.size
                    process.stdout.write('0/' + count)
                    for (let emote of emotes.values()) {
                        process.stdout.clearLine(0)
                        process.stdout.cursorTo(0)
                        process.stdout.write(l + '/' + count)
                        await emote.delete()
                        l++
                    }
                }
                l2.stop('\nEmotes deleted')
            } else if (!emotesDB.has('itemsCount') && forceLoadEmojis) {
                let emojisCount = 0

                for (let discord of itemDiscords) {
                    let guild = await client.guilds.fetch(discord)
                    let emotes = await guild.emojis.fetch()
                    emojisCount += emotes.size

                    for (let emote of emotes.values()) {
                        emotesDB.set('item@' + emote.name, emote.identifier)
                    }
                }

                emotesDB.set('itemsCount', emojisCount)
            }

            for (let item of Object.values(itemsData.data)) {
                if (Object.hasOwn(item, 'inStore') && !item.inStore) continue
                let itemId = utilities.fixItemName(item.name)
                if (!emotesDB.has(`item@${itemId}`)) {
                    let filename = await utilities.getItemImage(item.image.full)
                    //resize image to 105x105px
                    let randomName = crypto.randomBytes(16).toString('hex')
                    l.log('Resizing image to 105x105px')
                    await sharp(filename)
                        .resize(105, 105)
                        .toFile('./temp/' + randomName + '.png')

                    l.log('Resizing done')

                    //upload emote
                    //check if is space for emote
                    let discordServerId = itemDiscords[Math.ceil(i / 50) - 1]

                    let guild = await client.guilds.fetch(discordServerId)
                    if (!guild) {
                        l.stopError('Guild with id ' + discordServerId + ' not found.')
                        return
                    }

                    let emotes = await guild.emojis.fetch()

                    if (emotes.size >= 50) {
                        //find new server
                        for (let discord of itemDiscords) {
                            guild = await client.guilds.fetch(discord)
                            let emotes = await guild.emojis.fetch()
                            if (emotes.size < 50) {
                                discordServerId = discord
                                break
                            }
                        }
                    }

                    let emoji = await guild.emojis.create({
                        name: itemId,
                        attachment: './temp/' + randomName + '.png',
                    })

                    //Delete temp file
                    fs.unlinkSync('./temp/' + randomName + '.png')

                    emotesDB.set(`item@${itemId}`, emoji.identifier)
                }
                i++
            }
        }
    }
}

//download

//start tasks
async function tasks() {
    //clear temp folder
    {
        let l = new Logger('Clear TEMP', 'red')
        l.start('Clearing temp folder...')
        let files = fs.readdirSync('./temp')
        files.forEach((f) => {
            l.log(`Deleting ${f}...`)
            fs.unlinkSync(`./temp/${f}`)
        })
        l.stop('Done')
    }
    //resize ranked images for rank command
    {
        let l = new Logger('Resize Ranks', 'red')
        l.start('Resizing ranks...')
        let files = fs.readdirSync('./images/ranks')
        files
            .filter((f) => !f.includes('_resized'))
            .forEach((f) => {
                //check if file X_resized_rank.png exists
                if (!fs.existsSync(`./images/ranks/${f.split('.')[0]}_resized_rank.png`)) {
                    l.log(`Resizing ${f}...`)
                    //resize image
                    sharp(`./images/ranks/${f}`)
                        .resize(250, 250)
                        .toFile(`./images/ranks/${f.split('.')[0]}_resized_rank.png`)
                }
            })
        l.stop('Done')
    }
    //resize series images
    {
        let l = new Logger('Resize Series', 'red')
        l.start('Resizing series...')
        let imageNames = [
            'seriesWin.png',
            'seriesLose.png',
            'seriesEmpty.png',
            'seriesWin2.png',
            'seriesLose2.png',
            'seriesEmpty2.png',
        ]
        imageNames.forEach((f) => {
            //check if file X_resized_rank.png exists
            if (!fs.existsSync(`./images/${f.split('.')[0]}_resized.png`)) {
                l.log(`Resizing ${f}...`)
                //resize image
                let sharp = require('sharp')
                sharp(`./images/${f}`)
                    .resize(80, 80)
                    .toFile(`./images/${f.split('.')[0]}_resized.png`)
            }
        })
        l.stop('Done')
    }
}
tasks()

client.on('ready', () => {
    l.log(`Logged as ${client.user?.tag}`)
    changeStatus()
    updateVersion()
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        try {
            //automatically deffer reply
            await interaction.deferReply()

            emitter.emit('command', interaction)
        } catch (e: any) {
            l.error(e)
            if (interaction.isRepliable()) interaction.reply('Při vykonávání příkazu nastala někde chyba.')
        }
    }

    if (interaction.isButton()) {
        try {
            emitter.emit('button', interaction)
        } catch (e: any) {
            l.error(e)
            if (interaction.isRepliable()) interaction.editReply('Při zprácování kliku někde nastala chyba.')
        }
    }
})

client.login(process.env.DISCORD_TOKEN)

//express server
require('./liveServer/index')
