//Discord js stuff
const Discord = require('discord.js')
const Client = Discord.Client
const Intents = Discord.Intents

//Permissions
const permissions = new Intents()
permissions.add(Intents.FLAGS.GUILDS) //Guilds
permissions.add(Intents.FLAGS.GUILD_MESSAGES) //Get guild messages
permissions.add(Intents.FLAGS.GUILD_MEMBERS) //Get guild memebers
permissions.add(Intents.FLAGS.DIRECT_MESSAGES) //Get direct messages

//Creating bot
const client = new Client({ intents: permissions, partials: ['MESSAGE', 'CHANNEL'] })
client.cache = {}

//Enviroment variables
const env = require('dotenv')
env.config()

//Config
const config = require('./config.js')

//Load commands
const fs = require('fs')
const commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./assets/commands').filter((file) => file.endsWith('.js'))
const subcommandFiles = fs.readdirSync(`./assets/commands/subcommands`).filter((file) => file.endsWith('.js'))

//fetch
const fetch = require('node-fetch')

//db
const JSONdb = require("simple-json-db")
const db = new JSONdb("./assets/db/userProfiles.json", {
    asyncWrite: true,
    syncOnWrite: true
})

let loaded_commands = []
let notloaded_commands = []
let loaded_subcommands = []
loaded_subcommands.len = 0
let notloaded_subcommands = []

for (const file of commandFiles) {
    if (file.startsWith('#')) continue
    let command = require(`./assets/commands/${file}`)
    if (!command.name) {
        notloaded_commands.push(file.replace('.js', ''))
        continue
    }

    loaded_commands.push(command.name)
    commands.set(command.name, command)

    if (command.setup) {
        command.setup(client)
    }

    if (!command.subcommands.length) continue
    commands.get(command.name).subcommandsExec = new Discord.Collection()
    for (const subcommandFile of subcommandFiles) {
        if (subcommandFile.startsWith('#')) continue
        if (!subcommandFile.includes(command.name + '@')) continue
        let subcommand = require(`./assets/commands/subcommands/${subcommandFile}`)
        if (!subcommand.name) {
            if (!notloaded_subcommands[command.name]) notloaded_subcommands[command.name] = []
            notloaded_subcommands[command.name].push(subcommandFile.replace('.js', ''))
            continue
        }
        if (!loaded_subcommands[command.name]) loaded_subcommands[command.name] = []
        loaded_subcommands[command.name].push(subcommand.name)
        loaded_subcommands.len++
        commands.get(command.name).subcommandsExec.set(subcommand.name, subcommand)

        if (subcommand.setup) {
            subcommand.setup(client)
        }
    }
}

if (notloaded_commands.length) {
    console.log('❌ Failed to load ' + notloaded_commands.length + ' commands:')
    notloaded_commands.forEach((command) => {
        console.log(`- ${command}`)
    })
    console.log('')
}

//Sharing variables to global scope
client.commands = commands
client.config = config
client.wf = __dirname
client.fc = require('./assets/glob.js')
client.searchingStatus = {}
client.db = db;

(async function () {
    client.champions = await fetch(`http://${process.env.API}/champions`).then((res) => res.json())
})()

//set variables in modules
client.fc.config = client.config

if (loaded_commands.length) {
    console.log(
        '✔️  Sucessfully loaded ' +
        loaded_commands.length +
        ' commands with ' +
        loaded_subcommands.len +
        ' subcommands:'
    )

    loaded_commands.forEach((command) => {
        console.log(`- ${command}`)
        if (loaded_subcommands[command]?.length) {
            loaded_subcommands[command].forEach((subcommand) => {
                console.log(` - ✔️  ${subcommand}`)
            })
        }
        if (notloaded_subcommands[command]?.length) {
            notloaded_subcommands[command].forEach((subcommand) => {
                console.log(` - ❌  ${subcommand}`)
            })
        }
    })
}

client.on('ready', () => {
    console.log(`✔️  Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (message.author.id == client.config.author) message.author.owner = true
    if (!message.content.startsWith(client.config.prefix)) return
    let args = message.content.slice(client.config.prefix.length).trim().split(' ')
    let command = args.shift().toLowerCase()
    if (!command) return

    if (!commands.has(command)) {
        return
    }

    try {
        let command_to_execute = commands.get(command)

        if (args.length >= 1 && command_to_execute.subcommands.includes(args[0])) {
            let subcommand = args.shift()
            command_to_execute = command_to_execute.subcommandsExec.get(subcommand)
        }

        if (command_to_execute.admin && !message.author?.owner) {
            throw new Error('You are not allowed to use this command.')
        }

        command_to_execute.execute(message, args)
    } catch (e) {
        //console.log(e)
        message.reply(e.message)
    }
})

client.login(process.env.token)
