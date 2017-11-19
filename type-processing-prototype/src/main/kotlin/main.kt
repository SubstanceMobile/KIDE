package kide

// Analysis
import org.jetbrains.dokka.AnalysisEnvironment
import org.jetbrains.kotlin.resolve.LazyTopDownAnalyzer
import org.jetbrains.kotlin.resolve.TopDownAnalysisMode
import org.jetbrains.kotlin.cli.common.messages.MessageCollector
import java.io.File

typealias AnalysisResult = org.jetbrains.kotlin.resolve.TopDownAnalysisContext

fun main(args: Array<String>) {
   val path = if (args.size > 0) args[0] else "/home/adrian/Development/KIDE/type-processing-prototype/src/fake/kotlin/test.kt"
   val libPath = "/home/adrian/Development/KIDE/type-processing-prototype/lib/kotlin-ide-common.jar"
   val libPath1 = "/home/adrian/Development/KIDE/type-processing-prototype/lib/intellij-core-analysis.jar"
   //TODO: Input

   // Analysis
   val analysisEnv = AnalysisEnvironment(MessageCollector.NONE)
   analysisEnv.addSources(listOf(path))
   analysisEnv.addClasspath(File(libPath))
   analysisEnv.addClasspath(File(libPath1))
   val kotlinEnv = analysisEnv.createCoreEnvironment()
   val analyzer = analysisEnv.createResolutionFacade(kotlinEnv).getFrontendService(LazyTopDownAnalyzer::class.java)

   // Resolving
   val results = analyzer.analyzeDeclarations(TopDownAnalysisMode.TopLevelDeclarations, kotlinEnv.getSourceFiles())
   mapResults(results)
}