const {BufferedProcess} = require('atom');
const path = require('path');

const spinner = require('./spinner');
const notify = require('./notify');

const API_VER = 1
var Codes = { // These Codes are only present during the startup sequence. The tool then provides its own defenitions
  BUILDING: 240,
  RUNNING: 241,
  VERSION_MISMATCH: 244
}

stopSpinner = () => setTimeout(() => spinner.stop(), 3000)

module.exports = service = {
  processCommand: (input, error) => {
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
        switch (data) {
          case Codes.BUILD_SUCCESSFUL:
            notify.success("Gradle build complete")
            stopSpinner()
            break;
          case Codes.BUILD_FAILED:
            notify.error("Gradle build failed", {detail: "Please check the console"}) //TODO: Output view
            stopSpinner()
            break;
          case Codes.CANCELLING_BUILD:
          case Codes.PROJECT_CLOSED:
          case Codes.BUILD_STARTING:
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
        switch (data) {
          case Codes.INVALID:
            notify.error("Issued invalid command to Gradle client", {detail: `Command issued: ${service.lastCommand}`}) //TODO: Report issue button
            break;
          case Codes.VERSION_MISMATCH:
            notify.error("Gradle client using a different API version than KIDE"); // TODO: Report issue button
            break;
          case Codes.NO_PROJECT_CONNECTION:
            notify.error("Gradle client is unaware of the current project"); //TODO: Report issue button
            break;
          case Codes.NO_BUILD_RUNNING:
            notify.warning("No Gradle build is running")
            break;
          default:
            notify.error("Gradle client sent an unknown error", {detail: `Error code: ${data}`}) // TODO: Report issue button
        }
        console.error(`Gradle Service: Error: ${Object.keys(Codes).filter(key => Codes[key] == data)[0]}`)
      case "return":
        service.lastReturn = data // Store the return value
        break;
      default:
        notify.error("Gradle client issued an invalid command", {detail: `Command: ${command}`}) // TODO: Report issue button
    }
  },
  sendCommand: command => {
    //console.log("Gradle Service: " + command);
    service.lastCommand = command
    service.proc.process.stdin.write(command + "\n")
  },
  waitForReturn: () => { //TODO: Fix
    while (service.lastReturn == "") { /* Wait */ }
    let val = service.lastReturn
    service.lastReturn = ""
    return val
  },

  getGradleVersion: () => {
    service.sendCommand("?version:gradle")
    return service.waitForReturn()
  },

  activate: () => {
      service.lastReturn = ""
      service.lastCommand = ""
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
  terminate: () => {
    service.terminating = true
    sendCommand("done")
    service.proc = null
  }
}
