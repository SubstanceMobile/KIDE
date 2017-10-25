//TODO:
//https://github.com/31i73/atom-output-panel
//https://atom.io/packages/bottom-dock

// This object manages the interactive run panel
let panel;
let inst;
module.exports = runner = {
  running: false,
  panel: () => panel,
  init: service => {
    panel = service
    panel.initialise = function() {}
  },
  run: (bin, args) => {
    runner.stop()
    inst = panel.run(true, bin, args)
    running = true
  },
  open: () => inst.show(),
  close: () => inst.hide(),
  toggle: () => inst.toggle(),
  clear: () => inst.clear(),
  stop: () => {
    if (inst) inst.stop()
    running = false
  }
}
