interface User {
    language: string
    linkedAccounts: Array<{
        username: string
        id: string
        region: string
    }>
}

export default User
