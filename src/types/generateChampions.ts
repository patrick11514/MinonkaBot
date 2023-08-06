import fs from 'fs'
import fetch from 'node-fetch'

function fixNames(name: string) {
    return name.replaceAll("'", '').replaceAll('.', '').replaceAll('&', 'and')
}

//get all champions and create enum
;(async () => {
    let request = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')

    const json = (await request.json()) as string[]

    let version = json[0]

    request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
    const json2 = (await request.json()) as {
        data: {
            [key: string]: {
                name: string
            }
        }
    }

    let champions = json2.data

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
