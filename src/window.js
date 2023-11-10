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
        console.log(`== Loading initial behavior: ${behaviorName} ==`)

        let retry = 0;
        let behaviorListSize = 0;
        function loadInitialBehavior() {

            // wait for completed loading of behavior list
            const behaviorList = WS.Behaviorlib.getBehaviorList()
            if (behaviorListSize > 0 && behaviorListSize == behaviorList.length) {
                try {
                    var manifest = WS.Behaviorlib.getByName(behaviorName).getBehaviorManifest();
                    IO.BehaviorLoader.loadBehavior(manifest);
                    console.log(`== Loaded initial behavior: ${behaviorName} ==`)
                } catch (e) {
                    console.log(`Failed to load initial behavior '${behaviorName}': ${e}`)
                }
                return;
            }

            if (retry >= 50) {
                console.log(`Timeout: Failed to load initial behavior '${behaviorName}'`)
                return;
            }

            behaviorListSize = behaviorList.length;
            retry++;
            setTimeout(loadInitialBehavior, 500);
        }
        setTimeout(loadInitialBehavior, 100);
    }
    //-----------------------------------------------------------------
}
