interface user {
    puuid: string
    region: string
    lp: Array<{
        queue: string
        rank: string
        tier: string
        lp: number
        url?: string
    }>
    lastUpdate: number
    matches: Array<{
        [matchId: string]: number | string
    }>
}

export default user
