const notify = require('./notify');

// Used to find the location of the Gradle binary, or to prompt to download it.
let cache;
module.exports = findGradle = {
  findGradleBin: silent => {
    if (cache) return cache; // If cached, use that

    let path;

    // Try to get a user-specified path
    path = atom.config.get("compiler-gradle.updates.location");
    if (path != "auto") {
      cache = path
      return path
    }

    // If we got here, the user didn't specify a custom path. Try to find it
    path = require('which').sync("gradle", {nothrow: true})
    if (path != null) {
      cache = path
      return path
    }

    // If we got here, gradle couldn't be automatically found.
    console.log("Could not find Gradle automatically")
    if (!silent) notify.warning("Could not find Gradle automatically", {
      detail: "Please check your PATH, install Gradle, or specify a custom path in settings",
      dismissable: true
    })
    require('./update').check(); // Prompt for updates
    return null;
  },
  activate: () => require('./spinner').while("Checking Gradle", () => {
    require('bin-check')(findGradle.findGradleBin(true), ["-v"]).then(works => {
      if (!works) notify.warning("Invalid Gradle binary", {detail: "BinCheck failed\nTry to specify a direct path to Gradle"})
    })
  }),
  reset: () => {
    cache = null
    findGradle.activate()
  }
}
