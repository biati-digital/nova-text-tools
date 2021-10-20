import JavascriptExpander from './expander-javascript.js';
import { expandToSubword } from './expand/to-subword.js';
import { expandToQuotes } from './expand/to-quotes.js';
import { expandToXMLNode } from './expand/to-xml-node.js';
import { expandToWord } from './expand/to-word.js';
import { isInsideTag } from './expander-utils.js';

export default class HTMLExpander {
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

        expandStack.push('xml_node');
        result = expandToXMLNode(text, start, end);

        if (result) {
            result['expandStack'] = expandStack;
            return result;
        }

        return null;
    }
}
