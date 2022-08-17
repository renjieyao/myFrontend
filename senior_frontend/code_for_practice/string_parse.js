function match(s) {
    let foundA = true;
    let foundB = true;
    let foundC = true;
    for (let c of s) {
        if (c == "a")
            foundA = true;
        else if (foundA && c == "b")
            foundB = true;
        else if (foundB && c == "c")
            return true;
        else
            foundA = false;
            foundB = false;
            foundC = false;
    }
    return false
}
console.log(match("hello abc"));
