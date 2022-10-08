import EventEmitter from 'events'
import Config from './config'

declare module 'discord.js' {
    export interface Client {
        emitter: EventEmitter
        LOL_VERSION: string
        config: Config
    }
}
