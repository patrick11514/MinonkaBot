export default interface Config {
    regions: Array<string>
    regionTranslates: {
        [region: string]: string
    }
    languageTranslates: {
        [language: string]: string
    }
}
