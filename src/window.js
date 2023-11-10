window.onload = function() {
	var gui = require('nw.gui');

	Behavior.resetBehavior();

	// Initialize gui panel
	UI.Statemachine.initialize();
	UI.Menu.toDashboardClicked();
	UI.Dashboard.resetAllFields();
	UI.Dashboard.addBehaviorOutcome('finished');
	UI.Dashboard.addBehaviorOutcome('failed');
	ActivityTracer.resetActivities();
	UI.RuntimeControl.displayLockBehavior();

	RC.Controller.initialize();

	// Initialize runtime control
	if (!gui.App.argv.contains('--offline') && !gui.App.argv.contains('-o')) {
		RC.ROS.trySetupConnection();
	} else {
		T.logInfo("Running in offline mode: please connect to ROS manually if desired.");
	}

	// Restore local settings (including statelib)
	UI.Settings.restoreSettings();

	UI.Feed.initialize();

	if (gui.App.argv.contains('--run-tests')) {
		setTimeout(() => {
			TestReport.runAllTests(status =>  gui.App.quit());
		}, 5 * 1000);
	}

	else if (gui.App.argv.contains('--check-behaviors')) {
		setTimeout(() => {
			CheckBehaviorsReport.checkAllBehaviors(gui.App.quit);
		}, 5 * 1000);
	}

    //-----------------------------------------------------------------
    // load behavior from command line argument (by Takashi Sato 2023/11/10)
    function getCommandLineArguments() {
        let args = {};
        argv = gui.App.argv.toString()
        argv.split(',').forEach((val, index) => {
            // "--key=value" 形式の引数を解析
            if (val.startsWith('--')) {
                let [key, value] = val.slice(2).split('=');
                args[key] = value;
                console.log(`key: ${key}, value: ${value}`)
            }
        });
        return args;
    }

    const args = getCommandLineArguments();
    if ("behavior" in args) {
        behaviorName = args["behavior"]

        let retry = 0;
        function loadInitialBehavior() {
            try {
                var manifest = WS.Behaviorlib.getByName(behaviorName).getBehaviorManifest();
                IO.BehaviorLoader.loadBehavior(manifest);
            } catch (e) {
                if (retry < 10) {
                    setTimeout(loadInitialBehavior, 500);
                    retry++;
                }
            }
        }
        setTimeout(loadInitialBehavior, 100);
    }
    //-----------------------------------------------------------------
}
