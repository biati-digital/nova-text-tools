export default class SelectionAlign {
    align(editor) {
        let selectedRanges = editor.selectedRanges;
        let extension = this.getExtension(editor);

        for (const range of selectedRanges) {
            const aligned = this.process(range, editor.getTextInRange(range), extension);

            if (aligned) {
                editor.edit((e) => e.replace(range, aligned));
            }
        }
    }

    process(range, selectedText, extension) {
        const groups = this.getGroups(range, selectedText);

        console.log(groups);

        const tokens = this.parseText(selectedText, extension);
        if (!tokens) {
            return false;
        }

        return this.alignTokens(selectedText, tokens);
    }

    parseText(text) {
        let pos = 0;
        let tokens = [];
        let skipChars = null;
        let whiteSpaceBefore = 0;
        let charsBeforeCharFound = '';
        let isNewline = true;

        while (pos < text.length) {
            let type;
            let char = text.charAt(pos);
            let next = text.charAt(pos + 1);
            let nextSeek = 1;
            let stringStarts = ['"', "'", "`"]; //eslint-disable-line
            let bracketStarts = ['{', '(', '['];
            let bracketEnds = ['}', ')', ']'];

            if (text.charCodeAt(pos) == 10) {
                type = 'newline';
            } else if (char.match(/\s/)) {
                type = 'whitespace';
            } else if (stringStarts.includes(char)) {
                type = 'string';
            } else if (bracketStarts.includes(char)) {
                type = 'blockStart';
            } else if (bracketEnds.includes(char)) {
                type = 'blockEnd';
            } else if (char == '/' && (
                  (next == '/' && (pos > 0 ? text.charAt(pos - 1) : '') != ':')
                || next == '*'
            )) {
                type = 'comment';
            } else if ((char == '#' && next == ' ') || (char == '"' && next == '"' && text.charAt(pos + 2) == '"')) { // python style commets
                type = 'comment';
            } else if (char == ':' && next != ':') {
                type = 'colon';
            } else if (char == ':' && next == ':') {
                type = 'word';
            } else if (char == '=' && next == '>') {
                type = 'arrow';
                nextSeek = 2;
            } else if ((char == '=' || char == '!' || char == '>' || char == '<') && next == '=') {
                type = 'word';
                nextSeek = 2;
                if ((char == '=' || char == '!') && text.charAt(pos + nextSeek) == '=') {
                      nextSeek = 3;
                }
            } else if ((
                // Math operators
                char == '+' || char == '-' || char == '*' || char == '/' || char == '%' || // FIXME: Find a way to work with the `**` operator
                // Bitwise operators
                char == '~' || char == '|' || char == '^' || // FIXME: Find a way to work with the `<<` and `>>` bitwise operators
                // Other operators
                char == '.'
            ) && next == '=') {
                type = 'assignment';
                nextSeek = 2;
            } else if (char == '=' && next != '=') {
                type = 'assignment';
            } else {
                type = 'word';
            }

            //console.log('char', char, text.charCodeAt(pos));

            if (type == 'newline') {
                charsBeforeCharFound = '';
                isNewline = true;
            }

            if (isNewline && type !== 'newline') {
                charsBeforeCharFound += char;
            }

            if (type == 'whitespace') {
                whiteSpaceBefore += 1;
            }

            // Skip content defined as strings
            if (type == 'string' && !skipChars) {
                skipChars = true;
            } else if (type == 'string' && skipChars) {
                skipChars = false;
            }

            // Skip inner blocks
            if (type == 'blockStart' && !skipChars) {
                skipChars = true;
            } else if (type == 'blockEnd' && skipChars) {
                skipChars = false;
            }

            if (skipChars) {
                ++pos;
                continue;
            }

            if (isNewline && type == 'assignment' || type == 'arrow' || type == 'colon') {
                charsBeforeCharFound = charsBeforeCharFound.slice(0, -1);

                isNewline = false;
                tokens.push({
                   char: char,
                   whiteSpaceBefore: whiteSpaceBefore,
                   charsBeforeCharFound: charsBeforeCharFound,
                   pos: pos,
                   type: type
                });
                charsBeforeCharFound = '';
            }

            if (type !== 'whitespace') {
                whiteSpaceBefore = 0;
            }

            pos += nextSeek;
        }

        if (tokens && tokens.length > 1) {
            return tokens;
        }

        return null;
    }



    alignTokens(text, tokens) {
        // Find the biggest text before the found aligment character
        const before = tokens.reduce((acc, token) => acc = acc > token.charsBeforeCharFound.trimStart().length ? acc : token.charsBeforeCharFound.trimStart().length, 0);
        const originalText = text;
        let offset = 0;

        for (const token of tokens) {
            let toAdd = 0;
            let charsBefore = token.charsBeforeCharFound.trimStart().length;
            if (charsBefore < before) {
                toAdd = before - charsBefore;
            }

            if (toAdd > 0) {
                let space = ' '.repeat(toAdd);
                let pos = token.pos + offset;
                text = text.substring(0, pos) + space + text.substring(pos);
                offset += toAdd;
            }
            //console.log(JSON.stringify(token, null, ' '));
        }

        if (originalText == text) {
            return null;
        }

        return text;
    }



    getGroups(range, text) {
        let start = range.start;
        let end = range.end;
        let groups = [text];

        //let bracketGroups = /(?:\[)([^\]]+)+/gm;
        let bracketRegex = /(?:\[|{)([^\]}]+)+/gm;
        const bracketMatchs = [...text.matchAll(bracketRegex)];

        if (bracketMatchs && bracketMatchs.length) {
            bracketMatchs.forEach(match => {
                if (/\n/.test(match[1])) {
                    groups.push(match[1]);
                }
            });
        }

        return groups;
    }




    /**
     * Return file extension
     */
    getExtension(editor) {
        let filePath = editor.document.path;
        let extension = nova.path.extname(filePath).substring(1);

        if (filePath.endsWith('.blade.php')) {
            extension = 'html';
        } else if (extension == 'vue') {
            extension = 'html';
        }

        return extension;
    }
}
