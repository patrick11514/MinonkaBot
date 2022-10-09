//imports
import { ActivityType, Client, GatewayIntentBits, Interaction } from 'discord.js'
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
    //pick random status
    let option = Math.floor(Math.random() * status.length)

    client.user?.setActivity(status[option].text, {
        type: status[option].status,
    })
    //chanmge status in 5 minutes
    setTimeout(changeStatus, 5 * 60 * 1000)
}

//update version
async function updateVersion() {
    let response = await fetch(process.env.DDRAGON_URL + '/api/versions.json')
    let json = await response.json()

    let currentVer = json[0]

    //check if dragon data is uploaded
    response = await fetch(process.env.DDRAGON_URL + '/cdn/' + currentVer + '/data/en_US/champions.json')
    if (!response.ok) {
        client.LOL_VERSION = json[0]
    } else {
        client.LOL_VERSION = json[1]
    }

    //update version in an hour
    setTimeout(updateVersion, 60 * 60 * 1000)
}

//start tasks
async function tasks() {
    let l = new Logger('Clear TEMP', 'red')
    l.start('Clearing temp folder...')
    let files = fs.readdirSync('./temp')
    files.forEach((f) => {
        l.log(`Deleting ${f}...`)
        fs.unlinkSync(`./temp/${f}`)
    })
    l.stop('Done')
}
tasks()

client.on('ready', () => {
    l.log(`Logged as ${client.user?.tag}`)
    changeStatus()
    updateVersion()
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isCommand()) {
        try {
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