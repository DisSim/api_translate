var doc_set = [] // global document
// TODO it's modifying this, is that ok?
var global_rules = "";

function load_docs(doc_src, done_cb) {
    for (var n in doc_src) {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                doc_set[n] = JSON.parse(this.responseText);
                if (!(doc_set.length - doc_set.filter(String).length)) {
                    done_cb(doc_set);
                }
            }
        };
        xhttp.open("GET", doc_src[n], true);
        xhttp.send();
    }
}

// run this after loading all docs
function load_rules(rules_src, done_cb) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            global_rules = JSON.parse(this.responseText);
            done_cb(global_rules);
        }
    };
    xhttp.open("GET", rules_src, true);
    xhttp.send();
}

// use a number as the first element to get that document, else use l to use local input
function resolve_key(input, rules) {
    // gets the global relevant subsection given a rule
    // first element should tell us to look global or local
    if (rules[0] === "l") {
        doc = input;
        ruleset = rules.slice(1);
    } else {
        doc = doc_set;
        ruleset = rules;
    }
    for (var rule in ruleset) {
        if (Array.isArray(doc) && isNaN(rules[rule])) {
            var new_doc_set = [];
            for (var item in doc) {
                new_doc_set.push(doc[item][rules[rule]]);
            }
            doc = new_doc_set;
        }
        // if it's a list, make a list resolved by the rule
        // otherwise, just access using the rule
        else {
            doc = doc[rules[rule]];
        }
    }
    return doc;
}

function join(first, second, key) {
    // single join, so only get first
    var result = [];
    loop1:
        for (var rec in first) {
            loop2: for (var pmatch in second) {
                if (first[rec][key] === second[pmatch][key]) {
                    Object.keys(first[rec]).concat(Object.keys(second[pmatch])).forEach((x) => first[rec][x] = first[rec][x] || second[pmatch][x]);
                    result.push(first[rec]);
                    continue loop1;
                }
            }
        }
    return result;
}

function group(first, second, key, as) {
    // group all which match
    as = as || "grouping";
    for (rec in first) {
        first[rec][as] = [];
        for (var pmatch in second) {
            if (first[rec][key] === second[pmatch][key]) {
                delete second[pmatch][key]
                first[rec][as].push(second[pmatch]);
            }
        }
    }
    return first;
}

function render(input, rule) {
    output = [];
    if (!rule) {
        return input;
    }
    // may want to rename rule fields, these are confusing
    if (rule.type === "join") {
        let section = resolve_key(input, rule.key.slice(0, -1));
        let secondary = resolve_key(input, rule.on);
        return render(join(section, secondary, rule.key.slice(-1)[0]), rule.output);
    } else if (rule.type === "group") {
        let section = resolve_key(input, rule.key.slice(0, -1));
        let secondary = resolve_key(input, rule.on);
        return render(group(section, secondary, rule.key.slice(-1)[0], rule.as), rule.output);
    } else if (rule.type === "select") {
        let section = resolve_key(input, rule.key);
        return (render(section, rule.output))
    }
    // TODO do we want to re-add calculate
    else {
        console.warn("rule type specified is not implemented")
    }
    return output;
}

function init(doc_set, rule_doc) {
    var docs = [];
    for (var rule in rule_doc) {
        docs.push(render(doc_set, rule));
    }
    return docs;
}

function run(doc_src_list, rule_src) {
    load_docs(doc_src_list, () => (load_rules(rule_src, () => (render(doc_set, global_rules)))));
}
