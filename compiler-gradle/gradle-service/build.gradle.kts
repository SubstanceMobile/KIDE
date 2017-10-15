plugins {
   id("org.jetbrains.kotlin.jvm") version "1.1.51"
   application
   id("com.github.johnrengelman.shadow") version "2.0.1"
}

application {
   mainClassName = "GradleInteropKt"
}

dependencies {
   compile(kotlin("stdlib"))
   compile("org.gradle:gradle-tooling-api:4.2.1")
   runtime("org.slf4j:slf4j-simple:1.7.25")
}

repositories {
   maven { setUrl("https://repo.gradle.org/gradle/libs-releases") }
   jcenter()
}