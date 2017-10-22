
const MessagePanelView = require('atom-message-panel').MessagePanelView;
const PlainMessageView = require('atom-message-panel').PlainMessageView;

let pane;
module.exports = output = {
  pane: pane,
  add: (line, error) => {
    pane.add(new PlainMessageView({
      message: line,
      className: (error ? "text-error" : "")
    }))
  },
  open: () => pane.unfold(),
  close: () => {
    if (!pane.folded) pane.toggle()
  },
  toggle: () => pane.toggle(),
  reset: () => pane.clear(),

  /////////////////////////////////////////////////////////////////////////////
  // Language
  /////////////////////////////////////////////////////////////////////////////

  activate: () => {
    if (!pane) {
      pane = new MessagePanelView({
        title: "Gradle Build"
      })
      pane.attach()
      output.close()
    }
  },
  deactivate: () => {
    pane.close()
  }
}
