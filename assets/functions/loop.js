const { Client, Message } = require('discord.js')

class Loop {
    /**
     * @var {boolean} stopped
     */
    stopped = false
    /**
     * Number of dots
     * @var {int} dots
     */
    dots = 0

    /**
     *
     * @param {Client} client
     * @param {Message} message
     */
    constructor(message, msg) {
        let client = message.client
        this.client = client
        this.message = msg

        this.id = client.fc.generateRandomString(12)
        client.searchingStatus[this.id] = {
            scanned: 0,
            total: 0,
        }
        this.loop(this.message)
    }

    async loop() {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (this.stopped) return
        await this.message.edit(
            `Searching player${'.'.repeat(this.dots)} (${this.client.searchingStatus[this.id].scanned}/${
                this.client.searchingStatus[this.id].total
            })`
        )
        this.dots++
        if (this.dots > 3) this.dots = 1
        await this.loop(this.message)
    }

    stop() {
        this.stopped = true
    }
}

module.exports = Loop
