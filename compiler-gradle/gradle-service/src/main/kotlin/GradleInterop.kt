import kotlin.system.exitProcess

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Communication
//////////////////////////////////////////////////////////////////////////////////////////////////////////

const val VER = 1 // Version of this API
fun main(args: Array<String>) {

   if (input("version:api") != "return; $VER") {
      error(Codes.VERSION_MISMATCH)
      exitProcess(1)
   }

   setup("codes", getCodes())
   status(Codes.READY)

   listen@ while (true) {
      // Process the input to parse commands
      var ln = input() ?: ""
      if (ln.split(";").size < 2) ln += ";" // Add the ; if the command is missing it (make this tool human-proof)
      val command = ln.split(";")[0].split(",")[0].trim()
      val modifiers = ln.removePrefix(command).removePrefix(",").trim().split(";")[0].split(",").map { it.trim() }.filter { it != "" }
      val flags = modifiers.filter { it.indexOf(":") == -1 }
      val parameters = modifiers.filter { it.indexOf(":") != -1 }.associate {
         val raw = it.split(":")
         raw[0] to raw.drop(1).joinToString(":")
      }
      val data = ln.split(";").drop(1).joinToString(";").trim()

      // Command structure:
      // command, flag, flag, parameter:data, parameter=data2; dataForCommand
      // ^(req)   ^(called modifiers, optional               ) ^(optional   )
      // Notes:
      //    command cannot contain semicolons or commas, but can contain colons
      //    parameters can contain colons in their data
      //    flags cannot contain colons, or else they will become parameters
      //    all modifiers cannot contain commas or semicolons
      //    data can contain any character
      //println("IGNORE; Debug: command=$command, modifiers=$modifiers, flags=$flags, params=$parameters, data=$data") // Used to test command processing

      when (command) {
         "IGNORE", "COMMENT", ":" -> { /* do nothing */ }
         "testCommand" -> test(command = command, data = data, flags = flags, params = parameters)
         "?codes" -> ret(getCodes())
         "done" -> {
            cancel(quiet = true)
            break@listen
         }

         "tell" -> tell(text = data)

         "project" -> project(path = data, params = parameters)
         "task" -> runTasks(tasks = data.split(",").map {it.trim()}.toTypedArray())
         "cancel" -> cancel()
         "closeProject" -> closeProject()
         "?version:gradle" -> ret(getGradleVersion())
         "?tasks" -> ret(getTasks())
         else -> error(Codes.INVALID)
      }
   }
   status(Codes.EXIT)
   exitProcess(0)
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// The test output command
//////////////////////////////////////////////////////////////////////////////////////////////////////////

fun test(command: String, data: String, flags: List<String>, params: Map<String, String>) {
   println("Command: $command")
   if (data != "") println("Data: $data")
   for (flag in flags) println("Flag: $flag")
   for (key in params.keys) println("Param: $key = ${params.get(key)}")
   println()
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Commands that the IDE supports
//////////////////////////////////////////////////////////////////////////////////////////////////////////

fun setup(module: String, data: String) = println("setup, $module; $data") // Prep the IDE to recieve data to set up communications with this tool
fun status(code: Int) = println("status; $code") // Send the IDE a status code
fun display(status: String) = println("\ndisp; $status") // Tell the IDE to display some status text
fun error(code: Int) = println("error; $code") // Notify the IDE of an error
fun ret(value: String) = println("return; $value") // Send data back to the IDE

// Prompt the IDE for data
fun input(prompt: String = "command"): String? {
   println("?$prompt;")
   return readLine()
}
