const {BufferedProcess} = require('atom');
const path = require('path');

const spinner = require('./spinner');

const API_VER = 1
var Codes = { // Default codes of the API
  BUILDING: 240,
  RUNNING: 241,
  VERSION_MISMATCH: 244
}

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
        if (modifiers[0] == "codes") Codes = JSON.parse(data)
        break;
      case "status":
        if (Codes.BUILD_SUCCESSFUL == data || Codes.BUILD_FAILED == data) setTimeout(() => spinner.stop(), 3000)
        console.log(`Gradle Service: Status: ${Object.keys(Codes).filter(key => Codes[key] == data)[0]}`)
        break;
      case "disp":
        spinner.status(data)
        break;
      case "output":
        console[error ? "error" : "log"](`Gradle output: ${data}`)
        break;
      case "error":
        console.error(`Gradle Service: Error: ${Object.keys(Codes).filter(key => Codes[key] == data)[0]}`)
      case "return":
        service.lastReturn = data // Store the return value
        break;
      default:
        // Do nothing
    }
  },
  sendCommand: command => {
    //console.log("Gradle Service: " + command);
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
