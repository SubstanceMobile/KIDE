// Library Imports
const {BufferedProcess} = require('atom');
const path = require('path');
const issue = require('github-create-issue');

// Local imports
const spinner = require('./spinner');
const notify = require('./notify');
const output = require('./ui/console-output');
//TODO: KIDE Logger

// Time out functions
stopSpinner = () => setTimeout(() => spinner.stop(), 3000)
closeOutput = () => {
  code = setTimeout(() => output.close(), 3000)
  output.getPane().mouseenter(() => clearTimeout(code))
}

// Gihub interaction
const GIHUB_ISSUE_TOKEN = "6484c9d62487eff67" + "0fa0043dfc41808a2" + "0b3a12"
postIssue = (title, detail) => {
  let opts = {
    token: GIHUB_ISSUE_TOKEN,
    body: `# Codes\n\`\`\`\n${JSON.stringify(Codes, null, 4)}\n\`\`\`\n# Log\n\`\`\`\n${state.history}\n\`\`\`\n# Extras\n${detail}` //TODO: More and better detail
  }
  let callback = (error, issue, info) => {
    if (info) {
      console.info("Github rate limit: " + info.limit);
      console.info("Github rate remaining: " + info.remaining);
      console.info("Github rate reset: " + new Date(info.reset * 1000));
    }
    if (error) notify.error(error.message); else notify.success("Issue posted")
    console.log("Github Issue: " + JSON.stringify(issue))
  }
  issue("SubstanceMobile/KIDE", `Gradle Compiler Service: ${title}`, opts, callback)
}

const API_VER = 1
var Codes = { // These Codes are only present during the startup sequence. The tool then provides its own defenitions
  BUILDING: 240,
  RUNNING: 241,
  VERSION_MISMATCH: 244
}
language = { // Language processing
  process: (input, error) => { // Parse a command and redirect to impl
    state.history += `${input}\n`

    // Parse the syntax
    let command = input.split(";")[0].split(",")[0].trim()
    let modifiers = input.replace(command, "").replace(",", "").trim().split(";")[0].split(",").map(mod => mod.trim())
    var data = input.split(";"); data.shift(); data = data.join(";").trim()
    //console.log(`Debug: Command = ${command}, modifiers = ${modifiers}, data = ${data}`)

    switch (command) {
      case "?version:api":
        language.sendRaw(`return; ${API_VER}`)
        break;
      case "setup":
        impl.setup(modifiers[0], data)
        break;
      case "status":
        impl.status(parseInt(data))
        break;
      case "error":
        impl.error(parseInt(data))
        break;
      case "disp":
        impl.display(data)
        break;
      case "output":
        impl.output(data, error)
        break;
      case "return":
        impl.return(data)
        break;
      case "?command":
      case "":
      case "IGNORE":
      case "COMMENT":
      case ":":
        // Ignored
        break;
      default:
        if (!state.isBuildingClient) notify.error("Gradle client issued an invalid command", {
          detail: `Command: ${command}`,
          buttons: [{
              text: "Report issue",
              onDidClick: () => postIssue("Invalid Command Recieved", `Command recieved: ${command}`)
          }]
        })
        break;
    }
  },
  sendRaw: command => {
    if (!command.endsWith("\n")) command += "\n"
    state.lastCommand = command
    state.history += command
    process.proc.process.stdin.write(command)
  },
  send: command => queue.add(command)
}

queue = { // Command queue
  queue: [],
  waitEvent: 0,
  lastEvent: 0,
  add: command => queue.queue.push(command),
  remove: () => {},
  get: () => (state.isReady && queue.waitEvent == queue.lastEvent) ? queue.queue.shift() : undefined,
  waitFor: event => waitEvent = event,
  provideEvent: code => {
    if (queue.waitEvent == queue.lastEvent || code < 0) queue.waitEvent = code
    queue.lastEvent = code
  }
}

state = { // State management
  // Run state
  isReady: false, // If the tool is running enough to recieve commands
  isBuildingClient: false, // = ignore invalid commands

  // Command management
  history: "", // The history of all transactions
  lastCommand: "", // The last command sent
  queueListener: -1, // The ID for the interval that issues commands from the queue

  // Project management
  projectClosed: true,
  lastDir: "", // The last open directory
  updateProject: () => {
    dir = path.dirname(atom.workspace.getActiveTextEditor().getPath())
    if (dir == state.lastDir) return
    state.lastDir = dir
    language.send(`project; ${dir}`) // TODO: Version
    queue.waitFor(Codes.PROJECT_OPENED)
  },

  // Return management
  lastReturn: "", // The last return value sent to the IDE
  getReturn: () => {
    return new Promise(function(resolve, reject) {
      (check = () => {
        if (state.lastReturn != "") {
          resolve(state.lastReturn)
          state.lastReturn = ""
        } else {
          setTimeout(check, 200)
        }
      })()
    });
  }
}

impl = { // Command implementations
  setup: (service, data) => {
    if (service == "codes") Codes = JSON.parse(data) // Graft in the tool's codes
  },
  status: code => {
    queue.provideEvent(code)
    switch (code) {
      case Codes.BUILD_SUCCESSFUL:
        notify.success("Gradle Build Complete")
        stopSpinner()
        closeOutput()
        break;
      case Codes.BUILD_FAILED:
        notify.error("Gradle build failed", {detail: "Please check the Build Output pane for more details"})
        stopSpinner()
        break;
      case Codes.READY:
        spinner.stop() // Stop the "setting up gradle" spinner
        if (atom.workspace.getActiveTextEditor() != undefined) {
            state.updateProject() // Load up the first project
        }
        state.isReady = true
        break;
      case Codes.BUILDING:
        spinner.status("Configuring Gradle...")
        state.isBuildingClient = true
        break;
      case Codes.CANCELLING_BUILD:
        spinner.status("Stopping Build")
        break;
      case Codes.RUNNING:
        setTimeout(() => {
          state.isBuildingClient = false // Stop ignoring invalid output
        }, 1000) // Allow time to flush out buffers
        break;
      case Codes.PROJECT_CLOSED:
        state.projectClosed = true
        break;
      case Codes.PROJECT_OPENED:
        state.projectClosed = false
        break;
      case Codes.BUILD_STARTING:
      default:
        // Do nothing. Can later be activated to tune behaviour
    }
    console.log(`[Gradle Client] Status: ${Object.keys(Codes).filter(key => Codes[key] == code)[0]}`)
  },
  error: code => {
    queue.provideEvent(-code)
    switch (code) {
      case Codes.INVALID:
        notify.error("Issued invalid command to Gradle client", {
          detail: `Command issued: ${state.lastCommand}`,
          buttons: [{
              text: "Report issue",
              onDidClick: () => postIssue("Invalid Command Sent", `Command issued: ${state.lastCommand}`)
          }]
        })
        break;
      case Codes.VERSION_MISMATCH:
        notify.error("Gradle client using a different API version than KIDE", {
          buttons: [{
              text: "Report issue",
              onDidClick: () => state.postIssue("API Mismatch")
          }]
        })
        break;
      case Codes.NO_PROJECT_CONNECTION:
        if (state.lastCommand != "closeProject") {
          // Retry the connection
          state.lastDir = ""
          state.updateProject()

          // Resend the last command that just failed
          language.send(state.lastCommand)
        }
        break;
      case Codes.NO_BUILD_RUNNING:
        notify.warning("No Gradle build is running")
        break;
      default:
        notify.error("Gradle client sent an unknown error", {
          detail: `Error code: ${data}`,
          buttons: [{
              text: "Report issue",
              onDidClick: () => postIssue("Unknown Error Code", `Error code: ${data}`)
          }]
        })
    }
    console.error(`[Gradle Client] Error: ${Object.keys(Codes).filter(key => Codes[key] == code)[0]}`)
  },
  display: text => spinner.status(text),
  output: (text, isError) => {
    console[isError ? "error" : "log"](`[Gradle Client] Output: ${text}`)
    output.add(text, isError)
  },
  return: data => state.lastReturn = data
}

process = { // Process manipulation
  proc: null,
  run: () => {
    // Set default states
    state.history = state.history ? state.history + "\n--------------- RESTARTING -----------------\n" : ""
    state.lastCommand = ""
    state.lastReturn = ""
    state.lastDir = ""
    state.isReady = false
    clearInterval(state.queueListener)

    // Run the client
    handler = (output, isError) => { for (line of output.split("\n")) language.process(line, isError) }
    process.proc = new BufferedProcess({
      command: path.join(__dirname, "..", "gradle-service", "run.sh"), //TODO: Windows support
      stdout: output => handler(output, false),
      stderr: output => handler(output, true),
      exit: code => {
        console[(code == 0) ? "log" : "error"](`[Gradle Client] Exit: ${code}`)
        spinner.stop() // Stop any ongoing output
        process.run() // Restart the server
      }
    })
    process.manipulateInputs()
    process.queueListen()
  },
  queueListen: () => {
    state.queueListener = setInterval(() => {
      command = queue.get()
      if (command != undefined) language.sendRaw(command)
    }, 100)
  },
  manipulateInputs: () => {
    //TODO: Idea - add another file descriptor to add a second input stream
  },
  kill: () => {
    console.log("[Gradle Client] Forcibly stopping service")
    process.proc.kill()
  }
}

connector = { // Lifecycle and API
  language: language,
  queue: queue,
  state: state,
  impl: impl,
  process: process,

  // Lifecycle
  activate: process.run,
  deactivate: () => language.send("done"),

  // API
  updateProject: state.updateProject,
  runTask: tasks => {
    output.reset()
    output.open()
    before = atom.config.get("compiler-gradle.tasks.defaultTasksBefore")
    after = atom.config.get("compiler-gradle.tasks.defaultTasksAfter")
    language.send(`task; ${before.concat(tasks).concat(after).join(", ")}`)
  },
  cancel: () => language.send("cancel"),
  hardCancel: () => process.kill(),
  closeProject: () => {
    language.send("closeProject")
    state.lastDir = ""
    queue.waitFor(Codes.PROJECT_CLOSED)
  },
  getGradleVersion: () => {
    language.send("?version:gradle")
    return state.getReturn()
  },
  getTasks: () => {
    language.send("?tasks")
    return state.getReturn().then(value => JSON.parse(value))
  }
}

module.exports = connector // Export the connector
