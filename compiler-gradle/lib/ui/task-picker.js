const SelectList = require('atom-select-list')

module.exports = (tasks, clbk) => {
    console.log(tasks)
    close = () => {
      list.destroy()
      panel.destroy()
    }
    list = new SelectList({
      items: tasks,
      filterKeyForItem: item => item.path,
      elementForItem: item => {
        elem = document.createElement("li")
        elem.innerHTML = `<b>${item.name}</b><span class="pull-right">${item.path}</span>`
        elem.innerHTML += `<br><span>${item.description != "null" ? item.description : "&lt;No description&gt;"}</span>`
        return elem
      },
      didConfirmSelection: item => {
        clbk(item.path)
        close()
      },
      infoMessage: "Pick a task or enter a custom one. Type in a comma-seperated list of tasks to run many at once",
      didConfirmEmptySelection: () => {
        clbk(list.getQuery().split(",").map(item => item.trim()))
        close()
      },
      didCancelSelection: close
    });
    panel = atom.workspace.addModalPanel({item: list.element})
    list.focus()
}
