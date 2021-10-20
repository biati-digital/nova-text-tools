import { expandToSubword } from './expand/to-subword.js';
import { expandToQuotes } from './expand/to-quotes.js';
import { expandToXMLNode } from './expand/to-xml-node.js';
import { expandToWord } from './expand/to-word.js';
import { expandToSemanticUnit } from './expand/to-semantic-unit.js';
import { expandToSymbols } from './expand/to-symbol.js';
import { expandToLine } from './expand/to-line.js';
import { expandToBackticks } from './expand/to-backticks.js';
import { getLine, hasLineBreaks } from './expander-utils.js';

export default class JavascriptExpander {

    constructor(editor) {
        this.editor = editor;
    }

    expand(text, start, end, data = {}) {
        let selectionInString = expandToQuotes(text, start, end);
        if (selectionInString) {
            let stringResult = this.expandAgainsString(selectionInString.selectionText, start - selectionInString.end, end - selectionInString.end);

            if (stringResult) {
                stringResult.end = stringResult.end + selectionInString.end;
                stringResult.start = stringResult.start + selectionInString.end;
                stringResult.selectionText = text.substring(stringResult.end, stringResult.start);

                return stringResult;
            }
        }

        if (!hasLineBreaks(text, start, end)) {
            //let line = getLine(text, start, end);
            //let lineString = text.substring(line.start, line.end);
            let line = data.lineRange;
            let lineString = this.editor.getTextInRange(new Range(line.start, line.end));
            let lineResult = this.expandAgainsLine(lineString, start - line.start, end - line.start, data);

            if (lineResult) {
                lineResult.end = lineResult.end + line.start;
                lineResult.start = lineResult.start + line.start;
                lineResult.selectionText = this.editor.getTextInRange(new Range(lineResult.start, lineResult.end));
                return lineResult;
            }
        }

        let expandStack = [];
        let result = null;

        result = expandToSemanticUnit(text, start, end);
        if (result) {
            expandStack.push('semantic_unit');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToBackticks(text, start, end);
        if (result) {
            expandStack.push('backticks');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToSymbols(text, start, end);
        if (result) {
            expandStack.push('symbols');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToLine(text, start, end);
        if (result) {
            expandStack.push('line');
            result['expandStack'] = expandStack;
            return result;
        }

        // TODO: JS expand above will fails if there are comments

        return null;
    }

    expandAgainsLine(text, start, end, data) {
        let expandStack = [];
        let result = null;

        /*let result = expandToSubword(text, start, end);
        if (result) {
            expandStack.push('subword');
            result['expandStack'] = expandStack;
            return result;
        }*/

        result = expandToWord(text, start, end);
        if (result) {
            expandStack.push('word');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToQuotes(text, start, end);
        if (result) {
            expandStack.push('quotes');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToBackticks(text, start, end);
        if (result) {
            expandStack.push('backticks');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToSemanticUnit(text, start, end);
        if (result) {
            expandStack.push('semantic_unit');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToSymbols(text, start, end);
        if (result) {
            expandStack.push('symbols');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToLine(text, start, end);
        if (result) {
            expandStack.push('line');
            result['expandStack'] = expandStack;
            return result;
        }

        return null;
    }

    expandAgainsString(text, start, end) {
        let expandStack = [];
        let result = expandToSemanticUnit(text, start, end);
        if (result) {
            expandStack.push('semantic_unit');
            result['expandStack'] = expandStack;
            return result;
        }
        result = expandToSymbols(text, start, end);
        if (result) {
            expandStack.push('symbols');
            result['expandStack'] = expandStack;
        }

        return result;
    }
}
