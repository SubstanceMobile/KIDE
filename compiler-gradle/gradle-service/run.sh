#!/bin/bash
echo "status: 0" # building; notify the ide to ignore all of the stuff going on afterwards and to send errors as notifications
./gradlew -q shadowJar --console plain
echo "status: 1" # running; notify the ide to start listening
java -jar build/libs/GradleService-all.jar