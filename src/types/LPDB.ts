interface user {
    puuid: string
    region: string
    lp: Array<{
        queue: string
        lp: number
    }>
    lastUpdate: number
    matches: Array<{
        [matchId: string]: number | string
    }>
}

export default user
