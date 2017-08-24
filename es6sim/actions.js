//actions must have engine and that is why i cannot be within hq.
//we want the interface actions to run the engine even thought the date shouldnt
//go forward

class Actions {
  constructor (engine) {
    this.inspect = (officerId) => {
      engine.army.hq.inspectOfficer(officerId);
      engine.army.hq.targetOfficer(officerId);
      if (!engine.running) {
        //pass true as triggeredByUserAction
        engine.update(true);
        engine.updateUI(true);
      }
    }
  }
}

export default Actions
