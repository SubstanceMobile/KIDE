#!/bin/bash
cd `dirname $0`
echo "status; 240" # building; notify the ide to ignore all of the stuff going on afterwards and to send errors as notifications
./gradlew -q shadowJar --console plain
echo "status; 241" # running; notify the ide to start listening
java -jar build/libs/gradle-service-all.jar
