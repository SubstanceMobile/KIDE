package kide.types

import org.jetbrains.kotlin.descriptors.PropertyDescriptor
import org.jetbrains.kotlin.psi.KtProperty
import org.jetbrains.kotlin.resolve.DescriptorUtils

/////////////////////////////////////////////////////////////////////
// Data types
// https://github.com/JetBrains/kotlin/blob/master/core/descriptors/src/org/jetbrains/kotlin/descriptors/PropertyDescriptor.java
/////////////////////////////////////////////////////////////////////

//   val getter: Function,
//   val setter: Function,
data class Property(
   val name: String,
   val type: String,
   val file: String,
   val isMutable: Boolean,
   val isConst: Boolean,
   val isLateinit: Boolean,
   val isDelegated: Boolean,
   val isOverride: Boolean,
   val defaultValue: String,
   val documentation: KDoc
) {
   override fun toString() = """
   Property: $name
      Type: $type
      File: $file
      Modifiers
         Mutable: $isMutable
         Constant: $isConst
         Late Init: $isLateinit
         Delegated: $isDelegated
         Override: $isOverride
      Default: $defaultValue
      $documentation
   """.trimIndent().trim()
}

/////////////////////////////////////////////////////////////////////
// Parsing
/////////////////////////////////////////////////////////////////////

fun parseProperty(psiProperty: KtProperty, property: PropertyDescriptor): Property {
//      getter = parseFunction(psiProperty.getGetter(), property.getGetter()),
//      setter = parseFunction(psiProperty.getSetter(), property.getSetter()),

   //TODO: Scopes
   // getVisibility
   // getContainingDeclaration
   //val extReceiver = property.getExtensionReceiverParameter()?.getValue()
   // psi.isLocal(), psi.isTopLevel(), psi.isMember()
//   val type = property.getType().unwrap().constructor.getDeclarationDescriptor()

//   val classDescriptor = TypeUtils.getClassDescriptor(property.getType().unwrap())
//   if (classDescriptor != null) println(DescriptorUtils.getFqName(classDescriptor).asString())


   return Property(
      name = property.getName().toString(),
      type = property.getType().resolve(),
      file = property.file(),
      isMutable = property.isVar(),
      isConst = property.isConst(),
      isLateinit = property.isLateInit(),
      isDelegated = property.isDelegated,
      isOverride = DescriptorUtils.isOverride(property),
      defaultValue = property.getCompileTimeInitializer().toString(),
      documentation = parseKDoc(psiProperty.getDocComment()?.getDefaultSection())
   )
}