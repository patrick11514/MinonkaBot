import fetch from 'node-fetch'
import fs from 'fs'

function fixNames(name: string) {
    return name.replaceAll("'", '').replaceAll('.', '').replaceAll('&', 'and')
}

//get all champions and create enum
;(async () => {
    let request = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')

    let json = await request.json()

    let version = json[0]

    request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
    json = await request.json()

    let champions = json.data

    //create champ types
    let enumString = 'enum Champions {\n'

    for (let champion in champions) {
        enumString += `    ${fixNames(champion)} = "${champion}",\n`
    }

    enumString += '}'

    //create champ names
    enumString += '\n\nenum ChampionNames {\n'

    for (let champion in champions) {
        enumString += `    ${fixNames(champion)} = "${champions[champion].name}",\n`
    }

    enumString += '}\n\nexport { Champions, ChampionNames }'

    fs.writeFileSync('./src/types/champions.ts', enumString)
})()
