/* 
 * This script can be used as a basis to retrieve only the new documents that have been add
 * This ensures that the same documents are not aggregated each time.
 * Alterations can be made to insert other scripts into this while loop to do all functionality at once
 * Alternatively, an existing field (if present) can be used.
 */
const { MongoClient, ServerApiVersion } = require('mongodb');

async function copy({sourceUri, sourceDb, sourceCollection, destUri, destDb, destCollection}) {

    console.log('starting')

    const sourceClient = new MongoClient(sourceUri);
    await sourceClient.connect();
    const sourceJourneyCollection = sourceClient.db(sourceDb).collection(sourceCollection)

    const destClient = new MongoClient(destUri);
    await destClient.connect();
    const destJourneyCollection = sourceClient.db(destDb).collection(destCollection)

// If there is no date field currently present in any documents, take all documents
    let dateToGetFrom
    if (await destJourneyCollection.countDocuments() === 0) {
        dateToGetFrom = new Date('2000-06-29T11:01:15.332+00:00');
    } else {
        dateToGetFrom = (await destJourneyCollection
            .find({})
            .sort({created: -1})
            .limit(1)
            .next())
            .created
        ;
    }

    console.log('dateFrom:' + dateToGetFrom.toString())

    let cur = sourceJourneyCollection.find({created: {$gt: dateToGetFrom}});
    let batchInsert = [];
    while (await cur.hasNext()) {
        let doc = await cur.next();
        batchInsert.push(doc);
    }
    console.log('batch insert ' + batchInsert.length)
    if (batchInsert.length) {
        await destJourneyCollection.insertMany(batchInsert);
    }
}

copy({
    sourceUri: process.env.sourceUri,
    sourceDb: process.env.sourceDb,
    sourceCollection: process.env.sourceCollection,
    destUri: process.env.destUri,
    destDb: process.env.destDb,
    destCollection: process.env.destCollection,
}).then(() => {
    console.log('done')

    process.exit(0)
})

