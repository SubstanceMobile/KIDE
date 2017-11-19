#!/usr/bin/env bash
cd `dirname $0`
./gradlew -q shadowJar --console plain &&
   java -jar build/libs/type-processing-prototype-all.jar $1