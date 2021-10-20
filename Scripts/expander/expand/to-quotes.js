import { getResult } from '../expander-utils.js';

export function expandToQuotes(text, startIndex, endIndex) {
    var quotesRegex = /(['\"\`])(?:\\.|.)*?\1/g;
    var r;
    // iterate over all found quotes pairs
    while ((r = quotesRegex.exec(text)) !== null) {
        let quotesStart = r.index;
        let quotesEnd = quotesRegex.lastIndex;
        //quotes pair end is before selection, stop here and continue loop
        if (quotesEnd < startIndex) {
            continue;
        }

        // quotes pair start is after selection, return, no need to continue loop
        if (quotesStart > startIndex) {
            return null;
        }

        if (startIndex == quotesStart && endIndex == quotesEnd) {
            return null;
        }

        // the string w/o the quotes, "quotes content"
        let quotesContentStart = quotesStart + 1;
        let quotesContentEnd = quotesEnd - 1;
        // "quotes content" is selected, return with quotes
        if (startIndex == quotesContentStart && endIndex == quotesContentEnd) {
            return getResult(quotesStart, quotesEnd, text, 'quotes');
        }

        //# selection is within the found quote pairs, return "quotes content"
        if (startIndex > quotesStart && endIndex < quotesEnd) {
            return getResult(quotesContentStart, quotesContentEnd, text, 'quotes');
        }
    }

    return null;
}
