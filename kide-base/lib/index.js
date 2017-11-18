kideEnv = {
  logger: require("./logger"),

}

module.exports = {
  activate: () => {
    global.kide = kideEnv

    _updateWindowTitle = atom.workspace.updateWindowTitle;
    atom.workspace.updateWindowTitle = function() {
        _updateWindowTitle()
        document.title = document.title.replace("— Atom", "— KIDE")
    }
    atom.workspace.updateWindowTitle()

  },
  deactivate: () => {
    global.kide = undefined
  }
}
