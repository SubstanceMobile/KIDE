const {CompositeDisposable, BufferedProcess} = require('atom');
const path = require('path');
const fs = require('fs-plus');
const download = require('download');
const notify = require('./notify');

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
          default: 'download',
          title: "Gradle path",
          description: "Where is the gradle executable located. Put \'download\' to automatically download and update Gradle through KIDE"
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

  activate: function() {
      notify.activate();
  },

  deactivate: function() {
    notify.deactivate();
  }
};
