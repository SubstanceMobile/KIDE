// Gradle Tooling API
import org.gradle.tooling.*
import org.gradle.tooling.model.build.BuildEnvironment
import org.gradle.tooling.model.GradleProject

// Progress Listener
import org.gradle.tooling.events.ProgressListener
import org.gradle.tooling.events.ProgressEvent
import org.gradle.tooling.events.OperationType

// IO Imports
import java.io.File
import java.io.PrintStream
import java.io.OutputStream

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Status and error codes
// 0xF* = API Code
// 0x0* = Implementation Code
// 0x00 = Reserved for IDE default state
//////////////////////////////////////////////////////////////////////////////////////////////////////////

object Codes {
   val BUILDING =                0xF0 // Note: This code is used while the program is building. Keep stable until new release of API
   val RUNNING =                 0xF1 // Note: This code signifies that the program is starting to run. Keep stable until new release of API
   val READY =                   0xF2 // Can change whenever
   val EXIT =                    0xF3 // Can change whenever
   val VERSION_MISMATCH =        0xF4 // NOTE: The IDE does not know this code if it occurs on the init sequence. Keep stable until new release of API
   val INVALID =                 0xF5 // Can change whenever

   // Implementation Codes. The IDE is aware of all of these and they can be changed whenever.
   val BUILD_SUCCESSFUL =        0x01
   val BUILD_FAILED =            0x02
   val CANCELLING_BUILD =        0x03
   val NO_PROJECT_CONNECTION =   0x04
   val PROJECT_CLOSED =          0x05
   val NO_BUILD_RUNNING =        0x06
   val BUILD_STARTING =          0x07
   val PROJECT_OPENED =          0x08
}

fun getCodes() = """
{
   "BUILDING": ${Codes.BUILDING},
   "RUNNING": ${Codes.RUNNING},
   "READY": ${Codes.READY},
   "EXIT": ${Codes.EXIT},
   "VERSION_MISMATCH": ${Codes.VERSION_MISMATCH},
   "INVALID": ${Codes.INVALID},
   "BUILD_SUCCESSFUL": ${Codes.BUILD_SUCCESSFUL},
   "BUILD_FAILED": ${Codes.BUILD_FAILED},
   "CANCELLING_BUILD": ${Codes.CANCELLING_BUILD},
   "NO_PROJECT_CONNECTION": ${Codes.NO_PROJECT_CONNECTION},
   "PROJECT_CLOSED": ${Codes.PROJECT_CLOSED},
   "NO_BUILD_RUNNING": ${Codes.NO_BUILD_RUNNING},
   "BUILD_STARTING": ${Codes.BUILD_STARTING},
   "PROJECT_OPENED": ${Codes.PROJECT_OPENED}
}
""".formatJSON()

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Implementation of commands
//////////////////////////////////////////////////////////////////////////////////////////////////////////

// Main connection to the project
var connection: ProjectConnection? = null

// Models
var env: BuildEnvironment? = null
var gradleProj: GradleProject? = null

// For builds
var building = false
var cancellation = GradleConnector.newCancellationTokenSource()

fun project(path: String, params: Map<String, String>) {
   if (connection != null) closeProject() // Make sure we clean up after the previous project if we are defining a new one
   val connector = GradleConnector.newConnector().forProjectDirectory(File(path))
   if (params.containsKey("version")) connector.useGradleVersion(params.get("version"))
   connection = connector.connect()

   // TODO: env = connection?.getModel<BuildEnvironment>()
   env = safeCall<BuildEnvironment> {
      connection?.getModel(BuildEnvironment::class.java)
   }
   gradleProj = safeCall<GradleProject> {
      connection?.getModel(GradleProject::class.java)
   }

   status(Codes.PROJECT_OPENED)
}

fun getGradleVersion() = if (env == null) {
   error(Codes.NO_PROJECT_CONNECTION)
   "null"
} else env?.getGradle()?.getGradleVersion() ?: "null"

fun getTasks(): String {
   if (gradleProj == null) {
      error(Codes.NO_PROJECT_CONNECTION)
      return "null"
   }

   var tasks = ""
   val createTasksString: (GradleProject) -> Unit = { project ->
      for (task in project!!.getTasks().getAll()) {
        if (tasks != "") tasks += ","
        tasks += """
           {
              "name": "${task.name}",
              "path": "${task.path}",
              "description": "${task.description?.jsonKeepSpace()}",
              "group": "${task.group}"
           }
        """
     }
   }
   try {
      createTasksString(gradleProj!!)
      for (child in gradleProj!!.getChildren().getAll()) createTasksString(child!!)
   } catch (ignored: Exception) {}

   return """
      [
         $tasks
      ]
   """.formatJSON()
}

fun runTasks(tasks: Array<String>) {
   if (connection == null) {
      error(Codes.NO_PROJECT_CONNECTION)
      return;
   }

   val taskListener = object: ProgressListener {
      override fun statusChanged(event: ProgressEvent) {
         val taskName = event.descriptor.name
         if (event.displayName.contains("SUCCESS")) {
            display("Task $taskName successful")
         } else if (event.displayName.contains("failed")) {
            display("Task $taskName failed")
         } else display("Running task: ${taskName.removePrefix(":")}")
      }
   }

   val exitHandler: ResultHandler<Void?> = object : ResultHandler<Void?> {
      override fun onComplete(result: Void?) = done(Codes.BUILD_SUCCESSFUL)
      override fun onFailure(exception: GradleConnectionException) = done(Codes.BUILD_FAILED)
      fun done(status: Int) {
         println() // The status ends up on an 'output;' command, so print a newline
         status(status)
         building = false
      }
   }

   val build = connection!!.newBuild().forTasks(*tasks).withArguments("--console", "plain") // Create a build
   build.addProgressListener(taskListener, OperationType.TASK) // Configure progress listeners
   build.setStandardOutput(GradlePrinter(System.out)).setStandardError(GradlePrinter(System.err)) // Configure IO

   // TODO: Stdin

   build.withCancellationToken(cancellation.token()) // Link the cancel command
   status(Codes.BUILD_STARTING)
   display("Gradle build starting...")
   build.run(exitHandler);
   building = true
}

fun tell(text: String) = "" //TODO

fun cancel(quiet: Boolean = false) {
   if (!building) {
      if (!quiet) error(Codes.NO_BUILD_RUNNING)
      return;
   }

   cancellation.cancel()
   cancellation = GradleConnector.newCancellationTokenSource() // Make a new source
   status(Codes.CANCELLING_BUILD)
}

fun closeProject() {
   if (connection == null) {
      error(Codes.NO_PROJECT_CONNECTION)
      return;
   }

   cancel(quiet = true)
   connection = null
   env = null
   gradleProj = null
   status(Codes.PROJECT_CLOSED)
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Supporting code
//////////////////////////////////////////////////////////////////////////////////////////////////////////

class GradlePrinter(val stream: PrintStream): OutputStream() {
  var output = ""
  var firstLine = true

  override fun write(byte: Int) {
      output += byte.toChar()
   }

   override fun write(bytes: ByteArray) {
     output += bytes.map { it.toChar() }.joinToString("")
   }

   override fun write(bytes: ByteArray, offset: Int, length: Int) {
      for (i in offset..(length - 1)) write(bytes[i].toInt())
   }

   override fun flush() {
      if (firstLine) {
         output = "output; $output"
         firstLine = false
      }
      stream.print(output.replace("\n", "\noutput; "))
      output = "" // Clear out the buffer
   }
}

fun String.jsonKeepSpace() = this.replace("\\s".toRegex(), "\uFFFD")
fun String.formatJSON() = this.replace("\\s".toRegex(), "").replace("\uFFFD", " ").trimIndent().trim()

fun <T: Any?> safeCall(func: () -> T?): T? {
   try { return func() } catch (ignored: Exception) { return null }
}
