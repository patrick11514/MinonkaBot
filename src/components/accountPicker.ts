import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    CommandInteraction,
} from 'discord.js'
import crypto from 'crypto'
import { generateProfile } from '../commands/profile'
import { link } from '../commands/link'
import { generateRank } from '../commands/rank'
import { nameHistory } from '../commands/nameHistory'
//import { matchHistory } from '../commands/matchHistory'

class accountPicker {
    accounts: Array<{
        name: string
        region: string
        level: number
    }> = []

    id: string = ''
    rows: Array<ActionRowBuilder<ButtonBuilder>> = []
    interaction: ChatInputCommandInteraction | ButtonInteraction = null as unknown as ChatInputCommandInteraction
    message: string = ''
    edit: boolean = false

    constructor(
        accounts: Array<{
            name: string
            region: string
            level: number
        }>,
        interaction: ChatInputCommandInteraction | ButtonInteraction,
        edit = false,
        message = 'Zde je seznam nalezených účtů:'
    ) {
        //generate buttons
        let rows = []
        let accs = []

        this.accounts = accounts

        //divide accounts to arrays by five
        while (accounts.length > 0) {
            accs.push(accounts.slice(0, 5))
            accounts = accounts.slice(5)
        }

        let key = crypto.randomBytes(4).toString('hex')
        this.id = key

        let acc = 0
        for (let accList of accs) {
            let row = new ActionRowBuilder<ButtonBuilder>()

            for (let account of accList) {
                row.addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            `${account.name} (${process.client.config.regionTranslates[account.region]}) ${
                                account.level > -1 ? `- ${account.level}` : ''
                            }`
                        )
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId(key + '@' + acc)
                )
                acc++
            }
            rows.push(row)
        }

        this.rows = rows
        this.interaction = interaction
        this.message = message
        this.edit = edit
        return this
    }

    bindFunction(name: string, args?: any) {
        process.client.emitter.on('button', async (interaction: ButtonInteraction) => {
            let idData = interaction.customId.split('@')
            if (idData.length != 2) return
            let id = idData[0]
            let acc = idData[1]
            if (id != this.id) return
            let account = this.accounts[parseInt(acc)]

            await interaction.reply({ content: 'Účet vybrán, nyní provádíme další akce...', ephemeral: true })
            await this.interaction.editReply({ content: 'Načítání...', components: [] })

            switch (name) {
                case 'profile': {
                    generateProfile(account.name, account.region, null, this.interaction)
                    break
                }
                case 'link': {
                    link(args, account.name, account.region, this.interaction)
                    break
                }
                case 'rank': {
                    generateRank(account.name, account.region, null, this.interaction)
                    break
                }
                case 'nameHistory': {
                    nameHistory(account.name, account.region, null, this.interaction)
                    break
                }
                /*               case 'matchHistory': {
                    let argum = args as {
                        queue: string | null
                        limit: string | null
                    }
                    matchHistory(account.name, account.region, this.interaction, argum.queue, argum.limit)
                }*/
            }
        })
        return this
    }
    send() {
        if (this.edit) {
            this.interaction.editReply({ content: `${this.message}`, components: this.rows })
        } else {
            this.interaction.reply({ content: `${this.message}`, components: this.rows })
        }
    }
}

export default accountPicker
