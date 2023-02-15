interface DBUser {
    language: string
    linkedAccounts: Array<{
        username: string
        id: string
        region: string
    }>
}

export default DBUser
