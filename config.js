module.exports = {
    author: '620266881227423745',
    prefix: '?',
    default_region: 'EUN1',
    regions: ['EUN1', 'BR1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU'],
    regions_readable: {
        EUNE: 'EUN1',
        BR: 'BR1',
        EUW: 'EUW1',
        JP: 'JP1',
        KR: 'KR',
        LA1: 'LA1',
        LA2: 'LA2',
        NA: 'NA1',
        OC: 'OC1',
        TR: 'TR1',
        RU: 'RU',
    },
    endpoints: {
        'summoner/by-name': 'summoner/v4/summoners/by-name',
        'league/by-id': 'league/v4/entries/by-summoner',
        rotation: 'platform/v3/champion-rotations',
        "mastery/by-id": "champion-mastery/v4/champion-masteries/by-summoner",
    },
    lanes: {
        TOP: 'Top',
        MIDDLE: 'Mid',
        BOTTOM: 'AD Carry',
        UTILITY: 'Support',
        JUNGLE: 'Jungle',
        UNSELECTED: 'None',
        FILL: 'Fill',
    },
    roles: {
        CAPTAIN: 'Kapitán',
        MEMBER: 'Člen',
    },
    rank_values: {
        IRON: 1,
        BRONZE: 2,
        SILVER: 3,
        GOLD: 4,
        PLATINUM: 5,
        DIAMOND: 6,
        MASTER: 7,
        GRANDMASTER: 8,
        CHALLENGER: 9,
    },
    rank_tiers: {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
    },
    queues: {
        RANKED_FLEX_SR: 'flex',
        RANKED_SOLO_5x5: 'solo',
    },
}
