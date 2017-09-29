const {CompositeDisposable} = require('atom');
const path = require('path');
const taskPick = require("./ui/task-input");

// Modules
const notify = require('./notify');
const gradle = require('./gradle');
const update = require('./update');
const spinner = require('./spinner');
const which = require('./which');

module.exports = {
  config: {
    notify: {
      type: 'boolean',
      default: true,
      title: "Show notifications",
      description: "Errors will always be displayed",
      order: 1
    },
    wrapper: {
      type: 'boolean',
      default: true,
      title: "Use gradlew",
      description: "Use the Gradle Wrapper if it is present in the current project. This allows projects designed for older versions of Gradle to compile properly.",
      order: 2
    },
    updates: {
      type: 'object',
      order: 3,
      properties: {
        location: {
          type: 'string',
          default: 'auto',
          title: "Gradle path",
          description: "Where is the gradle executable located. Put \'auto\' to try and find a gradle binary automatically or download gradle if not found"
        },
        nightly: {
          type: 'boolean',
          default: false,
          title: "Use nightly builds",
          description: "Use nightly builds of Gradle when updating"
        }
      }
    },
    tasks: {
      type: 'object',
      order: 4,
      properties: {
        runTask: {
          type: 'string',
          default: "run",
          title: "Run Task",
          description: "What task to execute when running the project",
          order: 1
        },
        debugTask: {
          type: 'string',
          default: "debug",
          title: "Debug Task",
          description: "What task to execute when debugging the project",
          order: 2
        },
        releaseTask: {
          type: 'string',
          default: "release",
          title: "Release Task",
          description: "What task to execute when releasing the project",
          order: 3
        },
        publishTask: {
          type: 'string',
          default: "publish",
          title: "Publish Task",
          description: "What task to execute when publishing the project",
          order: 4
        },
        defaultTasksBefore: {
          type: 'array',
          default: [],
          title: "Default Tasks First",
          description: "Tasks to execute every build. Will run <b>before</b> the regular build",
          items: {type: 'string'},
          order: 5
        },
        defaultTasksAfter: {
          type: 'array',
          default: [],
          title: "Default Tasks Last",
          description: "Tasks to execute every build. Will run <b>after</b> the regular build",
          items: {type: 'string'},
          order: 6
        }
      }
    }
  },

  activate: () => {
      this.subscriptions = new CompositeDisposable();

      notify.activate();
      gradle.activate();
      update.activate();

      this.subscriptions.add(atom.config.onDidChange("compiler-gradle.updates.nightly", value => {
        if (!value) { //TODO: Necessary?
          update.purgeBinary()
          notify.info("Downgrading to stable version of Gradle", {icon: "history"});
        }
        update.check()
      }));

      this.subscriptions.add(atom.commands.add("atom-workspace", {
        'build:run': () => gradle.runTask(atom.config.get("compiler-gradle.tasks.runTask")),
        'build:debug': () => notify.error("Debug support coming soon!"),
        'build:release': () => gradle.runTask(atom.config.get("compiler-gradle.tasks.releaseTask")),
        'build:task': () => taskPick(tasks => gradle.runTask(tasks)),
        'build:wrapper': () => gradle.runTask("wrapper"),
        'build:stop': () => gradle.cancel(),
        'build:update': () => update.check(),
        'build:reload-binary': () => which.reset()
      })); //TODO: Hooks to allow other plugins to manage some of this behaviour (for example, SDK plugin inserting a platform picker into Substance SDK projects)
  },

  consumeBusySignal: (signal) => {
    spinner.init(signal);
    which.activate();
  },

  deactivate: () => {
    notify.deactivate();
    gradle.deactivate();
    update.deactivate();

    this.subscriptions.dispose(); // Release resources
    if (atom.packages.isPackageDisabled("compiler-gradle")) update.purgeBinary();
  }
};
