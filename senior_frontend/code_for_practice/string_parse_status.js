function match(str) {
    let state = start;
    for (let c of str) {
        state = state(c);
    }
    return state === end;
}

function start(c) {
    if (c == "a")
        return foundA;
    else
        return start;
}

function end(c) {
    return end;
}

function foundA(c) {
    if (c == "a")
        return foundB;
    else
        return start;
}
function foundB(c) {
    if (c == "b") {
        return foundC;
    } else
        return start;
}

function foundC(c) {
    if (c == "c")
        return foundA2;
    else
        return start(c);
}
function foundA2(c){
    if(c==="a")
        return foundB2;
    else
        return start;
}
function foundB2(c){
    if(c==="b")
        return foundX;
    else
        return start;
}
function foundX(c) {
    if (c == "x")
        return end;
    else
        return foundB;
}

console.log(match("hello aabcabx"));
