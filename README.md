# api_translate
Convert one API response into another

## Usage

Let's say we got our documents and want to convert them to some other useful formats.

```doc_set =[
[
{aid:1, name:"Bob"},
{aid:2, name:"Bobb"}
],

[
{aid:1, surname: "Smith"},
{aid:2, surname: "Jones"}
],

[
{catId:1, aid:1},
{catId:2, aid:1},
{catId:3, aid:1},
{catId:4, aid:2},
{catId:5, aid:2}
]]; 
```

To accomplish this, we want to call render with a the document set and rules to transform the document.

## Accessing Elements
Keys are a list which resolves to some place in either the global or local document. It gets elements of a list, or keys if supplied. Some Examples:

[0] returns [
{aid:1, name:"Bob"},
{aid:2, name:"Bobb"}
]

[0,"aid"] returns [1,2]

["l"] returns the local document, and works the same as any other key. Note that "l" must be the first element; subsequent use of "l" will look for elements literally called l in the global document.

## Rules
Rules are an object; each rule has an output field, which takes the result of the current rule and runs the output rule on it. This can be chained as far as recursion will allow. Different rules take different fields, so let's look at our rules.

### Join
[0] join [1] on 'aid' should return
```
[
{aid: 1, name: Bob, surname: Smith},
{aid: 2, name: Bobb, surname: Jones}
]
```
Join finds the first record in "on" which matches each key in "key".
Join takes a key, which is the path of the key to join on, and a field "on" which is expected to have a matching key, which is *not specified in the "on" field*.


So, the corresponding rule for this is 
```
rule_set_join = {
type: "join",
key: [0, "aid"],
on: [1]
}
```

### Group
Group takes the same parameters as Join, but collects all in "on" which match "key".
In addition to the parameters from Join, Group can take an "as" parameter which stores the results of the group under that name. If no "as" is specified, it's stored under "grouping". I recommend specifying "as", especially if you plan on using the grouping in an output rule.

```
rule_set_group = {
type: "join",
key: [0, "aid"],
on: [1],
output: {
  type: "group",
  key: ["l", "aid"],
  on: [2],
  as: 'cats'
}
}
```
Which represents a join b group c as cats, and should be
```
[
{aid: 1, name: Bob, surname: Smith, cats:[{catId:1},{catId:2},{catId:3}]},
{aid: 2, name: Bobb, surname: Jones, cats:[{catId:4},{catId:5}]}
]
```

### Select
Select Simply takes in a key and returns that selection.
