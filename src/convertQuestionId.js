const { MongoClient, ServerApiVersion } = require('mongodb');

async function questionIdToInt() {
    const uri = "mongodb+srv://<username>:<password>@<connection string>?retryWrites=true&w=majority"; // Pass in connection string, pw and username can be passed separately
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();
    const journeyStateCollection = client.db("<Database>").collection("<Collection>");
    // Sanity check
    if (db.gr_journeyState.stats().count < 1) {
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
    let ns = db.gr_journeyState.stats().ns;
    let mergeOp = {
        $merge: ns.substring(ns.indexOf(".") + 1)
    };
    let pipeline = [
        setOp,
        mergeOp
    ];
    db.gr_journeyState.aggregate(pipeline);
}
questionIdToInt();
