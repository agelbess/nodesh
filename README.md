# Node runner

## Run locally

    > npm i
    > node-aggregation-and-restructure.sh

## Build the images

    > docker-build.sh

## Run on docker

    > docker-run.sh

Then get the container id and

    > docker exec -it <container> /bin/bash

## Operations

### updateQuestionnaireStateAndQuestionId.js

This file contains the mongosh script that updates the questionnaireState and questionid
of the xx_guidedSelling collections.

Fromm the shell, assuming that the database is named `GuidedSelling`, execute

    > mongosh
    > use GuidedSelling
    > load('./src/updateQuestionnaireStateAndQuestionId.js')

Next, update the questionId

    > questionIdToInt(db.gr_journeyState)

Finally update the questionnaireState

    > updateQuestionnaireState(db.gr_journeyState)

### copyJourneyState.js

This file needs to be executed through nodejs.

To run locally, execute

    > copyJourneyState.sh

### aggregationAndRestructure.js

Run with nodejs.

    > aggregationAndRestructure.sh
