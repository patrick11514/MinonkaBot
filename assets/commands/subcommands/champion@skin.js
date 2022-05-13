const { Message, MessageEmbed } = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    mainCommand: 'champion',
    name: 'skin',
    arguments: ['skin_name'],
    description: 'Show lol champion skin',
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        const emotes = require('./../../emojis.json')

        if (args.length === 0) {
            return message.reply("Please enter name of skin.")
        }

        let skin = args.join(" ")

        let response = await fetch(`http://${process.env.API}/skin/${skin}`)
        let json = await response.json()
        if (json.error) {
            return message.reply(json.error)
        }

        skin = json

        let embed = new MessageEmbed()
            .setTitle(`${emotes[skin.champ]} **${skin.name}**`)
            .setThumbnail(`https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${skin.champ}_${skin.id}.jpg`)
            .setImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${skin.champ}_${skin.id}.jpg`)
            .setDescription(`**Skin for champion ${skin.champ}**
            To show all champion skins use \`?champion ${skin.champ}\`

            **Champion images:**
            [Centered Banner](https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${skin.champ}_${skin.id}.jpg)
            [Banner](https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${skin.champ}_${skin.id}.jpg)
            [Loading Screen](https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${skin.champ}_${skin.id}.jpg)
            [Tile](https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${skin.champ}_${skin.id}.jpg)

            *To make better images you can use <http://waifu2x.udp.jp/>*
            `)

        message.reply({ embeds: [embed] })
    },
}
