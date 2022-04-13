const { Message } = require('discord.js')

module.exports = {
    mainCommand: 'config',
    name: 'reload',
    arguments: [],
    description: 'Reload config',
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: function (message, args) {
        //try to load config
        try {
            //path to config
            let path = `${message.client.wf}/config.js`
            //delete config from cache
            delete require.cache[require.resolve(path)]
            //require config
            let config = require(path)
            //and save it to global scope
            message.client.config = config
            //reply with success message
            message.reply('Config reloaded.')
        } catch (e) {
            //reply with error message
            message.reply(e.message)
        }
    },
}
