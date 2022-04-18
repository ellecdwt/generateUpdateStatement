# generateUpdateStatement

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
