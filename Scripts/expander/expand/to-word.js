import { expandToRegexSet } from './to-regex.js';

export function expandToWord(text, startIndex, endIndex) {
    const regex = /[\u00BF-\u1FFF\u2C00-\uD7FF\w$]/;
    return expandToRegexSet(text, startIndex, endIndex, regex, 'word');
}

export function expandToWordWithDot(text, startIndex, endIndex) {
    const regex = /[\u00BF-\u1FFF\u2C00-\uD7FF\w\.$]/;
    return expandToRegexSet(text, startIndex, endIndex, regex, 'word_with_dot');
}
