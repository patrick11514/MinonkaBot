# Miňonka

---

#### League of Legends discord bot

**Tested on:**

-   OS: Ubuntu 22.04.1 (Jammy Jellyfish)
-   NodeJS: v16.17.0
-   tsc: 4.5.4
-   Discord.JS: 14.5.0

**How to run:**

-   **First we need create .env file and fill it with some credentials**
    Example .env file:
    ```ENV
    DISCORD_ID=1234567890123456
    DISCORD_TOKEN=1234567890ABCDEF.ABCDEF.1234567890
    RIOT_TOKEN=RGAPI-12345678-90AB-CD12-3456-7890ABCDE
    DDRAGON_URL=https://ddragon.leagueoflegends.com
    ```
    -   https://discord.com/devlopers
        -   Create new app and new bot in it
        -   Copy CLIENT ID to DISCORD_ID and CLIENT SECRET to DISCORD_TOKEN
    -   https://developer.riotgames.com/
        -   Create new app
        -   Then copy API KEY to RIOT_TOKEN
-   **Building bot**
    Install node modules:
    ```SHELL
    #npm
    $ npm i
    #pnpm
    $ pnpm i
    ```
    Build discord bot:
    ```SHELL
    #npm
    $ npm build
    #pnpm
    $ pnpm build
    ```
    Register slash commands on server:
    ```SHELL
    #npm
    $ npm startCommands
    #pnpm
    $ pnpm startCommands
    ```
    Run setup script, to copy fonts:
    ```SHELL
    $ chmod +x setup.sh
    $ ./setup.sh
    ```
    Run discord bot:
    ```SHELL
    #npm
    $ npm start
    #pnpm
    $ pnpm start
    ```
-   **Run bot in dev mode:**
    ```SHELL
    #npm
    $ npm dev
    #pnpm
    $ pnpm dev
    ```
