package kide.types

import org.jetbrains.kotlin.types.isError
import org.jetbrains.kotlin.types.KotlinType
import org.jetbrains.kotlin.descriptors.DeclarationDescriptor

import org.jetbrains.kotlin.resolve.DescriptorUtils
//https://github.com/JetBrains/kotlin/blob/master/core/descriptors/src/org/jetbrains/kotlin/resolve/DescriptorUtils.java
// TODO: Use ^ for refactoring


fun DeclarationDescriptor.resolve(): String = DescriptorUtils.getFqName(this).asString()

fun DeclarationDescriptor.file() = DescriptorUtils.getContainingSourceFile(this).toString()

fun KotlinType.resolve(): String {
   if (this.isError) return this.toString()

   // Compensate for `object : Type` situation
   val clazz = DescriptorUtils.getClassDescriptorForType(this.unwrap())
   if (DescriptorUtils.isAnonymousObject(clazz)) return clazz.getTypeConstructor().getSupertypes().first().resolve()

   // TODO: Find a better way to render type parameters
   val shortName = this.toString()
   val baseName = clazz.resolve().split(".").dropLast(1).joinToString(".")
   return "$baseName.$shortName"
}