package sdk.plugin

import org.gradle.api.*
import org.gradle.api.tasks.*
import org.gradle.script.lang.kotlin.*

import java.io.File
import java.io.FileInputStream
import java.io.SequenceInputStream
import java.util.Properties
import groovy.util.XmlParser
import groovy.util.Node
import groovy.util.NodeList
import de.undercouch.gradle.tasks.download.Download
import org.gradle.api.logging.configuration.ConsoleOutput

// Sets up a download task for the Android SDK if necessary.

/**
 * Testing
 *
 * Asdf `testing` _asdf_ __bold__ *bold* **bold**
 *    asdf
 *    asdf
 *
 * @param Asdf Test
 *
 * @return Ayy lmao
 */
fun Project.configureAndroidSdk() : Boolean {
	pluginManager.apply("de.undercouch.download") // Enable the Project.download function

	val os = System.getProperty("os.name")
	val sdkHome = when {
		os.startsWith("Windows") -> System.getenv("LOCALAPPDATA").removeSuffix("\\")
		os.startsWith("Mac") -> System.getenv("HOME").removeSuffix("/") + "/Library"
		else -> System.getenv("HOME").removeSuffix("/")
	}
	val defaultSdkPath = file("$sdkHome/Android/${if (os == "Linux") "Sdk" else "sdk"}")

	if (!checkForSdk(defaultSdkPath)) {

		// Pick where to install to
		val customPath = (parent.properties[Constants.ANDROID_SDK_INSTALL_ARGUMENT] as String?)
		if (customPath != null) println("Installing to custom location: $customPath. Please make sure you manually specify this location for other projects to avoid duplicate installs.")
		val path = file(customPath ?: defaultSdkPath.absolutePath)

		val repoTmpFile = file("$buildDir/sdk-repo.tmp") // The file of the Android SDK repository metadata
		val sdkTmpFile = file("$buildDir/sdk-tools.tmp") // The file of the Android SDK tools zip file

		val downloadRepo = task<Download>("downloadAndroidToolsRepo") {
			src("https://dl.google.com/android/repository/repository2-1.xml")
			dest(repoTmpFile)
			quiet(true)
		}
		val downloadSdk = task("downloadAndroidSdk") {
			dependsOn(downloadRepo)
		}.doLast {
			fun Node.getVersion(): String {
				val versionNode = (this.get("revision") as NodeList).get(0) as Node
				fun versionPart(name: String) = ((versionNode.get(name) as NodeList).get(0) as Node).text()
				return "${versionPart("major")}.${versionPart("minor")}.${versionPart("micro")}"
			}
			fun Node.children(name: String) = get(name) as MutableList<Node>
			fun Node.child(name: String) = children(name).get(0)
			val platformName = when {
				os.startsWith("Windows") -> "windows"
				os.startsWith("Mac") -> "macosx"
				os == "Linux" -> "linux"
				else -> throw GradleException("The Android SDK doesn't support this platform ($os)")
			}

			val xml = XmlParser().parse(repoTmpFile)
			val tools = xml.children("remotePackage").filter { it.attribute("path") == "tools" }.toMutableList()
			tools.sortBy { it.getVersion() }
			val archive = tools[tools.lastIndex].child("archives").children("archive").filter {
				it.child("host-os").text() == platformName
			}.get(0)
			val file = archive.child("complete").child("url").text()

			download { // Do the download
				src("https://dl.google.com/android/repository/$file")
				dest(sdkTmpFile)
			}
		}
		val extractSdk = task<Copy>("extractAndroidSdk") {
			dependsOn(downloadSdk)
			from(zipTree(sdkTmpFile))
			into(path)
		}

		val acceptLicenses = task<Exec>("acceptAndroidSdkLicenses") {
			dependsOn(extractSdk)
			workingDir = path
			standardInput = if ((parent.properties[Constants.ANDROID_SDK_LICENSES_ARGUMENT] as String?) == "y") {
				"y\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\n".byteInputStream() // Accept everything
			} else {
				SequenceInputStream("y\n".byteInputStream(), System.`in`)
			}
			commandLine("tools/bin/sdkmanager", "--licenses")
		}

		// If the SDK doesn't exist at the default path, add a download task
		task(Constants.ANDROID_SDK_TASK) {
			description = "Download the Android SDK and accept all of its licenses."
			group = "build setup"

			dependsOn(acceptLicenses)
			doLast {
				foundSdkAt(path) // Save the SDK directory
				repoTmpFile.delete()
				sdkTmpFile.delete()
			}
		}

		return false // Don't configure anything without an SDK
	} else {
		return true
	}
}

private fun Project.checkForSdk(path: File) : Boolean {
	if (System.getenv("ANDROID_HOME") != null && System.getenv("ANDROID_HOME") != "") return true

	val props = loadLocalProperties()
	if (props.getProperty("sdk.dir") != null) return true

	if (!path.isDirectory() || !file("${path.absolutePath}/tools").isDirectory()) {
		println("Couldn't find the Android SDK in the default location ($path). Please specify its location manually or download it with `android:${Constants.ANDROID_SDK_TASK}`")
		return false
	}

	foundSdkAt(path, props = props)
	return true
}

private fun Project.loadLocalProperties(path: File = file("$rootDir/local.properties")): Properties {
	val props = Properties()
	if (path.exists()) props.load(FileInputStream(path))
	return props
}

private fun Project.foundSdkAt(path: File,
	propsFile: File = file("$rootDir/local.properties"),
	props: Properties = loadLocalProperties()) {

	props.setProperty("sdk.dir", path.absolutePath)
	props.store(propsFile.printWriter(), """
			This file was generated by the SDK Gradle plugin to locate the Android SDK
			If you edit this file, your changes WILL NOT be overwritten. Deleting the `sdk.dir` tag may lead to the SDK recreating it
			Exclude this file from version control, as it is system dependent
	""".trimIndent().trim())
}
