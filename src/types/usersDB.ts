interface User {
    language: string
    linkedAccounts: Array<{
        username: string
        nameHistory: Array<string>
        id: string
        region: string
    }>
}

export default User
