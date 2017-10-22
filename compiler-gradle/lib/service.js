const {BufferedProcess} = require('atom');
const path = require('path');
const issue = require('github-create-issue');

const spinner = require('./spinner');
const notify = require('./notify');
const uvrun2 = require("../node_modules/uvrun2"); // Used to wait for the return value

const GIHUB_ISSUE_TOKEN = "a44caa5040ef862d39c27802af14ffb376bb6c50" //TODO: Make bot account
const API_VER = 1
var Codes = { // These Codes are only present during the startup sequence. The tool then provides its own defenitions
  BUILDING: 240,
  RUNNING: 241,
  VERSION_MISMATCH: 244
}

stopSpinner = () => setTimeout(() => spinner.stop(), 3000)

module.exports = service = {
  /////////////////////////////////////////////////////////////////////////////
  // Language
  /////////////////////////////////////////////////////////////////////////////

  processCommand: (input, error) => {
    service.history += input.endsWith("\n") ? input : `${input}\n`
    //console.log("Gradle Service: " + input)
    let command = input.split(";")[0].split(",")[0].trim()
    let modifiers = input.replace(command, "").replace(",", "").trim().split(";")[0].split(",").map(mod => mod.trim())
    var data = input.split(";"); data.shift(); data = data.join(";").trim()
    //console.log(`Debug: Command = ${command}, modifiers = ${modifiers}, data = ${data}`)

    switch (command) {
      case "?version:api":
        service.sendCommand(`return; ${API_VER}`)
        break;
      case "setup":
        if (modifiers[0] == "codes") Codes = JSON.parse(data) // Graft in the tool's codes
        break;
      case "status":
        service.lastStatus.provide(data);
        switch (parseInt(data)) {
          case Codes.BUILD_SUCCESSFUL:
            notify.success("Gradle build complete")
            stopSpinner()
            break;
          case Codes.BUILD_FAILED:
            notify.error("Gradle build failed", {detail: "Please check the console"}) //TODO: Output view
            stopSpinner()
            break;
          case Codes.READY:
            spinner.stop() // Stop the "setting up gradle" spinner
            service.updateProject() // Load up the first project
            break;
          case Codes.BUILDING:
            spinner.status("Setting up Gradle...")
            break;
          case Codes.CANCELLING_BUILD:
            spinner.status("Stopping Build")
            break;
          case Codes.RUNNING:
          case Codes.PROJECT_CLOSED:
          case Codes.BUILD_STARTING:
          case Codes.PROJECT_OPENED:
          default:
            // Do nothing. Can later be activated to tune behaviour
        }
        console.log(`Gradle Service: Status: ${Object.keys(Codes).filter(key => Codes[key] == data)[0]}`)
        break;
      case "disp":
        spinner.status(data)
        break;
      case "output":
        console[error ? "error" : "log"](`Gradle output: ${data}`)
        break;
      case "error":
        switch (parseInt(data)) {
          case Codes.INVALID:
            notify.error("Issued invalid command to Gradle client", {
              detail: `Command issued: ${service.lastCommand}`,
              buttons: [{
                  text: "Report issue",
                  onDidClick: () => service.postIssue("Invalid Command Sent", `Command issued: ${service.lastCommand}`)
              }]
            })
            break;
          case Codes.VERSION_MISMATCH:
            notify.error("Gradle client using a different API version than KIDE", {
              buttons: [{
                  text: "Report issue",
                  onDidClick: () => service.postIssue("API Mismatch")
              }]
            })
            break;
          case Codes.NO_PROJECT_CONNECTION:
            notify.error("Gradle client is unaware of the current project", {
              detail: "Try opening Settings and then going back to this tab",
              buttons: [{
                  text: "Report issue",
                  onDidClick: () => service.postIssue("No Project")
              }]
            })
            break;
          case Codes.NO_BUILD_RUNNING:
            notify.warning("No Gradle build is running")
            break;
          default:
            notify.error("Gradle client sent an unknown error", {
              detail: `Error code: ${data}`,
              buttons: [{
                  text: "Report issue",
                  onDidClick: () => service.postIssue("Unknown Error Code", `Error code: ${data}`)
              }]
            })
        }
        console.error(`Gradle Service: Error: ${Object.keys(Codes).filter(key => Codes[key] == data)[0]}`)
      case "return":
        service.lastReturn.provide(data) // Store the return value
        break;
      case "?command":
      case "":
      case "IGNORE":
      case "COMMENT":
      case ":":
        // Do nothing
        break;
      default:
        notify.error("Gradle client issued an invalid command", {
          detail: `Command: ${command}`,
          buttons: [{
              text: "Report issue",
              onDidClick: () => service.postIssue("Invalid Command Recieved", `Command recieved: ${command}`)
          }]
        })
    }
  },
  sendCommand: command => {
    //console.log("Gradle Service: " + command);
    service.lastCommand = command
    service.history += `${command}\n`
    service.proc.process.stdin.write(command + "\n")
  },
  getReturn: () => {
    let value = service.lastReturn.accept()
    service.lastReturn = new uvrun2.waitFor()
    return value
  },
  waitForStatus: code => {
    let value = service.lastStatus.accept()
    service.lastStatus = new uvrun2.waitFor()
    if (value == code) return; else service.waitForStatus(code)
  },
  getCodes: () => {
    service.sendCommand("?codes")
    return JSON.parse(service.getReturn())
  },

  /////////////////////////////////////////////////////////////////////////////
  // Github
  /////////////////////////////////////////////////////////////////////////////

  postIssue: (title, detail) => {
    let opts = {
      token: GIHUB_ISSUE_TOKEN,
      body: `# Codes\n${JSON.stringify(Codes)}\n# Log\n${service.history}\n# Extras\n${detail}`
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
    issue("SubstanceMobile/KIDE", `Gradle Compiler Client: ${title}`, opts, callback)
  },

  /////////////////////////////////////////////////////////////////////////////
  // Impl
  /////////////////////////////////////////////////////////////////////////////

  updateProject: () => {
    dir = atom.project.getDirectories().filter(d => d.contains(atom.workspace.getActiveTextEditor().getPath()))[0].getPath();
    if (dir == service.lastDir) return
    service.lastDir = dir
    service.sendCommand(`project; ${dir}`) // TODO: Version
    //waitForStatus(Codes.READY) TODO: Handle if an error happens
  },
  runTask: tasks => {
    before = atom.config.get("compiler-gradle.tasks.defaultTasksBefore")
    after = atom.config.get("compiler-gradle.tasks.defaultTasksAfter")
    service.sendCommand(`task; ${before.concat(tasks).concat(after).join(", ")}`)
  },
  cancel: () => {
    service.sendCommand("cancel")
  },
  closeProject: () => {
    service.sendCommand("closeProject")
    //waitForStatus(Codes.PROJECT_CLOSED) TODO: Handle if an error happens
  },
  getGradleVersion: () => {
    service.sendCommand("?version:gradle")
    return service.getReturn()
  },
  getTasks: () => {
    service.sendCommand("?tasks")
    return JSON.parse(service.getReturn())
  },

  /////////////////////////////////////////////////////////////////////////////
  // Lifecycle
  /////////////////////////////////////////////////////////////////////////////

  activate: () => {
      service.history = service.history ? service.history + "\n--------------------------------\n" : ""
      service.lastCommand = ""
      service.lastReturn = new uvrun2.waitFor()
      service.lastStatus = new uvrun2.waitFor()
      service.proc = new BufferedProcess({
        command: path.join(__dirname, "..", "gradle-service", "run.sh"),
        stdout: output => {for (line of output.split("\n")) service.processCommand(line, false) },
        stderr: output => {for (line of output.split("\n")) service.processCommand(line, true) },
        exit: code => {
          console.log("Gradle service exited with code: " + code)
          spinner.stop()
          if (!service.terminating) service.activate()
        }
      })
  },
  deactivate: () => {
    service.terminating = true
    service.sendCommand("done")
    service.waitForStatus(Codes.EXIT)
    service.proc = null
  }
}
