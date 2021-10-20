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
    let before_line = line;
    while (true) {
        let pos = before_line.start - 1;
        if (pos <= 0) {
            break;
        }

        before_line = getLine(text, pos, pos);
        let before_indent = getIndent(text, before_line);
        //done if the line has a lower indent
        if (!(indent <= before_indent) && !empty_line(text, before_line)) {
            break;
        }
        if (!empty_line(text, before_line) && indent == before_indent) {
            start = before_line.start;
        }
    }
    let after_line = line;
    while (true) {
        //get the line after_line
        let pos = after_line.end + 1;
        if (pos >= text.length) {
            break;
        }
        after_line = getLine(text, pos, pos);
        let after_indent = getIndent(text, after_line);
        //done if the line has a lower indent
        if (!(indent <= after_indent) && !empty_line(text, after_line)) {
            break;
        }
        //move the end
        if (!empty_line(text, after_line)) {
            end = after_line.end;
        }
    }

    return getResult(start, end, text, 'indent');
}
