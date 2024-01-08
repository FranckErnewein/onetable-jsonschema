# Onetable-jsonschema

convert JSON schema into OneTable Schema


## Example

```js
const { Table } = require("dynamodb-onetable");
const ontableJsonSchema = require("onetable-jsonschema");


// define a JSON schema
const UserSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  },
  required: ["name"],
  additionalProperties: false
};

// convert it as OneTable schema
const User = ontableJsonSchema.default(UserSchema)

console.log(User); 
// output:
//{
//  name: { type: [Function: String], required: true },
//  age: { type: [Function: Number] }
//}


// init OneTable
new Table({ schema: { models: { User } } });

```
