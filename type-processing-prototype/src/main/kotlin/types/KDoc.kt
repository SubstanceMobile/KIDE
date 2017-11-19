package kide.types

import org.jetbrains.kotlin.kdoc.psi.impl.KDocSection

/////////////////////////////////////////////////////////////////////
// Data Types
/////////////////////////////////////////////////////////////////////

data class KDoc(
   val obj: KDocSection?,
   val title: String,
   val content: String
) {
   override fun toString() = """
Documentation: $title
${content.prependIndent("* ").prependIndent().prependIndent()}
   """.trimIndent().trim()
}

data class KDocTag(
   val tagName: String,
   val subject: String?,
   val content: String
) {
   override fun toString() = "@$tagName $subject $content"
}

/////////////////////////////////////////////////////////////////////
// Functionality
// TODO: Helper methods for all of the flags
/////////////////////////////////////////////////////////////////////

fun KDoc.getTag(tag: String): KDocTag? {
   val rawTag = obj?.findTagByName(tag)
   if (rawTag == null) return null
   return KDocTag(
      tagName = rawTag.getName().toString(),
      subject = rawTag.getSubjectName(),
      content = rawTag.getContent()
   )
}

/////////////////////////////////////////////////////////////////////
// Parsing
// TODO: Parse all sections provided for class
/////////////////////////////////////////////////////////////////////

fun parseKDoc(from: KDocSection?, vararg sections: String): KDoc {
   if (from == null) return KDoc(null, "", "") // If there is no documentation, provide an empty object

   // TODO: parse with sections

   return KDoc(
      obj = from,
      title = from?.getContent()?.split("\n")?.firstOrNull().toString(),
      content = from?.getContent().toString()
   )
}