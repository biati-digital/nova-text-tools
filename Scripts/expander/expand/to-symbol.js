import { escapeRegExp, getResult, getLine } from '../expander-utils.js';

export function expandToSymbols(text, startIndex, endIndex) {
    // Do not expand to next symbol if the selection the prev
    // selection is followed by ; or , for example a closing bracket };
    const breakSymbols = [';', ','];
    const beforeBreak = ['}', ']', ')'];

    if (breakSymbols.includes(text.substring(endIndex, endIndex + 1)) && beforeBreak.includes(text.substring(endIndex - 1, endIndex))) {
        return null;
    }

    const openingSymbols = '([{';
    const closingSymbols = ')]}';
    const symbolsRegex = /[\(\[\{\)\]\}]/;
    const symbolsRegexGlobal = /[\(\[\{\)\]\}]/g;
    const quotesRegex = /(['\"])(?:\\.|.)*?\1/g;
    let quotesBlacklist = {};
    //   # get all quoted strings and create dict with key of index = True
    //   # Example: f+"oob"+bar
    //   # quotesBlacklist = {
    //   #   2: true, 3: true, 4: true, 5: true, 6: true
    //   # }
    var r;
    while ((r = quotesRegex.exec(text)) != null) {
        let quotes_start = r.index;
        let quotes_end = quotesRegex.lastIndex;
        let i = 0;
        while (i < text.length) {
            quotesBlacklist[quotes_start + i] = true;
            i += 1;
            if (quotes_start + i == quotes_end) {
                break;
            }
        }
    }
    const counterparts = {
        '(': ')',
        '{': '}',
        '[': ']',
        ')': '(',
        '}': '{',
        ']': '['
    };
    //# find symbols in selection that are "not closed"
    let selectionString = text.substring(startIndex, endIndex);
    let selectionQuotes = selectionString.match(symbolsRegexGlobal) || [];
    let backwardSymbolsStack = [];
    let forwardSymbolsStack = [];

    if (selectionQuotes.length != 0) {
        let inspect_index = 0;
        // # remove symbols that have a counterpart, i.e. that are "closed"
        while (true) {
            let item = selectionQuotes[inspect_index];
            if (item && selectionQuotes.indexOf(counterparts[item]) != -1) {
                selectionQuotes.splice(inspect_index, 1);
                selectionQuotes.splice(selectionQuotes.indexOf(counterparts[item]), 1);
            } else {
                inspect_index = inspect_index + 1;
                if (inspect_index >= selectionQuotes.length) {
                    break;
                }
            }
        }
        //# put the remaining "open" symbols in the stack lists depending if they are
        ///# opening or closing symbols
        selectionQuotes.forEach((item) => {
            if (openingSymbols.indexOf(item) !== -1) {
                forwardSymbolsStack.push(item);
            } else if (closingSymbols.indexOf(item) !== -1) {
                backwardSymbolsStack.push(item);
            }
        });
    }
    let search_index = startIndex - 1;
    let symbolsStart = 0,
        symbolsEnd = 0;
    var symbol;
    //# look back from begin of selection
    while (true) {
        //# begin of string reached
        if (search_index < 0) {
            return null;
        }
        //# skip if current index is within a quote
        if (quotesBlacklist[search_index]) {
            search_index -= 1;
            continue;
        }

        let char = text.substring(search_index, search_index + 1);

        let r = symbolsRegex.exec(char);
        if (r) {
            symbol = r[0];
            if (openingSymbols.indexOf(symbol) !== -1 && backwardSymbolsStack.length == 0) {
                symbolsStart = search_index + 1;
                break;
            }
            if (backwardSymbolsStack.length > 0 && backwardSymbolsStack[backwardSymbolsStack.length - 1] === counterparts[symbol]) {
                //# last symbol in the stack is the counterpart of the found one
                backwardSymbolsStack.pop();
            } else {
                backwardSymbolsStack.push(symbol);
            }
        }
        search_index -= 1;
    }
    let symbol_pair_regex = new RegExp(`[${escapeRegExp(symbol + counterparts[symbol])}]`);
    forwardSymbolsStack.push(symbol);
    search_index = endIndex;
    //# look forward from end of selection
    while (true) {
        //# skip if current index is within a quote
        if (quotesBlacklist[search_index]) {
            search_index += 1;
            continue;
        }
        let character = text.substring(search_index, search_index + 1);
        let result = symbol_pair_regex.exec(character);
        if (result) {
            symbol = result[0];
            if (forwardSymbolsStack[forwardSymbolsStack.length - 1] == counterparts[symbol]) {
                //# counterpart of found symbol is the last one in stack, remove it
                forwardSymbolsStack.pop();
            } else {
                forwardSymbolsStack.push(symbol);
            }

            if (forwardSymbolsStack.length == 0) {
                symbolsEnd = search_index;
                break;
            }
        }
        //# end of string reached
        if (search_index == text.length) {
            return;
        }
        search_index += 1;
    }


    if (startIndex == symbolsStart && endIndex == symbolsEnd) {
        return getResult(symbolsStart - 1, symbolsEnd + 1, text, 'symbol');
    } else {

        // Handle expansion inside objects properties
        // {
        //    example: {
        //       anotherelm: true
        //    }
        // }
        let line = getLine(text, startIndex, endIndex);
        let lineText = text.substring(line.start, line.end);
        let firstLine = lineText.split('\n');
        let currentSelectedFirstLine = selectionString.split('\n');
        if (currentSelectedFirstLine.length) {
            currentSelectedFirstLine = currentSelectedFirstLine[0].trim();
        }

        if (firstLine.length) {
            firstLine = firstLine[0].trim();

            // Do not jump to parent symbol if there's an object property. myprop: {
            if (/^\w+:.*{$/.test(firstLine) && firstLine !== currentSelectedFirstLine) {
                return null;
            }

            // Do not jump to parent symbol if there's an variable definition. const myvar = {
            if (/^\w+?[\s+]?\w+[\s+]?=[\s+]?{/.test(firstLine) && firstLine !== currentSelectedFirstLine) {
                return null;
            }
        }

        return getResult(symbolsStart, symbolsEnd, text, 'symbol');
    }
}
