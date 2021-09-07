const matcher = require('matcher');
const { snakeCase, camelCase, capitalCase, constantCase, dotCase, headerCase, noCase, paramCase, pascalCase, pathCase, sentenceCase } = require('change-case');
const { romanize, ordinal_suffix, titleCase, randomArray } = require('./helpers.js');
const { encode, decode } = require('html-entities');
const unserialize = require('locutus/php/var/unserialize');

/**
 * Nova Text Tools
 * created by https://www.biati.digital
 */
class NovaTextTools {
    constructor() {}

    /**
     * Process
     * process action for each selected range
     * if no selection then the entire content will
     * be processed
     */
    process(editor, fn) {
        let fromSelection = true;
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

                editor.edit((e) => e.replace(range, response));
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

        if (!nova.workspace) {
            // TODO: add notification about no workspace
            return false;
        }

        nova.workspace.openNewTextDocument({
            content: [...new Set(duplicates)].join('\n'),
            line: 0,
            //syntax: ''
        });

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
                    placeholder: '',
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    resolve(this.filterLines(text, val, false))
                }
            );
        });
    }

    /**
     * Filter Lines Matching
     */
    filterLinesMatching(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Keep Lines Mtaching...', {
                    placeholder: '',
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
            nova.workspace.showInputPalette('Keep Lines Mtaching...', {
                    placeholder: '',
                }, (val) => {
                    if (!val) {
                        resolve(false);
                        return;
                    }
                    if (!nova.workspace) {
                        // TODO: add notification about no workspace
                        return false;
                    }

                    nova.workspace.openNewTextDocument({
                        content: this.filterLines(text, val, true),
                        line: 0,
                        //syntax: ''
                    });
                    resolve(false);
                }
            );
        });
    }

    /**
     * Wrap lines with
     */
    wrapLinesWith(text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Wrap Each Line With', {
                    placeholder: '<li>$1</li>',
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
                    placeholder: '',
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
                    placeholder: '',
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
     * Filter lines
     *
     */
    filterLines(text, search, keep = true, caseSensitive = false) {
        let isRegex = false;
        let isMatcher = /[!\*\/^|\\]/.test(search);
        let isMatchStart = /^[\^]/.test(search);
        let isMatchEnd = /[\$]$/.test(search);

        if (isMatchStart) {
            search = search.slice(1);
        }
        if (isMatchEnd) {
            search = search.slice(0, -1);
        }
        if (search.startsWith('!') && !search.endsWith('*')) {
            search = search + '*';
        }

        /*if (!isMatchStart && isMatchEnd && search.startsWith('/') && isMatcher) {
            try {
                isRegex = new RegExp(search.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&'));
            } catch (e) {}
        }*/

        const lines = text.split('\n');
        return lines
            .filter((line) => {
                if (isRegex) {
                }
                if (isMatchStart) {
                    return keep ? line.startsWith(search) : !line.startsWith(search);
                }
                if (isMatchEnd) {
                    return keep ? line.endsWith(search) : !line.endsWith(search);
                }
                if (isMatcher) {
                    return keep ? matcher.isMatch(line, search, { caseSensitive }) : !matcher.isMatch(line, search, { caseSensitive });
                }

                if (!caseSensitive) {
                    line = line.toLowerCase();
                    search = search.toLowerCase();
                }
                return keep ? line.includes(search) : !line.includes(search);
            })
            .join('\n');
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
                    placeholder: 'Delimiter',
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
                return titleCase(line);
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
                            i = ordinal_suffix(i);
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
        return text.replace(/'|\\'/g, "\\'").replace(/"|\\"/g, '\\"');
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
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/[\u2026]/g, '...');
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
    select(editor, fn) {
        let fromSelection = true;
        let selectedRanges = editor.selectedRanges;

        if (selectedRanges.length === 1 && selectedRanges[0].start === selectedRanges[0].end) {
            selectedRanges = [new Range(0, editor.document.length)];
        }
        for (const range of selectedRanges) {
            const text = editor.getTextInRange(range);
            Promise.resolve(fn.apply(this, [editor, text])).then((response) => {
                if (!response || !response.length) {
                    return false;
                }

                // Move the cursor positio to the first matched range
                editor.selectedRanges = [new Range(response[0].start, response[0].end)];

                // Add selection ranges
                for (const filteredRange of response) {
                    editor.addSelectionForRange(filteredRange);
                }

                // Scroll to the first change
                editor.scrollToPosition(response[0].start);
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
                    placeholder: '',
                }, (val) => {
                    if (!val) {
                        resolve([]);
                        return;
                    }

                    const matched = this.filterLines(text, val, true)
                    if (!matched || !matched.length) {
                        resolve([]);
                        return;
                    }

                    const lines = matched.split('\n');
                    const allText = editor.getTextInRange(new Range(0, editor.document.length));
                    const newRanges = [];

                    for (let line of lines) {
                        line = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp('^' + line + '$', 'gm');
                        const matchedInDoc = [...allText.matchAll(regex)];

                        if (matchedInDoc && matchedInDoc.length) {
                            matchedInDoc.forEach(match => {
                                newRanges.push(new Range(match.index, match.index + match[0].length));
                            })
                        }
                    }

                    resolve(newRanges);
                }
            );
        });
    }

    /**
     * Select Ocurrences matching
     * check ocurrences that matches a specific query
     */
    selectOcurrencesMatching(editor, text) {
        return new Promise((resolve, reject) => {
            // prettier-ignore
            nova.workspace.showInputPalette('Select Ocurrences Matching...', {
                    placeholder: '',
                }, (val) => {
                    if (!val) {
                        resolve([]);
                        return;
                    }

                    val = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const allText = editor.getTextInRange(new Range(0, editor.document.length));
                    const regex = new RegExp(val, 'gi');
                    const matchedInDoc = [...allText.matchAll(regex)];
                    const newRanges = [];

                    if (matchedInDoc && matchedInDoc.length) {
                        matchedInDoc.forEach(match => {
                            newRanges.push(new Range(match.index, match.index + match[0].length));
                        })
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
        selected = selected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const allText = editor.getTextInRange(new Range(0, editor.document.length));
        const regex = new RegExp(selected, 'gi');
        const matchedInDoc = [...allText.matchAll(regex)];
        const newRanges = [];

        if (matchedInDoc && matchedInDoc.length) {
            matchedInDoc.forEach((match) => {
                newRanges.push(new Range(match.index, match.index + match[0].length));
            });
        }
        resolve(newRanges);
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
            if (!parsed) {
                parsed = JSON.parse(text);
            }
            parsed = JSON.stringify(parsed, undefined, 2);
        } catch (error) {
            // TODO: Nova Erro notification
            console.error(error);
        }

        return parsed;
    }

    /**
     * Maybe Unserialize
     */
    maybeUnserialize(text) {
        let str = text.trim();
        if (!str || (str.startsWith('{') && str.endsWith('}'))) {
            return false;
        }
        return unserialize(text);
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
}

module.exports = NovaTextTools;
