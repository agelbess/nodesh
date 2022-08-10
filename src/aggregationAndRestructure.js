const { MongoClient, ServerApiVersion } = require('mongodb');

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */
const uri = process.env.mongouri;
const database = process.env.database;
const collection = process.env.collection;
const tmpCollection = process.env.tmpCollection;
const dashboardCollection = process.env.dashboardCollection;

async function getConnection() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    await client.connect();
    await client.db(database).collection(tmpCollection).deleteMany({})
    await aggregateData(client); 
    await structureData(client);
    client.close();
}

/*
 * This function takes the data that has been processed to an object and carries out a number of aggregations to result in counting the number of times an answer is given and number of times a question is answered.
 * The below aggregation can be altered as needed.
 * All field names that are not in the 'gr_journeyState' collection are assumptions and can/ may need to be be changed.
 * The field 'objectQuestionnaireState' is a result of the script to convert the 'questionnaire' field to an object.
 * With information provided, this aggregation groups on the 'currentQuestionIndex' as the questionID.
 * There is a question ID located within the 'answers' object which may be required to group by instead. 
 * If done, this will need updating in the aggregation and the question text mapping.
 * For information on each aggregation stage see: https://www.mongodb.com/docs/manual/meta/aggregation-quick-reference/ 
 * The below 'agg' can be imported into the aggregation builder within Atlas or Compass for easy altering.
 */
async function aggregateData(client) {
const agg = [
    {
      '$match': {
        'questionnaireState.questionnaire.answers.questionIndex': {
          '$ne': null, 
          '$exists': true
        }
      }
    }, {
      '$project': {
        'questionTitles': {
          '$arrayElemAt': [
            '$questionTitles', '$objectQuestionnaireState.questionnaire.currentQuestionIndex'
          ]
        }, 
        'objectQuestionnaireState.questionnaire.selections': 1, 
        'objectQuestionnaireState.questionnaire.currentQuestionIndex': 1, 
        'market': 1, 
        '_class': 1
      }
    }, {
      '$group': {
        '_id': '$objectQuestionnaireState.questionnaire.currentQuestionIndex', 
        'questionInfo': {
          '$addToSet': {
            'text': '$questionTitles', 
            'market': '$market', 
            '_class': '$_class', 
            'selections': '$objectQuestionnaireState.questionnaire.selections'
          }
        }, 
        'timesAnswered': {
          '$count': {}
        }
      }
    }, {
      '$unwind': {
        'path': '$questionInfo', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$project': {
        'timesAnswered': 1, 
        'questionInfo.text': 1, 
        'questionInfo.market': 1, 
        'questionInfo._class': 1, 
        'selections': {
          '$objectToArray': '$questionInfo.selections'
        }
      }
    }, {
      '$unwind': {
        'path': '$selections', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$group': {
        '_id': {
          'questionIndex': '$_id', 
          'questionsInfo': '$questionInfo', 
          'selections': '$selections.v', 
          'timesAnswered': '$timesAnswered'
        }
      }
    }, {
      '$unwind': {
        'path': '$_id.selections', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$group': {
        '_id': {
          'answer': '$_id.selections', 
          'questionInfo': '$_id.questionsInfo', 
          'questionIndex': '$_id.questionIndex', 
          'timesQuestionAnswered': '$_id.timesAnswered'
        },
        'timesAnswerGiven': {
          '$count': {}
        }
      }
    }, {
      '$sort': {
        'timesAnswerGiven': -1
      }
    }
  ];

    const journeyStateCollection = client.db(database).collection(collection); // Insert the database and collection in which the data to aggregate is stored.
    let result = await journeyStateCollection.aggregate(agg).toArray();
    console.log(result.length);
    let batchInsert = [];
    let date = new Date()
    let today = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2); // Add the field for the date aggregated. This will allow dashboards to be built on time ranges.
    for (let doc = 0; doc < result.length; doc++) {
        result[doc].dateAggregated = today;
        batchInsert.push(result[doc]);
    };
    const aggCollection = client.db(database).collection(tmpCollection); // Write the raw aggregated data to a temp table for restructuring.
    await aggCollection.insertMany(batchInsert);
}

/* This function takes the aggregated resulting data in the 'tempColl' and restructures it to the required format.
 * This function can be changed to alter the end data structure to change as needed.
 * As this is an update, there shall be an addition to the document showing how many times each answer was given, adding on new fields with figures on each pass.
 * To split this by date, add in a date field (as above) and put this in the 'find' parameter.
 */ 
async function structureData(client){
    const tempColl = client.db(database).collection(tmpCollection);
    let cur = await tempColl.find().toArray();
    const structure = client.db(database).collection(dashboardCollection);
    let bulkOps = await structure.initializeUnorderedBulkOp();
    cur.forEach(function (doc) {
        bulkOps.find({questionIndex: doc._id.questionIndex}).upsert().updateOne(
            {
                $set: {
                    questionIndex: doc._id.questionIndex,
                    text: doc._id.questionInfo.text,
                    timesAnswered: doc._id.timesQuestionAnswered,
                    _class: doc._id.questionInfo._class,
                    date: doc.dateAggregated,
                    market: doc._id.questionInfo.market
                },
                $push: {
                    answers: {
                        answerText: doc._id.answer,
                        timesAnswered: doc.timesAnswerGiven
                    }
                }
            },{
                upsert: true
            }
        );
    });
    return await bulkOps.execute();
}
getConnection();
