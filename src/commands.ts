import { coopTitles, queues } from './components/queues'

const regions = [
    { name: 'EUNE', value: 'EUN1' },
    { name: 'EUW', value: 'EUW1' },
    { name: 'BR', value: 'BR1' },
    { name: 'JP', value: 'JP1' },
    { name: 'KR', value: 'KR' },
    { name: 'LAN', value: 'LA1' },
    { name: 'LAS', value: 'LA2' },
    { name: 'NA', value: 'NA1' },
    { name: 'OCE', value: 'OC1' },
    { name: 'TR', value: 'TR1' },
    { name: 'RU', value: 'RU' },
]

let commands: {
    [key: string]: {
        description: string
        mention?: boolean
        options: Array<{
            name: string
            type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'USER' | 'CHANNEL' | 'ROLE' | 'MENTIONABLE'
            description: string
            required: boolean
            choices?: Array<{
                name: string
                description?: string
                value?: string | number | boolean
            }>
        }>
    }
} = {
    profile: {
        description: 'Zobrazí tvůj league of legends profil',
        options: [
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
                choices: regions,
            },
            {
                name: 'mention',
                type: 'USER',
                description: 'Označ uživatele s propojeným účtem',
                required: false,
            },
        ],
    },
    language: {
        description: 'Změní jazyk riot API (později i bota)',
        options: [
            {
                name: 'language',
                type: 'STRING',
                description: 'Jazyk, na který chceš změnit bota',
                required: false,
                choices: [
                    { value: 'cs_CZ', name: 'Czech (Czech Republic)' },
                    { value: 'el_GR', name: 'Greek (Greece)' },
                    { value: 'pl_PL', name: 'Polish (Poland)' },
                    { value: 'ro_RO', name: 'Romanian (Romania)' },
                    { value: 'hu_HU', name: 'Hungarian (Hungary)' },
                    { value: 'en_GB', name: 'English (United Kingdom)' },
                    { value: 'de_DE', name: 'German (Germany)' },
                    { value: 'es_ES', name: 'Spanish (Spain)' },
                    { value: 'it_IT', name: 'Italian (Italy)' },
                    { value: 'fr_FR', name: 'French (France)' },
                    { value: 'ja_JP', name: 'Japanese (Japan)' },
                    { value: 'ko_KR', name: 'Korean (Korea)' },
                    { value: 'es_MX', name: 'Spanish (Mexico)' },
                    { value: 'es_AR', name: 'Spanish (Argentina)' },
                    { value: 'pt_BR', name: 'Portuguese (Brazil)' },
                    { value: 'en_US', name: 'English (United States)' },
                    { value: 'en_AU', name: 'English (Australia)' },
                    { value: 'ru_RU', name: 'Russian (Russia)' },
                    { value: 'tr_TR', name: 'Turkish (Turkey)' },
                    { value: 'ms_MY', name: 'Malay (Malaysia)' },
                    { value: 'en_PH', name: 'English (Republic of the Philippines)' },
                    { value: 'en_SG', name: 'English (Singapore)' },
                ],
            },
            {
                name: 'language2',
                type: 'STRING',
                description: 'Jazyk, na který chceš změnit bota',
                required: false,
                choices: [
                    { value: 'th_TH', name: 'Thai (Thailand)' },
                    { value: 'vn_VN', name: 'Vietnamese (Viet Nam)' },
                    { value: 'id_ID', name: 'Indonesian (Indonesia)' },
                    { value: 'zh_MY', name: 'Chinese (Malaysia)' },
                    { value: 'zh_CN', name: 'Chinese (China)' },
                    { value: 'zh_TW', name: 'Chinese (Taiwan)' },
                ],
            },
        ],
    },
    link: {
        description: 'Připojí tvůj discord účet k tvému league of legends účtu',
        options: [
            {
                name: 'action',
                type: 'STRING',
                description: 'Akce, kterou chceš provést',
                required: true,
                choices: [
                    {
                        name: 'list',
                        description: 'Zobrazí všechny tvé připojené účty',
                    },
                    {
                        name: 'add',
                        description: 'Připojí tvůj league of legends účet k tvému discord účtu',
                    },
                    {
                        name: 'delete',
                        description: 'Odpojí tvůj league of legends účet od tvého discord účtu',
                    },
                ],
            },
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
                choices: regions,
            },
        ],
    },
    rank: {
        description: 'Zobrazí tvůj league of legends rank',
        options: [
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
                choices: regions,
            },
            {
                name: 'mention',
                type: 'USER',
                description: 'Označ uživatele s propojeným účtem',
                required: false,
            },
        ],
    },
    namehistory: {
        description: 'Zobrazí historii tvého jména (historie se updatuje pouze po vykonanání nějakého příkazu)',
        options: [
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
                choices: regions,
            },
            {
                name: 'mention',
                type: 'USER',
                description: 'Označ uživatele s propojeným účtem',
                required: false,
            },
        ],
    },
    help: {
        description: 'Zobrazí seznam všech příkazů',
        options: [
            {
                name: 'command',
                type: 'STRING',
                description: 'Příkaz, který chceš zobrazit',
                required: false,
                choices: [],
            },
        ],
    },
    matchhistory: {
        description: 'Zobrazí historii až 6 tvých posledních zápasů',
        options: [
            {
                name: 'queue',
                type: 'STRING',
                description: 'Typ zápasu, který chceš zobrazit',
                required: false,
                choices: Object.entries(queues).map(([key, value]) => {
                    let kkey = parseInt(key)
                    if (kkey >= 830 && kkey <= 850) {
                        return { name: value + ' ' + coopTitles[(kkey - 830) / 10], value: key }
                    } else {
                        return { name: value, value: key }
                    }
                }),
            },
            {
                name: 'limit',
                type: 'STRING',
                description: 'Počet zápasů, které chceš zobrazit',
                required: false,
                choices: [
                    { name: '1', value: '1' },
                    { name: '2', value: '2' },
                    { name: '3', value: '3' },
                    { name: '4', value: '4' },
                    { name: '5', value: '5' },
                    { name: '6', value: '6' },
                ],
            },
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
                choices: regions,
            },
            {
                name: 'mention',
                type: 'USER',
                description: 'Označ uživatele s propojeným účtem',
                required: false,
            },
        ],
    },
    rotation: {
        description: 'Zobrazí aktuální champion rotaci',
        options: [
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém chceš zobrazit champion rotaci',
                required: false,
                choices: regions,
            },
        ],
    },
    liverank: {
        description: 'Vygeneruje odkaz na obrázek s tvým rankem, který se aktualizuje',
        options: [
            /*{
                name: 'queue',
                type: 'STRING',
                description: 'Typ zápasu, který chceš zobrazit',
                required: true,
                choices: [
                    { name: 'Solo/Duo', value: '420' },
                    { name: 'Flex 5v5', value: '440' },
                ],
            },*/
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
            },
            {
                name: 'mention',
                type: 'USER',
                description: 'Označ uživatele s propojeným účtem',
                required: false,
            },
        ],
    },
    clash: {
        description: 'Command, pro clashe v league of legends',
        options: [
            {
                name: 'action',
                type: 'STRING',
                description: 'Akce, kterou chceš provést',
                required: true,
                choices: [{ name: 'schedule', value: 'schedule' }],
            },
            {
                name: 'username',
                type: 'STRING',
                description: 'Jméno vyvolávače',
                required: false,
            },
            {
                name: 'region',
                type: 'STRING',
                description: 'Region, na kterém je tvůj účet vytvořen. (Zrychlí vyhledání účtu)',
                required: false,
            },
            {
                name: 'mention',
                type: 'USER',
                description: 'Označ uživatele s propojeným účtem',
                required: false,
            },
        ],
    },
}

commands.help.options[0].choices = Object.keys(commands).map((command: string) => {
    return {
        name: command,
        description: commands[command].description,
    }
})

export default commands
