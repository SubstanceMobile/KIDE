const {BufferedProcess} = require('atom');
const path = require('path');
const fs = require('fs-plus');

const notify = require('./notify');
const which = require('./which');
const spinner = require('./spinner');

const taskRegex = /:(\w*$)/m
// This object handles running the Gradle commands.
module.exports = gradle = {
  cancel: silent => {
    if (gradle.proc) {
      gradle.proc.cancelBuild();
      if (!silent) notify.success("Gradle build canceled", {icon: "x"});
    } else {
      if (!silent) notify.info("No gradle builds are running");
    }
  },
  cmd: (args, dir, gradleBin, silent) => {
    gradle.cancel(true);
    // TODO: Outputview
    spinner.status("Initializing build...")
    console.log(gradleBin)
    return new Promise((resolve, reject) => {
      if (atom.config.get("compiler-gradle.wrapper")) wrapper = path.join(dir.getPath(), "gradlew")
      gradle.proc = new BufferedProcess({
        command: fs.isFileSync(wrapper) ? wrapper : gradleBin,
        args: ['--console','plain']/*.concat(atom.config.get())*/.concat(args)/*.concat(atom.config.get())*/,
        options: {cwd: dir.getPath(), env: process.env},
        stdout: output => {
          console.log(`Build Output: ${output}`)
          //TODO: Outputview
          try {
            //TODO: Gradle client
            taskName = output.match(taskRegex)[1]
            if (taskName) spinner.status(`Running task: ${taskName}`)
          } catch (ignored) {}
        },
        stderr: error => {
          console.log(`Build Error: ${error}`);
          if (!silent) notify.warning("Gradle Error", {detail: "Check console. \nTODO: Output log view"})
          //TODO: output view
        },
        exit: code => {
          //TODO: output view
          if (code == 0) {
            if (!silent) notify.success("Gradle build complete");
            console.log("Build complete")
            resolve("Complete")
          } else {
            if (!silent) notify.error("Gradle build failed", {detail: `Exit code: ${code}\nCheck the console. TODO: Output view`});
            console.error(`Build Error: Exit code: ${code}`);
            reject(code.toString());
          }
          spinner.stop();
        }
      });
      gradle.proc.onWillThrowError(error => reject(error.toString()));
      gradle.proc.cancelBuild = () => {
        reject("Canceled");
        spinner.stop();
        gradle.proc.kill();
      }
    });
  },
  runTask: (tasks, continuous, silent) => {
    if (!silent) notify.info("Gradle build starting", {detail: `Tasks: ${tasks}`})

    let args;
    if (continuous) {
      args = ['--continuous'].concat(tasks);
    } else {
      args = tasks;
    }

    dir = atom.project.getDirectories().filter(d => d.contains(atom.workspace.getActiveTextEditor().getPath()))[0];
    promise = gradle.cmd(args, dir, which.findGradleBin(), silent)
    //spinner.while("Building...", () => promise, {revealTooltip: true}) //TODO: Granular reporting
  },

  /////////////////////////////////////////////////////////////////////////////
  // Lifecycle
  /////////////////////////////////////////////////////////////////////////////

  activate: () => {},
  deactivate: () => {}
}
