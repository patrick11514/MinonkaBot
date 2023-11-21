import { config } from 'dotenv'
import { z } from 'zod'
config()

const schema = z.object({
    BOT_ID: z.string().min(18),
    BOT_SECRET: z.string().min(70),
    RIOT_TOKEN: z.string().min(42).max(42),
})

export const env = schema.parse(process.env)
