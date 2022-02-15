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
const client = new Client({ intents: permissions })

//Enviroment variables
const env = require('dotenv')
env.config()

//Config
const config = require('./config.json')

//Load commands
const fs = require('fs')
const commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./assets/commands').filter((file) => file.endsWith('.js'))

let loaded_commands = []
let unloaded_commands = []

for (const file of commandFiles) {
    let command = require(`./assets/commands/${file}`)
    if (!command.name) {
        loaded_commands.push(file.replace('.js', ''))
    } else {
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', async (message) => {
    console.log(message)
})

client.login(process.env.token)
