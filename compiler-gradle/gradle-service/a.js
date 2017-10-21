var uvrun2 = require("uvrun2")
var returnValue = new uvrun2.waitFor()
setTimeout(() => returnValue.provide("First"), 2000)
setTimeout(() => returnValue.provide("Second"), 3000)

var wait = function() {
   var value = returnValue.accept()
   returnValue = new uvrun2.waitFor()
   return value
}

console.log(wait())
console.log(wait())