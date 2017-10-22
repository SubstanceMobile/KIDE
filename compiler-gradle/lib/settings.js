module.exports = {
  notify: {
    type: 'boolean',
    default: true,
    title: "Show notifications",
    description: "Errors will always be displayed",
    order: 1
  },
  wrapper: { // TODO: Check
    type: 'boolean',
    default: true,
    title: "Use gradlew",
    description: "Use the Gradle Wrapper if it is present in the current project. This allows projects designed for older versions of Gradle to compile properly.",
    order: 2
  },
  nightly: { // TODO
    type: 'boolean',
    default: false,
    title: "Nightly",
    description: "Use nightly builds of Gradle",
    order: 4
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
}
