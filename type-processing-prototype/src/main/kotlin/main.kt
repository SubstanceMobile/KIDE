package kide

// Analysis
import org.jetbrains.dokka.AnalysisEnvironment
import org.jetbrains.kotlin.resolve.LazyTopDownAnalyzer
import org.jetbrains.kotlin.resolve.TopDownAnalysisMode
import org.jetbrains.kotlin.cli.common.messages.MessageCollector

typealias AnalysisResult = org.jetbrains.kotlin.resolve.TopDownAnalysisContext

fun main(args: Array<String>) {
   val path = "/home/adrian/Development/Kotlin/TypeProcessing/src/fake/kotlin"
   //TODO: Input

   // Analysis
   val analysisEnv = AnalysisEnvironment(MessageCollector.NONE)
   analysisEnv.addSources(listOf(path))
   val kotlinEnv = analysisEnv.createCoreEnvironment()
   val analyzer = analysisEnv.createResolutionFacade(kotlinEnv).getFrontendService(LazyTopDownAnalyzer::class.java)

   // Resolving
   val results = analyzer.analyzeDeclarations(TopDownAnalysisMode.TopLevelDeclarations, kotlinEnv.getSourceFiles())
   mapResults(results)
}