class Actions {
    constructor (engine) {
        this.HQ = engine.army.HQ;
    }

    inspect (officerId) {
        this.HQ.inspectOfficer(officerId)
    }
}

export default Actions