export interface Challenge {
    id: number
    name: string
    description: string
    shortDescription: string
    hasLeaderboard: boolean
    thresholds: {
        [key in
            | 'IRON'
            | 'BRONZE'
            | 'SILVER'
            | 'GOLD'
            | 'PLATINUM'
            | 'DIAMOND'
            | 'MASTER'
            | 'GRANDMASTER'
            | 'CHALLENGER']: {
            value: number
            rewards?: Array<{
                category: 'TITLE'
                quantity: number
                title: string
            }>
        }
    }
}

export interface UserChallenges {
    totalPoints: {
        level: string
        current: number
        max: number
        percentile: number
    }
    categoryPoints: {
        [name: string]: {
            level: string
            current: number
            max: number
            percentile: number
        }
    }
    challenges: Array<{
        challengeId: number
        percentile: number
        level: string
        value: number
        achievedTime: number
    }>
    preferences: {
        bannerAccent: string
        title: string
        challengeIds: Array<number>
    }
}

export type EncryptedSummonerId = string
export type EncryptedAccountId = string
export type EncryptedPuuid = string

export interface SummonerBy {
    id: EncryptedSummonerId
    accountId: EncryptedAccountId
    puuid: EncryptedPuuid
    name: string
    profileIconId: number
    revisionDate: number
    summonerLevel: number
}

export enum QueueTypes {
    RANKED_SOLO = 'RANKED_SOLO_5x5',
    RANKED_FLEX = 'RANKED_FLEX_SR',
}

export enum Tiers {
    Iron = 'IRON',
    Bronze = 'BRONZE',
    Silver = 'SILVER',
    Gold = 'GOLD',
    Platinum = 'PLATINUM',
    Diamond = 'DIAMOND',
    Master = 'MASTER',
    Grandmaster = 'GRANDMASTER',
    Challenger = 'CHALLENGER',
}

export type lowerTier =
    | 'Iron'
    | 'Bronze'
    | 'Silver'
    | 'Gold'
    | 'Platinum'
    | 'Diamond'
    | 'Master'
    | 'Grandmaster'
    | 'Challenger'

export enum Ranks {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
}

export enum RankColors {
    Iron = '#99978b',
    Bronze = '#966502',
    Silver = '#99978b',
    Gold = '#e6c41c',
    Platinum = '#49ebaa',
    Diamond = '#5149eb',
    Master = '#8117b3',
    Grandmaster = '#9e0606',
    Challenger = '#e5f051',
}

export interface RankedData {
    leagueId: string
    queueType: QueueTypes
    tier: Tiers
    rank: Ranks
    summonerId: EncryptedSummonerId
    summonerName: string
    leaguePoints: number
    wins: number
    losses: number
    veteran: boolean
    inactive: boolean
    freshBlood: boolean
    hotStreak: boolean
    miniSeries?: {
        target: number
        wins: number
        losses: number
        progress: string
    }
}

interface JSONRiotFiles {
    name: string
    format: string
    version: string
}

export interface championData {
    version: string
    id: string
    key: string
    name: string
    title: string
    blurb: string
    info: {
        attack: number
        defense: number
        magic: number
        difficulty: number
    }
    image: {
        full: string
        sprite: string
        group: string
        x: number
        y: number
        w: number
        h: number
    }
    tags: Array<string>
    partype: string
    stats: {
        hp: number
        hpperlevel: number
        mp: number
        mpperlevel: number
        movespeed: number
        armor: number
        armorperlevel: number
        spellblock: number
        spellblockperlevel: number
        attackrange: number
        hpregen: number
        hpregenperlevel: number
        mpregen: number
        mpregenperlevel: number
        crit: number
        critperlevel: number
        attackdamage: number
        attackdamageperlevel: number
        attackspeedperlevel: number
        attackspeed: number
    }
}
export interface championsData extends JSONRiotFiles {
    data: {
        [key: string]: championData
    }
}

export interface itemData {
    name: string
    description: string
    colloq: string
    plaintext: string
    into: Array<string>
    inStore?: boolean
    image: {
        full: string
        sprite: string
        group: string
        x: number
        y: number
        w: number
        h: number
    }
    gold: {
        base: number
        purchasable: boolean
        total: number
        sell: number
    }
    tags: Array<string>
    maps: {
        [key: string]: boolean
    }
    stats: {}
}

export interface itemsData extends JSONRiotFiles {
    data: {
        [key: number]: itemData
    }
}

export interface errorResponse {
    status: {
        message: string
        status_code: number
    }
}

export interface matchChallenges {
    '12AssistStreakCount': number
    abilityUses: number
    acesBefore15Minutes: number
    alliedJungleMonsterKills: number
    baronTakedowns: number
    blastConeOppositeOpponentCount: number
    bountyGold: number
    buffsStolen: number
    completeSupportQuestInTime: number
    controlWardsPlaced: number
    damagePerMinute: number
    damageTakenOnTeamPercentage: number
    dancedWithRiftHerald: number
    deathsByEnemyChamps: number
    dodgeSkillShotsSmallWindow: number
    doubleAces: number
    dragonTakedowns: number
    earlyLaningPhaseGoldExpAdvantage: number
    effectiveHealAndShielding: number
    elderDragonKillsWithOpposingSoul: number
    elderDragonMultikills: number
    enemyChampionImmobilizations: number
    enemyJungleMonsterKills: number
    epicMonsterKillsNearEnemyJungler: number
    epicMonsterKillsWithin30SecondsOfSpawn: number
    epicMonsterSteals: number
    epicMonsterStolenWithoutSmite: number
    flawlessAces: number
    fullTeamTakedown: number
    gameLength: number
    getTakedownsInAllLanesEarlyJungleAsLaner: number
    goldPerMinute: number
    hadOpenNexus: number
    immobilizeAndKillWithAlly: number
    initialBuffCount: number
    initialCrabCount: number
    jungleCsBefore10Minutes: number
    junglerTakedownsNearDamagedEpicMonster: number
    kTurretsDestroyedBeforePlatesFall: number
    kda: number
    killAfterHiddenWithAlly: number
    killParticipation: number
    killedChampTookFullTeamDamageSurvived: number
    killsNearEnemyTurret: number
    killsOnOtherLanesEarlyJungleAsLaner: number
    killsOnRecentlyHealedByAramPack: number
    killsUnderOwnTurret: number
    killsWithHelpFromEpicMonster: number
    knockEnemyIntoTeamAndKill: number
    landSkillShotsEarlyGame: number
    laneMinionsFirst10Minutes: number
    laningPhaseGoldExpAdvantage: number
    legendaryCount: number
    lostAnInhibitor: number
    maxCsAdvantageOnLaneOpponent: number
    maxKillDeficit: number
    maxLevelLeadLaneOpponent: number
    moreEnemyJungleThanOpponent: number
    mejaisFullStackInTime?: number
    multiKillOneSpell: number
    multiTurretRiftHeraldCount: number
    multikills: number
    multikillsAfterAggressiveFlash: number
    mythicItemUsed: number
    outerTurretExecutesBefore10Minutes: number
    outnumberedKills: number
    outnumberedNexusKill: number
    perfectDragonSoulsTaken: number
    perfectGame: number
    pickKillWithAlly: number
    playedChampSelectPosition: number
    poroExplosions: number
    quickCleanse: number
    quickFirstTurret: number
    quickSoloKills: number
    riftHeraldTakedowns: number
    saveAllyFromDeath: number
    scuttleCrabKills: number
    skillshotsDodged: number
    skillshotsHit: number
    snowballsHit: number
    soloBaronKills: number
    soloKills: number
    stealthWardsPlaced: number
    survivedSingleDigitHpCount: number
    survivedThreeImmobilizesInFight: number
    takedownOnFirstTurret: number
    takedowns: number
    takedownsAfterGainingLevelAdvantage: number
    takedownsBeforeJungleMinionSpawn: number
    takedownsFirstXMinutes: number
    takedownsInAlcove: number
    takedownsInEnemyFountain: number
    teamBaronKills: number
    teamDamagePercentage: number
    teamElderDragonKills: number
    teamRiftHeraldKills: number
    threeWardsOneSweeperCount: number
    tookLargeDamageSurvived: number
    turretPlatesTaken: number
    turretTakedowns: number
    turretsTakenWithRiftHerald: number
    twentyMinionsIn3SecondsCount: number
    unseenRecalls: number
    visionScoreAdvantageLaneOpponent: number
    visionScorePerMinute: number
    wardTakedowns: number
    wardTakedownsBefore20M: number
    wardsGuarded: number
}

export interface participant {
    assists: number
    baronKills: number
    basicPings: number
    bountyLevel: number
    challenges: matchChallenges
    champExperience: number
    champLevel: number
    championId: number
    championName: string
    championTransform: number
    consumablesPurchased: number
    damageDealtToBuildings: number
    damageDealtToObjectives: number
    damageDealtToTurrets: number
    damageSelfMitigated: number
    deaths: number
    detectorWardsPlaced: number
    doubleKills: number
    dragonKills: number
    eligibleForProgression: boolean
    firstBloodAssist: boolean
    firstBloodKill: boolean
    firstTowerAssist: boolean
    firstTowerKill: boolean
    gameEndedInEarlySurrender: boolean
    gameEndedInSurrender: boolean
    goldEarned: number
    goldSpent: number
    individualPosition: string
    inhibitorKills: number
    inhibitorTakedowns: number
    inhibitorsLost: number
    item0: number
    item1: number
    item2: number
    item3: number
    item4: number
    item5: number
    item6: number
    itemsPurchased: number
    killingSprees: number
    kills: number
    lane: string
    largestCriticalStrike: number
    largestKillingSpree: number
    largestMultiKill: number
    longestTimeSpentLiving: number
    magicDamageDealt: number
    magicDamageDealtToChampions: number
    magicDamageTaken: number
    neutralMinionsKilled: number
    nexusKills: number
    nexusLost: number
    nexusTakedowns: number
    objectivesStolen: number
    objectivesStolenAssists: number
    participantId: number
    pentaKills: number
    perks: {
        statPerks: {
            defense: number
            flex: number
            offense: number
        }
        styles: Array<{
            description: string
            selections: Array<{
                perk: number
                var1: number
                var2: number
                var3: number
            }>

            style: number
        }>
    }
    physicalDamageDealt: number
    physicalDamageDealtToChampions: number
    physicalDamageTaken: number
    profileIcon: number
    puuid: EncryptedPuuid
    quadraKills: number
    riotIdName: string
    riotIdTagline: string
    role: string
    sightWardsBoughtInGame: number
    spell1Casts: number
    spell2Casts: number
    spell3Casts: number
    spell4Casts: number
    summoner1Casts: number
    summoner1Id: number
    summoner2Casts: number
    summoner2Id: number
    summonerId: EncryptedSummonerId
    summonerLevel: number
    summonerName: string
    teamEarlySurrendered: false
    teamId: number
    teamPosition: string
    timeCCingOthers: number
    timePlayed: number
    totalDamageDealt: number
    totalDamageDealtToChampions: number
    totalDamageShieldedOnTeammates: number
    totalDamageTaken: number
    totalHeal: number
    totalHealsOnTeammates: number
    totalMinionsKilled: number
    totalTimeCCDealt: number
    totalTimeSpentDead: number
    totalUnitsHealed: number
    tripleKills: number
    trueDamageDealt: number
    trueDamageDealtToChampions: number
    trueDamageTaken: number
    turretKills: number
    turretTakedowns: number
    turretsLost: number
    unrealKills: number
    visionScore: number
    visionWardsBoughtInGame: number
    wardsKilled: number
    wardsPlaced: number
    win: boolean
}

export interface teamMember {
    id: number
    champion: number
    summoner: string
    role: string
    summoners: number[]
    items: number[]
    kills: number
    asists: number
    deaths: number
    vision: number
    level: number
    perks: {
        statPerks: {
            defense: number
            flex: number
            offense: number
        }
        styles: Array<{
            description: string
            selections: Array<{
                perk: number
                var1: number
                var2: number
                var3: number
            }>

            style: number
        }>
    }
}

export interface match {
    metadata: {
        dataVersion: string
        matchId: string
        participants: Array<EncryptedPuuid>
    }
    info: {
        gameCreation: number
        gameDuration: number
        gameStartTimestamp: number
        gameEndTimestamp: number
        gameId: number
        gameMode: string
        gameName: string
        gameType: string
        gameVersion: string
        mapId: number
        participants: Array<participant>

        platformId: string
        queueId: queues
        teams: Array<{
            bans: Array<{
                championId: number
                pickTurn: number
            }>
            objectives: {
                baron: {
                    first: boolean
                    kills: number
                }
                champion: {
                    first: boolean
                    kills: number
                }
                dragon: {
                    first: boolean
                    kills: number
                }
                inhibitor: {
                    first: boolean
                    kills: number
                }
                riftHerald: {
                    first: boolean
                    kills: number
                }
                tower: {
                    first: boolean
                    kills: number
                }
            }
            teamId: number
            win: boolean
        }>
        tournamentCode: string
    }
}

export enum queues {
    'Custom' = 0,
    'Draft Pick' = 400,
    'Blind Pick' = 430,
    'Solo/Duo' = 420,
    'Flex' = 440,
    'ARAM' = 450,
    'Clash' = 700,
    'ARAM Clash' = 720,
    'Co-op vs AI Intro' = 830,
    'Co-op vs AI Beginner' = 840,
    'Co-op vs AI Intermediate' = 850,
    'URF' = 900,
    'One for All' = 1020,
    'Snow ARAM' = 1300,
    'Nexus Blitz' = 1400,
}

export interface summoners extends JSONRiotFiles {
    data: {
        [key: string]: {
            id: string
            name: string
            description: string
            tooltip: string
            maxrank: number
            cooldown: Array<number>
            cooldownBurn: string
            cost: Array<number>
            costBurn: string
            datavalues: {}
            effect: Array<Array<number> | null>
            effectBurn: Array<string | null>
            key: string
            summonerLevel: number
            modes: Array<string>
            costType: string
            maxammo: string
            range: Array<number>
            rangeBurn: string
            image: {
                full: string
                sprite: string
                group: string
                x: number
                y: number
                w: number
                h: number
            }
            resource: string
        }
    }
}

export interface runeData {
    id: number
    key: string
    icon: string
    name: string
    slots: {
        runes: {
            id: number
            key: string
            icon: string
            name: string
            shortDesc: string
            longDesc: string
        }[]
    }[]
}
