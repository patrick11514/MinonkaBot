const { MessageEmbed, Message } = require('discord.js')

module.exports = {
    name: 'info',
    subcommands: [],
    description: 'Show info about bot',
    arguments: [],

    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        let embed = new MessageEmbed()
            .setAuthor({ name: "Miňonka", iconURL: "https://proxy.patrick115.eu/minonka/profile.png" })
            .setColor("RED")
            .setTitle("Miňonka")
            .setDescription(`Miňonka is bot in **Alpha** stage.
        This bot can be used to show informations about your League of Legends profile, champions and items.
        
        Bot is developed by [patrick115](https://patrick115.eu) (ᴘᴀᴛʀɪᴋ.#0001)
        
        [GitHub](https://github.com/patrick11514/MinonkaBot)
        [Discord](https://discord.gg/6qFJgGB)
        `)

            .setTimestamp()
            .setFooter({ text: "ᴘᴀᴛʀɪᴋ.#0001", iconURL: "https://proxy.patrick115.eu/minonka/patrik.png" })

        message.reply({ embeds: [embed] })
    },
}
