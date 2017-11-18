const MessagePanelView = require('atom-message-panel').MessagePanelView;
const PlainMessageView = require('atom-message-panel').PlainMessageView;

let pane;
let tooltip;
module.exports = output = {
  getPane: () => pane,
  add: (line, error) => {
    pane.add(new PlainMessageView({
      message: line,
      className: (error ? "text-error" : "")
    }))
    pane.setSummary({summary: ""}) // Hide the summary text
    pane.updateScroll() // Scroll to bottom
  },
  hide: () => pane.hide(),
  unhide: () => pane.show(),
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
        title: '<span class="icon-file"></span> Build Output',
        rawTitle: true,
        maxHeight: 240
      })

      pane.btnClose.hide() // Hide the close button
      pane.btnFold.hide() // Hide the collapse button
      tooltip = atom.tooltips.add(pane.btnAutoScroll, {title: "Automatic Scrolling"}) // Add tooltip
      pane.heading.parent().click(e => {
        if (e.target != pane.btnAutoScroll[0] || pane.folded) pane.toggle()
      }) // Make the whole header click to expand
      pane.heading.handlers("click").pop() // Fix clicking on title

      pane.attach()
      output.close()
    }
    output.add("No build was run yet", false) // Add a default text
  },
  deactivate: () => {
    pane.close()
    pane = undefined
    tooltip.dispose()
  }
}
