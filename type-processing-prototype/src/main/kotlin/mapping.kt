package kide

import kide.types.*

//TODO: Remove
import org.jetbrains.kotlin.descriptors.ClassKind



fun mapResults(results: AnalysisResult) {
   for ((psi, descriptor) in results.getProperties()) println(parseProperty(psi, descriptor))
   println()

   //for ((psi, descriptor) in results.getDeclaredClasses()) println(parseClass(psi, descriptor))
   //println()

   //for ((psi, descriptor) in results.getFunctions()) println(parseFunction(psi, descriptor))
   //println()

   println() // Give space b/t properties and classess
   for (clazz in results.getDeclaredClasses().asIterable()) {
      // When parsing documentation, make sure to get property and construtor sections
      println("Class: " + clazz.value.getName())
      println("   Data: " + clazz.value.isData())
      println("   isCompanion: " + clazz.value.isCompanionObject())
      println("   Kind: " + clazz.value.getKind().let {
        when (it) {
         ClassKind.CLASS -> "Class"
         ClassKind.INTERFACE -> "Interface"
         ClassKind.ENUM_CLASS -> "Enum"
         ClassKind.ENUM_ENTRY -> "Enum (entry)"
         ClassKind.ANNOTATION_CLASS -> "Annotation"
         ClassKind.OBJECT -> "Object"
        }
      })
   }

   // TODO: Other results
}