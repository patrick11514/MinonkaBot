//imports
import { ActivityType, Client, GatewayIntentBits } from 'discord.js'
import EventEmitter from 'events'
import fs from 'fs'
import path from 'path'
import Logger from './lib/logger'
import config from './config'

//dotenv
import * as dotenv from 'dotenv'
import fetch from 'node-fetch'
import JSONdb from 'simple-json-db'
dotenv.config()

//intents
const intents = []
intents.push(GatewayIntentBits.Guilds)

//creating client
let client = new Client({
    intents: intents,
})
process.client = client

//varibales
let emitter = new EventEmitter()
client.emitter = emitter
client.config = config
const dir = __dirname
const l = new Logger('Client', 'cyan')

//give client to commands
let files = fs
    .readdirSync(path.join(dir, 'commands'))
    .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'))

for (let file of files) {
    let filePath = path.join(dir, 'commands', file)
    //give client to command
    require(filePath).default(client)
}

let usersDB = new JSONdb('databases/users.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.usersDB = usersDB

let nameHistoryDB = new JSONdb('databases/nameHistory.json', {
    syncOnWrite: true,
    asyncWrite: true,
})
client.nameHistoryDB = nameHistoryDB

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

    //check if dragon data is uploaded
    response = await fetch(process.env.DDRAGON_URL + '/cdn/' + currentVer + '/data/en_US/champions.json')
    if (!response.ok) {
        client.LOL_VERSION = json[0]

        if (prevVersion && prevVersion != currentVer) {
            l.log('New version found: ' + currentVer)
            //if yes, delete png files in cache folder and log
            let l2 = new Logger('Cache', 'blue')
            l2.start('Deleting cache...')
            let files = fs.readdirSync('./cache').filter((file) => file.endsWith('.png'))
            for (let file of files) {
                fs.unlinkSync('./cache/' + file)
            }
            l2.stop('Cache deleted')
        }
    } else {
        client.LOL_VERSION = json[1]
    }

    l.stop('Done.')

    //update version in an hour
    setTimeout(updateVersion, 60 * 60 * 1000)
}

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
                    let sharp = require('sharp')
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
        let imageNames = ['seriesWin.png', 'seriesLose.png', 'seriesEmpty.png']
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
