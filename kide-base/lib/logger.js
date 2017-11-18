module.exports = TAG => {
  logger = {
    info: message => {
      console.log(`I:[${TAG}] ${message}`)
    },
    debug: message => {
      if (atom.inDevMode()) console.log(`D:[${TAG}] ${message}`)
    },
    warn: message => {
      console.error(`W:[${TAG}] ${message}`)
    },
    error: message => {
      console.error(`E:[${TAG}] ${message}`)
    }
  }
  return logger
}
