// Renaming the atom window
_updateWindowTitle = atom.workspace.updateWindowTitle;
atom.workspace.updateWindowTitle = function() {
    _updateWindowTitle()
    document.title = document.title.replace("— Atom", "— KIDE")
}

// Adding a kide object
global.kide = {

}
