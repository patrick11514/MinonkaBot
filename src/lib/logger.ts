import clc from 'cli-color'

class Logger {
    name: string
    color: string
    time: number = 0

    constructor(name: string, color = 'yellow') {
        this.name = name
        this.color = color
    }

    getTime() {
        let date = new Date()

        //HH:MM:SS:MS
        let hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
        let minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
        let seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
        let milliseconds =
            date.getMilliseconds() < 10
                ? `00${date.getMilliseconds()}`
                : date.getMilliseconds() < 100
                ? `0${date.getMilliseconds()}`
                : date.getMilliseconds()

        return `${hours}:${minutes}:${seconds}:${milliseconds}`
    }

    log(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        console.log(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.blue(
                'INFO'
                //@ts-ignore
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${message}`
        )
    }

    start(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        this.time = Date.now()
        console.log(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.blue(
                'INFO'
                //@ts-ignore
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${message}`
        )
    }

    stop(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        let ms = Date.now() - this.time
        this.time = 0

        console.log(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.blue(
                'INFO'
                //@ts-ignore
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${message} ${clc.white(
                `(${ms} ms)`
            )}`
        )
    }

    error(message: any) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 4)
        }

        console.log(
            `${clc.white('[')}${clc.green(this.getTime())}${clc.white(']')} ${clc.white('[')}${clc.red(
                'ERROR'
                //@ts-ignore
            )}${clc.white(']')} ${clc.white('[')}${clc[this.color](this.name)}${clc.white(']')} ${clc.red(message)}`
        )
    }
}

export default Logger
