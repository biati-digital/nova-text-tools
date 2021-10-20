export function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'); //eslint-disable-line
}

export function trim(text) {
    const regStart = /^[ \t\n]*/;
    const regEnd = /[ \t\n]*$/;
    let rS = regStart.exec(text);
    let rE = regEnd.exec(text);
    let start = 0,
        end = text.length;
    if (rS) {
        start = rS[0].length;
    }
    if (rE) {
        end = rE.index;
    }
    if (rS && rE) {
        return {
            start: start,
            end: end
        };
    }

    return null;
}

export function getLine(text, startIndex, endIndex) {
    const linebreakRe = /\n/;
    var newStartIndex = 0,
        newEndIndex = 0;
    var searchIndex = startIndex - 1;
    while (true) {
        if (searchIndex < 0) {
            newStartIndex = searchIndex + 1;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        if (linebreakRe.test(char)) {
            newStartIndex = searchIndex + 1;
            break;
        } else {
            searchIndex -= 1;
        }
    }
    searchIndex = endIndex;
    while (true) {
        if (searchIndex > text.length - 1) {
            newEndIndex = searchIndex;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        if (linebreakRe.test(char)) {
            newEndIndex = searchIndex;
            break;
        } else {
            searchIndex += 1;
        }
    }
    return { start: newStartIndex, end: newEndIndex };
}

export function getResult(start, end, text, type) {
    return {
        end: end,
        start: start,
        selectionText: text.substring(start, end),
        type: type
    };
}


export function isInsideTag(tag = '', text, startIndex, endIndex) {
    if (!tag) {
        return false;
    }

    //var tagRegex = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/g;
    let regexString = '(<' + tag + '\\b[^>]*>)([\\s\\S]*?)(<\/' + tag + '\\b[^>]*>)';
    let tagRegex = new RegExp(regexString, 'gi');

    var r;
    while ((r = tagRegex.exec(text)) !== null) {
        if (r.length < 4 || r[2].trim() === '') {
            continue;
        }

        let tagStart = r.index + r[1].length;
        let tagEnd = tagRegex.lastIndex - r[3].length;

        //quotes pair end is before selection, stop here and continue loop
        if (tagEnd < startIndex) {
            continue;
        }

        // quotes pair start is after selection, return, no need to continue loop
        if (tagStart > startIndex) {
            return null;
        }

        if (startIndex == tagStart && endIndex == tagEnd) {
            return null;
        }

        if (startIndex > tagStart && endIndex < tagEnd) {
            return true;
        }
    }

    return false;
}


export function hasLineBreaks(text, startIndex, endIndex) {
    let linebreakRe = /\n/;
    let part = text.substring(startIndex, endIndex);
    return linebreakRe.test(part);
}


export function getIndent(text, line) {
    let indentReg = /^(\s*)/;
    let line_str = text.substring(line.start, line.end);
    let m = line_str.match(indentReg);
    if (m) {
        return m[0].length;
    }
    return 0;
}
