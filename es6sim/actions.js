class Actions {
    constructor (engine) {
        this.HQ = engine.army.HQ;
    }

    inspect (officerId) {
        this.HQ.inspectOfficer(officerId);
        if (!engine.running) {
            engine.update();
            engine.updateUI();
        }
    }
}

export default Actions