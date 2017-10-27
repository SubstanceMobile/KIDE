// Renaming the atom window
_updateWindowTitle = atom.workspace.updateWindowTitle;
atom.workspace.updateWindowTitle = function() {
    _updateWindowTitle()
    document.title = document.title.replace("— Atom", "— KIDE")
}

// Adding a kide object
global.kide = {

}


 //https://github.com/stefanbirkner/system-rules/blob/master/src/main/java/org/junit/contrib/java/lang/system/TextFromStandardInputStream.java