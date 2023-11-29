import { MemoryStorage } from '$lib/memStorage'
import { Client } from 'discord.js'
import { db } from './connection'

type languages = 'cs' | 'en'

declare global {
    namespace NodeJS {
        interface Process {
            client: Client
            database: typeof db
            memory: MemoryStorage<string, string>
            LOL_VERSION: string
        }
    }
}
export {}
