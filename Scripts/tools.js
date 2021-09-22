import { snakeCase, camelCase, constantCase, dotCase, headerCase, noCase, paramCase, pascalCase, pathCase, sentenceCase } from 'change-case';
import { romanize, ordinalSuffix, titleCase, randomArray, fakeData, quotesTransform, escape, isRegexLike } from './utils.js';
import { logPerformanceStart, logPerformanceEnd, showNotification, log } from './nova.js';
import { encode, decode } from 'html-entities';
import { dummyFile } from './dummy-file.js';
import unserialize from 'locutus/php/var/unserialize';
import uuid from 'uuid-random';

/**
 * Nova Text Tools
 * created by https://www.biati.digital
 */
class NovaTextTools {
    constructor() {} //eslint-disable-line

    /**
     * Process
     * process action for each selected range
     * if no selection then the entire content will
     * be processed
     */
    process(editor, fn, action = 'replace') {
        let selectedRanges = editor.selectedRanges;

        if (selectedRanges.length === 1 && selectedRanges[0].start === selectedRanges[0].end) {
            selectedRanges = [new Range(0, editor.document.length)];
        }
        for (const range of selectedRanges) {
            const text = editor.getTextInRange(range);
            Promise.resolve(fn.apply(this, [text])).then((response) => {
                if (!response && typeof response !== 'string') {
                    return false;
                }

                if (action === 'replace') {
                    editor.edit((e) => e.replace(range, response));
                }
                if (action === 'insert') {
                    console.log('action', action, response);
                    editor.insert(response);
                }
            });
        }
    }

    /**
     * Delete duplicates from text
     */
    deleteDuplicates(text) {
        const lines = text.split('\n');
        return [...new Set(lines)].join('\n');
    }

    /**
     * Filter duplicates
     */
    filterDuplicates(text) {
        const lines = text.split('\n');
        const set = new Set(lines);
        const duplicates = lines.filter((line) => {
            if (set.has(line)) {
                set.delete(line);
            } else {
                return line;
            }
        });

        return [...new Set(duplicates)].join('\n');
    }

    /**
     * Filter duplicates new doc
     */
    filterDuplicatesNewDoc(text) {
        const lines = text.split('\n');
        const set = new Set(lines);
        const duplicates = lines.filter((line) => {
            if (set.has(line)) {
                set.delete(line);
            } else {
                return line;
            }
        });

        this.newDocument([...new Set(duplicates)].join('\n'));
        return false;
    }

    /**
     * Delete Empty Lines
     */
    deleteEmptyLines(text) {
        const lines = text.split('\n');
        return lines.filter((line) => line.trim() !== '').join('\n');
    }

    /**
     * Delete Lines Matching
     */
    deleteLinesMatching(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Delete Lines Matching...', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    resolve(this.filterLines(text, val, false));
                }
            );
        });
    }

    /**
     * Remove values that are not unique
     * remove all elements that occur more than once from array
     * ['php', 'phython', 'javascript', 'rust', 'php', 'python'];
     * after filtered will look
     * ['javascript', 'rust'];
     */
    filterUniques(text) {
        const lines = text.split('\n');
        return lines
            .filter((line) => {
                return lines.lastIndexOf(line) == lines.indexOf(line);
            })
            .join('\n');
    }

    /**
     * Filter uniques
     * in a new document
     * see filterUniques
     *
     * @param {null}
     */
    filterUniquesNewDoc(text) {
        const filtered = this.filterUniques(text);
        this.newDocument(filtered);
        return false;
    }

    /**
     * Filter Lines Matching
     */
    filterLinesMatching(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Keep Lines Matching...', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    resolve(this.filterLines(text, val, true));
                }
            );
        });
    }

    /**
     * Filter Lines Matching
     */
    filterLinesMatchingNewDoc(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Keep Lines Matching...', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    this.newDocument(this.filterLines(text, val, true));
                    resolve(false);
                }
            );
        });
    }

    /**
     * Filter lines
     *
     */
    filterLines(text, search, keep = true, caseSensitive = false) {
        const isFullRegex = search.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
        let isRegex = false;
        let isMatchStart = search.startsWith('^');
        let isMatchEnd = search.endsWith('$');
        let isNot = search.startsWith('!');
        let defaultModifier = caseSensitive ? 'g' : 'gi';

        if (isFullRegex) {
            let modifiers = isFullRegex[3];
            if (!modifiers) {
                modifiers = defaultModifier;
            }
            isRegex = new RegExp(isFullRegex[2], modifiers);
        } else {
            if (isMatchStart) {
                let check = search.slice(1).toLowerCase();
                let isStringRegexLike = isRegexLike(check);

                if (isStringRegexLike) {
                    isRegex = new RegExp(search, defaultModifier);
                }
                if (!isStringRegexLike) {
                    search = search.slice(1);
                }
            } else if (isMatchEnd) {
                let check = search.slice(0, -1).toLowerCase();
                let isStringRegexLike = isRegexLike(check);

                if (isStringRegexLike) {
                    isRegex = new RegExp(search, defaultModifier);
                }
                if (!isStringRegexLike) {
                    search = search.slice(0, -1);
                }
            } else if (isNot) {
                let check = search.slice(1);
                let isStringRegexLike = isRegexLike(check);

                if (isStringRegexLike) {
                    isRegex = new RegExp(search, defaultModifier);
                }
                if (!isStringRegexLike) {
                    search = search.slice(1);
                }
            } else {
                let isStringRegexLike = isRegexLike(search);
                if (search.length > 1 && isStringRegexLike) {
                    isRegex = new RegExp(search, defaultModifier);
                }
            }
        }

        const lines = text.split('\n');
        return lines
            .filter((line) => {
                if (line.trim() === '') {
                    return line;
                }

                let match = null;
                if (isRegex) {
                    if (isMatchStart) {
                        line = line.trimStart();
                    }
                    if (isMatchEnd) {
                        line = line.trimEnd();
                    }

                    try {
                        match = line.match(isRegex);
                    } catch (error) {}
                } else if (isMatchStart) {
                    match = line.trimStart().startsWith(search);
                } else if (isMatchEnd) {
                    match = line.trimEnd().endsWith(search);
                } else {
                    match = line.includes(search);
                }

                if ((match == true && isNot == true) || (match == false && isNot == true)) {
                    match = !match;
                }

                return match;
            })
            .join('\n');
    }

    /**
     * Wrap lines with
     */
    wrapLinesWith(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Wrap Each Line With', {
                    placeholder: '<li>$1</li>'
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    const lines = text.split('\n');
                    const wrapped = lines.map(line => {
                        return val.replace('$1', line);
                    });
                    resolve(wrapped.join('\n'));
                }
            );
        });
    }

    /**
     * Append to lines
     */
    appendToLines(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Enter text to add at the beginning', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    const lines = text.split('\n');
                    const appended = lines.map(line => {
                        return val + line;
                    });
                    resolve(appended.join('\n'));
                }
            );
        });
    }

    /**
     * Prepend to lines
     */
    prependToLines(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Enter text to add at the end', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    const lines = text.split('\n');
                    const prepended = lines.map(line => {
                        return line + val;
                    });
                    resolve(prepended.join('\n'));
                }
            );
        });
    }

    /**
     * Sort Lines
     */
    sortLinesAlphanumerically(text) {
        const lines = text.split('\n');
        const sorted = lines.sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'case' });
        });
        return sorted.join('\n');
    }

    /**
     * Sort Lines Reverse
     */
    sortLinesAlphanumericallyReverse(text) {
        const lines = text.split('\n');
        const sorted = lines
            .sort((a, b) => {
                return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'case' });
            })
            .reverse();
        return sorted.join('\n');
    }

    /**
     * Sort Lines by length
     */
    sortLinesByLength(text) {
        const lines = text.split('\n');
        return lines
            .sort((a, b) => {
                return a.length - b.length;
            })
            .join('\n');
    }

    sortLinesByLengthReverse(text) {
        const lines = text.split('\n');
        return lines
            .sort((a, b) => {
                return b.length - a.length;
            })
            .join('\n');
    }

    /**
     * Reverse Lines
     */
    reverseLines(text) {
        return text.split('\n').reverse().join('\n');
    }

    /**
     * Joing Lines
     */
    joinLines(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Join Lines Delimiter', {
                    placeholder: 'Delimiter'
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    resolve(text.split('\n').join(val));
                }
            );
        });
    }

    /**
     * Split Text to lines
     */
    splitToLines(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Split Text at Delimiter', {
                    placeholder: 'Delimiter'
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    const splitted = text.split(val).map(line => {
                        return line.trimStart();
                    });
                    resolve(splitted.join('\n'));
                }
            );
        });
    }

    /**
     * Randomize Line
     */
    randomLines(text) {
        return randomArray(text.split('\n')).join('\n');
    }

    /**
     * Lower Case
     */
    toLowercase(text) {
        return text.toLowerCase();
    }

    /**
     * Upper Case
     */
    toUpperCase(text) {
        return text.toUpperCase();
    }

    /**
     * Snake Case
     */
    toSnakeCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return snakeCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Captal Case
     */
    toCapitalCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return line.replace(/(^|\s)\S/g, (l) => l.toUpperCase());
            })
            .join('\n');
    }

    /**
     * Camel Case
     */
    toCamelCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return camelCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Constant Case
     */
    toConstantCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return constantCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Dot Case
     */
    toDotCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return dotCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Header Case
     */
    toHeaderCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return headerCase(line);
            })
            .join('\n');
    }

    /**
     * No Case
     */
    toNoCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return noCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Param Case
     */
    toParamCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return paramCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Param Case
     */
    toPascalCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return pascalCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Param Case
     */
    toPathCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return pathCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Sentence Case
     */
    toSentenceCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return sentenceCase(this.normalizeText(line));
            })
            .join('\n');
    }

    /**
     * Sponge Case
     */
    toSpongeCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                let result = '';
                for (let i = 0; i < line.length; i++) {
                    result += Math.random() > 0.5 ? line[i].toUpperCase() : line[i].toLowerCase();
                }
                return result;
            })
            .join('\n');
    }

    /**
     * Title Case
     */
    toTitleCase(text) {
        const lines = text.split('\n');
        return lines
            .map((line) => {
                return titleCase(line.toLowerCase());
            })
            .join('\n');
    }

    /**
     * Add Lines Numbers
     */
    addLinesNumbers(text, format = false) {
        return new Promise((resolve, reject) => {
            if (!format) {
                nova.workspace.showChoicePalette(
                    // prettier-ignore
                    [
                        'Add Line Numbers with 1 ',
                        'Add Line Numbers with 1.',
                        'Add Line Numbers with 1)',
                        'Add Line Numbers with 1.-',
                        'Add Line Numbers with 1 -',
                        'Add Line Numbers with 1:',
                        'Add Line Numbers with Ordinal',
                        'Add Line Numbers with Roman Numerals'
                    ],
                    { placeholder: '' },
                    (sel) => {
                        if (!sel) {
                            resolve(false);
                            return false;
                        }

                        sel = sel.replace('Add Line Numbers with 1', '');
                        sel = sel.replace('Add Line Numbers with ', '');
                        resolve(this.addLinesNumbers(text, sel));
                    }
                );
                return false;
            }

            const lines = text
                .split('\n')
                .map((line, i) => {
                    i = i + 1;

                    switch (format) {
                        case 'Ordinal':
                            i = ordinalSuffix(i);
                            line = `${i} ${line}`;
                            break;
                        case 'Roman Numerals':
                            i = romanize(i);
                            line = `${i} ${line}`;
                            break;
                        default:
                            line = `${i}${format} ${line}`;
                    }

                    return line;
                })
                .join('\n');
            resolve(lines);
        });
    }

    /**
     * Base 64 encode
     */
    base64Encode(text) {
        return btoa(text);
    }

    /**
     * Base 64 decode
     */
    base64Decode(text) {
        return atob(text);
    }

    /**
     * URL encode
     */
    urlEncode(text) {
        return encodeURIComponent(text);
    }

    /**
     * URL decode
     */
    urlDecode(text) {
        return decodeURIComponent(text);
    }

    /**
     * Spaces encode
     */
    spacesEncode(text) {
        return text.replace(/ /g, '%20');
    }

    /**
     * Spaces decode
     */
    spacesDecode(text) {
        return text.replace(/%20/g, ' ');
    }

    /**
     * Spaces encode
     */
    htmlEncode(text) {
        return encode(text);
    }

    /**
     * Spaces decode
     */
    htmlDecode(text) {
        return decode(text);
    }

    /**
     * Strip Slashes
     */
    stripSlashes(text) {
        return text.replace(/\\/g, '');
    }

    /**
     * Add Slashes
     */
    addSlashes(text) {
        return text.replace(/'|\\'/g, "\\'").replace(/"|\\"/g, '\\"'); //eslint-disable-line
    }

    /**
     * Smart Punctuation
     */
    smartQuotes(text) {
        return text
            .replace(/(^|[-\u2014\s(\["])'/g, '$1\u2018')
            .replace(/'/g, '\u2019')
            .replace(/(^|[-\u2014/\[(\u2018\s])"/g, '$1\u201c')
            .replace(/"/g, '\u201d')
            .replace(/--/g, '\u2014');
    }

    /**
     * Straighten Quotes
     */
    straightenQuotes(text) {
        return text
            .replace(/[\u2018\u2019]/g, "'") // eslint-disable-line
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...');
    }

    /**
     * Single to double qutoes
     */
    quotesSingleToDouble(text) {
        return quotesTransform(text, "'", '"'); //eslint-disable-line
    }

    /**
     * Single to double qutoes
     */
    quotesSingleToBackticks(text) {
        return quotesTransform(text, "'", '`'); //eslint-disable-line
    }

    /**
     * Double qutoes to single quotes
     */
    quotesDoubleToSingle(text) {
        return quotesTransform(text, '"', "'"); //eslint-disable-line
    }

    /**
     * Double qutoes to backticks
     */
    quotesDoubleToBackticks(text) {
        return quotesTransform(text, '"', '`');
    }

    /**
     * Select
     * this handles commands related
     * with text selection
     * it calls other function and they
     * should return an array with the
     * information about the ranges that
     * need to be selected
     */
    async select(editor, fn) {
        let selectedRanges = [new Range(0, editor.document.length)];
        /*let selectedRanges = editor.selectedRanges;

        if (selectedRanges.length === 1 && selectedRanges[0].start === selectedRanges[0].end) {
            selectedRanges = [new Range(0, editor.document.length)];
        }*/
        for (const range of selectedRanges) {
            const text = editor.getTextInRange(range);
            Promise.resolve(fn.apply(this, [editor, text])).then((response) => {
                if (!response || !response.length) {
                    return false;
                }

                log('Matches found ' + response.length);
                logPerformanceStart('Nova select');

                // Move the cursor position to the first matched range
                editor.selectedRanges = [new Range(response[0].start, response[0].end)];

                // Add selection ranges
                /*for (const filteredRange of response) {
                    editor.addSelectionForRange(filteredRange);
                }*/
                editor.selectedRanges = response;

                // Scroll to the first change
                editor.scrollToPosition(response[0].start);
                logPerformanceEnd('Nova select');
            });
        }
    }

    /**
     * Select Lines Matching
     */
    selectLinesMatching(editor, text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Select Lines Matching...', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve([]);
                        return;
                    }

                    logPerformanceStart('select lines by match');

                    const matched = this.filterLines(text, val, true);
                    if (!matched || !matched.length) {
                        resolve([]);
                        return;
                    }

                    const lines = matched.split('\n');
                    const allText = editor.getTextInRange(new Range(0, editor.document.length));
                    const newRanges = [];

                    for (let line of lines) {
                        line = escape(line);
                        const regex = new RegExp('^' + line + '$', 'gm');
                        const matchedInDoc = [...allText.matchAll(regex)];

                        if (matchedInDoc && matchedInDoc.length) {
                            matchedInDoc.forEach(match => {

                                const matchStart = match.index;
                                const matchEnd = matchStart + match[0].length;
                                const matchedrange = new Range(matchStart, matchEnd);

                                // This is the line containing the match
                                const matchedLinerange = editor.getLineRangeForRange(matchedrange);

                                // The entire text of the line
                                //const lineText = editor.getTextInRange(matchedLinerange);
                                const lineText = line;
                                const leading = lineText.match(/^[\s]+/);

                                // if we use matchedLinerange it will select the entire
                                // line from start to end of the editor, we only want to select
                                // the text in that line
                                let lineStartRange = matchedLinerange.start;
                                let lineEndRange = matchedLinerange.end - 1;

                                if (leading && leading.length === 1 && typeof leading[0] === 'string') {
                                    lineStartRange += leading[0].length;
                                }

                                newRanges.push(new Range(lineStartRange, lineEndRange));
                                //newRanges.push(new Range(match.index, match.index + match[0].length));
                            });
                        }
                    }

                    logPerformanceEnd('select lines by match');

                    resolve(newRanges);
                }
            );
        });
    }

    /**
     * Select All Ocurrences matching
     * check all ocurrences that matches a specific query
     */
    selectAllOcurrencesMatching(editor, text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Select Ocurrences Matching...', {
                    placeholder: ''
                }, (val) => {
                    if (!val) {
                        resolve([]);
                        return;
                    }

                    let caseSensitive = false;
                    const isFullRegex = val.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
                    let regex = false;
                    let isMatchStart = val.startsWith('^');
                    let isMatchEnd = val.endsWith('$');
                    let isNot = val.startsWith('!');
                    let defaultModifier = caseSensitive ? 'g' : 'gi';

                    if (isFullRegex) {
                        let modifiers = isFullRegex[3];
                        if (!modifiers) {
                            modifiers = defaultModifier;
                        }
                        if (modifiers) {
                            regex = new RegExp(isFullRegex[2], modifiers);
                        } else {
                            regex = new RegExp(isFullRegex[2]);
                        }
                    } else {
                        if (isMatchStart) {
                            let check = val.slice(1).toLowerCase();
                            let isStringRegexLike = isRegexLike(check);

                            if (isStringRegexLike) {
                                regex = new RegExp(val, defaultModifier);
                            }
                            if (!isStringRegexLike) {
                                val = val.slice(1);
                            }
                        } else if (isMatchEnd) {
                            let check = val.slice(0, -1).toLowerCase();
                            let isStringRegexLike = isRegexLike(check);

                            if (isStringRegexLike) {
                                regex = new RegExp(val, defaultModifier);
                            }
                            if (!isStringRegexLike) {
                                val = val.slice(0, -1);
                            }
                        } else if (isNot) {
                            let check = val.slice(1);
                            let isStringRegexLike = isRegexLike(check);

                            if (isStringRegexLike) {
                                regex = new RegExp(val, defaultModifier);
                            }
                            if (!isStringRegexLike) {
                                val = val.slice(1);
                            }
                        } else {
                            let isStringRegexLike = isRegexLike(val);
                            if (val.length > 1 && isStringRegexLike) {
                                console.log('defaultModifier', defaultModifier);
                                regex = new RegExp(val, defaultModifier);
                            }
                            if (val.length > 1 && !isStringRegexLike) {
                                regex = new RegExp(escape(val), defaultModifier);
                            }
                        }
                    }


                    const allText = editor.getTextInRange(new Range(0, editor.document.length));
                    const matchedInDoc = [...allText.matchAll(regex)];
                    const newRanges = [];

                    if (matchedInDoc && matchedInDoc.length) {
                        matchedInDoc.forEach(match => {

                            let fullMatch = match[0];
                            let matchStart = match.index;
                            let matchEnd = matchStart + match[0].length;

                            if (match.length <= 1) {
                                newRanges.push(new Range(matchStart, matchEnd));
                            } else {
                                // There's capture groups
                                // If capture groups only select every group
                                let groupsMatched = [...match];
                                groupsMatched.shift();

                                for (const imatch of groupsMatched) {
                                    let groupStart = matchStart + fullMatch.indexOf(imatch);
                                    let groupEnd = groupStart + imatch.length;
                                    newRanges.push(new Range(groupStart, groupEnd));
                                }
                            }
                        });
                    }
                    resolve(newRanges);
                }
            );
        });
    }

    /**
     * Select All Ocurrences
     */
    selectOcurrences(editor, text) {
        let selected = editor.selectedText;
        if (!selected) {
            return false;
        }
        selected = escape(selected);
        const allText = editor.getTextInRange(new Range(0, editor.document.length));
        const regex = new RegExp(selected, 'gi');
        const matchedInDoc = [...allText.matchAll(regex)];
        const newRanges = [];

        if (matchedInDoc && matchedInDoc.length) {
            matchedInDoc.forEach((match) => {
                newRanges.push(new Range(match.index, match.index + match[0].length));
            });
        }
        return newRanges;
    }

    /**
     * Add All Numbers
     */
    addAllNumbers(text) {
        const lines = text.split('\n');
        const sum = lines.reduce((acc, val) => {
            let lineval = 0;
            if (val && val.trim()) {
                val = val.replace(/[^0-9\.,-]+/g, '');
                val = parseFloat(val.replace(/,/g, ''));
                lineval = val;
            }
            return acc + lineval;
        }, 0);
        return parseFloat(sum).toFixed(2).toString();
    }

    /**
     * Substract All Numbers
     */
    substractAllNumbers(text) {
        const lines = text.split('\n');
        const sum = lines.reduce((acc, val) => {
            let lineval = 0;
            if (val && val.trim()) {
                val = val.replace(/[^0-9\.,-]+/g, '');
                val = parseFloat(val.replace(/,/g, ''));
                lineval = val;
            }

            if (acc === null) {
                return lineval;
            }
            return acc - lineval;
        }, null);
        return parseFloat(sum).toFixed(2).toString();
    }

    /**
     * Parse JSON String
     */
    jsonStringParse(text) {
        if (!text.trim()) {
            return false;
        }

        let parsed = false;
        try {
            parsed = this.maybeUnserialize(text);

            if (typeof parsed === 'string' && parsed.startsWith('{')) {
                parsed = JSON.parse(parsed.replace(/\\/g, ''));
            }
            if (!parsed) {
                parsed = JSON.parse(text);
            }
            parsed = JSON.stringify(parsed, undefined, 2);
        } catch (error) {
            log(error);
            showNotification({
                title: 'Text Tools',
                body: 'JSON Error: ' + error,
                actions: true
            });
        }

        return parsed;
    }

    /**
     * Maybe Unserialize
     */
    maybeUnserialize(text) {
        let unserialized = false;
        try {
            unserialized = unserialize(text);
        } catch (error) {
            console.error(error);
        }
        return unserialized;
    }

    /**
     * Fake Data Types
     */
    fakeDataTypes() {
        // prettier-ignore
        return [
            'Full Name',
            'Name',
            'Lastname',
            'Email',
            'Phone',
            'Credit Card',
            'User Name',
            'Full Address',
            'Country',
            'City',
            'Street',
            'Zip Code',
            'Company',
            'URL',
            'Lorem Paragraph',
            'Lorem Paragraphs',
            'Number',
            'JSON',
            'Array'
        ];
    }

    /**
     * Generate Fake Data
     */
    generateFakeData(text, format = false) {
        return new Promise((resolve, reject) => {
            if (!format) {
                nova.workspace.showChoicePalette(this.fakeDataTypes(), { placeholder: '' }, (sel) => {
                    if (!sel) {
                        resolve(false);
                        return false;
                    }
                    resolve(this.generateFakeData(text, sel));
                });
                return false;
            }

            let val = fakeData(format);
            if (typeof val !== 'string') {
                return false;
            }

            resolve(val);
        });
    }

    /**
     * Generate UUID
     */
    generateUUID() {
        return uuid();
    }

    /**
     * Generate Dummy File
     */
    generateDummyFile(fileName, fileSize) {
        if (!nova.workspace) {
            showNotification({
                title: 'Text Tools',
                body: 'ERROR: a workspace is required to create a dummy file',
                actions: true
            });
            return false;
        }

        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Enter file name with extension', {
                    placeholder: 'filename.txt'
                }, (filename) => {
                    if (!filename) {
                        resolve();
                        return;
                    }

                    // prettier-ignore
                    nova.workspace.showInputPalette('Enter file size, example: 10mb', {
                            placeholder: 'filesize for example: 500kb, 10mb, 1gb'
                        }, (filesize) => {
                            if (!filesize) {
                                resolve();
                                return;
                            }

                            dummyFile(nova.workspace.path, filename, filesize)
                            .then(() => {
                                showNotification({
                                    title: 'Text Tools',
                                    body: 'File generated correctly'
                                });
                                resolve();
                            }).catch(error => {
                                log(error, true);
                                showNotification({
                                    title: 'Text Tools',
                                    body: 'ERROR: ' + error,
                                    actions: true
                                });
                                resolve();
                            });
                        }
                    );
                }
            );
        });
    }

    /**
     * Normalize text
     * resolve diacritics, accents, etc.
     *
     * @param {strong} str
     */
    normalizeText(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    /**
     * Open in new document
     *
     * @param {string} text
     */
    newDocument(content) {
        if (!nova.workspace) {
            showNotification({
                title: 'Text Tools',
                body: 'ERROR: a workspace is required to create new documents',
                actions: true
            });
            return false;
        }

        nova.workspace.openNewTextDocument({
            content: content,
            line: 0
            //syntax: ''
        });
    }
}

export default NovaTextTools;
