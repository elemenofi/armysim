    //   if (target != army.commander) {

    //     if ((army.commander.drift > 500 && target.drift > 500 ) || (army.commander.drift < 500 && target.drift < 500)) {

    //       targetImmune = true;

    //       _.each(plotters, function (plotter) {

    //         var plotterIntRoll = plotter.intelligence + helpers.randomNumber(100);
    //         var armyCommanderIntRoll = army.commander.intelligence;

    //         console.log(plotterIntRoll, armyCommanderIntRoll, "rolling discharge discharge: " + plotter.lastName);

    //         if ((plotterIntRoll < armyCommanderIntRoll) && (plotter.rank != "Captain")) {

    //           console.log("discharging ", plotter.lastName);
    //           var message = "dishonorable discharge ordered by " + army.commander.rank + " " + army.commander.lastName;
    //           staffManager.retireSpecificOfficer(plotter, army, message);

    //         };
            
    //       });

    //     };

    //   };