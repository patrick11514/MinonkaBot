export default interface Config {
    regions: Array<string>
    regionTranslates: {
        [region: string]: string
    }
    languageTranslates: {
        [language: string]: string
    }
    routes: {
        [region: string]: Array<string>
    }
    basicGamemodes: {
        [gamemode: string]: number
    }
    statuses: {
        [status: number]: string
    }
    emotes: {
        champions: Array<string>
        items: Array<string>
        mix: Array<string>
    }
}
