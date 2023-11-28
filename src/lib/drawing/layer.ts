import fetch from 'node-fetch'
import Sharp from 'sharp'
import { checkCache, getCachePath, saveToCache, toFileName } from '../cache'
import { position } from './main'

export class Layer {
    private canvas: Sharp.Sharp
    public position: position

    constructor(source: string | Sharp.Sharp, position: position) {
        if (typeof source === 'string') {
            this.canvas = Sharp(source)
        } else {
            this.canvas = source
        }

        this.position = position
    }

    static async fromURL(url: string, position: position, cache = true): Promise<Layer> {
        if (!url.endsWith('.png') && !url.endsWith('.jpg') && !url.endsWith('.jpeg')) {
            throw new Error('Invalid image format')
        }

        if (!url.startsWith('http') && !url.startsWith('https')) {
            throw new Error('Invalid URL')
        }

        if (cache) {
            const path = toFileName(url)

            if (checkCache(path)) {
                return new Layer(getCachePath(path), position)
            }

            const request = await fetch(url)
            const data = await request.arrayBuffer()
            saveToCache(path, Buffer.from(data))

            return new Layer(getCachePath(path), position)
        }

        return new Layer(url, position)
    }

    resize(width?: number, height?: number): Layer {
        this.canvas.resize(width, height)

        return this
    }

    public async toBuffer(): Promise<Buffer> {
        return this.canvas.toBuffer()
    }
}
