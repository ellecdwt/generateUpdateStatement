// Test document
let document = {
  _id: 1,
  "name": "Test Document",
  "posts": [
    {
      _id: 2,
      value: "First Post",
      mentions: []
    },
    {
      _id: 3,
      value: "Post Two",
      mentions: [
        {
          _id: 5,
          text: "First Mention"
        },
        {
          _id: 6,
          text: "Second Mention",
          tags: [
            {
              _id: 7,
              value: "First Tag"
            }
          ]
        }
      ]
    },
    {
      _id: 4,
      value: "three",
      mentions: []
    }
  ],
  "comments": [
    { _id: 8,
      value: "A comment"
    }
  ]
};

/* Output document mutations update statements
 Inputs:
 document - the original document in the db (Sample in this case)
 mutation - the changes to be made to the document
 Output:
 a log of the stringified action that would be taken on the document based on the input
 (could return this if desired, but it didn't specify in the prompt)
 Assumptions:
 1. All documents being mutated are already in the db when this method is being called
 2. Actions can occur across multiple fields, but only 1 Add/Update/Remove each per mutation
 (I made it this way to match the example output which was in { <action>:{}} format,
  with more time I would've adjusted the output to allow however many of each action)
 3. The mutation key matches a top level key in the document
 With more time:
 1. The above mentioned ability to include multiples of each action type in a single mutation
 2. Validation checking on the provided IDs
 3. Replace assumptions pointed out inline with validation code
 4. Better unit tests
*/
let generateUpdateStatement = (document, mutation) => {
  let output = {};

  /* Parses the mutation. Processes Action if appropriate or
    recursively split the mutaiton further if there are nested arrays to investigate
    Input:
    document - the original document that is in the db (or a scoped portion of it)
    mutation - the changes to be made to the document
    path - the current path traversed for the mutation. Begins as the top level doc field (eg "posts")
    field - the current field being traversed
    determine if this is the field being mutated
   to investigate its other fields. If neither,
   Check key/values for other arrays and check those
   If no array fields, then it is update
   */
  let splitMutations = (document, mutation, path, field) => {
    // loop through array objects
    for (let i = 0; i < mutation.length; ++i) {
      // use a copy of the path so other actions are not impacted by updates to it
      let currentPath = path;
      // This object has a delete key, so it should be removed
      if (mutation[i]._delete === true) {
        // update the path with the appropriate index from the document
        currentPath += `.${document[field].indexOf(
          document[field].find((d) => d._id === mutation[i]._id)
        )}`;
        output.$remove = { [currentPath]: true };
      } 
      // This object has no _id key so it should be added
      else if (mutation[i]._id === undefined) {
        // Assumption that there will only be one value here
        let key = Object.keys(mutation[i])[0];
        output.$add = { [currentPath]: [{ [key]: mutation[0][key] }] };
      } 
      // This is either an update on this field or there is a nested value to traverse
      else {
        let isNested = false;
        for (let key in mutation[i]) {
          if (Array.isArray(mutation[i][key])) {
            isNested = true;

            // Narrow the document down to the next level of it
            let filteredDocument = document[field].find((d) => d._id === mutation[i]._id);            
            
            // Get index of matching item from the document for the path
            let idx = document[field].indexOf(filteredDocument);
            currentPath += `.${idx}.${key}`;
            
            // Traverse the next array to find the action to take
            splitMutations(filteredDocument, mutation[i][key], currentPath, key);
          }
        }
        // There were no array values for the field; this is an update on the current field
        if (!isNested) {
          // assumption that ID is the first key and next key is the only other value, would fix this w/ more time
          let key = Object.keys(mutation[0])[1];
          // update path with index from document
          let idx = document[field].indexOf(document[field].find((d) => d._id === mutation[i]._id));
          currentPath += `.${idx}.${key}`;
          output.$update = { [currentPath]: mutation[0][key] };
        }
      }
    }
  };

  // Iterate through each of the subdocument array mutations
  // Examples all shows just one main document entity, but this allows changes to
  // multiple top level fields (eg update posts and add a comment on a document)
  for (let key in mutation) {
    splitMutations(document, mutation[key], key, key);
  }

  // print out the output (could return if preferred)
  console.log(JSON.stringify(output));
};

// Tests
// Update a post
generateUpdateStatement(document, {"posts": [{"_id": 2, "value": "too"}]});
// Add a post
generateUpdateStatement(document, {"posts": [{"value": "Another Post"}]});
// Remove a post
generateUpdateStatement(document, {"posts": [{"_id": 2,"_delete": true}]});
// Update a mention on a post
generateUpdateStatement(document, { "posts": [{"_id": 3, "mentions": [ {"_id": 5, "text": "pear"}]}] })
// Add a mention to a post
generateUpdateStatement(document, {"posts": [{"_id": 3, "mentions": [{"text": "banana"}]}]})
// Add, Remove, Update in one mutation
generateUpdateStatement(document, { "posts": [{ "_id": 2, value: "too" },{ value: "four" },{ _id: 4, _delete: true }]});
// Update an additional nested layer
generateUpdateStatement(document, {"posts": [{ "_id": 3, mentions: [{ _id: 6, tags: [{ _id: 7, value: "Edited Tags" }] }] }]});
// Add a comment
generateUpdateStatement(document, {"comments": [{"value": "Another Comment"}]})
// Add a post and add a comment
generateUpdateStatement(document, {"posts": [{"_id": 3, "value": "Yet Another Post"}],"comments": [{"value": "A third comment"}]})
