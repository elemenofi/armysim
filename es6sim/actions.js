class Actions {
    constructor (engine) {
        this.HQ = engine.army.HQ;
    }

    inspect (officerId) {
        this.HQ.inspectOfficer(officerId);
        engine.update();
        engine.updateUI();
    }
}

export default Actions