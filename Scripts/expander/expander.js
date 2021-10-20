import HTMLExpander from './expander-html.js';
import PythonExpander from './expander-python.js';
import PHPExpander from './expander-php.js';
import JavascriptExpander from './expander-javascript.js';

class SelectionExpander {
    expandHistory = new Map();

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

    /**
     * Expand
     * expand the active selections
     */
    expand(editor) {
        if (!editor) {
            return;
        }

        let exp;
        let path = editor.document.path;
        let extension = this.getExtension(editor);
        let text = editor.getTextInRange(new Range(0, editor.document.length));
        let selectedRanges = editor.selectedRanges;

        if (extension) {
            switch (extension) {
                case 'html':
                    exp = new HTMLExpander(editor);
                    break;
                case 'php':
                    exp = new PHPExpander(editor);
                    break;
                case 'py':
                    exp = new PythonExpander(editor);
                    break;
                default:
                    exp = new JavascriptExpander(editor);
                    break;
            }
        }

        const history = this.getHistory(path);

        const newRanges = selectedRanges.map((range, index) => {
            let start = range.start;
            let end = range.end;
            let lineRange = editor.getLineRangeForRange(new Range(start, end));

            let additionalData = {
                lineRange: {
                    start: lineRange.start,
                    end: lineRange.end - 1 >= lineRange.start ? lineRange.end - 1 : lineRange.end,
                },
                selectedText: editor.getTextInRange(new Range(start, end)),
            };

            let result = exp.expand(text, start, end, additionalData);

            if (result) {
                if (!history.steps[index]) {
                    history.steps[index] = [];
                }

                if (this.allowHistoryStep(path, range)) {
                    history.steps[index].push({
                        start: range.start,
                        end: range.end,
                        resultStart: result.start,
                        resultEnd: result.end,
                        index: index
                    });
                    history.lastSelected = result;
                }

                start = result.start;
                end = result.end;
            }

            if (start < end) {
                editor.addSelectionForRange(new Range(start, end));
                return new Range(start, end);
            }
        });

        history.selectedRanges = selectedRanges;

        if (newRanges.length) {
            //editor.selectedRanges = newRanges;
        }
    }

    /**
     * Shink selection
     * shrinks the active selection(s)
     * using the ranges stored in expandHistory
     */
    shrink(editor) {
        const path = editor.document.path;
        const history = this.getHistory(path);

        if (!history || !history.steps.length) {
            return;
        }

        let newRanges = history.selectedRanges.map((range, index) => {
            if (history.steps[index].length > 0) {
                let historyPosition = history.steps[index].pop();
                if (historyPosition && historyPosition.start && historyPosition.end) {
                    return new Range(historyPosition.start, historyPosition.end);
                }
            }
        });

        newRanges = newRanges.filter(Boolean);

        if (newRanges.length) {
            editor.selectedRanges = newRanges;
        }
    }

    /**
     * Get steps history
     *
     * @param {string} path
     */
    getHistory(path) {
        if (!this.expandHistory.has(path)) {
            this.expandHistory.set(path, {
                steps: [],
                selectedRanges: [],
                lastSelected: null
            });
        }

        return this.expandHistory.get(path);
    }

    /**
     * Get last step
     *
     * @param {string} path - current file path
     */
    getHistoryLastSetp(path) {
        const history = this.getHistory(path);
        if (!history.steps || !history.steps[history.steps.length - 1]) {
            return false;
        }

        const steps = history.steps[history.steps.length - 1];
        if (steps && steps.length) {
            const lastStep = steps[steps.length - 1];
            if (lastStep?.start && lastStep?.end) {
                return lastStep;
            }
        }

        return false;
    }

    /**
     * Check if we can push
     * the step into the history array
     *
     * @param {string} path
     * @param {Range} range
     */
    allowHistoryStep(path, range) {
        const lastStep = this.getHistoryLastSetp(path);
        if (!lastStep) {
            return true;
        }

        // Same as previous step, do not push otherwise undo
        // will do the same step multiple times
        if (lastStep.start === range.start && lastStep.end === range.end) {
            return false;
        }

        return true;
    }


    /**
     * Maybe Reset History
     * the editor will reset
     * the selection history
     * once the user clears the
     * active selection
     */
    maybeResetHistory(editor) {
        const path = editor.document.path;
        const history = this.expandHistory.get(path);
        const selected = editor.selectedRanges;

        if (!history) {
            return false;
        }

        // Selection cleared, reset history
        if (history.lastSelected && selected[0].start == selected[0].end) {
            this.resetHistory(editor);
        }
    }

    /**
     * Reset history
     */
    resetHistory(editor) {
        const path = editor.document.path;

        if (this.expandHistory.has(path)) {
            this.expandHistory.set(path, {
                steps: [],
                selectedRanges: [],
                lastSelected: null
            });

            if (nova.inDevMode()) {
                console.log('reset selection data');
            }
        }
    }
}

export default SelectionExpander;
