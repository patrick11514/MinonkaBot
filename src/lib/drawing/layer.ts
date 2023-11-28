import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
import Sharp from 'sharp'
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
            const parts = url.split('.')

            const extension = parts.pop()
            const urlWithoutExtension = parts.join('.')

            const cacheName = urlWithoutExtension.replace(/[^a-zA-Z0-9]/g, '_')
            //extension is now _png, _jpg or _jpeg
            const fullFilePath = path.join('cache', `${cacheName}.${extension}`)

            if (fs.existsSync(fullFilePath)) {
                return new Layer(fullFilePath, position)
            }

            const request = await fetch(url)

            const data = await request.arrayBuffer()

            fs.writeFileSync(fullFilePath, Buffer.from(data))

            return new Layer(fullFilePath, position)
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
