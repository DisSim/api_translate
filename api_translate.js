doc_set = [] // global document

// use a number as the first element to get that document, else use l to use local input
function resolve_key(input, rules){
  // gets the global relevant subsection given a rule
  // first element should tell us to look global or local
  if (rules[0] === "l"){
    doc = input;
    ruleset = rules.slice(1);
  }else {
    doc = ruleset;
    ruleset = rules;
  }
  for (var rule in ruleset){
    if (Array.isArray(doc) && isNaN(rules[rule])){
      var new_doc_set = [];
      for (var item in doc){
        new_doc_set.push(doc[item][rules[rule]]);
      }
      doc = new_doc_set;
    }
    // if it's a list, make a list resolved by the rule
    // otherwise, just access using the rule
    else{
      doc = doc[rules[rule]];
      console.log('num')
    }
  }
  return doc;
}

function join(first, second, key){
  // single join, so only get first
  var result=[];
  loop1:
  for (var rec in first){
    loop2:
    for (var pmatch in second){
      if (first[rec][key] === second[pmatch][key]){
        Object.keys(first[rec]).concat(Object.keys(second[pmatch])).forEach((x)=>first[rec][x] = first[rec][x] || second[pmatch][x]);
        result.push(first[rec]);
        continue loop1;
      }
    }
  }
  return result;
}

function group(first, second, key, as){
  // group all which match
  as = as || "grouping";
  for (rec in first){
    first[rec][as] = [];
    for (var pmatch in second){
      if (first[rec][key] === second[pmatch][key]){
        delete second[pmatch][key]
        first[rec][as].push(second[pmatch]);
      }
    }
  }
  return first;
}

function render(input, rule){
  if (!rule){
    return input;
  } if (rule.type === "join"){
    let section = resolve_key(input, rule.key);
    let secondary = resolve_key(input, rule.on);
    return render(join(section, secondary, rule.key), rule.output);
  } else if (rule.type === "group"){
    let section = resolve_key(input, rule.key);
    let secondary = resolve_key(input, rule.on);
    return render(group(section, secondary, rule.key, rule.as), rule.output);
  } else if (rule.type === "select"){
    let section = resolve_key(input, rule.key);
    return(render(section, rule.output)
  } else if (rule.type === "calculate"){
    // what operation?
    let section = resolve_key(input, rule.key);
    var operations = {
      sum: (a,b)=>a+b,
      max: (a,b)=>(a>b)?a:b,
      min: (a,b)=>(a>b)?b:a
    }
    if (rule.operation === "average"){
      result = [];
      for (var subsection in section){
        output.push(subsection.map(sum)/subsection.length);
      }
    } else if (rule.operation === "count"){
      result = [];
      for (var subsection in section){
        output.push(subsection.length);
      }
    } else {
      output = section.map(operations[rule.operation]);
    }
  }
  return output;
}

function init(doc_set, rule_doc){
  var docs = [];
  for (var rule in rule_doc){
    docs.push(render(doc_set, rule));
  }
  return docs;
}
