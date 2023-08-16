# Miňonka

#### League of Legends discord bot

**Tested on:**

-   OS:
    -   Ubuntu 22.04.1 (Jammy Jellyfish)
    -   Arch Linux
    -   Raspbian 11 (Bullseye)
-   NodeJS:
    -   v18.16.1
    -   v18.14.2
-   tsc: 4.8.2
-   Discord.JS: 14.9.0

**How to run:**

-   **First we need create .env file and fill it with some credentials**
    Example .env file:
    ```ENV
    DISCORD_ID=1234567890123456
    DISCORD_TOKEN=1234567890ABCDEF.ABCDEF.1234567890
    RIOT_TOKEN=RGAPI-12345678-90AB-CD12-3456-7890ABCDE
    DDRAGON_URL=https://ddragon.leagueoflegends.com
    PORT=3000
    WEB_PATH=http://localhost:3000
    KEY=RANDOM_KEY
    ```
    -   https://discord.com/devlopers
        -   Create new app and new bot in it
        -   Copy CLIENT ID to DISCORD_ID and CLIENT SECRET to DISCORD_TOKEN
    -   https://developer.riotgames.com/
        -   Create new app
        -   Then copy API KEY to RIOT_TOKEN
    -   PORT is port on which will be running the web server, which serves live rank
    -   WEB_PATH is path to web server, which serves live rank and bot will use it in command
    -   KEY will be used in buttons, to check if the buttons are from this specific bot
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
