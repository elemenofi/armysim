//actions must have engine and that is why i cannot be within HQ.
//we want the interface actions to run the engine even thought the date shouldnt
//go forward

class Actions {
  constructor (engine) {
    this.inspect = (officerId) => {
      engine.army.HQ.inspectOfficer(officerId);
      engine.army.HQ.targetOfficer(officerId);
      if (!engine.running) {
        //pass true as triggeredByUserAction
        engine.update(true);
        engine.updateUI(true);
      }
    }

    // this.target = (officerId) => {
    //   if (!engine.running) {
    //     //pass true as triggeredByUserAction
    //     engine.update(true);
    //     engine.updateUI(true);
    //   }
    // }
  }
}

export default Actions
