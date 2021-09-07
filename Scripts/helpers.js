function romanize(num) {
    if (isNaN(num)) return NaN;
    var digits = String(+num).split(''),
        key = [
            '',
            'C',
            'CC',
            'CCC',
            'CD',
            'D',
            'DC',
            'DCC',
            'DCCC',
            'CM',
            '',
            'X',
            'XX',
            'XXX',
            'XL',
            'L',
            'LX',
            'LXX',
            'LXXX',
            'XC',
            '',
            'I',
            'II',
            'III',
            'IV',
            'V',
            'VI',
            'VII',
            'VIII',
            'IX',
        ],
        roman = '',
        i = 3;
    while (i--) roman = (key[+digits.pop() + i * 10] || '') + roman;
    return Array(+digits.join('') + 1).join('M') + roman;
}

function ordinal_suffix(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + 'st';
    }
    if (j == 2 && k != 12) {
        return i + 'nd';
    }
    if (j == 3 && k != 13) {
        return i + 'rd';
    }
    return i + 'th';
}

function titleCase(string) {
    const SMALL_WORDS = /\b(?:an?d?|a[st]|because|but|by|en|for|i[fn]|neither|nor|o[fnr]|only|over|per|so|some|tha[tn]|the|to|up|upon|vs?\.?|versus|via|when|with|without|yet)\b/i;
    const TOKENS = /[^\s:–—-]+|./g;
    const WHITESPACE = /\s/;
    const IS_MANUAL_CASE = /.(?=[A-Z]|\..)/;
    const ALPHANUMERIC_PATTERN = /[A-Za-z0-9\u00C0-\u00FF]/;

    let result = '';
    let m;

    // tslint:disable-next-line
    while ((m = TOKENS.exec(string)) !== null) {
        const { 0: token, index } = m;

        if (
            // Ignore already capitalized words.
            !IS_MANUAL_CASE.test(token) &&
            // Ignore small words except at beginning or end.
            (!SMALL_WORDS.test(token) || index === 0 || index + token.length === string.length) &&
            // Ignore URLs.
            (string.charAt(index + token.length) !== ':' || WHITESPACE.test(string.charAt(index + token.length + 1)))
        ) {
            // Find and uppercase first word character, skips over *modifiers*.
            result += token.replace(ALPHANUMERIC_PATTERN, (m) => m.toUpperCase());
            continue;
        }

        result += token;
    }

    return result;
}

function randomArray(array) {
    var currentIndex = array.length,
        randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

module.exports = {
    romanize,
    ordinal_suffix,
    titleCase,
    randomArray,
};
