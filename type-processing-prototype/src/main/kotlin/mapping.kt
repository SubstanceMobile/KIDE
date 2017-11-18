package kide

import org.jetbrains.kotlin.descriptors.ClassKind
//Possible??? import org.jetbrains.kotlin.descriptors.*

fun mapResults(results: AnalysisResult) {
   for (property in results.getProperties().asIterable()) {
      println("Property: " + property.value.getName())
      println("   Type: " + property.value.getType().constructor.getDeclarationDescriptor()?.getName())
      println("   Mutable: " + property.value.isVar())
      println("   Constant: " + property.value.isConst())
      println("   Default value: " + property.value.getCompileTimeInitializer()?.toString())
   }

   println() // Give space b/t properties and classes
   for (clazz in results.getDeclaredClasses().asIterable()) {
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