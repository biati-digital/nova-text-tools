import JavascriptExpander from './expander-javascript.js';
import { expandToIndent, getIndent, empty_line } from './expand/to-indent.js';
import { getResult, getLine } from './expander-utils.js';

export default class PythonExpander {
    constructor(editor) {
        this.editor = editor;
    }

    expand(text, start, end, data = {}) {
        let expandStack = [];
        let result = null;

        const jsExpander = new JavascriptExpander(this.editor);
        const expand = jsExpander.expand(text, start, end, data);

        if (expand) {
            return expand;
        }


        result = this.expandLineWithoutIndent(text, start, end);
        if (result) {
            expandStack.push('line_no_indent');
            result['expandStack'] = expandStack;
            return result;
        }


        result = this.expandOverLineContinuation(text, start, end);
        if (result) {
            expandStack.push('line_continuation');
            result['expandStack'] = expandStack;
            return result;
        }

        result = this.expandPythonBlockFromStart(text, start, end);
        if (result) {
            expandStack.push('py_block_start');
            result['expandStack'] = expandStack;
            return result;
        }


        result = this.pyExpandToIndent(text, start, end);
        if (result) {
            expandStack.push('py_indent');
            result['expandStack'] = expandStack;
            return result;
        }


        if (result) {
            result['expandStack'] = expandStack;
            return result;
        }

        return null;
    }


    expandLineWithoutIndent(text, start, end) {
        const line = getLine(text, start, end);
        //const line = this.editor.getLineRangeForRange(new Range(start, end));
        const indent = getIndent(text, line);
        let lstart = Math.min(start, line.start + indent);
        let lend = Math.max(end, line.end);

        if (lstart !== start || lend !== end) {
            return getResult(lstart, lend, text, 'line_no_indent');
        }

        return null;
    }

    expandOverLineContinuation(text, start, end) {
        if (text.substring(end - 1, end) !== '\\') {
            return null;
        }

        const line = this.editor.getLineRangeForRange(new Range(start, end));
        const lineIndent = getIndent(text, line);
        const nextLine = this.editor.getLineRangeForRange(new Range(end + 1, end + 2));

        start = line.start + lineIndent;
        end = nextLine.end - 1;

        const nextResult = this.expandOverLineContinuation(text, start, end);
        if (nextResult) {
            start = nextResult.start;
            end = nextResult.end;
        }

        return getResult(start, end, text, 'line_continuation');
    }

    expandPythonBlockFromStart(text, start, end) {
        if (text.substring(end - 1, end) !== ':') {
            return null;
        }

        const result = expandToIndent(text, end + 1, end + 1);
        if (result) {
            const line = this.editor.getLineRangeForRange(new Range(start, end));
            const indent = getIndent(text, line);

            start = line.start + indent;
            end = result.end;
            return getResult(start, end, text, 'py_block_start');
        }

        return null;
    }



    pyExpandToIndent(text, start, end) {
        //const line = this.editor.getLineRangeForRange(new Range(start, end));
        const line = getLine(text, start, end);
        const indent = getIndent(text, line);

        // we don't expand to indent 0 (whole document)
        if (indent == 0) {
            return null;
        }

        // expand to indent
        //let result = expandToIndent(text, start - indent, end);
        let result = expandToIndent(text, start - indent, end);
        if (!result) {
            return null;
        }

        // get the indent of the first line
        // if the expansion changed return the result increased
        /*if (result.start !== start || result.end !== end) {
            //return result;
        }*/

        let pos = result.start + indent - 1;

        while (true) {
            if (pos < 0) {
                break;
            }

            // get the indent of the line before
            let beforeLine = getLine(text, pos, pos);
            let beforeIndent = getIndent(text, beforeLine);

            if (!empty_line(text, beforeLine) && beforeIndent < indent) {
                start = beforeLine.start;
                end = result.end;
                return getResult(start + beforeIndent, end, text, 'py_indent');
            }

            // goto the line before the line befor
            pos = beforeLine.start - 1;
        }

        return null;
    }
}
