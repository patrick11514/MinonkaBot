import { FakeInteraction, FakeInteractionArg } from '$types/types'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    MessageInteraction,
} from 'discord.js'
import { link } from '../commands/link'
import { matchHistory } from '../commands/matchHistory'
import { nameHistory } from '../commands/nameHistory'
import { generateProfile } from '../commands/profile'
import { generateRank } from '../commands/rank'

class accountPicker {
    accounts: Array<{
        name: string
        region: string
        level: number
    }> = []

    id: string = ''
    rows: Array<ActionRowBuilder<ButtonBuilder>> = []
    interaction: ChatInputCommandInteraction | ButtonInteraction | FakeInteraction =
        null as unknown as ChatInputCommandInteraction
    message: string = ''
    edit: boolean = false

    constructor(
        accounts: Array<{
            name: string
            region: string
            level: number
        }>,
        interaction: ChatInputCommandInteraction | ButtonInteraction | FakeInteraction,
        edit = false,
        message = 'Zde je seznam nalezených účtů:'
    ) {
        this.accounts = accounts

        this.id = process.env.KEY

        this.interaction = interaction
        this.message = message
        this.edit = edit
        return this
    }

    bindFunction(name: string, args?: object | string) {
        //generate buttons
        let accs = []
        let rows = []

        let accounts = this.accounts

        //divide accounts to arrays by five
        while (accounts.length > 0) {
            accs.push(accounts.slice(0, 5))
            accounts = accounts.slice(5)
        }

        for (let accList of accs) {
            let row = new ActionRowBuilder<ButtonBuilder>()

            for (let account of accList) {
                let id = `${this.id}@${account.name}:${account.region}@${name}`

                if (args) {
                    id += `@${typeof args == 'object' ? JSON.stringify(args) : args}`
                }

                row.addComponents(
                    new ButtonBuilder()
                        .setLabel(
                            `${account.name} (${process.client.config.regionTranslates[account.region]}) ${
                                account.level > -1 ? `- ${account.level}` : ''
                            }`
                        )
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId(id)
                )
            }
            rows.push(row)
        }

        this.rows = rows

        return this
    }

    static initHandler() {
        process.client.emitter.on(`button`, async (interaction: ButtonInteraction) => {
            let idData = interaction.customId.split('@')
            if (idData.length < 3) return
            let id = idData[0]
            let acc = idData[1]
            let fnc = idData[2]
            let args = null

            if (idData.length == 4) {
                let arg = idData[3]

                try {
                    args = JSON.parse(arg)
                } catch (e) {
                    args = arg
                }
            }

            if (id != process.env.KEY) return

            let accountParts = acc.split(':')
            let account = {
                name: accountParts[0],
                region: accountParts[1],
            }

            await interaction.reply({ content: 'Účet vybrán, nyní provádíme další akce...', ephemeral: true })

            const rawInteraction = interaction.message.interaction as MessageInteraction
            const message = interaction.message

            const inter: FakeInteraction = {
                editReply: (content: FakeInteractionArg) => {
                    return message.edit(content)
                },
                reply: (content: FakeInteractionArg) => {
                    return message.reply(content)
                },
                client: {
                    usersDB: process.client.usersDB,
                    nameHistoryDB: process.client.nameHistoryDB,
                    commandsDB: process.client.commandsDB,
                    config: process.client.config,
                    LPDB: process.client.LPDB,
                },
                user: {
                    id: rawInteraction.user.id,
                    name: rawInteraction.user.username,
                },
                fake: true,
            }

            //remove buttons
            await interaction.message.edit({ content: 'Načítání...', components: [] })

            switch (fnc) {
                case 'profile': {
                    generateProfile(account.name, account.region, null, inter)
                    break
                }
                case 'link': {
                    link(args, account.name, account.region, inter)
                    break
                }
                case 'rank': {
                    generateRank(account.name, account.region, null, inter)
                    break
                }
                case 'nameHistory': {
                    nameHistory(account.name, account.region, null, inter)
                    break
                }
                case 'matchHistory': {
                    let argum = args as {
                        queue: string | null
                        limit: string | null
                    }
                    matchHistory(account.name, account.region, null, inter, argum.queue, argum.limit)
                }
            }
        })
    }

    send() {
        if (this.edit) {
            this.interaction.editReply({ content: `${this.message}`, components: this.rows })
        } else {
            if ((this.interaction as FakeInteraction).fake) {
                ;(this.interaction as FakeInteraction).reply({ content: `${this.message}`, components: this.rows })
            } else {
                ;(this.interaction as ChatInputCommandInteraction<CacheType> | ButtonInteraction<CacheType>).reply({
                    content: `${this.message}`,
                    components: this.rows,
                })
            }
        }
    }
}

export default accountPicker
