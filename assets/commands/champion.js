const { Message, MessageEmbed } = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    name: 'champion',
    subcommands: ['skin'],
    description: 'Show lol champion',
    arguments: ['name'],
    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        const emotes = require('./../emojis.json')

        if (args.length === 0) {
            return message.reply("Please enter name of champion.")
        }

        let champion = args.join(" ")
        let request = await fetch(`http://${process.env.API}/champion/${champion}`)
        let json = await request.json()
        if (json.error) {
            return message.reply(json.error)
        }

        champion = json

        let embed = new MessageEmbed()
            .setTitle(`${emotes[champion.id]} **${champion.name}** (${champion.tags.join(", ")})`)
            .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${champion.id}_0.jpg`)
            .setImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${champion.id}_0.jpg`)
            .setDescription(`**Lore:**\n${champion.lore}\n\n**Skins:**`)
            .setColor('BLUE')

        if (champion.skins.length > 1) {
            console.log("bb")
            let z = 0;
            let up = null
            let down = null

            for (let i = 0; i < champion.skins.length; i++) {
                if (i == 0) continue
                z++
                let skin = champion.skins[i]

                if (z == 1) {
                    up = skin.name
                } else {
                    down = skin.name
                    embed.addField(up, `**${down}**`)
                    z = 0
                    up = null
                    down = null
                }
            }
            if (up != null && down == null) {
                embed.addField(up, "\u200b")
            }
        } else {
            embed.addField("No skins found!", "\u200b")
        }
        message.reply({ embeds: [embed] })
    },
}
