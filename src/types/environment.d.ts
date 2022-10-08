declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_ID: string
            DISCORD_TOKEN: string
            RIOT_TOKEN: string
            DDRAGON_URL: string
            REGIONS: string
        }
    }
}
export {}
