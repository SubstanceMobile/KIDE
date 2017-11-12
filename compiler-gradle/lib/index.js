CompositeDisposable = require('atom').CompositeDisposable;
const path = require('path');

// UI
const taskPick = require("./ui/task-picker");
const output = require('./ui/console-output');

// Modules
const notify = require('./notify');
const spinner = require('./spinner');
const service = require('./service');

module.exports = index = {
  config: require("./settings.js"),
  subscriptions: undefined,
  activate: () => {
      index.subscriptions = new CompositeDisposable();

      notify.activate();
      setTimeout(service.activate, 1000) // Give the IDE a second to suppress build errors
      output.activate()

      index.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(editor => {
        if (editor == undefined) {
          service.closeProject();
          output.hide()
        } else {
          service.updateProject();
          output.unhide()
        }
      }))

      index.subscriptions.add(atom.commands.add("atom-workspace", {
        'gradle:run': () => service.runTask(atom.config.get("compiler-gradle.tasks.runTask")), // TODO: Interactive
        'gradle:debug': () => notify.error("Debug support coming soon!"),
        'gradle:release': () => service.runTask(atom.config.get("compiler-gradle.tasks.releaseTask")),
        'gradle:tasks': () => service.getTasks().then(data => taskPick(data, tasks => service.runTask(tasks))),
        'gradle:get-current-version': () => service.getGradleVersion().then(ver => notify.info(`This project uses Gradle ${ver}`)),
        'gradle:wrapper': () => service.runTask("wrapper"),
        'gradle:reload': () => {
          spinner.status("Reloading Gradle...")
          service.hardCancel()
          service.activate()
        },
        'gradle:stop': () => service.cancel(),
        'gradle:force-stop': () => service.hardCancel()
      })); //TODO: Hooks to allow other plugins to manage some of this behaviour (for example, SDK plugin inserting a platform picker into Substance SDK projects)
  },

  consumeBusySignal: signal => spinner.init(signal),

  deactivate: () => {
    notify.success("hello")

    service.deactivate();
    notify.deactivate();
    output.deactivate();

    spinner.stop()
    index.subscriptions.dispose(); // Release resources
  }
};
