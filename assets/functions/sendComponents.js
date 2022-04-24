const { MessageActionRow, MessageButton, Message } = require("discord.js")

class SendComponent {
    /**
     * @param {string} commandName
     * @param {string} color
     * @param {Message} message,
     * @param {CallableFunction} label
     */
    constructor(commandName, color, message, label) {
        this.commandName = commandName
        this.color = color
        this.labelFunction = label
        this.message = message
        this.config = message.client.config
    }

    /**
     * 
     * @param {Array} array 
     * @returns {Array[MessageActionRow]} array of MessageActionRow
     */
    async generate(array) {
        let rows = []

        for (let i = 0, j = array.length; i < j; i += 5) {
            let temp = array.slice(i, i + 5)
            let row = new MessageActionRow()
            temp.forEach((loop) => {
                let [name, region] = loop.split("@")
                row.addComponents(
                    new MessageButton()
                        .setCustomId(
                            `${this.commandName}@${name}@${region.toLowerCase()}@${this.message.channelId}@${this.message.id}`
                        )
                        .setLabel(this.labelFunction(name, region, this.config))
                        .setStyle(this.color)
                )
            })
            rows.push(row)
        }

        return rows
    }
}

module.exports = SendComponent