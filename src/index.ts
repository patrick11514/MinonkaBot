import Logger from '$/lib/logger'
import { env } from '$/types/env'
import { Awaitable } from '$/types/types'
import clc from 'cli-color'
import { Client, GatewayIntentBits, Partials } from 'discord.js'
import * as microjob from 'microjob'
import fs from 'node:fs'
import path from 'path'
import { DiscordEvent } from './hooks'
import { MemoryStorage } from './lib/memStorage'

//Intends
const intents: GatewayIntentBits[] = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
]

//Partials
const partials: Partials[] = [Partials.Message, Partials.User, Partials.Reaction]

//logger for main messages
const l = new Logger('DiscordBot', 'cyan')
l.start('Starting discord bot...')

//discord client
const client = new Client({
    intents,
    partials,
})
process.client = client
process.memory = new MemoryStorage()
microjob.start({
    maxWorkers: parseInt(env.THREADS),
})

//event handlers
const starts: (() => Awaitable<void>)[] = []
const events: DiscordEvent<any>[] = []

client.on('ready', () => {
    l.stop(`Logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`)

    starts.forEach((start) => {
        start()
    })
})

//load events from files
const files = fs
    .readdirSync(path.join(__dirname, 'functions'))
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))

files.forEach((file) => {
    const required = require(path.join(__dirname, 'functions', file))

    if (!('default' in required)) {
        l.error(`File ${file} is missing default export`)
        return
    }

    const exp: {
        events: DiscordEvent<any>[]
        start?: () => Awaitable<void>
    } = required.default

    const start = exp.start

    if (start !== undefined) {
        starts.push(start)
    }

    exp.events.forEach((ev) => {
        events.push(ev)
    })
})

let evs = 0
events.forEach((ev) => {
    const { event, callback } = ev.get()
    client.on(event, callback)
    evs++
})

l.log(`Registered ${clc.blue(evs)} events`)

//login
client.login(env.BOT_SECRET)
