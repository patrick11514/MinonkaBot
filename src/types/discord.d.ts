import EventEmitter from 'events'

declare module 'discord.js' {
    export interface Client {
        emitter: EventEmitter
        LOL_VERSION: string
    }
}
