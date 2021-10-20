import JavascriptExpander from './expander-javascript.js';
import { expandToSubword } from './expand/to-subword.js';
import { expandToQuotes } from './expand/to-quotes.js';
import { expandToXMLNode } from './expand/to-xml-node.js';
import { expandToWord } from './expand/to-word.js';
import { expandToLine } from './expand/to-line.js';
import { expandToSemanticUnit } from './expand/to-semantic-unit.js';
import { expandToSymbols } from './expand/to-symbol.js';
import { isInsideTag, getResult, hasLineBreaks, getIndent } from './expander-utils.js';

export default class PHPExpander {
    constructor(editor) {
        this.editor = editor;
    }


    expand(text, start, end, data = {}) {
        let expandStack = [];
        let result = null;


        // Check if inside a script tag
        if (isInsideTag('script', text, start, end)) {
            const jsExpander = new JavascriptExpander(this.editor);
            const expand = jsExpander.expand(text, start, end, data);
            if (expand) {
                return expand;
            }
        }

        // Check if inside a style tag
        if (isInsideTag('style', text, start, end)) {
            const jsExpander = new JavascriptExpander(this.editor);
            const expand = jsExpander.expand(text, start, end, data);
            if (expand) {
                return expand;
            }
        }


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

        /*expandStack.push('subword');
        let result = expandToSubword(text, start, end);
        if (result) {
            result['expandStack'] = expandStack;
            return result;
        }*/

        result = expandToWord(text, start, end);
        if (result) {
            expandStack.push('word');
            console.log('word');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToQuotes(text, start, end);
        if (result) {
            expandStack.push('quotes');
            console.log('quotes');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToSemanticUnit(text, start, end);
        if (result) {
            expandStack.push('semantic_unit');
            console.log('semantic_unit');
            result['expandStack'] = expandStack;
            return result;
        }

        result = this.expandToFunction(text, start, end);
        if (result) {
            expandStack.push('function');
            console.log('function');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToSymbols(text, start, end);
        if (result) {
            expandStack.push('symbols');
            console.log('symbols');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToXMLNode(text, start, end);
        if (result) {
            expandStack.push('xml_node');
            console.log('xml_node');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToLine(text, start, end);
        if (result) {
            expandStack.push('line');
            console.log('line');
            result['expandStack'] = expandStack;
            return result;
        }

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


    expandToFunction(text, start, end) {
        const currentSelection = text.substring(start, end);
        if (currentSelection.trim().startsWith('{')) {

            const line = this.editor.getLineRangeForRange(new Range(start, end));
            const prevLine = this.editor.getLineRangeForRange(new Range(line.start - 2, line.start - 1));
            const prevLineText = text.substring(prevLine.start, prevLine.end);

            if (/^(?:\w+).+function.+\w+\(.*\)/.test(prevLineText.trim())) {
                let indent = getIndent(text, prevLine);
                return getResult(prevLine.start + indent, end, text, 'function');
            }
        }

        return null;
    }
}
