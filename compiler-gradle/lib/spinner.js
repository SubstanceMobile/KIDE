// This object manages the instance of the 'working' spinner in the status bar
let spinner;
let inst;
module.exports = {
  init: service => spinner = service,
  while: (text, func) => {
    inst = spinner.reportBusyWhile(text, func);
    inst.then(() => inst = null)
    return inst
  },
  status: text => {
    if (inst) {
      inst.setTitle(text)
    } else {
      inst = spinner.reportBusy(text)
    }
  },
  stop: () => {
    if (inst) {
      inst.dispose()
      inst = null
    }
  }
}
