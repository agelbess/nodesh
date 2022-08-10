// These can be loaded into mongosh with the load("path/to/file") method
// Ref.: https://www.mongodb.com/docs/manual/reference/method/load/

// Usage: updateQuestionnarieState(db.<collection>)
/**
 *
 * @param {db.collection} journeyStateCollection
 */
function updateQuestionnaireState(journeyStateCollection) {
    // Sanity check
    if (journeyStateCollection.stats().count < 1) {
        console.log("Empty collection");
        return;
    }

    // Parse questionnaireState to JSON object and update
    let cur = journeyStateCollection.find();
    let bulkOps = journeyStateCollection.initializeUnorderedBulkOp();
    let count = 0
    while (cur.hasNext()) {
        let doc = cur.next();
        try {
            let object = JSON.parse(doc.questionnaireState);
            count++
            bulkOps.find({_id: doc._id}).updateOne(
                {
                    $set: {
                        questionnaireState: object
                    }
                }
            );
        } catch (e) {
            // if fails, then it is already an object
        }
    };
    console.log('bulkOps: ' + count)
    if (count) {
        return bulkOps.execute();
    }
}

// Usage: questionIdToInt(db.<collection>)
/**
 *
 * @param {db.collection} journeyStateCollection
 */
function questionIdToInt(journeyStateCollection) {
    // Sanity check
    if (journeyStateCollection.stats().count < 1) {
        console.log("Empty collection");
        return;
    }

    // Convert questionId field value from string to integer
    let setOp = {
        $set: {
            questionId: {
                $toInt: "$questionId"
            }
        }
    };
    let ns = journeyStateCollection.stats().ns;
    let mergeOp = {
        $merge: ns.substring(ns.indexOf(".") + 1)
    };
    let pipeline = [
        setOp,
        mergeOp
    ];
    journeyStateCollection.aggregate(pipeline);
}
