// Adds some simple wrapper functions for notifications
module.exports = {
  enabled: function () {
    return atom.config.get("compiler-gradle.notify");
  },

  info: function (message, opts) {
    if (this.enabled()) atom.notifications.addInfo(message, opts);
  },

  success: function (message, opts) {
    if (this.enabled()) atom.notifications.addSuccess(message, opts);
  },

  warning: function (message, opts) {
    if (this.enabled()) atom.notifications.addWarning(message, opts);
  },

  error: function (message, opts) {
    atom.notifications.addError(message, opts);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Lifecycle
  /////////////////////////////////////////////////////////////////////////////

  activate: function () {
    this.listener = atom.config.onDidChange("compiler-gradle.notify", function(newValue, oldValue) {
        atom.notifications.addSuccess("Gradle", {
          description: "Notifications " + (newValue ? "enabled" : "disabled")
        });
    });
  },

  deactivate: function () {
    this.listener.despose();
  }
}
