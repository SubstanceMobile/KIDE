plugins {
  kotlin("jvm") version "1.1.60"
  application
  id("com.github.johnrengelman.shadow") version "2.0.1"
}

application {
   mainClassName = "kide.MainKt"
}

repositories {
   jcenter()
}

dependencies {
   compile(kotlin("stdlib"))
   compile(kotlin("compiler"))
   compile(fileTree("lib/")) // NOTE: Make sure to keep these up to date from time to time
}