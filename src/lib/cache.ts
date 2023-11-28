import fs from 'node:fs'
import path from 'node:path'

const cacheFolder = 'cache'

export const toFileName = (url: string) => {
    const parts = url.split('.')

    const extension = parts.pop()
    const urlWithoutExtension = parts.join('.')

    const cacheName = urlWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_')
    return `${cacheName}.${extension}`
}

export const checkCache = (fileName: string) => {
    const pathToFile = path.join(cacheFolder, fileName)

    return fs.existsSync(pathToFile)
}

export const getCachePath = (fileName: string) => {
    const pathToFile = path.join(cacheFolder, fileName)

    return pathToFile
}

export const getCache = (fileName: string) => {
    const pathToFile = path.join(cacheFolder, fileName)

    const buffer = fs.readFileSync(pathToFile)
    return buffer
}

export const saveToCache = (fileName: string, buffer: Buffer) => {
    const pathToFile = path.join(cacheFolder, fileName)

    fs.writeFileSync(pathToFile, buffer)
}
