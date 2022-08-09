/* 
 * This script can be used as a basis to retrieve only the new documents that have been add
 * This ensures that the same documents are not aggregated each time.
 * Alterations can be made to insert other scripts into this while loop to do all functionality at once
 * Alternatively, an existing field (if present) can be used.
 */

// If there is no date field currently present in any documents, take all documents
if( db.copied_journeyState.find({}).count() === 0)
{
  dateToGetFrom = new Date('2000-06-29T11:01:15.332+00:00');
} else {
  dateToGetFrom = db.copied_journeyState.find({}).sort({created: -1}).limit(1).map(function(x) {
      return x.created;
  });
}
let cur = db.gr_journeyState.find({created: { $gt: dateToGetFrom }});
let batchInsert = [];
while (cur.hasNext()) {
    let doc = cur.next();
    batchInsert.push(doc);
};
db.copied_journeyState.insertMany(batchInsert);
