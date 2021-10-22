import { getLine, getResult } from '../expander-utils.js';
const indentReg = /^(\s*)/;

export function empty_line(text, line) {
    return text.substring(line.start, line.end).trim() === '';
}

export function getIndent(text, line) {
    let line_str = text.substring(line.start, line.end);
    let m = line_str.match(indentReg);
    if (m) {
        return m[0].length;
    }
    return 0;
}

export function expandToIndent(text, startIndex, endIndex) {
    let line = getLine(text, startIndex, endIndex);
    let indent = getIndent(text, line);
    let start = line.start;
    let end = line.end;
    let beforeLine = line;

    while (true) {
        let pos = beforeLine.start - 1;
        if (pos <= 0) {
            break;
        }

        beforeLine = getLine(text, pos, pos);

        let beforeIndent = getIndent(text, beforeLine);

        //done if the line has a lower indent
        if (!(indent <= beforeIndent) && !empty_line(text, beforeLine)) {
            break;
        }

        if (!empty_line(text, beforeLine) && indent == beforeIndent) {
            start = beforeLine.start;
        }
    }

    let afterLine = line;

    while (true) {
        //get the line afterLine
        let pos = afterLine.end + 1;
        if (pos >= text.length) {
            break;
        }
        afterLine = getLine(text, pos, pos);
        let afterIndent = getIndent(text, afterLine);
        //done if the line has a lower indent
        if (!(indent <= afterIndent) && !empty_line(text, afterLine)) {
            break;
        }
        //move the end
        if (!empty_line(text, afterLine)) {
            end = afterLine.end;
        }
    }

    return getResult(start, end, text, 'indent');
}
