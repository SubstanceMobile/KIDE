const {CompositeDisposable} = require('atom');
const path = require('path');
//const taskPick = require("./ui/task-input");
const taskPick = require("./ui/task-picker");

// Modules
const notify = require('./notify');
const spinner = require('./spinner');
const service = require('./service');

module.exports = {
  config: require("./settings.js"),
  activate: () => {
      this.subscriptions = new CompositeDisposable();

      notify.activate();
      setTimeout(service.activate, 1) // NOTE: For some reason this fixes javac errors

      this.subscriptions.add(atom.workspace.onDidChangeActiveTextEditor(editor => {
        if (editor == undefined) service.closeProject(); else service.updateProject();
      }))

      this.subscriptions.add(atom.commands.add("atom-workspace", {
        'build:run': () => service.runTask(atom.config.get("compiler-gradle.tasks.runTask")), // TODO: Interactive
        'build:debug': () => notify.error("Debug support coming soon!"),
        'build:release': () => service.runTask(atom.config.get("compiler-gradle.tasks.releaseTask")),
        'build:tasks': () => taskPick(service.getTasks(), tasks => service.runTask(tasks)),
        'build:wrapper': () => service.runTask("wrapper"),
        'build:stop': () => service.cancel()
      })); //TODO: Hooks to allow other plugins to manage some of this behaviour (for example, SDK plugin inserting a platform picker into Substance SDK projects)
  },

  consumeBusySignal: (signal) => {
    spinner.init(signal);
  },

  deactivate: () => {
    service.deactivate();
    notify.deactivate();
    spinner.stop()
    this.subscriptions.dispose(); // Release resources
  }
};
