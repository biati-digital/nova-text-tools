'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

/**
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 */
/**
 * Lower case as a function.
 */
function lowerCase(str) {
    return str.toLowerCase();
}

// Support camel case ("camelCase" -> "camel Case" and "CAMELCase" -> "CAMEL Case").
var DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];
// Remove all non-word characters.
var DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi;
/**
 * Normalize the string into something other libraries can manipulate easier.
 */
function noCase(input, options) {
    if (options === void 0) { options = {}; }
    var _a = options.splitRegexp, splitRegexp = _a === void 0 ? DEFAULT_SPLIT_REGEXP : _a, _b = options.stripRegexp, stripRegexp = _b === void 0 ? DEFAULT_STRIP_REGEXP : _b, _c = options.transform, transform = _c === void 0 ? lowerCase : _c, _d = options.delimiter, delimiter = _d === void 0 ? " " : _d;
    var result = replace(replace(input, splitRegexp, "$1\0$2"), stripRegexp, "\0");
    var start = 0;
    var end = result.length;
    // Trim the delimiter from around the output string.
    while (result.charAt(start) === "\0")
        start++;
    while (result.charAt(end - 1) === "\0")
        end--;
    // Transform each token independently.
    return result.slice(start, end).split("\0").map(transform).join(delimiter);
}
/**
 * Replace `re` in the input string with the replacement value.
 */
function replace(input, re, value) {
    if (re instanceof RegExp)
        return input.replace(re, value);
    return re.reduce(function (input, re) { return input.replace(re, value); }, input);
}

function pascalCaseTransform(input, index) {
    var firstChar = input.charAt(0);
    var lowerChars = input.substr(1).toLowerCase();
    if (index > 0 && firstChar >= "0" && firstChar <= "9") {
        return "_" + firstChar + lowerChars;
    }
    return "" + firstChar.toUpperCase() + lowerChars;
}
function pascalCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: "", transform: pascalCaseTransform }, options));
}

function camelCaseTransform(input, index) {
    if (index === 0)
        return input.toLowerCase();
    return pascalCaseTransform(input, index);
}
function camelCase(input, options) {
    if (options === void 0) { options = {}; }
    return pascalCase(input, __assign({ transform: camelCaseTransform }, options));
}

/**
 * Upper case the first character of an input string.
 */
function upperCaseFirst(input) {
    return input.charAt(0).toUpperCase() + input.substr(1);
}

function capitalCaseTransform(input) {
    return upperCaseFirst(input.toLowerCase());
}
function capitalCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: " ", transform: capitalCaseTransform }, options));
}

/**
 * Source: ftp://ftp.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt
 */
/**
 * Upper case as a function.
 */
function upperCase(str) {
    return str.toUpperCase();
}

function constantCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: "_", transform: upperCase }, options));
}

function dotCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: "." }, options));
}

function headerCase(input, options) {
    if (options === void 0) { options = {}; }
    return capitalCase(input, __assign({ delimiter: "-" }, options));
}

function paramCase(input, options) {
    if (options === void 0) { options = {}; }
    return dotCase(input, __assign({ delimiter: "-" }, options));
}

function pathCase(input, options) {
    if (options === void 0) { options = {}; }
    return dotCase(input, __assign({ delimiter: "/" }, options));
}

function sentenceCaseTransform(input, index) {
    var result = input.toLowerCase();
    if (index === 0)
        return upperCaseFirst(result);
    return result;
}
function sentenceCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: " ", transform: sentenceCaseTransform }, options));
}

function snakeCase(input, options) {
    if (options === void 0) { options = {}; }
    return dotCase(input, __assign({ delimiter: "_" }, options));
}

/**
 * To Title case
 *
 * @param {string}
 */
function titleCase(string) {
    const SMALL_WORDS = /\b(?:an?d?|a[st]|because|but|by|en|for|i[fn]|neither|nor|o[fnr]|only|over|per|so|some|tha[tn]|the|to|up|upon|vs?\.?|versus|via|when|with|without|yet)\b/i;
    const TOKENS = /[^\s:??????-]+|./g;
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

/**
 * Romanize
 * convert number to it's roman counterpart
 *
 * @param {numberi}
 */
function romanize(num) {
    if (isNaN(num)) {
        return NaN;
    }
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
            'IX'
        ],
        roman = '',
        i = 3;
    while (i--) {
        roman = (key[+digits.pop() + i * 10] || '') + roman;
    }
    return Array(+digits.join('') + 1).join('M') + roman;
}

/**
 * Ordinal suffix
 * example 1st, 2nd, etc.
 *
 * @param {numeric} i
 */
function ordinalSuffix(i) {
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

/**
 * Random Array
 * randomize items order
 *
 * @param {array} array
 */
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

function fakeData(format, amount = 1) {
    let val = false;
    switch (format) {
        case 'Full Name':
            val = faker.name.findName();
            break;
        case 'Name':
            val = faker.name.firstName();
            break;
        case 'Lastname':
            val = faker.name.lastName();
            break;
        case 'Email':
            val = faker.internet.email();
            break;
        case 'Phone':
            val = faker.phone.phoneNumber();
            break;
        case 'Credit Card':
            val = faker.finance.creditCardNumber();
            break;
        case 'User Name':
            val = faker.internet.userName();
            break;
        case 'URL':
            val = faker.internet.url();
            break;
        case 'Full Address':
            val = faker.address.streetAddress() + ', ' + faker.address.city() + ', ' + faker.address.country() + ', Zip Code ' + faker.address.zipCode();
            break;
        case 'Country':
            val = faker.address.country();
            break;
        case 'City':
            val = faker.address.city();
            break;
        case 'Street':
            val = faker.address.streetAddress();
            break;
        case 'Zip Code':
            val = faker.address.zipCode();
            break;
        case 'Company':
            val = faker.company.companyName();
            break;
        case 'Lorem Paragraph':
            val = faker.lorem.paragraph();
            break;
        case 'Lorem Paragraphs':
            val = faker.lorem.paragraphs();
            break;
        case 'Number':
            val = faker.datatype.number().toString();
            break;
        case 'JSON':
            val = faker.datatype.json();
            break;
        case 'Array':
            val = faker.random.arrayElements();
            break;
        case 'UUID':
            val = faker.datatype.uuid();
            break;
    }
    return val;
}

/**
 * Quote Transform
 * convert quotes
 *
 * @param {string} input
 * @param {string} toChange
 * @param {string} changeTo
 */
function quotesTransform(input, toChange, changeTo) {
    let result = '';
    let isBetweenQuotes = false;
    let quoteCharacter;

    for (let index = 0; index < input.length; index++) {
        const current = input[index];
        const next = input[index + 1];

        // Found double-quote or single-quote
        // eslint-disable-next-line
        if (current === '"' || current === "'") {
            //eslint-disable-line
            // If not processing in between quotes
            if (!isBetweenQuotes) {
                quoteCharacter = current;
                isBetweenQuotes = true;
                result += changeTo;
            } else if (quoteCharacter === current) {
                // If processing between quotes, close quotes
                result += changeTo;
                isBetweenQuotes = false;
            } else {
                // Still inside quotes
                result += '\\' + changeTo;
            }
        } else if (current === '\\' && (next === "'" || next === '"')) {
            // If escape character is found and double or single quote after
            // Escape + quote to change to
            if (next === changeTo) {
                // If in between quotes and quote is equal to changeTo only escape once
                result += isBetweenQuotes && quoteCharacter === changeTo ? '\\' + changeTo : '\\\\' + changeTo;
                index++;
            } else if (next === toChange) {
                // Escape + quote to be changed
                // If between quotes can mantain tochange
                result += isBetweenQuotes ? toChange : changeTo;
                index++;
            } else {
                result += current;
            }
        } else if (current === '\\' && next === '\\') {
            // Don't touch backslashes
            result += '\\\\';
            index++;
        } else {
            result += current;
        }
    }

    return result;
}

/**
 * Escape string
 *
 * @param {string} string
 */
function escape(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape string
 *
 * @param {string} string
 */
function isRegexLike(string) {
    return /\\w|\\s|\\d|\\b|\\.|\.\*|\.\+/.test(string);
}

/**
 * To Binary
 *
 * @param {string} n
 */
function toBinary(n) {
    let value = convertToBinary(n);
    let length = value.length;
    while (length < 8) {
        value = '0' + value;
        length++;
    }
    return value;
}

/**
 * From Binary
 *
 * @param {string} binary
 * @return {string}
 */
function fromBinary(binary) {
    let out = '';
    while (binary.length >= 8) {
        var byte = binary.slice(0, 8);
        binary = binary.slice(8);
        out += String.fromCharCode(parseInt(byte, 2));
    }

    return decodeURIComponent(escape(out));
}

function convertToBinary(n) {
    if (n <= 1) {
        return String(n);
    } else {
        return convertToBinary(Math.floor(n / 2)) + String(n % 2);
    }
}

/**
 * Log
 * print log in debug pane
 *
 * @param {mixed} message
 */
function log(message) {
    const showLog = nova.workspace.config.get(nova.extension.identifier + '.log');
    if (nova.inDevMode() || showLog) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, 2);
        }
        console.log(message);
    }
}

/**
 * Performance starts
 *
 * @param {string} id
 */
function logPerformanceStart(id = '') {
    const showLog = nova.workspace.config.get(nova.extension.identifier + '.log');
    if (nova.inDevMode() || showLog) {
        console.time(id);
    }
}

/**
 * Performance end
 *
 * @param {string} id
 */
function logPerformanceEnd(id = '') {
    const showLog = nova.workspace.config.get(nova.extension.identifier + '.log');
    if (nova.inDevMode() || showLog) {
        if (typeof message == 'object') {
            message = JSON.stringify(message, null, ' ');
        }
        console.timeEnd(id);
    }
}

/**
 * Show notifications
 *
 * @param {Object}
 */
function showNotification({ id = '', title, body, actions = false, type = '', cancellAll = true }) {
    if (!id) {
        id = nova.extension.identifier;
    }
    if (cancellAll) {
        nova.notifications.cancel(id);
    }

    let request = new NotificationRequest(id);
    request.title = nova.localize(title);
    request.body = nova.localize(body);

    if (actions) {
        if (typeof actions === 'boolean') {
            request.actions = [nova.localize('OK')];
        } else {
            request.actions = actions.map((action) => nova.localize(action));
        }
    }

    nova.notifications.add(request).catch((err) => console.error(err, err.stack));
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var namedReferences = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,"__esModule",{value:true});exports.bodyRegExps={xml:/&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,html4:/&(?:nbsp|iexcl|cent|pound|curren|yen|brvbar|sect|uml|copy|ordf|laquo|not|shy|reg|macr|deg|plusmn|sup2|sup3|acute|micro|para|middot|cedil|sup1|ordm|raquo|frac14|frac12|frac34|iquest|Agrave|Aacute|Acirc|Atilde|Auml|Aring|AElig|Ccedil|Egrave|Eacute|Ecirc|Euml|Igrave|Iacute|Icirc|Iuml|ETH|Ntilde|Ograve|Oacute|Ocirc|Otilde|Ouml|times|Oslash|Ugrave|Uacute|Ucirc|Uuml|Yacute|THORN|szlig|agrave|aacute|acirc|atilde|auml|aring|aelig|ccedil|egrave|eacute|ecirc|euml|igrave|iacute|icirc|iuml|eth|ntilde|ograve|oacute|ocirc|otilde|ouml|divide|oslash|ugrave|uacute|ucirc|uuml|yacute|thorn|yuml|quot|amp|lt|gt|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,html5:/&(?:AElig|AMP|Aacute|Acirc|Agrave|Aring|Atilde|Auml|COPY|Ccedil|ETH|Eacute|Ecirc|Egrave|Euml|GT|Iacute|Icirc|Igrave|Iuml|LT|Ntilde|Oacute|Ocirc|Ograve|Oslash|Otilde|Ouml|QUOT|REG|THORN|Uacute|Ucirc|Ugrave|Uuml|Yacute|aacute|acirc|acute|aelig|agrave|amp|aring|atilde|auml|brvbar|ccedil|cedil|cent|copy|curren|deg|divide|eacute|ecirc|egrave|eth|euml|frac12|frac14|frac34|gt|iacute|icirc|iexcl|igrave|iquest|iuml|laquo|lt|macr|micro|middot|nbsp|not|ntilde|oacute|ocirc|ograve|ordf|ordm|oslash|otilde|ouml|para|plusmn|pound|quot|raquo|reg|sect|shy|sup1|sup2|sup3|szlig|thorn|times|uacute|ucirc|ugrave|uml|uuml|yacute|yen|yuml|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g};exports.namedReferences={xml:{entities:{"&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&amp;":"&"},characters:{"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;","&":"&amp;"}},html4:{entities:{"&apos;":"'","&nbsp":"??","&nbsp;":"??","&iexcl":"??","&iexcl;":"??","&cent":"??","&cent;":"??","&pound":"??","&pound;":"??","&curren":"??","&curren;":"??","&yen":"??","&yen;":"??","&brvbar":"??","&brvbar;":"??","&sect":"??","&sect;":"??","&uml":"??","&uml;":"??","&copy":"??","&copy;":"??","&ordf":"??","&ordf;":"??","&laquo":"??","&laquo;":"??","&not":"??","&not;":"??","&shy":"??","&shy;":"??","&reg":"??","&reg;":"??","&macr":"??","&macr;":"??","&deg":"??","&deg;":"??","&plusmn":"??","&plusmn;":"??","&sup2":"??","&sup2;":"??","&sup3":"??","&sup3;":"??","&acute":"??","&acute;":"??","&micro":"??","&micro;":"??","&para":"??","&para;":"??","&middot":"??","&middot;":"??","&cedil":"??","&cedil;":"??","&sup1":"??","&sup1;":"??","&ordm":"??","&ordm;":"??","&raquo":"??","&raquo;":"??","&frac14":"??","&frac14;":"??","&frac12":"??","&frac12;":"??","&frac34":"??","&frac34;":"??","&iquest":"??","&iquest;":"??","&Agrave":"??","&Agrave;":"??","&Aacute":"??","&Aacute;":"??","&Acirc":"??","&Acirc;":"??","&Atilde":"??","&Atilde;":"??","&Auml":"??","&Auml;":"??","&Aring":"??","&Aring;":"??","&AElig":"??","&AElig;":"??","&Ccedil":"??","&Ccedil;":"??","&Egrave":"??","&Egrave;":"??","&Eacute":"??","&Eacute;":"??","&Ecirc":"??","&Ecirc;":"??","&Euml":"??","&Euml;":"??","&Igrave":"??","&Igrave;":"??","&Iacute":"??","&Iacute;":"??","&Icirc":"??","&Icirc;":"??","&Iuml":"??","&Iuml;":"??","&ETH":"??","&ETH;":"??","&Ntilde":"??","&Ntilde;":"??","&Ograve":"??","&Ograve;":"??","&Oacute":"??","&Oacute;":"??","&Ocirc":"??","&Ocirc;":"??","&Otilde":"??","&Otilde;":"??","&Ouml":"??","&Ouml;":"??","&times":"??","&times;":"??","&Oslash":"??","&Oslash;":"??","&Ugrave":"??","&Ugrave;":"??","&Uacute":"??","&Uacute;":"??","&Ucirc":"??","&Ucirc;":"??","&Uuml":"??","&Uuml;":"??","&Yacute":"??","&Yacute;":"??","&THORN":"??","&THORN;":"??","&szlig":"??","&szlig;":"??","&agrave":"??","&agrave;":"??","&aacute":"??","&aacute;":"??","&acirc":"??","&acirc;":"??","&atilde":"??","&atilde;":"??","&auml":"??","&auml;":"??","&aring":"??","&aring;":"??","&aelig":"??","&aelig;":"??","&ccedil":"??","&ccedil;":"??","&egrave":"??","&egrave;":"??","&eacute":"??","&eacute;":"??","&ecirc":"??","&ecirc;":"??","&euml":"??","&euml;":"??","&igrave":"??","&igrave;":"??","&iacute":"??","&iacute;":"??","&icirc":"??","&icirc;":"??","&iuml":"??","&iuml;":"??","&eth":"??","&eth;":"??","&ntilde":"??","&ntilde;":"??","&ograve":"??","&ograve;":"??","&oacute":"??","&oacute;":"??","&ocirc":"??","&ocirc;":"??","&otilde":"??","&otilde;":"??","&ouml":"??","&ouml;":"??","&divide":"??","&divide;":"??","&oslash":"??","&oslash;":"??","&ugrave":"??","&ugrave;":"??","&uacute":"??","&uacute;":"??","&ucirc":"??","&ucirc;":"??","&uuml":"??","&uuml;":"??","&yacute":"??","&yacute;":"??","&thorn":"??","&thorn;":"??","&yuml":"??","&yuml;":"??","&quot":'"',"&quot;":'"',"&amp":"&","&amp;":"&","&lt":"<","&lt;":"<","&gt":">","&gt;":">","&OElig;":"??","&oelig;":"??","&Scaron;":"??","&scaron;":"??","&Yuml;":"??","&circ;":"??","&tilde;":"??","&ensp;":"???","&emsp;":"???","&thinsp;":"???","&zwnj;":"???","&zwj;":"???","&lrm;":"???","&rlm;":"???","&ndash;":"???","&mdash;":"???","&lsquo;":"???","&rsquo;":"???","&sbquo;":"???","&ldquo;":"???","&rdquo;":"???","&bdquo;":"???","&dagger;":"???","&Dagger;":"???","&permil;":"???","&lsaquo;":"???","&rsaquo;":"???","&euro;":"???","&fnof;":"??","&Alpha;":"??","&Beta;":"??","&Gamma;":"??","&Delta;":"??","&Epsilon;":"??","&Zeta;":"??","&Eta;":"??","&Theta;":"??","&Iota;":"??","&Kappa;":"??","&Lambda;":"??","&Mu;":"??","&Nu;":"??","&Xi;":"??","&Omicron;":"??","&Pi;":"??","&Rho;":"??","&Sigma;":"??","&Tau;":"??","&Upsilon;":"??","&Phi;":"??","&Chi;":"??","&Psi;":"??","&Omega;":"??","&alpha;":"??","&beta;":"??","&gamma;":"??","&delta;":"??","&epsilon;":"??","&zeta;":"??","&eta;":"??","&theta;":"??","&iota;":"??","&kappa;":"??","&lambda;":"??","&mu;":"??","&nu;":"??","&xi;":"??","&omicron;":"??","&pi;":"??","&rho;":"??","&sigmaf;":"??","&sigma;":"??","&tau;":"??","&upsilon;":"??","&phi;":"??","&chi;":"??","&psi;":"??","&omega;":"??","&thetasym;":"??","&upsih;":"??","&piv;":"??","&bull;":"???","&hellip;":"???","&prime;":"???","&Prime;":"???","&oline;":"???","&frasl;":"???","&weierp;":"???","&image;":"???","&real;":"???","&trade;":"???","&alefsym;":"???","&larr;":"???","&uarr;":"???","&rarr;":"???","&darr;":"???","&harr;":"???","&crarr;":"???","&lArr;":"???","&uArr;":"???","&rArr;":"???","&dArr;":"???","&hArr;":"???","&forall;":"???","&part;":"???","&exist;":"???","&empty;":"???","&nabla;":"???","&isin;":"???","&notin;":"???","&ni;":"???","&prod;":"???","&sum;":"???","&minus;":"???","&lowast;":"???","&radic;":"???","&prop;":"???","&infin;":"???","&ang;":"???","&and;":"???","&or;":"???","&cap;":"???","&cup;":"???","&int;":"???","&there4;":"???","&sim;":"???","&cong;":"???","&asymp;":"???","&ne;":"???","&equiv;":"???","&le;":"???","&ge;":"???","&sub;":"???","&sup;":"???","&nsub;":"???","&sube;":"???","&supe;":"???","&oplus;":"???","&otimes;":"???","&perp;":"???","&sdot;":"???","&lceil;":"???","&rceil;":"???","&lfloor;":"???","&rfloor;":"???","&lang;":"???","&rang;":"???","&loz;":"???","&spades;":"???","&clubs;":"???","&hearts;":"???","&diams;":"???"},characters:{"'":"&apos;","??":"&nbsp;","??":"&iexcl;","??":"&cent;","??":"&pound;","??":"&curren;","??":"&yen;","??":"&brvbar;","??":"&sect;","??":"&uml;","??":"&copy;","??":"&ordf;","??":"&laquo;","??":"&not;","??":"&shy;","??":"&reg;","??":"&macr;","??":"&deg;","??":"&plusmn;","??":"&sup2;","??":"&sup3;","??":"&acute;","??":"&micro;","??":"&para;","??":"&middot;","??":"&cedil;","??":"&sup1;","??":"&ordm;","??":"&raquo;","??":"&frac14;","??":"&frac12;","??":"&frac34;","??":"&iquest;","??":"&Agrave;","??":"&Aacute;","??":"&Acirc;","??":"&Atilde;","??":"&Auml;","??":"&Aring;","??":"&AElig;","??":"&Ccedil;","??":"&Egrave;","??":"&Eacute;","??":"&Ecirc;","??":"&Euml;","??":"&Igrave;","??":"&Iacute;","??":"&Icirc;","??":"&Iuml;","??":"&ETH;","??":"&Ntilde;","??":"&Ograve;","??":"&Oacute;","??":"&Ocirc;","??":"&Otilde;","??":"&Ouml;","??":"&times;","??":"&Oslash;","??":"&Ugrave;","??":"&Uacute;","??":"&Ucirc;","??":"&Uuml;","??":"&Yacute;","??":"&THORN;","??":"&szlig;","??":"&agrave;","??":"&aacute;","??":"&acirc;","??":"&atilde;","??":"&auml;","??":"&aring;","??":"&aelig;","??":"&ccedil;","??":"&egrave;","??":"&eacute;","??":"&ecirc;","??":"&euml;","??":"&igrave;","??":"&iacute;","??":"&icirc;","??":"&iuml;","??":"&eth;","??":"&ntilde;","??":"&ograve;","??":"&oacute;","??":"&ocirc;","??":"&otilde;","??":"&ouml;","??":"&divide;","??":"&oslash;","??":"&ugrave;","??":"&uacute;","??":"&ucirc;","??":"&uuml;","??":"&yacute;","??":"&thorn;","??":"&yuml;",'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;","??":"&OElig;","??":"&oelig;","??":"&Scaron;","??":"&scaron;","??":"&Yuml;","??":"&circ;","??":"&tilde;","???":"&ensp;","???":"&emsp;","???":"&thinsp;","???":"&zwnj;","???":"&zwj;","???":"&lrm;","???":"&rlm;","???":"&ndash;","???":"&mdash;","???":"&lsquo;","???":"&rsquo;","???":"&sbquo;","???":"&ldquo;","???":"&rdquo;","???":"&bdquo;","???":"&dagger;","???":"&Dagger;","???":"&permil;","???":"&lsaquo;","???":"&rsaquo;","???":"&euro;","??":"&fnof;","??":"&Alpha;","??":"&Beta;","??":"&Gamma;","??":"&Delta;","??":"&Epsilon;","??":"&Zeta;","??":"&Eta;","??":"&Theta;","??":"&Iota;","??":"&Kappa;","??":"&Lambda;","??":"&Mu;","??":"&Nu;","??":"&Xi;","??":"&Omicron;","??":"&Pi;","??":"&Rho;","??":"&Sigma;","??":"&Tau;","??":"&Upsilon;","??":"&Phi;","??":"&Chi;","??":"&Psi;","??":"&Omega;","??":"&alpha;","??":"&beta;","??":"&gamma;","??":"&delta;","??":"&epsilon;","??":"&zeta;","??":"&eta;","??":"&theta;","??":"&iota;","??":"&kappa;","??":"&lambda;","??":"&mu;","??":"&nu;","??":"&xi;","??":"&omicron;","??":"&pi;","??":"&rho;","??":"&sigmaf;","??":"&sigma;","??":"&tau;","??":"&upsilon;","??":"&phi;","??":"&chi;","??":"&psi;","??":"&omega;","??":"&thetasym;","??":"&upsih;","??":"&piv;","???":"&bull;","???":"&hellip;","???":"&prime;","???":"&Prime;","???":"&oline;","???":"&frasl;","???":"&weierp;","???":"&image;","???":"&real;","???":"&trade;","???":"&alefsym;","???":"&larr;","???":"&uarr;","???":"&rarr;","???":"&darr;","???":"&harr;","???":"&crarr;","???":"&lArr;","???":"&uArr;","???":"&rArr;","???":"&dArr;","???":"&hArr;","???":"&forall;","???":"&part;","???":"&exist;","???":"&empty;","???":"&nabla;","???":"&isin;","???":"&notin;","???":"&ni;","???":"&prod;","???":"&sum;","???":"&minus;","???":"&lowast;","???":"&radic;","???":"&prop;","???":"&infin;","???":"&ang;","???":"&and;","???":"&or;","???":"&cap;","???":"&cup;","???":"&int;","???":"&there4;","???":"&sim;","???":"&cong;","???":"&asymp;","???":"&ne;","???":"&equiv;","???":"&le;","???":"&ge;","???":"&sub;","???":"&sup;","???":"&nsub;","???":"&sube;","???":"&supe;","???":"&oplus;","???":"&otimes;","???":"&perp;","???":"&sdot;","???":"&lceil;","???":"&rceil;","???":"&lfloor;","???":"&rfloor;","???":"&lang;","???":"&rang;","???":"&loz;","???":"&spades;","???":"&clubs;","???":"&hearts;","???":"&diams;"}},html5:{entities:{"&AElig":"??","&AElig;":"??","&AMP":"&","&AMP;":"&","&Aacute":"??","&Aacute;":"??","&Abreve;":"??","&Acirc":"??","&Acirc;":"??","&Acy;":"??","&Afr;":"????","&Agrave":"??","&Agrave;":"??","&Alpha;":"??","&Amacr;":"??","&And;":"???","&Aogon;":"??","&Aopf;":"????","&ApplyFunction;":"???","&Aring":"??","&Aring;":"??","&Ascr;":"????","&Assign;":"???","&Atilde":"??","&Atilde;":"??","&Auml":"??","&Auml;":"??","&Backslash;":"???","&Barv;":"???","&Barwed;":"???","&Bcy;":"??","&Because;":"???","&Bernoullis;":"???","&Beta;":"??","&Bfr;":"????","&Bopf;":"????","&Breve;":"??","&Bscr;":"???","&Bumpeq;":"???","&CHcy;":"??","&COPY":"??","&COPY;":"??","&Cacute;":"??","&Cap;":"???","&CapitalDifferentialD;":"???","&Cayleys;":"???","&Ccaron;":"??","&Ccedil":"??","&Ccedil;":"??","&Ccirc;":"??","&Cconint;":"???","&Cdot;":"??","&Cedilla;":"??","&CenterDot;":"??","&Cfr;":"???","&Chi;":"??","&CircleDot;":"???","&CircleMinus;":"???","&CirclePlus;":"???","&CircleTimes;":"???","&ClockwiseContourIntegral;":"???","&CloseCurlyDoubleQuote;":"???","&CloseCurlyQuote;":"???","&Colon;":"???","&Colone;":"???","&Congruent;":"???","&Conint;":"???","&ContourIntegral;":"???","&Copf;":"???","&Coproduct;":"???","&CounterClockwiseContourIntegral;":"???","&Cross;":"???","&Cscr;":"????","&Cup;":"???","&CupCap;":"???","&DD;":"???","&DDotrahd;":"???","&DJcy;":"??","&DScy;":"??","&DZcy;":"??","&Dagger;":"???","&Darr;":"???","&Dashv;":"???","&Dcaron;":"??","&Dcy;":"??","&Del;":"???","&Delta;":"??","&Dfr;":"????","&DiacriticalAcute;":"??","&DiacriticalDot;":"??","&DiacriticalDoubleAcute;":"??","&DiacriticalGrave;":"`","&DiacriticalTilde;":"??","&Diamond;":"???","&DifferentialD;":"???","&Dopf;":"????","&Dot;":"??","&DotDot;":"???","&DotEqual;":"???","&DoubleContourIntegral;":"???","&DoubleDot;":"??","&DoubleDownArrow;":"???","&DoubleLeftArrow;":"???","&DoubleLeftRightArrow;":"???","&DoubleLeftTee;":"???","&DoubleLongLeftArrow;":"???","&DoubleLongLeftRightArrow;":"???","&DoubleLongRightArrow;":"???","&DoubleRightArrow;":"???","&DoubleRightTee;":"???","&DoubleUpArrow;":"???","&DoubleUpDownArrow;":"???","&DoubleVerticalBar;":"???","&DownArrow;":"???","&DownArrowBar;":"???","&DownArrowUpArrow;":"???","&DownBreve;":"??","&DownLeftRightVector;":"???","&DownLeftTeeVector;":"???","&DownLeftVector;":"???","&DownLeftVectorBar;":"???","&DownRightTeeVector;":"???","&DownRightVector;":"???","&DownRightVectorBar;":"???","&DownTee;":"???","&DownTeeArrow;":"???","&Downarrow;":"???","&Dscr;":"????","&Dstrok;":"??","&ENG;":"??","&ETH":"??","&ETH;":"??","&Eacute":"??","&Eacute;":"??","&Ecaron;":"??","&Ecirc":"??","&Ecirc;":"??","&Ecy;":"??","&Edot;":"??","&Efr;":"????","&Egrave":"??","&Egrave;":"??","&Element;":"???","&Emacr;":"??","&EmptySmallSquare;":"???","&EmptyVerySmallSquare;":"???","&Eogon;":"??","&Eopf;":"????","&Epsilon;":"??","&Equal;":"???","&EqualTilde;":"???","&Equilibrium;":"???","&Escr;":"???","&Esim;":"???","&Eta;":"??","&Euml":"??","&Euml;":"??","&Exists;":"???","&ExponentialE;":"???","&Fcy;":"??","&Ffr;":"????","&FilledSmallSquare;":"???","&FilledVerySmallSquare;":"???","&Fopf;":"????","&ForAll;":"???","&Fouriertrf;":"???","&Fscr;":"???","&GJcy;":"??","&GT":">","&GT;":">","&Gamma;":"??","&Gammad;":"??","&Gbreve;":"??","&Gcedil;":"??","&Gcirc;":"??","&Gcy;":"??","&Gdot;":"??","&Gfr;":"????","&Gg;":"???","&Gopf;":"????","&GreaterEqual;":"???","&GreaterEqualLess;":"???","&GreaterFullEqual;":"???","&GreaterGreater;":"???","&GreaterLess;":"???","&GreaterSlantEqual;":"???","&GreaterTilde;":"???","&Gscr;":"????","&Gt;":"???","&HARDcy;":"??","&Hacek;":"??","&Hat;":"^","&Hcirc;":"??","&Hfr;":"???","&HilbertSpace;":"???","&Hopf;":"???","&HorizontalLine;":"???","&Hscr;":"???","&Hstrok;":"??","&HumpDownHump;":"???","&HumpEqual;":"???","&IEcy;":"??","&IJlig;":"??","&IOcy;":"??","&Iacute":"??","&Iacute;":"??","&Icirc":"??","&Icirc;":"??","&Icy;":"??","&Idot;":"??","&Ifr;":"???","&Igrave":"??","&Igrave;":"??","&Im;":"???","&Imacr;":"??","&ImaginaryI;":"???","&Implies;":"???","&Int;":"???","&Integral;":"???","&Intersection;":"???","&InvisibleComma;":"???","&InvisibleTimes;":"???","&Iogon;":"??","&Iopf;":"????","&Iota;":"??","&Iscr;":"???","&Itilde;":"??","&Iukcy;":"??","&Iuml":"??","&Iuml;":"??","&Jcirc;":"??","&Jcy;":"??","&Jfr;":"????","&Jopf;":"????","&Jscr;":"????","&Jsercy;":"??","&Jukcy;":"??","&KHcy;":"??","&KJcy;":"??","&Kappa;":"??","&Kcedil;":"??","&Kcy;":"??","&Kfr;":"????","&Kopf;":"????","&Kscr;":"????","&LJcy;":"??","&LT":"<","&LT;":"<","&Lacute;":"??","&Lambda;":"??","&Lang;":"???","&Laplacetrf;":"???","&Larr;":"???","&Lcaron;":"??","&Lcedil;":"??","&Lcy;":"??","&LeftAngleBracket;":"???","&LeftArrow;":"???","&LeftArrowBar;":"???","&LeftArrowRightArrow;":"???","&LeftCeiling;":"???","&LeftDoubleBracket;":"???","&LeftDownTeeVector;":"???","&LeftDownVector;":"???","&LeftDownVectorBar;":"???","&LeftFloor;":"???","&LeftRightArrow;":"???","&LeftRightVector;":"???","&LeftTee;":"???","&LeftTeeArrow;":"???","&LeftTeeVector;":"???","&LeftTriangle;":"???","&LeftTriangleBar;":"???","&LeftTriangleEqual;":"???","&LeftUpDownVector;":"???","&LeftUpTeeVector;":"???","&LeftUpVector;":"???","&LeftUpVectorBar;":"???","&LeftVector;":"???","&LeftVectorBar;":"???","&Leftarrow;":"???","&Leftrightarrow;":"???","&LessEqualGreater;":"???","&LessFullEqual;":"???","&LessGreater;":"???","&LessLess;":"???","&LessSlantEqual;":"???","&LessTilde;":"???","&Lfr;":"????","&Ll;":"???","&Lleftarrow;":"???","&Lmidot;":"??","&LongLeftArrow;":"???","&LongLeftRightArrow;":"???","&LongRightArrow;":"???","&Longleftarrow;":"???","&Longleftrightarrow;":"???","&Longrightarrow;":"???","&Lopf;":"????","&LowerLeftArrow;":"???","&LowerRightArrow;":"???","&Lscr;":"???","&Lsh;":"???","&Lstrok;":"??","&Lt;":"???","&Map;":"???","&Mcy;":"??","&MediumSpace;":"???","&Mellintrf;":"???","&Mfr;":"????","&MinusPlus;":"???","&Mopf;":"????","&Mscr;":"???","&Mu;":"??","&NJcy;":"??","&Nacute;":"??","&Ncaron;":"??","&Ncedil;":"??","&Ncy;":"??","&NegativeMediumSpace;":"???","&NegativeThickSpace;":"???","&NegativeThinSpace;":"???","&NegativeVeryThinSpace;":"???","&NestedGreaterGreater;":"???","&NestedLessLess;":"???","&NewLine;":"\n","&Nfr;":"????","&NoBreak;":"???","&NonBreakingSpace;":"??","&Nopf;":"???","&Not;":"???","&NotCongruent;":"???","&NotCupCap;":"???","&NotDoubleVerticalBar;":"???","&NotElement;":"???","&NotEqual;":"???","&NotEqualTilde;":"?????","&NotExists;":"???","&NotGreater;":"???","&NotGreaterEqual;":"???","&NotGreaterFullEqual;":"?????","&NotGreaterGreater;":"?????","&NotGreaterLess;":"???","&NotGreaterSlantEqual;":"?????","&NotGreaterTilde;":"???","&NotHumpDownHump;":"?????","&NotHumpEqual;":"?????","&NotLeftTriangle;":"???","&NotLeftTriangleBar;":"?????","&NotLeftTriangleEqual;":"???","&NotLess;":"???","&NotLessEqual;":"???","&NotLessGreater;":"???","&NotLessLess;":"?????","&NotLessSlantEqual;":"?????","&NotLessTilde;":"???","&NotNestedGreaterGreater;":"?????","&NotNestedLessLess;":"?????","&NotPrecedes;":"???","&NotPrecedesEqual;":"?????","&NotPrecedesSlantEqual;":"???","&NotReverseElement;":"???","&NotRightTriangle;":"???","&NotRightTriangleBar;":"?????","&NotRightTriangleEqual;":"???","&NotSquareSubset;":"?????","&NotSquareSubsetEqual;":"???","&NotSquareSuperset;":"?????","&NotSquareSupersetEqual;":"???","&NotSubset;":"??????","&NotSubsetEqual;":"???","&NotSucceeds;":"???","&NotSucceedsEqual;":"?????","&NotSucceedsSlantEqual;":"???","&NotSucceedsTilde;":"?????","&NotSuperset;":"??????","&NotSupersetEqual;":"???","&NotTilde;":"???","&NotTildeEqual;":"???","&NotTildeFullEqual;":"???","&NotTildeTilde;":"???","&NotVerticalBar;":"???","&Nscr;":"????","&Ntilde":"??","&Ntilde;":"??","&Nu;":"??","&OElig;":"??","&Oacute":"??","&Oacute;":"??","&Ocirc":"??","&Ocirc;":"??","&Ocy;":"??","&Odblac;":"??","&Ofr;":"????","&Ograve":"??","&Ograve;":"??","&Omacr;":"??","&Omega;":"??","&Omicron;":"??","&Oopf;":"????","&OpenCurlyDoubleQuote;":"???","&OpenCurlyQuote;":"???","&Or;":"???","&Oscr;":"????","&Oslash":"??","&Oslash;":"??","&Otilde":"??","&Otilde;":"??","&Otimes;":"???","&Ouml":"??","&Ouml;":"??","&OverBar;":"???","&OverBrace;":"???","&OverBracket;":"???","&OverParenthesis;":"???","&PartialD;":"???","&Pcy;":"??","&Pfr;":"????","&Phi;":"??","&Pi;":"??","&PlusMinus;":"??","&Poincareplane;":"???","&Popf;":"???","&Pr;":"???","&Precedes;":"???","&PrecedesEqual;":"???","&PrecedesSlantEqual;":"???","&PrecedesTilde;":"???","&Prime;":"???","&Product;":"???","&Proportion;":"???","&Proportional;":"???","&Pscr;":"????","&Psi;":"??","&QUOT":'"',"&QUOT;":'"',"&Qfr;":"????","&Qopf;":"???","&Qscr;":"????","&RBarr;":"???","&REG":"??","&REG;":"??","&Racute;":"??","&Rang;":"???","&Rarr;":"???","&Rarrtl;":"???","&Rcaron;":"??","&Rcedil;":"??","&Rcy;":"??","&Re;":"???","&ReverseElement;":"???","&ReverseEquilibrium;":"???","&ReverseUpEquilibrium;":"???","&Rfr;":"???","&Rho;":"??","&RightAngleBracket;":"???","&RightArrow;":"???","&RightArrowBar;":"???","&RightArrowLeftArrow;":"???","&RightCeiling;":"???","&RightDoubleBracket;":"???","&RightDownTeeVector;":"???","&RightDownVector;":"???","&RightDownVectorBar;":"???","&RightFloor;":"???","&RightTee;":"???","&RightTeeArrow;":"???","&RightTeeVector;":"???","&RightTriangle;":"???","&RightTriangleBar;":"???","&RightTriangleEqual;":"???","&RightUpDownVector;":"???","&RightUpTeeVector;":"???","&RightUpVector;":"???","&RightUpVectorBar;":"???","&RightVector;":"???","&RightVectorBar;":"???","&Rightarrow;":"???","&Ropf;":"???","&RoundImplies;":"???","&Rrightarrow;":"???","&Rscr;":"???","&Rsh;":"???","&RuleDelayed;":"???","&SHCHcy;":"??","&SHcy;":"??","&SOFTcy;":"??","&Sacute;":"??","&Sc;":"???","&Scaron;":"??","&Scedil;":"??","&Scirc;":"??","&Scy;":"??","&Sfr;":"????","&ShortDownArrow;":"???","&ShortLeftArrow;":"???","&ShortRightArrow;":"???","&ShortUpArrow;":"???","&Sigma;":"??","&SmallCircle;":"???","&Sopf;":"????","&Sqrt;":"???","&Square;":"???","&SquareIntersection;":"???","&SquareSubset;":"???","&SquareSubsetEqual;":"???","&SquareSuperset;":"???","&SquareSupersetEqual;":"???","&SquareUnion;":"???","&Sscr;":"????","&Star;":"???","&Sub;":"???","&Subset;":"???","&SubsetEqual;":"???","&Succeeds;":"???","&SucceedsEqual;":"???","&SucceedsSlantEqual;":"???","&SucceedsTilde;":"???","&SuchThat;":"???","&Sum;":"???","&Sup;":"???","&Superset;":"???","&SupersetEqual;":"???","&Supset;":"???","&THORN":"??","&THORN;":"??","&TRADE;":"???","&TSHcy;":"??","&TScy;":"??","&Tab;":"\t","&Tau;":"??","&Tcaron;":"??","&Tcedil;":"??","&Tcy;":"??","&Tfr;":"????","&Therefore;":"???","&Theta;":"??","&ThickSpace;":"??????","&ThinSpace;":"???","&Tilde;":"???","&TildeEqual;":"???","&TildeFullEqual;":"???","&TildeTilde;":"???","&Topf;":"????","&TripleDot;":"???","&Tscr;":"????","&Tstrok;":"??","&Uacute":"??","&Uacute;":"??","&Uarr;":"???","&Uarrocir;":"???","&Ubrcy;":"??","&Ubreve;":"??","&Ucirc":"??","&Ucirc;":"??","&Ucy;":"??","&Udblac;":"??","&Ufr;":"????","&Ugrave":"??","&Ugrave;":"??","&Umacr;":"??","&UnderBar;":"_","&UnderBrace;":"???","&UnderBracket;":"???","&UnderParenthesis;":"???","&Union;":"???","&UnionPlus;":"???","&Uogon;":"??","&Uopf;":"????","&UpArrow;":"???","&UpArrowBar;":"???","&UpArrowDownArrow;":"???","&UpDownArrow;":"???","&UpEquilibrium;":"???","&UpTee;":"???","&UpTeeArrow;":"???","&Uparrow;":"???","&Updownarrow;":"???","&UpperLeftArrow;":"???","&UpperRightArrow;":"???","&Upsi;":"??","&Upsilon;":"??","&Uring;":"??","&Uscr;":"????","&Utilde;":"??","&Uuml":"??","&Uuml;":"??","&VDash;":"???","&Vbar;":"???","&Vcy;":"??","&Vdash;":"???","&Vdashl;":"???","&Vee;":"???","&Verbar;":"???","&Vert;":"???","&VerticalBar;":"???","&VerticalLine;":"|","&VerticalSeparator;":"???","&VerticalTilde;":"???","&VeryThinSpace;":"???","&Vfr;":"????","&Vopf;":"????","&Vscr;":"????","&Vvdash;":"???","&Wcirc;":"??","&Wedge;":"???","&Wfr;":"????","&Wopf;":"????","&Wscr;":"????","&Xfr;":"????","&Xi;":"??","&Xopf;":"????","&Xscr;":"????","&YAcy;":"??","&YIcy;":"??","&YUcy;":"??","&Yacute":"??","&Yacute;":"??","&Ycirc;":"??","&Ycy;":"??","&Yfr;":"????","&Yopf;":"????","&Yscr;":"????","&Yuml;":"??","&ZHcy;":"??","&Zacute;":"??","&Zcaron;":"??","&Zcy;":"??","&Zdot;":"??","&ZeroWidthSpace;":"???","&Zeta;":"??","&Zfr;":"???","&Zopf;":"???","&Zscr;":"????","&aacute":"??","&aacute;":"??","&abreve;":"??","&ac;":"???","&acE;":"?????","&acd;":"???","&acirc":"??","&acirc;":"??","&acute":"??","&acute;":"??","&acy;":"??","&aelig":"??","&aelig;":"??","&af;":"???","&afr;":"????","&agrave":"??","&agrave;":"??","&alefsym;":"???","&aleph;":"???","&alpha;":"??","&amacr;":"??","&amalg;":"???","&amp":"&","&amp;":"&","&and;":"???","&andand;":"???","&andd;":"???","&andslope;":"???","&andv;":"???","&ang;":"???","&ange;":"???","&angle;":"???","&angmsd;":"???","&angmsdaa;":"???","&angmsdab;":"???","&angmsdac;":"???","&angmsdad;":"???","&angmsdae;":"???","&angmsdaf;":"???","&angmsdag;":"???","&angmsdah;":"???","&angrt;":"???","&angrtvb;":"???","&angrtvbd;":"???","&angsph;":"???","&angst;":"??","&angzarr;":"???","&aogon;":"??","&aopf;":"????","&ap;":"???","&apE;":"???","&apacir;":"???","&ape;":"???","&apid;":"???","&apos;":"'","&approx;":"???","&approxeq;":"???","&aring":"??","&aring;":"??","&ascr;":"????","&ast;":"*","&asymp;":"???","&asympeq;":"???","&atilde":"??","&atilde;":"??","&auml":"??","&auml;":"??","&awconint;":"???","&awint;":"???","&bNot;":"???","&backcong;":"???","&backepsilon;":"??","&backprime;":"???","&backsim;":"???","&backsimeq;":"???","&barvee;":"???","&barwed;":"???","&barwedge;":"???","&bbrk;":"???","&bbrktbrk;":"???","&bcong;":"???","&bcy;":"??","&bdquo;":"???","&becaus;":"???","&because;":"???","&bemptyv;":"???","&bepsi;":"??","&bernou;":"???","&beta;":"??","&beth;":"???","&between;":"???","&bfr;":"????","&bigcap;":"???","&bigcirc;":"???","&bigcup;":"???","&bigodot;":"???","&bigoplus;":"???","&bigotimes;":"???","&bigsqcup;":"???","&bigstar;":"???","&bigtriangledown;":"???","&bigtriangleup;":"???","&biguplus;":"???","&bigvee;":"???","&bigwedge;":"???","&bkarow;":"???","&blacklozenge;":"???","&blacksquare;":"???","&blacktriangle;":"???","&blacktriangledown;":"???","&blacktriangleleft;":"???","&blacktriangleright;":"???","&blank;":"???","&blk12;":"???","&blk14;":"???","&blk34;":"???","&block;":"???","&bne;":"=???","&bnequiv;":"??????","&bnot;":"???","&bopf;":"????","&bot;":"???","&bottom;":"???","&bowtie;":"???","&boxDL;":"???","&boxDR;":"???","&boxDl;":"???","&boxDr;":"???","&boxH;":"???","&boxHD;":"???","&boxHU;":"???","&boxHd;":"???","&boxHu;":"???","&boxUL;":"???","&boxUR;":"???","&boxUl;":"???","&boxUr;":"???","&boxV;":"???","&boxVH;":"???","&boxVL;":"???","&boxVR;":"???","&boxVh;":"???","&boxVl;":"???","&boxVr;":"???","&boxbox;":"???","&boxdL;":"???","&boxdR;":"???","&boxdl;":"???","&boxdr;":"???","&boxh;":"???","&boxhD;":"???","&boxhU;":"???","&boxhd;":"???","&boxhu;":"???","&boxminus;":"???","&boxplus;":"???","&boxtimes;":"???","&boxuL;":"???","&boxuR;":"???","&boxul;":"???","&boxur;":"???","&boxv;":"???","&boxvH;":"???","&boxvL;":"???","&boxvR;":"???","&boxvh;":"???","&boxvl;":"???","&boxvr;":"???","&bprime;":"???","&breve;":"??","&brvbar":"??","&brvbar;":"??","&bscr;":"????","&bsemi;":"???","&bsim;":"???","&bsime;":"???","&bsol;":"\\","&bsolb;":"???","&bsolhsub;":"???","&bull;":"???","&bullet;":"???","&bump;":"???","&bumpE;":"???","&bumpe;":"???","&bumpeq;":"???","&cacute;":"??","&cap;":"???","&capand;":"???","&capbrcup;":"???","&capcap;":"???","&capcup;":"???","&capdot;":"???","&caps;":"??????","&caret;":"???","&caron;":"??","&ccaps;":"???","&ccaron;":"??","&ccedil":"??","&ccedil;":"??","&ccirc;":"??","&ccups;":"???","&ccupssm;":"???","&cdot;":"??","&cedil":"??","&cedil;":"??","&cemptyv;":"???","&cent":"??","&cent;":"??","&centerdot;":"??","&cfr;":"????","&chcy;":"??","&check;":"???","&checkmark;":"???","&chi;":"??","&cir;":"???","&cirE;":"???","&circ;":"??","&circeq;":"???","&circlearrowleft;":"???","&circlearrowright;":"???","&circledR;":"??","&circledS;":"???","&circledast;":"???","&circledcirc;":"???","&circleddash;":"???","&cire;":"???","&cirfnint;":"???","&cirmid;":"???","&cirscir;":"???","&clubs;":"???","&clubsuit;":"???","&colon;":":","&colone;":"???","&coloneq;":"???","&comma;":",","&commat;":"@","&comp;":"???","&compfn;":"???","&complement;":"???","&complexes;":"???","&cong;":"???","&congdot;":"???","&conint;":"???","&copf;":"????","&coprod;":"???","&copy":"??","&copy;":"??","&copysr;":"???","&crarr;":"???","&cross;":"???","&cscr;":"????","&csub;":"???","&csube;":"???","&csup;":"???","&csupe;":"???","&ctdot;":"???","&cudarrl;":"???","&cudarrr;":"???","&cuepr;":"???","&cuesc;":"???","&cularr;":"???","&cularrp;":"???","&cup;":"???","&cupbrcap;":"???","&cupcap;":"???","&cupcup;":"???","&cupdot;":"???","&cupor;":"???","&cups;":"??????","&curarr;":"???","&curarrm;":"???","&curlyeqprec;":"???","&curlyeqsucc;":"???","&curlyvee;":"???","&curlywedge;":"???","&curren":"??","&curren;":"??","&curvearrowleft;":"???","&curvearrowright;":"???","&cuvee;":"???","&cuwed;":"???","&cwconint;":"???","&cwint;":"???","&cylcty;":"???","&dArr;":"???","&dHar;":"???","&dagger;":"???","&daleth;":"???","&darr;":"???","&dash;":"???","&dashv;":"???","&dbkarow;":"???","&dblac;":"??","&dcaron;":"??","&dcy;":"??","&dd;":"???","&ddagger;":"???","&ddarr;":"???","&ddotseq;":"???","&deg":"??","&deg;":"??","&delta;":"??","&demptyv;":"???","&dfisht;":"???","&dfr;":"????","&dharl;":"???","&dharr;":"???","&diam;":"???","&diamond;":"???","&diamondsuit;":"???","&diams;":"???","&die;":"??","&digamma;":"??","&disin;":"???","&div;":"??","&divide":"??","&divide;":"??","&divideontimes;":"???","&divonx;":"???","&djcy;":"??","&dlcorn;":"???","&dlcrop;":"???","&dollar;":"$","&dopf;":"????","&dot;":"??","&doteq;":"???","&doteqdot;":"???","&dotminus;":"???","&dotplus;":"???","&dotsquare;":"???","&doublebarwedge;":"???","&downarrow;":"???","&downdownarrows;":"???","&downharpoonleft;":"???","&downharpoonright;":"???","&drbkarow;":"???","&drcorn;":"???","&drcrop;":"???","&dscr;":"????","&dscy;":"??","&dsol;":"???","&dstrok;":"??","&dtdot;":"???","&dtri;":"???","&dtrif;":"???","&duarr;":"???","&duhar;":"???","&dwangle;":"???","&dzcy;":"??","&dzigrarr;":"???","&eDDot;":"???","&eDot;":"???","&eacute":"??","&eacute;":"??","&easter;":"???","&ecaron;":"??","&ecir;":"???","&ecirc":"??","&ecirc;":"??","&ecolon;":"???","&ecy;":"??","&edot;":"??","&ee;":"???","&efDot;":"???","&efr;":"????","&eg;":"???","&egrave":"??","&egrave;":"??","&egs;":"???","&egsdot;":"???","&el;":"???","&elinters;":"???","&ell;":"???","&els;":"???","&elsdot;":"???","&emacr;":"??","&empty;":"???","&emptyset;":"???","&emptyv;":"???","&emsp13;":"???","&emsp14;":"???","&emsp;":"???","&eng;":"??","&ensp;":"???","&eogon;":"??","&eopf;":"????","&epar;":"???","&eparsl;":"???","&eplus;":"???","&epsi;":"??","&epsilon;":"??","&epsiv;":"??","&eqcirc;":"???","&eqcolon;":"???","&eqsim;":"???","&eqslantgtr;":"???","&eqslantless;":"???","&equals;":"=","&equest;":"???","&equiv;":"???","&equivDD;":"???","&eqvparsl;":"???","&erDot;":"???","&erarr;":"???","&escr;":"???","&esdot;":"???","&esim;":"???","&eta;":"??","&eth":"??","&eth;":"??","&euml":"??","&euml;":"??","&euro;":"???","&excl;":"!","&exist;":"???","&expectation;":"???","&exponentiale;":"???","&fallingdotseq;":"???","&fcy;":"??","&female;":"???","&ffilig;":"???","&fflig;":"???","&ffllig;":"???","&ffr;":"????","&filig;":"???","&fjlig;":"fj","&flat;":"???","&fllig;":"???","&fltns;":"???","&fnof;":"??","&fopf;":"????","&forall;":"???","&fork;":"???","&forkv;":"???","&fpartint;":"???","&frac12":"??","&frac12;":"??","&frac13;":"???","&frac14":"??","&frac14;":"??","&frac15;":"???","&frac16;":"???","&frac18;":"???","&frac23;":"???","&frac25;":"???","&frac34":"??","&frac34;":"??","&frac35;":"???","&frac38;":"???","&frac45;":"???","&frac56;":"???","&frac58;":"???","&frac78;":"???","&frasl;":"???","&frown;":"???","&fscr;":"????","&gE;":"???","&gEl;":"???","&gacute;":"??","&gamma;":"??","&gammad;":"??","&gap;":"???","&gbreve;":"??","&gcirc;":"??","&gcy;":"??","&gdot;":"??","&ge;":"???","&gel;":"???","&geq;":"???","&geqq;":"???","&geqslant;":"???","&ges;":"???","&gescc;":"???","&gesdot;":"???","&gesdoto;":"???","&gesdotol;":"???","&gesl;":"??????","&gesles;":"???","&gfr;":"????","&gg;":"???","&ggg;":"???","&gimel;":"???","&gjcy;":"??","&gl;":"???","&glE;":"???","&gla;":"???","&glj;":"???","&gnE;":"???","&gnap;":"???","&gnapprox;":"???","&gne;":"???","&gneq;":"???","&gneqq;":"???","&gnsim;":"???","&gopf;":"????","&grave;":"`","&gscr;":"???","&gsim;":"???","&gsime;":"???","&gsiml;":"???","&gt":">","&gt;":">","&gtcc;":"???","&gtcir;":"???","&gtdot;":"???","&gtlPar;":"???","&gtquest;":"???","&gtrapprox;":"???","&gtrarr;":"???","&gtrdot;":"???","&gtreqless;":"???","&gtreqqless;":"???","&gtrless;":"???","&gtrsim;":"???","&gvertneqq;":"??????","&gvnE;":"??????","&hArr;":"???","&hairsp;":"???","&half;":"??","&hamilt;":"???","&hardcy;":"??","&harr;":"???","&harrcir;":"???","&harrw;":"???","&hbar;":"???","&hcirc;":"??","&hearts;":"???","&heartsuit;":"???","&hellip;":"???","&hercon;":"???","&hfr;":"????","&hksearow;":"???","&hkswarow;":"???","&hoarr;":"???","&homtht;":"???","&hookleftarrow;":"???","&hookrightarrow;":"???","&hopf;":"????","&horbar;":"???","&hscr;":"????","&hslash;":"???","&hstrok;":"??","&hybull;":"???","&hyphen;":"???","&iacute":"??","&iacute;":"??","&ic;":"???","&icirc":"??","&icirc;":"??","&icy;":"??","&iecy;":"??","&iexcl":"??","&iexcl;":"??","&iff;":"???","&ifr;":"????","&igrave":"??","&igrave;":"??","&ii;":"???","&iiiint;":"???","&iiint;":"???","&iinfin;":"???","&iiota;":"???","&ijlig;":"??","&imacr;":"??","&image;":"???","&imagline;":"???","&imagpart;":"???","&imath;":"??","&imof;":"???","&imped;":"??","&in;":"???","&incare;":"???","&infin;":"???","&infintie;":"???","&inodot;":"??","&int;":"???","&intcal;":"???","&integers;":"???","&intercal;":"???","&intlarhk;":"???","&intprod;":"???","&iocy;":"??","&iogon;":"??","&iopf;":"????","&iota;":"??","&iprod;":"???","&iquest":"??","&iquest;":"??","&iscr;":"????","&isin;":"???","&isinE;":"???","&isindot;":"???","&isins;":"???","&isinsv;":"???","&isinv;":"???","&it;":"???","&itilde;":"??","&iukcy;":"??","&iuml":"??","&iuml;":"??","&jcirc;":"??","&jcy;":"??","&jfr;":"????","&jmath;":"??","&jopf;":"????","&jscr;":"????","&jsercy;":"??","&jukcy;":"??","&kappa;":"??","&kappav;":"??","&kcedil;":"??","&kcy;":"??","&kfr;":"????","&kgreen;":"??","&khcy;":"??","&kjcy;":"??","&kopf;":"????","&kscr;":"????","&lAarr;":"???","&lArr;":"???","&lAtail;":"???","&lBarr;":"???","&lE;":"???","&lEg;":"???","&lHar;":"???","&lacute;":"??","&laemptyv;":"???","&lagran;":"???","&lambda;":"??","&lang;":"???","&langd;":"???","&langle;":"???","&lap;":"???","&laquo":"??","&laquo;":"??","&larr;":"???","&larrb;":"???","&larrbfs;":"???","&larrfs;":"???","&larrhk;":"???","&larrlp;":"???","&larrpl;":"???","&larrsim;":"???","&larrtl;":"???","&lat;":"???","&latail;":"???","&late;":"???","&lates;":"??????","&lbarr;":"???","&lbbrk;":"???","&lbrace;":"{","&lbrack;":"[","&lbrke;":"???","&lbrksld;":"???","&lbrkslu;":"???","&lcaron;":"??","&lcedil;":"??","&lceil;":"???","&lcub;":"{","&lcy;":"??","&ldca;":"???","&ldquo;":"???","&ldquor;":"???","&ldrdhar;":"???","&ldrushar;":"???","&ldsh;":"???","&le;":"???","&leftarrow;":"???","&leftarrowtail;":"???","&leftharpoondown;":"???","&leftharpoonup;":"???","&leftleftarrows;":"???","&leftrightarrow;":"???","&leftrightarrows;":"???","&leftrightharpoons;":"???","&leftrightsquigarrow;":"???","&leftthreetimes;":"???","&leg;":"???","&leq;":"???","&leqq;":"???","&leqslant;":"???","&les;":"???","&lescc;":"???","&lesdot;":"???","&lesdoto;":"???","&lesdotor;":"???","&lesg;":"??????","&lesges;":"???","&lessapprox;":"???","&lessdot;":"???","&lesseqgtr;":"???","&lesseqqgtr;":"???","&lessgtr;":"???","&lesssim;":"???","&lfisht;":"???","&lfloor;":"???","&lfr;":"????","&lg;":"???","&lgE;":"???","&lhard;":"???","&lharu;":"???","&lharul;":"???","&lhblk;":"???","&ljcy;":"??","&ll;":"???","&llarr;":"???","&llcorner;":"???","&llhard;":"???","&lltri;":"???","&lmidot;":"??","&lmoust;":"???","&lmoustache;":"???","&lnE;":"???","&lnap;":"???","&lnapprox;":"???","&lne;":"???","&lneq;":"???","&lneqq;":"???","&lnsim;":"???","&loang;":"???","&loarr;":"???","&lobrk;":"???","&longleftarrow;":"???","&longleftrightarrow;":"???","&longmapsto;":"???","&longrightarrow;":"???","&looparrowleft;":"???","&looparrowright;":"???","&lopar;":"???","&lopf;":"????","&loplus;":"???","&lotimes;":"???","&lowast;":"???","&lowbar;":"_","&loz;":"???","&lozenge;":"???","&lozf;":"???","&lpar;":"(","&lparlt;":"???","&lrarr;":"???","&lrcorner;":"???","&lrhar;":"???","&lrhard;":"???","&lrm;":"???","&lrtri;":"???","&lsaquo;":"???","&lscr;":"????","&lsh;":"???","&lsim;":"???","&lsime;":"???","&lsimg;":"???","&lsqb;":"[","&lsquo;":"???","&lsquor;":"???","&lstrok;":"??","&lt":"<","&lt;":"<","&ltcc;":"???","&ltcir;":"???","&ltdot;":"???","&lthree;":"???","&ltimes;":"???","&ltlarr;":"???","&ltquest;":"???","&ltrPar;":"???","&ltri;":"???","&ltrie;":"???","&ltrif;":"???","&lurdshar;":"???","&luruhar;":"???","&lvertneqq;":"??????","&lvnE;":"??????","&mDDot;":"???","&macr":"??","&macr;":"??","&male;":"???","&malt;":"???","&maltese;":"???","&map;":"???","&mapsto;":"???","&mapstodown;":"???","&mapstoleft;":"???","&mapstoup;":"???","&marker;":"???","&mcomma;":"???","&mcy;":"??","&mdash;":"???","&measuredangle;":"???","&mfr;":"????","&mho;":"???","&micro":"??","&micro;":"??","&mid;":"???","&midast;":"*","&midcir;":"???","&middot":"??","&middot;":"??","&minus;":"???","&minusb;":"???","&minusd;":"???","&minusdu;":"???","&mlcp;":"???","&mldr;":"???","&mnplus;":"???","&models;":"???","&mopf;":"????","&mp;":"???","&mscr;":"????","&mstpos;":"???","&mu;":"??","&multimap;":"???","&mumap;":"???","&nGg;":"?????","&nGt;":"??????","&nGtv;":"?????","&nLeftarrow;":"???","&nLeftrightarrow;":"???","&nLl;":"?????","&nLt;":"??????","&nLtv;":"?????","&nRightarrow;":"???","&nVDash;":"???","&nVdash;":"???","&nabla;":"???","&nacute;":"??","&nang;":"??????","&nap;":"???","&napE;":"?????","&napid;":"?????","&napos;":"??","&napprox;":"???","&natur;":"???","&natural;":"???","&naturals;":"???","&nbsp":"??","&nbsp;":"??","&nbump;":"?????","&nbumpe;":"?????","&ncap;":"???","&ncaron;":"??","&ncedil;":"??","&ncong;":"???","&ncongdot;":"?????","&ncup;":"???","&ncy;":"??","&ndash;":"???","&ne;":"???","&neArr;":"???","&nearhk;":"???","&nearr;":"???","&nearrow;":"???","&nedot;":"?????","&nequiv;":"???","&nesear;":"???","&nesim;":"?????","&nexist;":"???","&nexists;":"???","&nfr;":"????","&ngE;":"?????","&nge;":"???","&ngeq;":"???","&ngeqq;":"?????","&ngeqslant;":"?????","&nges;":"?????","&ngsim;":"???","&ngt;":"???","&ngtr;":"???","&nhArr;":"???","&nharr;":"???","&nhpar;":"???","&ni;":"???","&nis;":"???","&nisd;":"???","&niv;":"???","&njcy;":"??","&nlArr;":"???","&nlE;":"?????","&nlarr;":"???","&nldr;":"???","&nle;":"???","&nleftarrow;":"???","&nleftrightarrow;":"???","&nleq;":"???","&nleqq;":"?????","&nleqslant;":"?????","&nles;":"?????","&nless;":"???","&nlsim;":"???","&nlt;":"???","&nltri;":"???","&nltrie;":"???","&nmid;":"???","&nopf;":"????","&not":"??","&not;":"??","&notin;":"???","&notinE;":"?????","&notindot;":"?????","&notinva;":"???","&notinvb;":"???","&notinvc;":"???","&notni;":"???","&notniva;":"???","&notnivb;":"???","&notnivc;":"???","&npar;":"???","&nparallel;":"???","&nparsl;":"??????","&npart;":"?????","&npolint;":"???","&npr;":"???","&nprcue;":"???","&npre;":"?????","&nprec;":"???","&npreceq;":"?????","&nrArr;":"???","&nrarr;":"???","&nrarrc;":"?????","&nrarrw;":"?????","&nrightarrow;":"???","&nrtri;":"???","&nrtrie;":"???","&nsc;":"???","&nsccue;":"???","&nsce;":"?????","&nscr;":"????","&nshortmid;":"???","&nshortparallel;":"???","&nsim;":"???","&nsime;":"???","&nsimeq;":"???","&nsmid;":"???","&nspar;":"???","&nsqsube;":"???","&nsqsupe;":"???","&nsub;":"???","&nsubE;":"?????","&nsube;":"???","&nsubset;":"??????","&nsubseteq;":"???","&nsubseteqq;":"?????","&nsucc;":"???","&nsucceq;":"?????","&nsup;":"???","&nsupE;":"?????","&nsupe;":"???","&nsupset;":"??????","&nsupseteq;":"???","&nsupseteqq;":"?????","&ntgl;":"???","&ntilde":"??","&ntilde;":"??","&ntlg;":"???","&ntriangleleft;":"???","&ntrianglelefteq;":"???","&ntriangleright;":"???","&ntrianglerighteq;":"???","&nu;":"??","&num;":"#","&numero;":"???","&numsp;":"???","&nvDash;":"???","&nvHarr;":"???","&nvap;":"??????","&nvdash;":"???","&nvge;":"??????","&nvgt;":">???","&nvinfin;":"???","&nvlArr;":"???","&nvle;":"??????","&nvlt;":"<???","&nvltrie;":"??????","&nvrArr;":"???","&nvrtrie;":"??????","&nvsim;":"??????","&nwArr;":"???","&nwarhk;":"???","&nwarr;":"???","&nwarrow;":"???","&nwnear;":"???","&oS;":"???","&oacute":"??","&oacute;":"??","&oast;":"???","&ocir;":"???","&ocirc":"??","&ocirc;":"??","&ocy;":"??","&odash;":"???","&odblac;":"??","&odiv;":"???","&odot;":"???","&odsold;":"???","&oelig;":"??","&ofcir;":"???","&ofr;":"????","&ogon;":"??","&ograve":"??","&ograve;":"??","&ogt;":"???","&ohbar;":"???","&ohm;":"??","&oint;":"???","&olarr;":"???","&olcir;":"???","&olcross;":"???","&oline;":"???","&olt;":"???","&omacr;":"??","&omega;":"??","&omicron;":"??","&omid;":"???","&ominus;":"???","&oopf;":"????","&opar;":"???","&operp;":"???","&oplus;":"???","&or;":"???","&orarr;":"???","&ord;":"???","&order;":"???","&orderof;":"???","&ordf":"??","&ordf;":"??","&ordm":"??","&ordm;":"??","&origof;":"???","&oror;":"???","&orslope;":"???","&orv;":"???","&oscr;":"???","&oslash":"??","&oslash;":"??","&osol;":"???","&otilde":"??","&otilde;":"??","&otimes;":"???","&otimesas;":"???","&ouml":"??","&ouml;":"??","&ovbar;":"???","&par;":"???","&para":"??","&para;":"??","&parallel;":"???","&parsim;":"???","&parsl;":"???","&part;":"???","&pcy;":"??","&percnt;":"%","&period;":".","&permil;":"???","&perp;":"???","&pertenk;":"???","&pfr;":"????","&phi;":"??","&phiv;":"??","&phmmat;":"???","&phone;":"???","&pi;":"??","&pitchfork;":"???","&piv;":"??","&planck;":"???","&planckh;":"???","&plankv;":"???","&plus;":"+","&plusacir;":"???","&plusb;":"???","&pluscir;":"???","&plusdo;":"???","&plusdu;":"???","&pluse;":"???","&plusmn":"??","&plusmn;":"??","&plussim;":"???","&plustwo;":"???","&pm;":"??","&pointint;":"???","&popf;":"????","&pound":"??","&pound;":"??","&pr;":"???","&prE;":"???","&prap;":"???","&prcue;":"???","&pre;":"???","&prec;":"???","&precapprox;":"???","&preccurlyeq;":"???","&preceq;":"???","&precnapprox;":"???","&precneqq;":"???","&precnsim;":"???","&precsim;":"???","&prime;":"???","&primes;":"???","&prnE;":"???","&prnap;":"???","&prnsim;":"???","&prod;":"???","&profalar;":"???","&profline;":"???","&profsurf;":"???","&prop;":"???","&propto;":"???","&prsim;":"???","&prurel;":"???","&pscr;":"????","&psi;":"??","&puncsp;":"???","&qfr;":"????","&qint;":"???","&qopf;":"????","&qprime;":"???","&qscr;":"????","&quaternions;":"???","&quatint;":"???","&quest;":"?","&questeq;":"???","&quot":'"',"&quot;":'"',"&rAarr;":"???","&rArr;":"???","&rAtail;":"???","&rBarr;":"???","&rHar;":"???","&race;":"?????","&racute;":"??","&radic;":"???","&raemptyv;":"???","&rang;":"???","&rangd;":"???","&range;":"???","&rangle;":"???","&raquo":"??","&raquo;":"??","&rarr;":"???","&rarrap;":"???","&rarrb;":"???","&rarrbfs;":"???","&rarrc;":"???","&rarrfs;":"???","&rarrhk;":"???","&rarrlp;":"???","&rarrpl;":"???","&rarrsim;":"???","&rarrtl;":"???","&rarrw;":"???","&ratail;":"???","&ratio;":"???","&rationals;":"???","&rbarr;":"???","&rbbrk;":"???","&rbrace;":"}","&rbrack;":"]","&rbrke;":"???","&rbrksld;":"???","&rbrkslu;":"???","&rcaron;":"??","&rcedil;":"??","&rceil;":"???","&rcub;":"}","&rcy;":"??","&rdca;":"???","&rdldhar;":"???","&rdquo;":"???","&rdquor;":"???","&rdsh;":"???","&real;":"???","&realine;":"???","&realpart;":"???","&reals;":"???","&rect;":"???","&reg":"??","&reg;":"??","&rfisht;":"???","&rfloor;":"???","&rfr;":"????","&rhard;":"???","&rharu;":"???","&rharul;":"???","&rho;":"??","&rhov;":"??","&rightarrow;":"???","&rightarrowtail;":"???","&rightharpoondown;":"???","&rightharpoonup;":"???","&rightleftarrows;":"???","&rightleftharpoons;":"???","&rightrightarrows;":"???","&rightsquigarrow;":"???","&rightthreetimes;":"???","&ring;":"??","&risingdotseq;":"???","&rlarr;":"???","&rlhar;":"???","&rlm;":"???","&rmoust;":"???","&rmoustache;":"???","&rnmid;":"???","&roang;":"???","&roarr;":"???","&robrk;":"???","&ropar;":"???","&ropf;":"????","&roplus;":"???","&rotimes;":"???","&rpar;":")","&rpargt;":"???","&rppolint;":"???","&rrarr;":"???","&rsaquo;":"???","&rscr;":"????","&rsh;":"???","&rsqb;":"]","&rsquo;":"???","&rsquor;":"???","&rthree;":"???","&rtimes;":"???","&rtri;":"???","&rtrie;":"???","&rtrif;":"???","&rtriltri;":"???","&ruluhar;":"???","&rx;":"???","&sacute;":"??","&sbquo;":"???","&sc;":"???","&scE;":"???","&scap;":"???","&scaron;":"??","&sccue;":"???","&sce;":"???","&scedil;":"??","&scirc;":"??","&scnE;":"???","&scnap;":"???","&scnsim;":"???","&scpolint;":"???","&scsim;":"???","&scy;":"??","&sdot;":"???","&sdotb;":"???","&sdote;":"???","&seArr;":"???","&searhk;":"???","&searr;":"???","&searrow;":"???","&sect":"??","&sect;":"??","&semi;":";","&seswar;":"???","&setminus;":"???","&setmn;":"???","&sext;":"???","&sfr;":"????","&sfrown;":"???","&sharp;":"???","&shchcy;":"??","&shcy;":"??","&shortmid;":"???","&shortparallel;":"???","&shy":"??","&shy;":"??","&sigma;":"??","&sigmaf;":"??","&sigmav;":"??","&sim;":"???","&simdot;":"???","&sime;":"???","&simeq;":"???","&simg;":"???","&simgE;":"???","&siml;":"???","&simlE;":"???","&simne;":"???","&simplus;":"???","&simrarr;":"???","&slarr;":"???","&smallsetminus;":"???","&smashp;":"???","&smeparsl;":"???","&smid;":"???","&smile;":"???","&smt;":"???","&smte;":"???","&smtes;":"??????","&softcy;":"??","&sol;":"/","&solb;":"???","&solbar;":"???","&sopf;":"????","&spades;":"???","&spadesuit;":"???","&spar;":"???","&sqcap;":"???","&sqcaps;":"??????","&sqcup;":"???","&sqcups;":"??????","&sqsub;":"???","&sqsube;":"???","&sqsubset;":"???","&sqsubseteq;":"???","&sqsup;":"???","&sqsupe;":"???","&sqsupset;":"???","&sqsupseteq;":"???","&squ;":"???","&square;":"???","&squarf;":"???","&squf;":"???","&srarr;":"???","&sscr;":"????","&ssetmn;":"???","&ssmile;":"???","&sstarf;":"???","&star;":"???","&starf;":"???","&straightepsilon;":"??","&straightphi;":"??","&strns;":"??","&sub;":"???","&subE;":"???","&subdot;":"???","&sube;":"???","&subedot;":"???","&submult;":"???","&subnE;":"???","&subne;":"???","&subplus;":"???","&subrarr;":"???","&subset;":"???","&subseteq;":"???","&subseteqq;":"???","&subsetneq;":"???","&subsetneqq;":"???","&subsim;":"???","&subsub;":"???","&subsup;":"???","&succ;":"???","&succapprox;":"???","&succcurlyeq;":"???","&succeq;":"???","&succnapprox;":"???","&succneqq;":"???","&succnsim;":"???","&succsim;":"???","&sum;":"???","&sung;":"???","&sup1":"??","&sup1;":"??","&sup2":"??","&sup2;":"??","&sup3":"??","&sup3;":"??","&sup;":"???","&supE;":"???","&supdot;":"???","&supdsub;":"???","&supe;":"???","&supedot;":"???","&suphsol;":"???","&suphsub;":"???","&suplarr;":"???","&supmult;":"???","&supnE;":"???","&supne;":"???","&supplus;":"???","&supset;":"???","&supseteq;":"???","&supseteqq;":"???","&supsetneq;":"???","&supsetneqq;":"???","&supsim;":"???","&supsub;":"???","&supsup;":"???","&swArr;":"???","&swarhk;":"???","&swarr;":"???","&swarrow;":"???","&swnwar;":"???","&szlig":"??","&szlig;":"??","&target;":"???","&tau;":"??","&tbrk;":"???","&tcaron;":"??","&tcedil;":"??","&tcy;":"??","&tdot;":"???","&telrec;":"???","&tfr;":"????","&there4;":"???","&therefore;":"???","&theta;":"??","&thetasym;":"??","&thetav;":"??","&thickapprox;":"???","&thicksim;":"???","&thinsp;":"???","&thkap;":"???","&thksim;":"???","&thorn":"??","&thorn;":"??","&tilde;":"??","&times":"??","&times;":"??","&timesb;":"???","&timesbar;":"???","&timesd;":"???","&tint;":"???","&toea;":"???","&top;":"???","&topbot;":"???","&topcir;":"???","&topf;":"????","&topfork;":"???","&tosa;":"???","&tprime;":"???","&trade;":"???","&triangle;":"???","&triangledown;":"???","&triangleleft;":"???","&trianglelefteq;":"???","&triangleq;":"???","&triangleright;":"???","&trianglerighteq;":"???","&tridot;":"???","&trie;":"???","&triminus;":"???","&triplus;":"???","&trisb;":"???","&tritime;":"???","&trpezium;":"???","&tscr;":"????","&tscy;":"??","&tshcy;":"??","&tstrok;":"??","&twixt;":"???","&twoheadleftarrow;":"???","&twoheadrightarrow;":"???","&uArr;":"???","&uHar;":"???","&uacute":"??","&uacute;":"??","&uarr;":"???","&ubrcy;":"??","&ubreve;":"??","&ucirc":"??","&ucirc;":"??","&ucy;":"??","&udarr;":"???","&udblac;":"??","&udhar;":"???","&ufisht;":"???","&ufr;":"????","&ugrave":"??","&ugrave;":"??","&uharl;":"???","&uharr;":"???","&uhblk;":"???","&ulcorn;":"???","&ulcorner;":"???","&ulcrop;":"???","&ultri;":"???","&umacr;":"??","&uml":"??","&uml;":"??","&uogon;":"??","&uopf;":"????","&uparrow;":"???","&updownarrow;":"???","&upharpoonleft;":"???","&upharpoonright;":"???","&uplus;":"???","&upsi;":"??","&upsih;":"??","&upsilon;":"??","&upuparrows;":"???","&urcorn;":"???","&urcorner;":"???","&urcrop;":"???","&uring;":"??","&urtri;":"???","&uscr;":"????","&utdot;":"???","&utilde;":"??","&utri;":"???","&utrif;":"???","&uuarr;":"???","&uuml":"??","&uuml;":"??","&uwangle;":"???","&vArr;":"???","&vBar;":"???","&vBarv;":"???","&vDash;":"???","&vangrt;":"???","&varepsilon;":"??","&varkappa;":"??","&varnothing;":"???","&varphi;":"??","&varpi;":"??","&varpropto;":"???","&varr;":"???","&varrho;":"??","&varsigma;":"??","&varsubsetneq;":"??????","&varsubsetneqq;":"??????","&varsupsetneq;":"??????","&varsupsetneqq;":"??????","&vartheta;":"??","&vartriangleleft;":"???","&vartriangleright;":"???","&vcy;":"??","&vdash;":"???","&vee;":"???","&veebar;":"???","&veeeq;":"???","&vellip;":"???","&verbar;":"|","&vert;":"|","&vfr;":"????","&vltri;":"???","&vnsub;":"??????","&vnsup;":"??????","&vopf;":"????","&vprop;":"???","&vrtri;":"???","&vscr;":"????","&vsubnE;":"??????","&vsubne;":"??????","&vsupnE;":"??????","&vsupne;":"??????","&vzigzag;":"???","&wcirc;":"??","&wedbar;":"???","&wedge;":"???","&wedgeq;":"???","&weierp;":"???","&wfr;":"????","&wopf;":"????","&wp;":"???","&wr;":"???","&wreath;":"???","&wscr;":"????","&xcap;":"???","&xcirc;":"???","&xcup;":"???","&xdtri;":"???","&xfr;":"????","&xhArr;":"???","&xharr;":"???","&xi;":"??","&xlArr;":"???","&xlarr;":"???","&xmap;":"???","&xnis;":"???","&xodot;":"???","&xopf;":"????","&xoplus;":"???","&xotime;":"???","&xrArr;":"???","&xrarr;":"???","&xscr;":"????","&xsqcup;":"???","&xuplus;":"???","&xutri;":"???","&xvee;":"???","&xwedge;":"???","&yacute":"??","&yacute;":"??","&yacy;":"??","&ycirc;":"??","&ycy;":"??","&yen":"??","&yen;":"??","&yfr;":"????","&yicy;":"??","&yopf;":"????","&yscr;":"????","&yucy;":"??","&yuml":"??","&yuml;":"??","&zacute;":"??","&zcaron;":"??","&zcy;":"??","&zdot;":"??","&zeetrf;":"???","&zeta;":"??","&zfr;":"????","&zhcy;":"??","&zigrarr;":"???","&zopf;":"????","&zscr;":"????","&zwj;":"???","&zwnj;":"???"},characters:{"??":"&AElig;","&":"&amp;","??":"&Aacute;","??":"&Abreve;","??":"&Acirc;","??":"&Acy;","????":"&Afr;","??":"&Agrave;","??":"&Alpha;","??":"&Amacr;","???":"&And;","??":"&Aogon;","????":"&Aopf;","???":"&af;","??":"&angst;","????":"&Ascr;","???":"&coloneq;","??":"&Atilde;","??":"&Auml;","???":"&ssetmn;","???":"&Barv;","???":"&doublebarwedge;","??":"&Bcy;","???":"&because;","???":"&bernou;","??":"&Beta;","????":"&Bfr;","????":"&Bopf;","??":"&breve;","???":"&bump;","??":"&CHcy;","??":"&copy;","??":"&Cacute;","???":"&Cap;","???":"&DD;","???":"&Cfr;","??":"&Ccaron;","??":"&Ccedil;","??":"&Ccirc;","???":"&Cconint;","??":"&Cdot;","??":"&cedil;","??":"&middot;","??":"&Chi;","???":"&odot;","???":"&ominus;","???":"&oplus;","???":"&otimes;","???":"&cwconint;","???":"&rdquor;","???":"&rsquor;","???":"&Proportion;","???":"&Colone;","???":"&equiv;","???":"&DoubleContourIntegral;","???":"&oint;","???":"&complexes;","???":"&coprod;","???":"&awconint;","???":"&Cross;","????":"&Cscr;","???":"&Cup;","???":"&asympeq;","???":"&DDotrahd;","??":"&DJcy;","??":"&DScy;","??":"&DZcy;","???":"&ddagger;","???":"&Darr;","???":"&DoubleLeftTee;","??":"&Dcaron;","??":"&Dcy;","???":"&nabla;","??":"&Delta;","????":"&Dfr;","??":"&acute;","??":"&dot;","??":"&dblac;","`":"&grave;","??":"&tilde;","???":"&diamond;","???":"&dd;","????":"&Dopf;","??":"&uml;","???":"&DotDot;","???":"&esdot;","???":"&dArr;","???":"&lArr;","???":"&iff;","???":"&xlArr;","???":"&xhArr;","???":"&xrArr;","???":"&rArr;","???":"&vDash;","???":"&uArr;","???":"&vArr;","???":"&spar;","???":"&downarrow;","???":"&DownArrowBar;","???":"&duarr;","??":"&DownBreve;","???":"&DownLeftRightVector;","???":"&DownLeftTeeVector;","???":"&lhard;","???":"&DownLeftVectorBar;","???":"&DownRightTeeVector;","???":"&rightharpoondown;","???":"&DownRightVectorBar;","???":"&top;","???":"&mapstodown;","????":"&Dscr;","??":"&Dstrok;","??":"&ENG;","??":"&ETH;","??":"&Eacute;","??":"&Ecaron;","??":"&Ecirc;","??":"&Ecy;","??":"&Edot;","????":"&Efr;","??":"&Egrave;","???":"&isinv;","??":"&Emacr;","???":"&EmptySmallSquare;","???":"&EmptyVerySmallSquare;","??":"&Eogon;","????":"&Eopf;","??":"&Epsilon;","???":"&Equal;","???":"&esim;","???":"&rlhar;","???":"&expectation;","???":"&Esim;","??":"&Eta;","??":"&Euml;","???":"&exist;","???":"&exponentiale;","??":"&Fcy;","????":"&Ffr;","???":"&FilledSmallSquare;","???":"&squf;","????":"&Fopf;","???":"&forall;","???":"&Fscr;","??":"&GJcy;",">":"&gt;","??":"&Gamma;","??":"&Gammad;","??":"&Gbreve;","??":"&Gcedil;","??":"&Gcirc;","??":"&Gcy;","??":"&Gdot;","????":"&Gfr;","???":"&ggg;","????":"&Gopf;","???":"&geq;","???":"&gtreqless;","???":"&geqq;","???":"&GreaterGreater;","???":"&gtrless;","???":"&ges;","???":"&gtrsim;","????":"&Gscr;","???":"&gg;","??":"&HARDcy;","??":"&caron;","^":"&Hat;","??":"&Hcirc;","???":"&Poincareplane;","???":"&hamilt;","???":"&quaternions;","???":"&boxh;","??":"&Hstrok;","???":"&bumpeq;","??":"&IEcy;","??":"&IJlig;","??":"&IOcy;","??":"&Iacute;","??":"&Icirc;","??":"&Icy;","??":"&Idot;","???":"&imagpart;","??":"&Igrave;","??":"&Imacr;","???":"&ii;","???":"&Int;","???":"&int;","???":"&xcap;","???":"&ic;","???":"&it;","??":"&Iogon;","????":"&Iopf;","??":"&Iota;","???":"&imagline;","??":"&Itilde;","??":"&Iukcy;","??":"&Iuml;","??":"&Jcirc;","??":"&Jcy;","????":"&Jfr;","????":"&Jopf;","????":"&Jscr;","??":"&Jsercy;","??":"&Jukcy;","??":"&KHcy;","??":"&KJcy;","??":"&Kappa;","??":"&Kcedil;","??":"&Kcy;","????":"&Kfr;","????":"&Kopf;","????":"&Kscr;","??":"&LJcy;","<":"&lt;","??":"&Lacute;","??":"&Lambda;","???":"&Lang;","???":"&lagran;","???":"&twoheadleftarrow;","??":"&Lcaron;","??":"&Lcedil;","??":"&Lcy;","???":"&langle;","???":"&slarr;","???":"&larrb;","???":"&lrarr;","???":"&lceil;","???":"&lobrk;","???":"&LeftDownTeeVector;","???":"&downharpoonleft;","???":"&LeftDownVectorBar;","???":"&lfloor;","???":"&leftrightarrow;","???":"&LeftRightVector;","???":"&dashv;","???":"&mapstoleft;","???":"&LeftTeeVector;","???":"&vltri;","???":"&LeftTriangleBar;","???":"&trianglelefteq;","???":"&LeftUpDownVector;","???":"&LeftUpTeeVector;","???":"&upharpoonleft;","???":"&LeftUpVectorBar;","???":"&lharu;","???":"&LeftVectorBar;","???":"&lesseqgtr;","???":"&leqq;","???":"&lg;","???":"&LessLess;","???":"&les;","???":"&lsim;","????":"&Lfr;","???":"&Ll;","???":"&lAarr;","??":"&Lmidot;","???":"&xlarr;","???":"&xharr;","???":"&xrarr;","????":"&Lopf;","???":"&swarrow;","???":"&searrow;","???":"&lsh;","??":"&Lstrok;","???":"&ll;","???":"&Map;","??":"&Mcy;","???":"&MediumSpace;","???":"&phmmat;","????":"&Mfr;","???":"&mp;","????":"&Mopf;","??":"&Mu;","??":"&NJcy;","??":"&Nacute;","??":"&Ncaron;","??":"&Ncedil;","??":"&Ncy;","???":"&ZeroWidthSpace;","\n":"&NewLine;","????":"&Nfr;","???":"&NoBreak;","??":"&nbsp;","???":"&naturals;","???":"&Not;","???":"&nequiv;","???":"&NotCupCap;","???":"&nspar;","???":"&notinva;","???":"&ne;","?????":"&nesim;","???":"&nexists;","???":"&ngtr;","???":"&ngeq;","?????":"&ngeqq;","?????":"&nGtv;","???":"&ntgl;","?????":"&nges;","???":"&ngsim;","?????":"&nbump;","?????":"&nbumpe;","???":"&ntriangleleft;","?????":"&NotLeftTriangleBar;","???":"&ntrianglelefteq;","???":"&nlt;","???":"&nleq;","???":"&ntlg;","?????":"&nLtv;","?????":"&nles;","???":"&nlsim;","?????":"&NotNestedGreaterGreater;","?????":"&NotNestedLessLess;","???":"&nprec;","?????":"&npreceq;","???":"&nprcue;","???":"&notniva;","???":"&ntriangleright;","?????":"&NotRightTriangleBar;","???":"&ntrianglerighteq;","?????":"&NotSquareSubset;","???":"&nsqsube;","?????":"&NotSquareSuperset;","???":"&nsqsupe;","??????":"&vnsub;","???":"&nsubseteq;","???":"&nsucc;","?????":"&nsucceq;","???":"&nsccue;","?????":"&NotSucceedsTilde;","??????":"&vnsup;","???":"&nsupseteq;","???":"&nsim;","???":"&nsimeq;","???":"&ncong;","???":"&napprox;","???":"&nsmid;","????":"&Nscr;","??":"&Ntilde;","??":"&Nu;","??":"&OElig;","??":"&Oacute;","??":"&Ocirc;","??":"&Ocy;","??":"&Odblac;","????":"&Ofr;","??":"&Ograve;","??":"&Omacr;","??":"&ohm;","??":"&Omicron;","????":"&Oopf;","???":"&ldquo;","???":"&lsquo;","???":"&Or;","????":"&Oscr;","??":"&Oslash;","??":"&Otilde;","???":"&Otimes;","??":"&Ouml;","???":"&oline;","???":"&OverBrace;","???":"&tbrk;","???":"&OverParenthesis;","???":"&part;","??":"&Pcy;","????":"&Pfr;","??":"&Phi;","??":"&Pi;","??":"&pm;","???":"&primes;","???":"&Pr;","???":"&prec;","???":"&preceq;","???":"&preccurlyeq;","???":"&prsim;","???":"&Prime;","???":"&prod;","???":"&vprop;","????":"&Pscr;","??":"&Psi;",'"':"&quot;","????":"&Qfr;","???":"&rationals;","????":"&Qscr;","???":"&drbkarow;","??":"&reg;","??":"&Racute;","???":"&Rang;","???":"&twoheadrightarrow;","???":"&Rarrtl;","??":"&Rcaron;","??":"&Rcedil;","??":"&Rcy;","???":"&realpart;","???":"&niv;","???":"&lrhar;","???":"&duhar;","??":"&Rho;","???":"&rangle;","???":"&srarr;","???":"&rarrb;","???":"&rlarr;","???":"&rceil;","???":"&robrk;","???":"&RightDownTeeVector;","???":"&downharpoonright;","???":"&RightDownVectorBar;","???":"&rfloor;","???":"&vdash;","???":"&mapsto;","???":"&RightTeeVector;","???":"&vrtri;","???":"&RightTriangleBar;","???":"&trianglerighteq;","???":"&RightUpDownVector;","???":"&RightUpTeeVector;","???":"&upharpoonright;","???":"&RightUpVectorBar;","???":"&rightharpoonup;","???":"&RightVectorBar;","???":"&reals;","???":"&RoundImplies;","???":"&rAarr;","???":"&realine;","???":"&rsh;","???":"&RuleDelayed;","??":"&SHCHcy;","??":"&SHcy;","??":"&SOFTcy;","??":"&Sacute;","???":"&Sc;","??":"&Scaron;","??":"&Scedil;","??":"&Scirc;","??":"&Scy;","????":"&Sfr;","???":"&uparrow;","??":"&Sigma;","???":"&compfn;","????":"&Sopf;","???":"&radic;","???":"&square;","???":"&sqcap;","???":"&sqsubset;","???":"&sqsubseteq;","???":"&sqsupset;","???":"&sqsupseteq;","???":"&sqcup;","????":"&Sscr;","???":"&sstarf;","???":"&Subset;","???":"&subseteq;","???":"&succ;","???":"&succeq;","???":"&succcurlyeq;","???":"&succsim;","???":"&sum;","???":"&Supset;","???":"&supset;","???":"&supseteq;","??":"&THORN;","???":"&trade;","??":"&TSHcy;","??":"&TScy;","\t":"&Tab;","??":"&Tau;","??":"&Tcaron;","??":"&Tcedil;","??":"&Tcy;","????":"&Tfr;","???":"&therefore;","??":"&Theta;","??????":"&ThickSpace;","???":"&thinsp;","???":"&thksim;","???":"&simeq;","???":"&cong;","???":"&thkap;","????":"&Topf;","???":"&tdot;","????":"&Tscr;","??":"&Tstrok;","??":"&Uacute;","???":"&Uarr;","???":"&Uarrocir;","??":"&Ubrcy;","??":"&Ubreve;","??":"&Ucirc;","??":"&Ucy;","??":"&Udblac;","????":"&Ufr;","??":"&Ugrave;","??":"&Umacr;",_:"&lowbar;","???":"&UnderBrace;","???":"&bbrk;","???":"&UnderParenthesis;","???":"&xcup;","???":"&uplus;","??":"&Uogon;","????":"&Uopf;","???":"&UpArrowBar;","???":"&udarr;","???":"&varr;","???":"&udhar;","???":"&perp;","???":"&mapstoup;","???":"&nwarrow;","???":"&nearrow;","??":"&upsih;","??":"&Upsilon;","??":"&Uring;","????":"&Uscr;","??":"&Utilde;","??":"&Uuml;","???":"&VDash;","???":"&Vbar;","??":"&Vcy;","???":"&Vdash;","???":"&Vdashl;","???":"&xvee;","???":"&Vert;","???":"&smid;","|":"&vert;","???":"&VerticalSeparator;","???":"&wreath;","???":"&hairsp;","????":"&Vfr;","????":"&Vopf;","????":"&Vscr;","???":"&Vvdash;","??":"&Wcirc;","???":"&xwedge;","????":"&Wfr;","????":"&Wopf;","????":"&Wscr;","????":"&Xfr;","??":"&Xi;","????":"&Xopf;","????":"&Xscr;","??":"&YAcy;","??":"&YIcy;","??":"&YUcy;","??":"&Yacute;","??":"&Ycirc;","??":"&Ycy;","????":"&Yfr;","????":"&Yopf;","????":"&Yscr;","??":"&Yuml;","??":"&ZHcy;","??":"&Zacute;","??":"&Zcaron;","??":"&Zcy;","??":"&Zdot;","??":"&Zeta;","???":"&zeetrf;","???":"&integers;","????":"&Zscr;","??":"&aacute;","??":"&abreve;","???":"&mstpos;","?????":"&acE;","???":"&acd;","??":"&acirc;","??":"&acy;","??":"&aelig;","????":"&afr;","??":"&agrave;","???":"&aleph;","??":"&alpha;","??":"&amacr;","???":"&amalg;","???":"&wedge;","???":"&andand;","???":"&andd;","???":"&andslope;","???":"&andv;","???":"&angle;","???":"&ange;","???":"&measuredangle;","???":"&angmsdaa;","???":"&angmsdab;","???":"&angmsdac;","???":"&angmsdad;","???":"&angmsdae;","???":"&angmsdaf;","???":"&angmsdag;","???":"&angmsdah;","???":"&angrt;","???":"&angrtvb;","???":"&angrtvbd;","???":"&angsph;","???":"&angzarr;","??":"&aogon;","????":"&aopf;","???":"&apE;","???":"&apacir;","???":"&approxeq;","???":"&apid;","'":"&apos;","??":"&aring;","????":"&ascr;","*":"&midast;","??":"&atilde;","??":"&auml;","???":"&awint;","???":"&bNot;","???":"&bcong;","??":"&bepsi;","???":"&bprime;","???":"&bsim;","???":"&bsime;","???":"&barvee;","???":"&barwedge;","???":"&bbrktbrk;","??":"&bcy;","???":"&ldquor;","???":"&bemptyv;","??":"&beta;","???":"&beth;","???":"&twixt;","????":"&bfr;","???":"&xcirc;","???":"&xodot;","???":"&xoplus;","???":"&xotime;","???":"&xsqcup;","???":"&starf;","???":"&xdtri;","???":"&xutri;","???":"&xuplus;","???":"&rbarr;","???":"&lozf;","???":"&utrif;","???":"&dtrif;","???":"&ltrif;","???":"&rtrif;","???":"&blank;","???":"&blk12;","???":"&blk14;","???":"&blk34;","???":"&block;","=???":"&bne;","??????":"&bnequiv;","???":"&bnot;","????":"&bopf;","???":"&bowtie;","???":"&boxDL;","???":"&boxDR;","???":"&boxDl;","???":"&boxDr;","???":"&boxH;","???":"&boxHD;","???":"&boxHU;","???":"&boxHd;","???":"&boxHu;","???":"&boxUL;","???":"&boxUR;","???":"&boxUl;","???":"&boxUr;","???":"&boxV;","???":"&boxVH;","???":"&boxVL;","???":"&boxVR;","???":"&boxVh;","???":"&boxVl;","???":"&boxVr;","???":"&boxbox;","???":"&boxdL;","???":"&boxdR;","???":"&boxdl;","???":"&boxdr;","???":"&boxhD;","???":"&boxhU;","???":"&boxhd;","???":"&boxhu;","???":"&minusb;","???":"&plusb;","???":"&timesb;","???":"&boxuL;","???":"&boxuR;","???":"&boxul;","???":"&boxur;","???":"&boxv;","???":"&boxvH;","???":"&boxvL;","???":"&boxvR;","???":"&boxvh;","???":"&boxvl;","???":"&boxvr;","??":"&brvbar;","????":"&bscr;","???":"&bsemi;","\\":"&bsol;","???":"&bsolb;","???":"&bsolhsub;","???":"&bullet;","???":"&bumpE;","??":"&cacute;","???":"&cap;","???":"&capand;","???":"&capbrcup;","???":"&capcap;","???":"&capcup;","???":"&capdot;","??????":"&caps;","???":"&caret;","???":"&ccaps;","??":"&ccaron;","??":"&ccedil;","??":"&ccirc;","???":"&ccups;","???":"&ccupssm;","??":"&cdot;","???":"&cemptyv;","??":"&cent;","????":"&cfr;","??":"&chcy;","???":"&checkmark;","??":"&chi;","???":"&cir;","???":"&cirE;","??":"&circ;","???":"&cire;","???":"&olarr;","???":"&orarr;","???":"&oS;","???":"&oast;","???":"&ocir;","???":"&odash;","???":"&cirfnint;","???":"&cirmid;","???":"&cirscir;","???":"&clubsuit;",":":"&colon;",",":"&comma;","@":"&commat;","???":"&complement;","???":"&congdot;","????":"&copf;","???":"&copysr;","???":"&crarr;","???":"&cross;","????":"&cscr;","???":"&csub;","???":"&csube;","???":"&csup;","???":"&csupe;","???":"&ctdot;","???":"&cudarrl;","???":"&cudarrr;","???":"&curlyeqprec;","???":"&curlyeqsucc;","???":"&curvearrowleft;","???":"&cularrp;","???":"&cup;","???":"&cupbrcap;","???":"&cupcap;","???":"&cupcup;","???":"&cupdot;","???":"&cupor;","??????":"&cups;","???":"&curvearrowright;","???":"&curarrm;","???":"&cuvee;","???":"&cuwed;","??":"&curren;","???":"&cwint;","???":"&cylcty;","???":"&dHar;","???":"&dagger;","???":"&daleth;","???":"&hyphen;","???":"&rBarr;","??":"&dcaron;","??":"&dcy;","???":"&downdownarrows;","???":"&eDDot;","??":"&deg;","??":"&delta;","???":"&demptyv;","???":"&dfisht;","????":"&dfr;","???":"&diams;","??":"&gammad;","???":"&disin;","??":"&divide;","???":"&divonx;","??":"&djcy;","???":"&llcorner;","???":"&dlcrop;",$:"&dollar;","????":"&dopf;","???":"&eDot;","???":"&minusd;","???":"&plusdo;","???":"&sdotb;","???":"&lrcorner;","???":"&drcrop;","????":"&dscr;","??":"&dscy;","???":"&dsol;","??":"&dstrok;","???":"&dtdot;","???":"&triangledown;","???":"&dwangle;","??":"&dzcy;","???":"&dzigrarr;","??":"&eacute;","???":"&easter;","??":"&ecaron;","???":"&eqcirc;","??":"&ecirc;","???":"&eqcolon;","??":"&ecy;","??":"&edot;","???":"&fallingdotseq;","????":"&efr;","???":"&eg;","??":"&egrave;","???":"&eqslantgtr;","???":"&egsdot;","???":"&el;","???":"&elinters;","???":"&ell;","???":"&eqslantless;","???":"&elsdot;","??":"&emacr;","???":"&varnothing;","???":"&emsp13;","???":"&emsp14;","???":"&emsp;","??":"&eng;","???":"&ensp;","??":"&eogon;","????":"&eopf;","???":"&epar;","???":"&eparsl;","???":"&eplus;","??":"&epsilon;","??":"&varepsilon;","=":"&equals;","???":"&questeq;","???":"&equivDD;","???":"&eqvparsl;","???":"&risingdotseq;","???":"&erarr;","???":"&escr;","??":"&eta;","??":"&eth;","??":"&euml;","???":"&euro;","!":"&excl;","??":"&fcy;","???":"&female;","???":"&ffilig;","???":"&fflig;","???":"&ffllig;","????":"&ffr;","???":"&filig;",fj:"&fjlig;","???":"&flat;","???":"&fllig;","???":"&fltns;","??":"&fnof;","????":"&fopf;","???":"&pitchfork;","???":"&forkv;","???":"&fpartint;","??":"&half;","???":"&frac13;","??":"&frac14;","???":"&frac15;","???":"&frac16;","???":"&frac18;","???":"&frac23;","???":"&frac25;","??":"&frac34;","???":"&frac35;","???":"&frac38;","???":"&frac45;","???":"&frac56;","???":"&frac58;","???":"&frac78;","???":"&frasl;","???":"&sfrown;","????":"&fscr;","???":"&gtreqqless;","??":"&gacute;","??":"&gamma;","???":"&gtrapprox;","??":"&gbreve;","??":"&gcirc;","??":"&gcy;","??":"&gdot;","???":"&gescc;","???":"&gesdot;","???":"&gesdoto;","???":"&gesdotol;","??????":"&gesl;","???":"&gesles;","????":"&gfr;","???":"&gimel;","??":"&gjcy;","???":"&glE;","???":"&gla;","???":"&glj;","???":"&gneqq;","???":"&gnapprox;","???":"&gneq;","???":"&gnsim;","????":"&gopf;","???":"&gscr;","???":"&gsime;","???":"&gsiml;","???":"&gtcc;","???":"&gtcir;","???":"&gtrdot;","???":"&gtlPar;","???":"&gtquest;","???":"&gtrarr;","??????":"&gvnE;","??":"&hardcy;","???":"&harrcir;","???":"&leftrightsquigarrow;","???":"&plankv;","??":"&hcirc;","???":"&heartsuit;","???":"&mldr;","???":"&hercon;","????":"&hfr;","???":"&searhk;","???":"&swarhk;","???":"&hoarr;","???":"&homtht;","???":"&larrhk;","???":"&rarrhk;","????":"&hopf;","???":"&horbar;","????":"&hscr;","??":"&hstrok;","???":"&hybull;","??":"&iacute;","??":"&icirc;","??":"&icy;","??":"&iecy;","??":"&iexcl;","????":"&ifr;","??":"&igrave;","???":"&qint;","???":"&tint;","???":"&iinfin;","???":"&iiota;","??":"&ijlig;","??":"&imacr;","??":"&inodot;","???":"&imof;","??":"&imped;","???":"&incare;","???":"&infin;","???":"&infintie;","???":"&intercal;","???":"&intlarhk;","???":"&iprod;","??":"&iocy;","??":"&iogon;","????":"&iopf;","??":"&iota;","??":"&iquest;","????":"&iscr;","???":"&isinE;","???":"&isindot;","???":"&isins;","???":"&isinsv;","??":"&itilde;","??":"&iukcy;","??":"&iuml;","??":"&jcirc;","??":"&jcy;","????":"&jfr;","??":"&jmath;","????":"&jopf;","????":"&jscr;","??":"&jsercy;","??":"&jukcy;","??":"&kappa;","??":"&varkappa;","??":"&kcedil;","??":"&kcy;","????":"&kfr;","??":"&kgreen;","??":"&khcy;","??":"&kjcy;","????":"&kopf;","????":"&kscr;","???":"&lAtail;","???":"&lBarr;","???":"&lesseqqgtr;","???":"&lHar;","??":"&lacute;","???":"&laemptyv;","??":"&lambda;","???":"&langd;","???":"&lessapprox;","??":"&laquo;","???":"&larrbfs;","???":"&larrfs;","???":"&looparrowleft;","???":"&larrpl;","???":"&larrsim;","???":"&leftarrowtail;","???":"&lat;","???":"&latail;","???":"&late;","??????":"&lates;","???":"&lbarr;","???":"&lbbrk;","{":"&lcub;","[":"&lsqb;","???":"&lbrke;","???":"&lbrksld;","???":"&lbrkslu;","??":"&lcaron;","??":"&lcedil;","??":"&lcy;","???":"&ldca;","???":"&ldrdhar;","???":"&ldrushar;","???":"&ldsh;","???":"&leq;","???":"&llarr;","???":"&lthree;","???":"&lescc;","???":"&lesdot;","???":"&lesdoto;","???":"&lesdotor;","??????":"&lesg;","???":"&lesges;","???":"&ltdot;","???":"&lfisht;","????":"&lfr;","???":"&lgE;","???":"&lharul;","???":"&lhblk;","??":"&ljcy;","???":"&llhard;","???":"&lltri;","??":"&lmidot;","???":"&lmoustache;","???":"&lneqq;","???":"&lnapprox;","???":"&lneq;","???":"&lnsim;","???":"&loang;","???":"&loarr;","???":"&xmap;","???":"&rarrlp;","???":"&lopar;","????":"&lopf;","???":"&loplus;","???":"&lotimes;","???":"&lowast;","???":"&lozenge;","(":"&lpar;","???":"&lparlt;","???":"&lrhard;","???":"&lrm;","???":"&lrtri;","???":"&lsaquo;","????":"&lscr;","???":"&lsime;","???":"&lsimg;","???":"&sbquo;","??":"&lstrok;","???":"&ltcc;","???":"&ltcir;","???":"&ltimes;","???":"&ltlarr;","???":"&ltquest;","???":"&ltrPar;","???":"&triangleleft;","???":"&lurdshar;","???":"&luruhar;","??????":"&lvnE;","???":"&mDDot;","??":"&strns;","???":"&male;","???":"&maltese;","???":"&marker;","???":"&mcomma;","??":"&mcy;","???":"&mdash;","????":"&mfr;","???":"&mho;","??":"&micro;","???":"&midcir;","???":"&minus;","???":"&minusdu;","???":"&mlcp;","???":"&models;","????":"&mopf;","????":"&mscr;","??":"&mu;","???":"&mumap;","?????":"&nGg;","??????":"&nGt;","???":"&nlArr;","???":"&nhArr;","?????":"&nLl;","??????":"&nLt;","???":"&nrArr;","???":"&nVDash;","???":"&nVdash;","??":"&nacute;","??????":"&nang;","?????":"&napE;","?????":"&napid;","??":"&napos;","???":"&natural;","???":"&ncap;","??":"&ncaron;","??":"&ncedil;","?????":"&ncongdot;","???":"&ncup;","??":"&ncy;","???":"&ndash;","???":"&neArr;","???":"&nearhk;","?????":"&nedot;","???":"&toea;","????":"&nfr;","???":"&nleftrightarrow;","???":"&nhpar;","???":"&nis;","???":"&nisd;","??":"&njcy;","?????":"&nleqq;","???":"&nleftarrow;","???":"&nldr;","????":"&nopf;","??":"&not;","?????":"&notinE;","?????":"&notindot;","???":"&notinvb;","???":"&notinvc;","???":"&notnivb;","???":"&notnivc;","??????":"&nparsl;","?????":"&npart;","???":"&npolint;","???":"&nrightarrow;","?????":"&nrarrc;","?????":"&nrarrw;","????":"&nscr;","???":"&nsub;","?????":"&nsubseteqq;","???":"&nsup;","?????":"&nsupseteqq;","??":"&ntilde;","??":"&nu;","#":"&num;","???":"&numero;","???":"&numsp;","???":"&nvDash;","???":"&nvHarr;","??????":"&nvap;","???":"&nvdash;","??????":"&nvge;",">???":"&nvgt;","???":"&nvinfin;","???":"&nvlArr;","??????":"&nvle;","<???":"&nvlt;","??????":"&nvltrie;","???":"&nvrArr;","??????":"&nvrtrie;","??????":"&nvsim;","???":"&nwArr;","???":"&nwarhk;","???":"&nwnear;","??":"&oacute;","??":"&ocirc;","??":"&ocy;","??":"&odblac;","???":"&odiv;","???":"&odsold;","??":"&oelig;","???":"&ofcir;","????":"&ofr;","??":"&ogon;","??":"&ograve;","???":"&ogt;","???":"&ohbar;","???":"&olcir;","???":"&olcross;","???":"&olt;","??":"&omacr;","??":"&omega;","??":"&omicron;","???":"&omid;","????":"&oopf;","???":"&opar;","???":"&operp;","???":"&vee;","???":"&ord;","???":"&oscr;","??":"&ordf;","??":"&ordm;","???":"&origof;","???":"&oror;","???":"&orslope;","???":"&orv;","??":"&oslash;","???":"&osol;","??":"&otilde;","???":"&otimesas;","??":"&ouml;","???":"&ovbar;","??":"&para;","???":"&parsim;","???":"&parsl;","??":"&pcy;","%":"&percnt;",".":"&period;","???":"&permil;","???":"&pertenk;","????":"&pfr;","??":"&phi;","??":"&varphi;","???":"&phone;","??":"&pi;","??":"&varpi;","???":"&planckh;","+":"&plus;","???":"&plusacir;","???":"&pluscir;","???":"&plusdu;","???":"&pluse;","???":"&plussim;","???":"&plustwo;","???":"&pointint;","????":"&popf;","??":"&pound;","???":"&prE;","???":"&precapprox;","???":"&prnap;","???":"&prnE;","???":"&prnsim;","???":"&prime;","???":"&profalar;","???":"&profline;","???":"&profsurf;","???":"&prurel;","????":"&pscr;","??":"&psi;","???":"&puncsp;","????":"&qfr;","????":"&qopf;","???":"&qprime;","????":"&qscr;","???":"&quatint;","?":"&quest;","???":"&rAtail;","???":"&rHar;","?????":"&race;","??":"&racute;","???":"&raemptyv;","???":"&rangd;","???":"&range;","??":"&raquo;","???":"&rarrap;","???":"&rarrbfs;","???":"&rarrc;","???":"&rarrfs;","???":"&rarrpl;","???":"&rarrsim;","???":"&rightarrowtail;","???":"&rightsquigarrow;","???":"&ratail;","???":"&ratio;","???":"&rbbrk;","}":"&rcub;","]":"&rsqb;","???":"&rbrke;","???":"&rbrksld;","???":"&rbrkslu;","??":"&rcaron;","??":"&rcedil;","??":"&rcy;","???":"&rdca;","???":"&rdldhar;","???":"&rdsh;","???":"&rect;","???":"&rfisht;","????":"&rfr;","???":"&rharul;","??":"&rho;","??":"&varrho;","???":"&rrarr;","???":"&rthree;","??":"&ring;","???":"&rlm;","???":"&rmoustache;","???":"&rnmid;","???":"&roang;","???":"&roarr;","???":"&ropar;","????":"&ropf;","???":"&roplus;","???":"&rotimes;",")":"&rpar;","???":"&rpargt;","???":"&rppolint;","???":"&rsaquo;","????":"&rscr;","???":"&rtimes;","???":"&triangleright;","???":"&rtriltri;","???":"&ruluhar;","???":"&rx;","??":"&sacute;","???":"&scE;","???":"&succapprox;","??":"&scaron;","??":"&scedil;","??":"&scirc;","???":"&succneqq;","???":"&succnapprox;","???":"&succnsim;","???":"&scpolint;","??":"&scy;","???":"&sdot;","???":"&sdote;","???":"&seArr;","??":"&sect;",";":"&semi;","???":"&tosa;","???":"&sext;","????":"&sfr;","???":"&sharp;","??":"&shchcy;","??":"&shcy;","??":"&shy;","??":"&sigma;","??":"&varsigma;","???":"&simdot;","???":"&simg;","???":"&simgE;","???":"&siml;","???":"&simlE;","???":"&simne;","???":"&simplus;","???":"&simrarr;","???":"&smashp;","???":"&smeparsl;","???":"&ssmile;","???":"&smt;","???":"&smte;","??????":"&smtes;","??":"&softcy;","/":"&sol;","???":"&solb;","???":"&solbar;","????":"&sopf;","???":"&spadesuit;","??????":"&sqcaps;","??????":"&sqcups;","????":"&sscr;","???":"&star;","???":"&subset;","???":"&subseteqq;","???":"&subdot;","???":"&subedot;","???":"&submult;","???":"&subsetneqq;","???":"&subsetneq;","???":"&subplus;","???":"&subrarr;","???":"&subsim;","???":"&subsub;","???":"&subsup;","???":"&sung;","??":"&sup1;","??":"&sup2;","??":"&sup3;","???":"&supseteqq;","???":"&supdot;","???":"&supdsub;","???":"&supedot;","???":"&suphsol;","???":"&suphsub;","???":"&suplarr;","???":"&supmult;","???":"&supsetneqq;","???":"&supsetneq;","???":"&supplus;","???":"&supsim;","???":"&supsub;","???":"&supsup;","???":"&swArr;","???":"&swnwar;","??":"&szlig;","???":"&target;","??":"&tau;","??":"&tcaron;","??":"&tcedil;","??":"&tcy;","???":"&telrec;","????":"&tfr;","??":"&theta;","??":"&vartheta;","??":"&thorn;","??":"&times;","???":"&timesbar;","???":"&timesd;","???":"&topbot;","???":"&topcir;","????":"&topf;","???":"&topfork;","???":"&tprime;","???":"&utri;","???":"&trie;","???":"&tridot;","???":"&triminus;","???":"&triplus;","???":"&trisb;","???":"&tritime;","???":"&trpezium;","????":"&tscr;","??":"&tscy;","??":"&tshcy;","??":"&tstrok;","???":"&uHar;","??":"&uacute;","??":"&ubrcy;","??":"&ubreve;","??":"&ucirc;","??":"&ucy;","??":"&udblac;","???":"&ufisht;","????":"&ufr;","??":"&ugrave;","???":"&uhblk;","???":"&ulcorner;","???":"&ulcrop;","???":"&ultri;","??":"&umacr;","??":"&uogon;","????":"&uopf;","??":"&upsilon;","???":"&uuarr;","???":"&urcorner;","???":"&urcrop;","??":"&uring;","???":"&urtri;","????":"&uscr;","???":"&utdot;","??":"&utilde;","??":"&uuml;","???":"&uwangle;","???":"&vBar;","???":"&vBarv;","???":"&vangrt;","??????":"&vsubne;","??????":"&vsubnE;","??????":"&vsupne;","??????":"&vsupnE;","??":"&vcy;","???":"&veebar;","???":"&veeeq;","???":"&vellip;","????":"&vfr;","????":"&vopf;","????":"&vscr;","???":"&vzigzag;","??":"&wcirc;","???":"&wedbar;","???":"&wedgeq;","???":"&wp;","????":"&wfr;","????":"&wopf;","????":"&wscr;","????":"&xfr;","??":"&xi;","???":"&xnis;","????":"&xopf;","????":"&xscr;","??":"&yacute;","??":"&yacy;","??":"&ycirc;","??":"&ycy;","??":"&yen;","????":"&yfr;","??":"&yicy;","????":"&yopf;","????":"&yscr;","??":"&yucy;","??":"&yuml;","??":"&zacute;","??":"&zcaron;","??":"&zcy;","??":"&zdot;","??":"&zeta;","????":"&zfr;","??":"&zhcy;","???":"&zigrarr;","????":"&zopf;","????":"&zscr;","???":"&zwj;","???":"&zwnj;"}}};
});

var numericUnicodeMap = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,"__esModule",{value:true});exports.numericUnicodeMap={0:65533,128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};
});

var surrogatePairs = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports,"__esModule",{value:true});exports.fromCodePoint=String.fromCodePoint||function(astralCodePoint){return String.fromCharCode(Math.floor((astralCodePoint-65536)/1024)+55296,(astralCodePoint-65536)%1024+56320)};exports.getCodePoint=String.prototype.codePointAt?function(input,position){return input.codePointAt(position)}:function(input,position){return (input.charCodeAt(position)-55296)*1024+input.charCodeAt(position+1)-56320+65536};exports.highSurrogateFrom=55296;exports.highSurrogateTo=56319;
});

var lib = createCommonjsModule(function (module, exports) {
var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });



var allNamedReferences = __assign(__assign({}, namedReferences.namedReferences), { all: namedReferences.namedReferences.html5 });
var encodeRegExps = {
    specialChars: /[<>'"&]/g,
    nonAscii: /(?:[<>'"&\u0080-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
    nonAsciiPrintable: /(?:[<>'"&\x01-\x08\x11-\x15\x17-\x1F\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
    extensive: /(?:[\x01-\x0c\x0e-\x1f\x21-\x2c\x2e-\x2f\x3a-\x40\x5b-\x60\x7b-\x7d\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g
};
var defaultEncodeOptions = {
    mode: 'specialChars',
    level: 'all',
    numeric: 'decimal'
};
/** Encodes all the necessary (specified by `level`) characters in the text */
function encode(text, _a) {
    var _b = _a === void 0 ? defaultEncodeOptions : _a, _c = _b.mode, mode = _c === void 0 ? 'specialChars' : _c, _d = _b.numeric, numeric = _d === void 0 ? 'decimal' : _d, _e = _b.level, level = _e === void 0 ? 'all' : _e;
    if (!text) {
        return '';
    }
    var encodeRegExp = encodeRegExps[mode];
    var references = allNamedReferences[level].characters;
    var isHex = numeric === 'hexadecimal';
    encodeRegExp.lastIndex = 0;
    var _b = encodeRegExp.exec(text);
    var _c;
    if (_b) {
        _c = '';
        var _d = 0;
        do {
            if (_d !== _b.index) {
                _c += text.substring(_d, _b.index);
            }
            var _e = _b[0];
            var result_1 = references[_e];
            if (!result_1) {
                var code_1 = _e.length > 1 ? surrogatePairs.getCodePoint(_e, 0) : _e.charCodeAt(0);
                result_1 = (isHex ? '&#x' + code_1.toString(16) : '&#' + code_1) + ';';
            }
            _c += result_1;
            _d = _b.index + _e.length;
        } while ((_b = encodeRegExp.exec(text)));
        if (_d !== text.length) {
            _c += text.substring(_d);
        }
    }
    else {
        _c =
            text;
    }
    return _c;
}
exports.encode = encode;
var defaultDecodeOptions = {
    scope: 'body',
    level: 'all'
};
var strict = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);/g;
var attribute = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+)[;=]?/g;
var baseDecodeRegExps = {
    xml: {
        strict: strict,
        attribute: attribute,
        body: namedReferences.bodyRegExps.xml
    },
    html4: {
        strict: strict,
        attribute: attribute,
        body: namedReferences.bodyRegExps.html4
    },
    html5: {
        strict: strict,
        attribute: attribute,
        body: namedReferences.bodyRegExps.html5
    }
};
var decodeRegExps = __assign(__assign({}, baseDecodeRegExps), { all: baseDecodeRegExps.html5 });
var fromCharCode = String.fromCharCode;
var outOfBoundsChar = fromCharCode(65533);
var defaultDecodeEntityOptions = {
    level: 'all'
};
/** Decodes a single entity */
function decodeEntity(entity, _a) {
    var _b = (_a === void 0 ? defaultDecodeEntityOptions : _a).level, level = _b === void 0 ? 'all' : _b;
    if (!entity) {
        return '';
    }
    var _b = entity;
    var decodeEntityLastChar_1 = entity[entity.length - 1];
    {
        var decodeResultByReference_1 = allNamedReferences[level].entities[entity];
        if (decodeResultByReference_1) {
            _b = decodeResultByReference_1;
        }
        else if (entity[0] === '&' && entity[1] === '#') {
            var decodeSecondChar_1 = entity[2];
            var decodeCode_1 = decodeSecondChar_1 == 'x' || decodeSecondChar_1 == 'X'
                ? parseInt(entity.substr(3), 16)
                : parseInt(entity.substr(2));
            _b =
                decodeCode_1 >= 0x10ffff
                    ? outOfBoundsChar
                    : decodeCode_1 > 65535
                        ? surrogatePairs.fromCodePoint(decodeCode_1)
                        : fromCharCode(numericUnicodeMap.numericUnicodeMap[decodeCode_1] || decodeCode_1);
        }
    }
    return _b;
}
exports.decodeEntity = decodeEntity;
/** Decodes all entities in the text */
function decode(text, _a) {
    var decodeSecondChar_1 = _a === void 0 ? defaultDecodeOptions : _a, decodeCode_1 = decodeSecondChar_1.level, level = decodeCode_1 === void 0 ? 'all' : decodeCode_1, _b = decodeSecondChar_1.scope, scope = _b === void 0 ? level === 'xml' ? 'strict' : 'body' : _b;
    if (!text) {
        return '';
    }
    var decodeRegExp = decodeRegExps[level][scope];
    var references = allNamedReferences[level].entities;
    var isAttribute = scope === 'attribute';
    var isStrict = scope === 'strict';
    decodeRegExp.lastIndex = 0;
    var replaceMatch_1 = decodeRegExp.exec(text);
    var replaceResult_1;
    if (replaceMatch_1) {
        replaceResult_1 = '';
        var replaceLastIndex_1 = 0;
        do {
            if (replaceLastIndex_1 !== replaceMatch_1.index) {
                replaceResult_1 += text.substring(replaceLastIndex_1, replaceMatch_1.index);
            }
            var replaceInput_1 = replaceMatch_1[0];
            var decodeResult_1 = replaceInput_1;
            var decodeEntityLastChar_2 = replaceInput_1[replaceInput_1.length - 1];
            if (isAttribute
                && decodeEntityLastChar_2 === '=') {
                decodeResult_1 = replaceInput_1;
            }
            else if (isStrict
                && decodeEntityLastChar_2 !== ';') {
                decodeResult_1 = replaceInput_1;
            }
            else {
                var decodeResultByReference_2 = references[replaceInput_1];
                if (decodeResultByReference_2) {
                    decodeResult_1 = decodeResultByReference_2;
                }
                else if (replaceInput_1[0] === '&' && replaceInput_1[1] === '#') {
                    var decodeSecondChar_2 = replaceInput_1[2];
                    var decodeCode_2 = decodeSecondChar_2 == 'x' || decodeSecondChar_2 == 'X'
                        ? parseInt(replaceInput_1.substr(3), 16)
                        : parseInt(replaceInput_1.substr(2));
                    decodeResult_1 =
                        decodeCode_2 >= 0x10ffff
                            ? outOfBoundsChar
                            : decodeCode_2 > 65535
                                ? surrogatePairs.fromCodePoint(decodeCode_2)
                                : fromCharCode(numericUnicodeMap.numericUnicodeMap[decodeCode_2] || decodeCode_2);
                }
            }
            replaceResult_1 += decodeResult_1;
            replaceLastIndex_1 = replaceMatch_1.index + replaceInput_1.length;
        } while ((replaceMatch_1 = decodeRegExp.exec(text)));
        if (replaceLastIndex_1 !== text.length) {
            replaceResult_1 += text.substring(replaceLastIndex_1);
        }
    }
    else {
        replaceResult_1 =
            text;
    }
    return replaceResult_1;
}
exports.decode = decode;
});

var index = /*@__PURE__*/unwrapExports(lib);

/**
 * MK File
 * create file using mkfile
 *
 * @author biati-digital
 */
function mkFile(filePath, size) {
    return new Promise((resolve, reject) => {
        const docurl = new Process('/usr/bin/env', {
            args: ['mkfile', '-n', size.toString(), filePath]
        });
        let stdOut = '';
        let stdErr = '';
        docurl.onStdout((result) => {
            stdOut += result;
        });
        docurl.onStderr((line) => {
            stdErr += line;
        });
        docurl.onDidExit((status) => {
            if (status === 0) {
                resolve(stdOut);
            } else {
                reject(stdErr);
            }
        });
        docurl.start();
    });
}

/**
 * Compress file
 * used to compress the file
 * in multiple formats
 */
function compressFile(command) {
    return new Promise((resolve, reject) => {
        const docurl = new Process('/usr/bin/env', {
            args: command
        });
        let stdOut = '';
        let stdErr = '';
        docurl.onStdout((result) => {
            stdOut += result;
        });
        docurl.onStderr((line) => {
            stdErr += line;
        });
        docurl.onDidExit((status) => {
            if (status === 0) {
                resolve(stdOut);
            } else {
                reject(stdErr);
            }
        });
        docurl.start();
    });
}

/**
 * Dumy file
 *
 * @param {string} filePath
 * @param {string} fileName
 * @param {string} size
 * @returns {Promise}
 */
async function dummyFile(filePath, fileName, size) {
    if (!filePath) {
        throw new Error('File path must be provided');
    }
    if (!fileName) {
        throw new Error('File name must be provided');
    }

    size = size.toLowerCase().replace(/\s/g, '').replace(/,/, '');
    size = size.replace(/([0-9.]+)(gigabytes|gigas|giga|gbs|gb)/i, (r1, r2) => {
        return r2 + 'gb';
    });
    size = size.replace(/([0-9.]+)(megabytes|megabyte|mbs|mb)/i, (r1, r2) => {
        return r2 + 'mb';
    });
    size = size.replace(/([0-9.]+)(kilobytes|kilobyte|kbs|kb)/i, (r1, r2) => {
        return r2 + 'kb';
    });
    size = size.replace(/([0-9.]+)(bytes|byte|bs|b)/i, (r1, r2) => {
        return r2;
    });

    const bMatch = size.match(/^(\d+)$/i);
    const kbMatch = size.match(/^(\d+)kb$/i);
    const mbMatch = size.match(/^(\d+)mb/i);
    const gbMatch = size.match(/^(\d+)gb/i);

    let isZip = false;
    let isTar = false;

    // Handle Zip files
    if (fileName.endsWith('.zip')) {
        isZip = nova.path.join(filePath, fileName);
        fileName = fileName.replace('.zip', '.txt');
    }
    // Handle Tar files
    if (fileName.endsWith('.tar')) {
        isTar = nova.path.join(filePath, fileName);
        fileName = fileName.replace('.tar', '.txt');
    }

    filePath = nova.path.join(filePath, fileName);

    if (bMatch) {
        size = +bMatch[1];
    }
    if (kbMatch) {
        size = +kbMatch[1] * 1000;
    }
    if (mbMatch) {
        size = +mbMatch[1] * 1000 * 1000;
    }
    if (gbMatch) {
        size = +gbMatch[1] * 1000 * 1000 * 1000;
    }

    if (size < 0) {
        throw new Error('File size must be provided');
    }

    if (size >= 30000000000) {
        throw new Error('File size limit is 30GB just in case');
    }

    mkFile(filePath, size)
        .then((res) => {
            if (isZip) {
                return compressFile(['zip', '-m', '-0', isZip, filePath]);
            }
            if (isTar) {
                return compressFile(['tar', '-cf', isTar, filePath]);
            }
            return true;
        })
        .then(() => {
            return true;
        })
        .catch((error) => {
            console.error(error);
        });
}

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function initCache() {
  var store = [];
  // cache only first element, second is length to jump ahead for the parser
  var cache = function cache(value) {
    store.push(value[0]);
    return value;
  };

  cache.get = function (index) {
    if (index >= store.length) {
      throw RangeError('Can\'t resolve reference ' + (index + 1));
    }

    return store[index];
  };

  return cache;
}

function expectType(str, cache) {
  var types = /^(?:N(?=;)|[bidsSaOCrR](?=:)|[^:]+(?=:))/g;
  var type = (types.exec(str) || [])[0];

  if (!type) {
    throw SyntaxError('Invalid input: ' + str);
  }

  switch (type) {
    case 'N':
      return cache([null, 2]);
    case 'b':
      return cache(expectBool(str));
    case 'i':
      return cache(expectInt(str));
    case 'd':
      return cache(expectFloat(str));
    case 's':
      return cache(expectString(str));
    case 'S':
      return cache(expectEscapedString(str));
    case 'a':
      return expectArray(str, cache);
    case 'O':
      return expectObject(str, cache);
    case 'C':
      return expectClass();
    case 'r':
    case 'R':
      return expectReference(str, cache);
    default:
      throw SyntaxError('Invalid or unsupported data type: ' + type);
  }
}

function expectBool(str) {
  var reBool = /^b:([01]);/;

  var _ref = reBool.exec(str) || [],
      _ref2 = _slicedToArray(_ref, 2),
      match = _ref2[0],
      boolMatch = _ref2[1];

  if (!boolMatch) {
    throw SyntaxError('Invalid bool value, expected 0 or 1');
  }

  return [boolMatch === '1', match.length];
}

function expectInt(str) {
  var reInt = /^i:([+-]?\d+);/;

  var _ref3 = reInt.exec(str) || [],
      _ref4 = _slicedToArray(_ref3, 2),
      match = _ref4[0],
      intMatch = _ref4[1];

  if (!intMatch) {
    throw SyntaxError('Expected an integer value');
  }

  return [parseInt(intMatch, 10), match.length];
}

function expectFloat(str) {
  var reFloat = /^d:(NAN|-?INF|(?:\d+\.\d*|\d*\.\d+|\d+)(?:[eE][+-]\d+)?);/;

  var _ref5 = reFloat.exec(str) || [],
      _ref6 = _slicedToArray(_ref5, 2),
      match = _ref6[0],
      floatMatch = _ref6[1];

  if (!floatMatch) {
    throw SyntaxError('Expected a float value');
  }

  var floatValue = void 0;

  switch (floatMatch) {
    case 'NAN':
      floatValue = Number.NaN;
      break;
    case '-INF':
      floatValue = Number.NEGATIVE_INFINITY;
      break;
    case 'INF':
      floatValue = Number.POSITIVE_INFINITY;
      break;
    default:
      floatValue = parseFloat(floatMatch);
      break;
  }

  return [floatValue, match.length];
}

function readBytes(str, len) {
  var escapedString = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  var bytes = 0;
  var out = '';
  var c = 0;
  var strLen = str.length;
  var wasHighSurrogate = false;
  var escapedChars = 0;

  while (bytes < len && c < strLen) {
    var chr = str.charAt(c);
    var code = chr.charCodeAt(0);
    var isHighSurrogate = code >= 0xd800 && code <= 0xdbff;
    var isLowSurrogate = code >= 0xdc00 && code <= 0xdfff;

    if (escapedString && chr === '\\') {
      chr = String.fromCharCode(parseInt(str.substr(c + 1, 2), 16));
      escapedChars++;

      // each escaped sequence is 3 characters. Go 2 chars ahead.
      // third character will be jumped over a few lines later
      c += 2;
    }

    c++;

    bytes += isHighSurrogate || isLowSurrogate && wasHighSurrogate
    // if high surrogate, count 2 bytes, as expectation is to be followed by low surrogate
    // if low surrogate preceded by high surrogate, add 2 bytes
    ? 2 : code > 0x7ff
    // otherwise low surrogate falls into this part
    ? 3 : code > 0x7f ? 2 : 1;

    // if high surrogate is not followed by low surrogate, add 1 more byte
    bytes += wasHighSurrogate && !isLowSurrogate ? 1 : 0;

    out += chr;
    wasHighSurrogate = isHighSurrogate;
  }

  return [out, bytes, escapedChars];
}

function expectString(str) {
  // PHP strings consist of one-byte characters.
  // JS uses 2 bytes with possible surrogate pairs.
  // Serialized length of 2 is still 1 JS string character
  var reStrLength = /^s:(\d+):"/g; // also match the opening " char

  var _ref7 = reStrLength.exec(str) || [],
      _ref8 = _slicedToArray(_ref7, 2),
      match = _ref8[0],
      byteLenMatch = _ref8[1];

  if (!match) {
    throw SyntaxError('Expected a string value');
  }

  var len = parseInt(byteLenMatch, 10);

  str = str.substr(match.length);

  var _readBytes = readBytes(str, len),
      _readBytes2 = _slicedToArray(_readBytes, 2),
      strMatch = _readBytes2[0],
      bytes = _readBytes2[1];

  if (bytes !== len) {
    throw SyntaxError('Expected string of ' + len + ' bytes, but got ' + bytes);
  }

  str = str.substr(strMatch.length);

  // strict parsing, match closing "; chars
  if (!str.startsWith('";')) {
    throw SyntaxError('Expected ";');
  }

  return [strMatch, match.length + strMatch.length + 2]; // skip last ";
}

function expectEscapedString(str) {
  var reStrLength = /^S:(\d+):"/g; // also match the opening " char

  var _ref9 = reStrLength.exec(str) || [],
      _ref10 = _slicedToArray(_ref9, 2),
      match = _ref10[0],
      strLenMatch = _ref10[1];

  if (!match) {
    throw SyntaxError('Expected an escaped string value');
  }

  var len = parseInt(strLenMatch, 10);

  str = str.substr(match.length);

  var _readBytes3 = readBytes(str, len, true),
      _readBytes4 = _slicedToArray(_readBytes3, 3),
      strMatch = _readBytes4[0],
      bytes = _readBytes4[1],
      escapedChars = _readBytes4[2];

  if (bytes !== len) {
    throw SyntaxError('Expected escaped string of ' + len + ' bytes, but got ' + bytes);
  }

  str = str.substr(strMatch.length + escapedChars * 2);

  // strict parsing, match closing "; chars
  if (!str.startsWith('";')) {
    throw SyntaxError('Expected ";');
  }

  return [strMatch, match.length + strMatch.length + 2]; // skip last ";
}

function expectKeyOrIndex(str) {
  try {
    return expectString(str);
  } catch (err) {}

  try {
    return expectEscapedString(str);
  } catch (err) {}

  try {
    return expectInt(str);
  } catch (err) {
    throw SyntaxError('Expected key or index');
  }
}

function expectObject(str, cache) {
  // O:<class name length>:"class name":<prop count>:{<props and values>}
  // O:8:"stdClass":2:{s:3:"foo";s:3:"bar";s:3:"bar";s:3:"baz";}
  var reObjectLiteral = /^O:(\d+):"([^"]+)":(\d+):\{/;

  var _ref11 = reObjectLiteral.exec(str) || [],
      _ref12 = _slicedToArray(_ref11, 4),
      objectLiteralBeginMatch = _ref12[0],
      /* classNameLengthMatch */className = _ref12[2],
      propCountMatch = _ref12[3];

  if (!objectLiteralBeginMatch) {
    throw SyntaxError('Invalid input');
  }

  if (className !== 'stdClass') {
    throw SyntaxError('Unsupported object type: ' + className);
  }

  var totalOffset = objectLiteralBeginMatch.length;

  var propCount = parseInt(propCountMatch, 10);
  var obj = {};
  cache([obj]);

  str = str.substr(totalOffset);

  for (var i = 0; i < propCount; i++) {
    var prop = expectKeyOrIndex(str);
    str = str.substr(prop[1]);
    totalOffset += prop[1];

    var value = expectType(str, cache);
    str = str.substr(value[1]);
    totalOffset += value[1];

    obj[prop[0]] = value[0];
  }

  // strict parsing, expect } after object literal
  if (str.charAt(0) !== '}') {
    throw SyntaxError('Expected }');
  }

  return [obj, totalOffset + 1]; // skip final }
}

function expectClass(str, cache) {
  // can't be well supported, because requires calling eval (or similar)
  // in order to call serialized constructor name
  // which is unsafe
  // or assume that constructor is defined in global scope
  // but this is too much limiting
  throw Error('Not yet implemented');
}

function expectReference(str, cache) {
  var reRef = /^[rR]:([1-9]\d*);/;

  var _ref13 = reRef.exec(str) || [],
      _ref14 = _slicedToArray(_ref13, 2),
      match = _ref14[0],
      refIndex = _ref14[1];

  if (!match) {
    throw SyntaxError('Expected reference value');
  }

  return [cache.get(parseInt(refIndex, 10) - 1), match.length];
}

function expectArray(str, cache) {
  var reArrayLength = /^a:(\d+):{/;

  var _ref15 = reArrayLength.exec(str) || [],
      _ref16 = _slicedToArray(_ref15, 2),
      arrayLiteralBeginMatch = _ref16[0],
      arrayLengthMatch = _ref16[1];

  if (!arrayLengthMatch) {
    throw SyntaxError('Expected array length annotation');
  }

  str = str.substr(arrayLiteralBeginMatch.length);

  var array = expectArrayItems(str, parseInt(arrayLengthMatch, 10), cache);

  // strict parsing, expect closing } brace after array literal
  if (str.charAt(array[1]) !== '}') {
    throw SyntaxError('Expected }');
  }

  return [array[0], arrayLiteralBeginMatch.length + array[1] + 1]; // jump over }
}

function expectArrayItems(str) {
  var expectedItems = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var cache = arguments[2];

  var key = void 0;
  var hasStringKeys = false;
  var item = void 0;
  var totalOffset = 0;
  var items = [];
  cache([items]);

  for (var i = 0; i < expectedItems; i++) {
    key = expectKeyOrIndex(str);

    // this is for backward compatibility with previous implementation
    if (!hasStringKeys) {
      hasStringKeys = typeof key[0] === 'string';
    }

    str = str.substr(key[1]);
    totalOffset += key[1];

    // references are resolved immediately, so if duplicate key overwrites previous array index
    // the old value is anyway resolved
    // fixme: but next time the same reference should point to the new value
    item = expectType(str, cache);
    str = str.substr(item[1]);
    totalOffset += item[1];

    items[key[0]] = item[0];
  }

  // this is for backward compatibility with previous implementation
  if (hasStringKeys) {
    items = Object.assign({}, items);
  }

  return [items, totalOffset];
}

var unserialize = function unserialize(str) {
  //       discuss at: https://locutus.io/php/unserialize/
  //      original by: Arpad Ray (mailto:arpad@php.net)
  //      improved by: Pedro Tainha (https://www.pedrotainha.com)
  //      improved by: Kevin van Zonneveld (https://kvz.io)
  //      improved by: Kevin van Zonneveld (https://kvz.io)
  //      improved by: Chris
  //      improved by: James
  //      improved by: Le Torbi
  //      improved by: Eli Skeggs
  //      bugfixed by: dptr1988
  //      bugfixed by: Kevin van Zonneveld (https://kvz.io)
  //      bugfixed by: Brett Zamir (https://brett-zamir.me)
  //      bugfixed by: philippsimon (https://github.com/philippsimon/)
  //       revised by: d3x
  //         input by: Brett Zamir (https://brett-zamir.me)
  //         input by: Martin (https://www.erlenwiese.de/)
  //         input by: kilops
  //         input by: Jaroslaw Czarniak
  //         input by: lovasoa (https://github.com/lovasoa/)
  //      improved by: Rafa?? Kukawski
  // reimplemented by: Rafa?? Kukawski
  //           note 1: We feel the main purpose of this function should be
  //           note 1: to ease the transport of data between php & js
  //           note 1: Aiming for PHP-compatibility, we have to translate objects to arrays
  //        example 1: unserialize('a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}')
  //        returns 1: ['Kevin', 'van', 'Zonneveld']
  //        example 2: unserialize('a:2:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";}')
  //        returns 2: {firstName: 'Kevin', midName: 'van'}
  //        example 3: unserialize('a:3:{s:2:"??";s:2:"??";s:3:"???";s:3:"???";s:4:"????";s:4:"????";}')
  //        returns 3: {'??': '??', '???': '???', '????': '????'}
  //        example 4: unserialize(undefined)
  //        returns 4: false
  //        example 5: unserialize('O:8:"stdClass":1:{s:3:"foo";b:1;}')
  //        returns 5: { foo: true }
  //        example 6: unserialize('a:2:{i:0;N;i:1;s:0:"";}')
  //        returns 6: [null, ""]
  //        example 7: unserialize('S:7:"\\65\\73\\63\\61\\70\\65\\64";')
  //        returns 7: 'escaped'

  try {
    if (typeof str !== 'string') {
      return false;
    }

    return expectType(str, initCache())[0];
  } catch (err) {
    console.error(err);
    return false;
  }
};

var _nodeResolve_empty = {};

var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': _nodeResolve_empty
});

var require$$0 = getCjsExportFromNamespace(_nodeResolve_empty$1);

var uuidRandom = createCommonjsModule(function (module) {

(function(){

  var
    buf,
    bufIdx = 0,
    hexBytes = [],
    i
  ;

  // Pre-calculate toString(16) for speed
  for (i = 0; i < 256; i++) {
    hexBytes[i] = (i + 0x100).toString(16).substr(1);
  }

  // Buffer random numbers for speed
  // Reduce memory usage by decreasing this number (min 16)
  // or improve speed by increasing this number (try 16384)
  uuid.BUFFER_SIZE = 4096;

  // Binary uuids
  uuid.bin = uuidBin;

  // Clear buffer
  uuid.clearBuffer = function() {
    buf = null;
    bufIdx = 0;
  };

  // Test for uuid
  uuid.test = function(uuid) {
    if (typeof uuid === 'string') {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
    }
    return false;
  };

  // Node & Browser support
  var crypt0;
  if (typeof crypto !== 'undefined') {
    crypt0 = crypto;
  } else if( (typeof window !== 'undefined') && (typeof window.msCrypto !== 'undefined')) {
    crypt0 = window.msCrypto; // IE11
  }

  if ( (typeof commonjsRequire === 'function')) {
    crypt0 = crypt0 || require$$0;
    module.exports = uuid;
  } else if (typeof window !== 'undefined') {
    window.uuid = uuid;
  }

  // Use best available PRNG
  // Also expose this so you can override it.
  uuid.randomBytes = (function(){
    if (crypt0) {
      if (crypt0.randomBytes) {
        return crypt0.randomBytes;
      }
      if (crypt0.getRandomValues) {
        if (typeof Uint8Array.prototype.slice !== 'function') {
          return function(n) {
            var bytes = new Uint8Array(n);
            crypt0.getRandomValues(bytes);
            return Array.from(bytes);
          };
        }
        return function(n) {
          var bytes = new Uint8Array(n);
          crypt0.getRandomValues(bytes);
          return bytes;
        };
      }
    }
    return function(n) {
      var i, r = [];
      for (i = 0; i < n; i++) {
        r.push(Math.floor(Math.random() * 256));
      }
      return r;
    };
  })();

  // Buffer some random bytes for speed
  function randomBytesBuffered(n) {
    if (!buf || ((bufIdx + n) > uuid.BUFFER_SIZE)) {
      bufIdx = 0;
      buf = uuid.randomBytes(uuid.BUFFER_SIZE);
    }
    return buf.slice(bufIdx, bufIdx += n);
  }

  // uuid.bin
  function uuidBin() {
    var b = randomBytesBuffered(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    return b;
  }

  // String UUIDv4 (Random)
  function uuid() {
    var b = uuidBin();
    return hexBytes[b[0]] + hexBytes[b[1]] +
      hexBytes[b[2]] + hexBytes[b[3]] + '-' +
      hexBytes[b[4]] + hexBytes[b[5]] + '-' +
      hexBytes[b[6]] + hexBytes[b[7]] + '-' +
      hexBytes[b[8]] + hexBytes[b[9]] + '-' +
      hexBytes[b[10]] + hexBytes[b[11]] +
      hexBytes[b[12]] + hexBytes[b[13]] +
      hexBytes[b[14]] + hexBytes[b[15]]
    ;
  }

})();
});

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
                        const whitespace = line.match(/^[\s]*/g);
                        let newLine = val;

                        if (whitespace && whitespace[0]) {
                            newLine = whitespace[0] + newLine;
                        }

                        return newLine.replace('$1', line.trim());
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
                        const whitespace = line.match(/^[\s]*/g);
                        let newLine = val + line;

                        if (whitespace && whitespace[0]) {
                            newLine = whitespace[0] + val + line.trimStart();
                        }

                        return newLine;
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
        return index.encode(text);
    }

    /**
     * Spaces decode
     */
    htmlDecode(text) {
        return index.decode(text);
    }

    /**
     * Get the decimal value of an ASCII character
     */
    asciiToDecimal(text, fn = null) {
        let encoded = [];
        for (const letter of text) {
            let decimal = Number(letter.charCodeAt(0).toString(10));

            if (fn) {
                decimal = fn(decimal);
            }

            encoded.push(decimal);
        }

        return encoded.join(' ');
    }

    /**
     * HTML ASCII to decimal
     */
    htmlAsciiToDecimal(text) {
        let encoded = this.asciiToDecimal(text, (decimal) => {
            decimal = decimal < 100 ? '0' + decimal : decimal;
            return '&#' + decimal + ';';
        });

        return encoded.replace(/ /g, '');
    }

    /**
     * ASCII to Hex (bytes)
     */
    asciiToHex(text) {
        let encoded = [];
        for (const letter of text) {
            encoded.push(Number(letter.charCodeAt(0)).toString(16));
        }

        return encoded.join(' ').toUpperCase();
    }

    /**
     * Text to binary
     */
    textToBinary(text) {
        let binary = [];
        for (const letter of text) {
            binary.push(toBinary(letter.charCodeAt(0)));
        }
        return binary.join(' ');
    }

    /**
     * Text to binary
     */
    binaryToText(text) {
        let string = [];
        text.split(' ').forEach((binary) => {
            string.push(fromBinary(binary));
        });

        return string.join('');
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
                    const isFullRegex = val.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
                    let regex = false;
                    let isMatchStart = val.startsWith('^');
                    let isMatchEnd = val.endsWith('$');
                    let isNot = val.startsWith('!');
                    let defaultModifier =  'gi';

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
        return uuidRandom();
    }

    /**
     * Insert non-breaking space
     */
    nonBreakingSpace() {
        return '&nbsp;';
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
                                log(error);
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

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'); //eslint-disable-line
}

function trim(text) {
    const regStart = /^[ \t\n]*/;
    const regEnd = /[ \t\n]*$/;
    let rS = regStart.exec(text);
    let rE = regEnd.exec(text);
    let start = 0,
        end = text.length;
    if (rS) {
        start = rS[0].length;
    }
    if (rE) {
        end = rE.index;
    }
    if (rS && rE) {
        return {
            start: start,
            end: end
        };
    }

    return null;
}

function getLine(text, startIndex, endIndex) {
    const linebreakRe = /\n/;
    var newStartIndex = 0,
        newEndIndex = 0;
    var searchIndex = startIndex - 1;
    while (true) {
        if (searchIndex < 0) {
            newStartIndex = searchIndex + 1;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        if (linebreakRe.test(char)) {
            newStartIndex = searchIndex + 1;
            break;
        } else {
            searchIndex -= 1;
        }
    }
    searchIndex = endIndex;
    while (true) {
        if (searchIndex > text.length - 1) {
            newEndIndex = searchIndex;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        if (linebreakRe.test(char)) {
            newEndIndex = searchIndex;
            break;
        } else {
            searchIndex += 1;
        }
    }
    return { start: newStartIndex, end: newEndIndex };
}

function getResult(start, end, text, type) {
    return {
        end: end,
        start: start,
        selectionText: text.substring(start, end),
        type: type
    };
}


function isInsideTag(tag = '', text, startIndex, endIndex) {
    if (!tag) {
        return false;
    }

    //var tagRegex = /(<script\b[^>]*>)([\s\S]*?)(<\/script\b[^>]*>)/g;
    let regexString = '(<' + tag + '\\b[^>]*>)([\\s\\S]*?)(<\/' + tag + '\\b[^>]*>)';
    let tagRegex = new RegExp(regexString, 'gi');

    var r;
    while ((r = tagRegex.exec(text)) !== null) {
        if (r.length < 4 || r[2].trim() === '') {
            continue;
        }

        let tagStart = r.index + r[1].length;
        let tagEnd = tagRegex.lastIndex - r[3].length;

        //quotes pair end is before selection, stop here and continue loop
        if (tagEnd < startIndex) {
            continue;
        }

        // quotes pair start is after selection, return, no need to continue loop
        if (tagStart > startIndex) {
            return null;
        }

        if (startIndex == tagStart && endIndex == tagEnd) {
            return null;
        }

        if (startIndex > tagStart && endIndex < tagEnd) {
            return true;
        }
    }

    return false;
}


function hasLineBreaks(text, startIndex, endIndex) {
    let linebreakRe = /\n/;
    let part = text.substring(startIndex, endIndex);
    return linebreakRe.test(part);
}


function getIndent(text, line) {
    let indentReg = /^(\s*)/;
    let line_str = text.substring(line.start, line.end);
    let m = line_str.match(indentReg);
    if (m) {
        return m[0].length;
    }
    return 0;
}

function expandToRegexSet(text, startIndex, endIndex, regex, type) {
    //add modifier
    const globalRegex = new RegExp(regex.source, 'g');
    //if{there is a selection (and not only a blinking cursor)
    if (startIndex != endIndex) {
        let selection = text.substring(startIndex, endIndex);
        // make sure, that every character of the selection meets the regex rules,
        // if not return here
        if ((selection.match(globalRegex) || []).length != selection.length) {
            return null;
        }
    }
    // look back
    let searchIndex = startIndex - 1;
    var newStartIndex = 0,
        newEndIndex = 0;
    while (true) {
        // begin of text is reached
        if (searchIndex < 0) {
            newStartIndex = searchIndex + 1;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        // character found, that does not fit into the search set
        if (!regex.test(char)) {
            newStartIndex = searchIndex + 1;
            break;
        } else {
            searchIndex -= 1;
        }
    }
    // look forward
    searchIndex = endIndex;
    while (true) {
        // end of text reached
        if (searchIndex > text.length - 1) {
            newEndIndex = searchIndex;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        // character found, that does not fit into the search set
        if (!regex.test(char)) {
            newEndIndex = searchIndex;
            break;
        } else {
            searchIndex += 1;
        }
    }

    if (startIndex == newStartIndex && endIndex == newEndIndex) {
        return null;
    }

    return getResult(newStartIndex, newEndIndex, text, type);
}

function expandToQuotes(text, startIndex, endIndex) {
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

function expandToXMLNode(text, start, end) {
    let tagProperties = getTagProperties(text.substring(start, end));
    //if we are selecting a tag, then select the matching tag

    let tagName;
    if (tagProperties) {
        tagName = tagProperties['name'];
        if (tagProperties['type'] == 'closing') {
            let stringStartToTagStart = text.substring(0, start);

            let openingTagPosition = findTag(stringStartToTagStart, 'backward', tagName);
            if (openingTagPosition) {
                return getResult(openingTagPosition['start'], end, text, 'complete_node');
            }
        }
        //if it's a opening tag, find opening tag and return positions
        else if (tagProperties['type'] == 'opening') {
            // check this tag already have closing tag inside
            if (!isTextCloseTag(text.substring(start, end), tagName)) {
                let stringNodeEndToStringEnd = text.substring(end, text.length);
                let closingTagPosition = findTag(stringNodeEndToStringEnd, 'forward', tagName);
                if (closingTagPosition) {
                    return getResult(start, end + closingTagPosition['end'], text, 'complete_node');
                }
            }
        } //else it's self closing and there is no matching tag
    }

    //check if current selection is within a tag, if it is expand to the tag
    //first expand to inside the tag and then to the whole tag
    let isWithinTagResult = isWithinTag(text, start, end);
    if (isWithinTagResult) {
        let inner_start = isWithinTagResult['start'] + 1;
        let inner_end = isWithinTagResult['end'] - 1;

        if (start == inner_start && end == inner_end) {
            return getResult(isWithinTagResult['start'], isWithinTagResult['end'], text, 'complete_node');
        } else {
            return getResult(inner_start, inner_end, text, 'inner_node');
        }
    }

    //expand selection to the "parent" node of the current selection
    let stringStartToSelectionStart = text.substring(0, start);
    let parent_opening_tag = findTag(stringStartToSelectionStart, 'backward');
    let newStart = 0,
        newEnd = 0;


    if (parent_opening_tag) {
        //find closing tag
        let stringNodeEndToStringEnd = text.substring(parent_opening_tag['end'], text.length);
        //console.log('stringNodeEndToStringEnd', stringNodeEndToStringEnd);
        let closingTagPosition = findTag(stringNodeEndToStringEnd, 'forward', parent_opening_tag['name']);
        if (closingTagPosition) {
            //set positions to content of node, w / o the node tags
            newStart = parent_opening_tag['end'];
            newEnd = parent_opening_tag['end'] + closingTagPosition['start'];
        }

        //if this is the current selection, set positions to content of node including start and end tags
        if (newStart == start && newEnd == end) {
            newStart = parent_opening_tag['start'];
            newEnd = parent_opening_tag['end'] + closingTagPosition['end'];
        }

        return getResult(newStart, newEnd, text, 'parent_node_content');
    }

    return null;
}

function isWithinTag(text, startIndex, endIndex) {
    let openingRe = /</;
    let closingRe = />/;

    //// look back
    let searchIndex = startIndex - 1;
    let newStartIndex = 0;
    while (true) {
        ////begin of text is reached, let's return here
        if (searchIndex < 0) {
            return false;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        //# tag start found!
        if (openingRe.test(char)) {
            newStartIndex = searchIndex;
            break;
        }
        //# closing tag found, let's return here
        if (closingRe.test(char)) {
            return false;
        }
        searchIndex -= 1;
    }
    //# look forward
    searchIndex = endIndex;
    while (true) {
        //# end of text is reached, let's return here
        if (searchIndex > text.length - 1) {
            return false;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        //# tag start found!
        if (closingRe.test(char)) {
            return { start: newStartIndex, end: searchIndex + 1 };
        }
        //# closing tag found, let's return here
        if (openingRe.test(char)) {
            return false;
        }
        searchIndex += 1;
    }
}



function getTagProperties(text) {
    text = text.replace(/\s\s+/g, ' ').trim();

    var regex = /<\s*(\/?)\s*([^\s\/]*)\s*(?:.*?)(\/?)\s*>/;
    var tagName, tag_type;
    let void_elements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

    var result = regex.exec(text);
    if (!result) {
        return null;
    }

    tagName = result[2];
    if (result[1]) {
        tag_type = 'closing';
    } else if (result[3]) {
        tag_type = 'self_closing';
    } else if (void_elements.indexOf(tagName) !== -1) {
        tag_type = 'self_closing';
    } else {
        tag_type = 'opening';
    }

    return { name: tagName, type: tag_type };
}

function findTag(text, direction, tagName = '') {
    // search for opening and closing tag with a tagName.If tagName = "", search
    // for all tags.
    //let regexString = '<s*' + tagName + '.*?>|</s*' + tagName + 's*>';
    let regexString = '<s*[\\s\\S]+?>|<\/s*s*>';

    if (tagName) {
        regexString = '<s*' + tagName + '[\\s\\S]+?>|</s*' + tagName + 's*>';
    }

    let regex = new RegExp(regexString, 'g');
    // direction == "forward" implies that we are looking for closing tags (and
    // vice versa
    let targetTagType = direction == 'forward' ? 'closing' : 'opening';
    // set counterpart
    let targetTagTypeCounterpart = direction == 'forward' ? 'opening' : 'closing';

    // found tags will be added/ removed from the stack to eliminate complete nodes
    // (opening tag + closing tag).
    let symbolStack = [];
    // since regex can't run backwards, we reverse the result
    var tArr = [];
    var r;
    while ((r = regex.exec(text)) !== null) {
        let tagName = r[0];
        let start = r.index;
        let end = regex.lastIndex;
        tArr.push({
            name: tagName,
            start: start,
            end: end
        });
    }

    if (direction == 'backward') {
        tArr.reverse();
    }

    //console.log('reverse', JSON.stringify(tArr, null, ' '));

    var result = null;
    tArr.forEach((value) => {
        let tag_string = value.name;
        // ignore comments
        if (result) {
            return;
        }

        if (tag_string.includes('<!--') || tag_string.includes('<![')) {
            return;
        }

        let tag_type = getTagProperties(tag_string)['type'];

        if (tag_type == targetTagType) {
            if (symbolStack.length === 0) {
                result = {
                    start: value.start,
                    end: value.end,
                    name: getTagProperties(tag_string)['name']
                };
                return;
            }

            symbolStack.pop();
        } else if (tag_type == targetTagTypeCounterpart) {
            symbolStack.push(tag_type);
        }
    });

    return result;
}




// check is text string have xml node closing ex:<div>aaa</div>
function isTextCloseTag(text, tagName = '') {
    // search for opening and closing tag with a tagName.If tagName = "", search
    // for all tags.
    let regexString = '<s*' + tagName + '.*?>|</s*' + tagName + 's*>';
    let regex = new RegExp(regexString, 'g');
    // direction == "forward" implies that we are looking for closing tags (and
    // vice versa
    let targetTagType = 'closing';
    // set counterpart
    let targetTagTypeCounterpart = 'opening';
    // found tags will be added/ removed from the stack to eliminate complete nodes
    // (opening tag + closing tag).
    let symbolStack = [];
    // since regex can't run backwards, we reverse the result
    var tArr = [];
    var r;
    while ((r = regex.exec(text)) !== null) {
        let tagName = r[0];
        let start = r.index;
        let end = regex.lastIndex;
        tArr.push({ name: tagName, start: start, end: end });
    }
    tArr.forEach((value) => {
        let tag_string = value.name;
        if (tag_string.indexOf('<!--') === 0 || tag_string.indexOf('<![') === 0) {
            return;
        }
        let tag_type = getTagProperties(tag_string)['type'];
        if (tag_type == targetTagType) {
            symbolStack.pop();
        } else if (tag_type == targetTagTypeCounterpart) {
            symbolStack.push(tag_type);
        }
    });

    return symbolStack.length == 0;
}

function expandToWord(text, startIndex, endIndex) {
    const regex = /[\u00BF-\u1FFF\u2C00-\uD7FF\w$]/;
    return expandToRegexSet(text, startIndex, endIndex, regex, 'word');
}

function expandToSemanticUnit(text, startIndex, endIndex) {
    const symbols = '([{)]}';
    const breakSymbols = ':|,;=&|\n\r';
    const lookBackBreakSymbols = breakSymbols + '([{';
    const lookForwardBreakSymbols = breakSymbols + ')]}';
    const symbolsRe = new RegExp(`[${escapeRegExp(symbols)}${escapeRegExp(breakSymbols)}]`);
    const counterparts = {
        '(': ')',
        '{': '}',
        '[': ']',
        ')': '(',
        '}': '{',
        ']': '['
    };
    let symbolStack = [];

    let searchIndex = startIndex - 1;
    let newStartIndex, newEndIndex;
    while (true) {
        if (searchIndex < 0) {
            newStartIndex = searchIndex + 1;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        let result = symbolsRe.exec(char);
        if (result) {
            let symbol = result[0];
            if (lookBackBreakSymbols.indexOf(symbol) != -1 && symbolStack.length == 0) {
                newStartIndex = searchIndex + 1;
                break;
            }
            if (symbols.indexOf(symbol) != -1) {
                if (symbolStack.length > 0 && symbolStack[symbolStack.length - 1] == counterparts[symbol]) {
                    symbolStack.pop();
                } else {
                    symbolStack.push(symbol);
                }
            }
        }
        searchIndex -= 1;
    }

    searchIndex = endIndex;

    while (true) {
        let char = text.substring(searchIndex, searchIndex + 1);
        let result = symbolsRe.exec(char);
        if (result) {
            let symbol = result[0];
            if (symbolStack.length == 0 && lookForwardBreakSymbols.indexOf(symbol) != -1) {
                newEndIndex = searchIndex;
                break;
            }
            if (symbols.indexOf(symbol) != -1) {
                if (symbolStack.length > 0 && symbolStack[symbolStack.length - 1] == counterparts[symbol]) {
                    symbolStack.pop();
                } else {
                    symbolStack.push(symbol);
                }
            }
        }
        if (searchIndex >= text.length - 1) {
            return null;
        }
        searchIndex += 1;
    }
    let s = text.substring(newStartIndex, newEndIndex);
    let trimResult = trim(s);

    if (trimResult) {
        newStartIndex = newStartIndex + trimResult.start;
        newEndIndex = newEndIndex - (s.length - trimResult.end);
    }
    if (newStartIndex == startIndex && newEndIndex == endIndex) {
        return null;
    }
    if (newStartIndex > startIndex || newEndIndex < endIndex) {
        return null;
    }

    // Handle arrow funtions =>
    if (s.charAt(0) == '>') {
        if (text.substring(newStartIndex - 1, newStartIndex) == '=') {
            newStartIndex = newStartIndex - 1;
        }
    }

    return getResult(newStartIndex, newEndIndex, text, 'semantic_unit');
}

function expandToSymbols(text, startIndex, endIndex) {
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

function expandToLine(text, startIndex, endIndex) {
    const lineReg = /\n/;
    const spacesAndTabsRe = /(\s|\t)*/;
    var newStartIndex = 0,
        newEndIndex = 0;

    let searchIndex = startIndex - 1;
    while (true) {
        if (searchIndex < 0) {
            newStartIndex = searchIndex + 1;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        if (lineReg.test(char)) {
            newStartIndex = searchIndex + 1;
            break;
        } else {
            searchIndex -= 1;
        }
    }

    searchIndex = endIndex;

    while (true) {
        if (searchIndex > text.length - 1) {
            newEndIndex = searchIndex;
            break;
        }
        let char = text.substring(searchIndex, searchIndex + 1);
        if (lineReg.test(char)) {
            newEndIndex = searchIndex;
            break;
        } else {
            searchIndex += 1;
        }
    }

    //remove blank space in top
    var s = text.substring(newStartIndex, newEndIndex);
    var r = spacesAndTabsRe.exec(s);
    if (r && r[0].length <= startIndex) {
        newStartIndex += r[0].length;
    }

    // Stop at line end delimiter
    const lineEndingChars = [';', ','];
    const lastChar = text.substring(newEndIndex - 1, newEndIndex);

    if (lineEndingChars.includes(lastChar)) {
        if (startIndex == newStartIndex && endIndex < newEndIndex - 1) {
            newEndIndex = newEndIndex - 1;
        } else if (newStartIndex < startIndex && endIndex + 1 == newEndIndex) {
            newEndIndex = newEndIndex - 1;
        }
    }

    if (startIndex == newStartIndex && endIndex == newEndIndex) {
        return null;
    }

    return getResult(newStartIndex, newEndIndex, text, 'line');
}

function expandToBackticks(text, startIndex, endIndex) {
    var quotesRegex = /([\`])(?:[\w\s\S])*?\1/g;
    var r;

    // iterate over all found backticks pairs
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
            return getResult(quotesStart, quotesEnd, text, 'backticks');
        }

        //# selection is within the found quote pairs, return "quotes content"
        if (startIndex > quotesStart && endIndex < quotesEnd) {
            return getResult(quotesContentStart, quotesContentEnd, text, 'backticks');
        }
    }

    return null;
}

class JavascriptExpander {

    constructor(editor) {
        this.editor = editor;
    }

    expand(text, start, end, data = {}) {
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

        let expandStack = [];
        let result = null;


        result = expandToSemanticUnit(text, start, end);
        if (result) {
            expandStack.push('semantic_unit');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToBackticks(text, start, end);
        if (result) {
            expandStack.push('backticks');
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

        // TODO: JS expand above will fails if there are comments

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

        result = expandToBackticks(text, start, end);
        if (result) {
            expandStack.push('backticks');
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
}

class HTMLExpander {
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

const indentReg = /^(\s*)/;

function empty_line(text, line) {
    return text.substring(line.start, line.end).trim() === '';
}

function getIndent$1(text, line) {
    let line_str = text.substring(line.start, line.end);
    let m = line_str.match(indentReg);
    if (m) {
        return m[0].length;
    }
    return 0;
}

function expandToIndent(text, startIndex, endIndex) {
    let line = getLine(text, startIndex, endIndex);
    let indent = getIndent$1(text, line);
    let start = line.start;
    let end = line.end;
    let beforeLine = line;

    while (true) {
        let pos = beforeLine.start - 1;
        if (pos <= 0) {
            break;
        }

        beforeLine = getLine(text, pos, pos);

        let beforeIndent = getIndent$1(text, beforeLine);

        //done if the line has a lower indent
        if (!(indent <= beforeIndent) && !empty_line(text, beforeLine)) {
            break;
        }

        if (!empty_line(text, beforeLine) && indent == beforeIndent) {
            start = beforeLine.start;
        }
    }

    let afterLine = line;

    while (true) {
        //get the line afterLine
        let pos = afterLine.end + 1;
        if (pos >= text.length) {
            break;
        }
        afterLine = getLine(text, pos, pos);
        let afterIndent = getIndent$1(text, afterLine);
        //done if the line has a lower indent
        if (!(indent <= afterIndent) && !empty_line(text, afterLine)) {
            break;
        }
        //move the end
        if (!empty_line(text, afterLine)) {
            end = afterLine.end;
        }
    }

    return getResult(start, end, text, 'indent');
}

class PythonExpander {
    constructor(editor) {
        this.editor = editor;
    }

    expand(text, start, end, data = {}) {
        let expandStack = [];
        let result = null;

        const jsExpander = new JavascriptExpander(this.editor);
        const expand = jsExpander.expand(text, start, end, data);

        if (expand) {
            return expand;
        }


        result = this.expandLineWithoutIndent(text, start, end);
        if (result) {
            expandStack.push('line_no_indent');
            result['expandStack'] = expandStack;
            return result;
        }


        result = this.expandOverLineContinuation(text, start, end);
        if (result) {
            expandStack.push('line_continuation');
            result['expandStack'] = expandStack;
            return result;
        }

        result = this.expandPythonBlockFromStart(text, start, end);
        if (result) {
            expandStack.push('py_block_start');
            result['expandStack'] = expandStack;
            return result;
        }


        result = this.pyExpandToIndent(text, start, end);
        if (result) {
            expandStack.push('py_indent');
            result['expandStack'] = expandStack;
            return result;
        }


        if (result) {
            result['expandStack'] = expandStack;
            return result;
        }

        return null;
    }


    expandLineWithoutIndent(text, start, end) {
        const line = getLine(text, start, end);
        //const line = this.editor.getLineRangeForRange(new Range(start, end));
        const indent = getIndent$1(text, line);
        let lstart = Math.min(start, line.start + indent);
        let lend = Math.max(end, line.end);

        if (lstart !== start || lend !== end) {
            return getResult(lstart, lend, text, 'line_no_indent');
        }

        return null;
    }

    expandOverLineContinuation(text, start, end) {
        if (text.substring(end - 1, end) !== '\\') {
            return null;
        }

        const line = this.editor.getLineRangeForRange(new Range(start, end));
        const lineIndent = getIndent$1(text, line);
        const nextLine = this.editor.getLineRangeForRange(new Range(end + 1, end + 2));

        start = line.start + lineIndent;
        end = nextLine.end - 1;

        const nextResult = this.expandOverLineContinuation(text, start, end);
        if (nextResult) {
            start = nextResult.start;
            end = nextResult.end;
        }

        return getResult(start, end, text, 'line_continuation');
    }

    expandPythonBlockFromStart(text, start, end) {
        if (text.substring(end - 1, end) !== ':') {
            return null;
        }

        const result = expandToIndent(text, end + 1, end + 1);
        if (result) {
            const line = this.editor.getLineRangeForRange(new Range(start, end));
            const indent = getIndent$1(text, line);

            start = line.start + indent;
            end = result.end;
            return getResult(start, end, text, 'py_block_start');
        }

        return null;
    }



    pyExpandToIndent(text, start, end) {
        //const line = this.editor.getLineRangeForRange(new Range(start, end));
        const line = getLine(text, start, end);
        const indent = getIndent$1(text, line);

        // we don't expand to indent 0 (whole document)
        if (indent == 0) {
            return null;
        }

        // expand to indent
        //let result = expandToIndent(text, start - indent, end);
        let result = expandToIndent(text, start - indent, end);
        if (!result) {
            return null;
        }

        // get the indent of the first line
        // if the expansion changed return the result increased
        /*if (result.start !== start || result.end !== end) {
            //return result;
        }*/

        let pos = result.start + indent - 1;

        while (true) {
            if (pos < 0) {
                break;
            }

            // get the indent of the line before
            let beforeLine = getLine(text, pos, pos);
            let beforeIndent = getIndent$1(text, beforeLine);

            if (!empty_line(text, beforeLine) && beforeIndent < indent) {
                start = beforeLine.start;
                end = result.end;
                return getResult(start + beforeIndent, end, text, 'py_indent');
            }

            // goto the line before the line befor
            pos = beforeLine.start - 1;
        }

        return null;
    }
}

class PHPExpander {
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

        result = this.expandToFunction(text, start, end);
        if (result) {
            expandStack.push('function');
            result['expandStack'] = expandStack;
            return result;
        }

        result = expandToSymbols(text, start, end);
        if (result) {
            expandStack.push('symbols');
            result['expandStack'] = expandStack;
            return result;
        }

        /*result = expandToXMLNode(text, start, end);
        if (result) {
            expandStack.push('xml_node');
            result['expandStack'] = expandStack;
            return result;
        }*/

        result = expandToLine(text, start, end);
        if (result) {
            expandStack.push('line');
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

            if (/^(?:\w+).+function.+\w+\(.*\)/.test(prevLineText.trim()) || /\s*class\s+.*/.test(prevLineText.trim())) {
                let indent = getIndent(text, prevLine);
                return getResult(prevLine.start + indent, end, text, 'function');
            }
        }

        return null;
    }
}

const expandHistory = new Map();

class SelectionExpander {
    //expandHistory = new Map();

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

        if (newRanges.length) ;
    }

    /**
     * Shink selection
     * shrinks the active selection(s)
     * using the ranges stored in expandHistory
     */
    shrink(editor) {
        const path = editor.document.path;
        const history = this.getHistory(path);

        if (!history ||??!history.steps.length) {
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
        if (!expandHistory.has(path)) {
            expandHistory.set(path, {
                steps: [],
                selectedRanges: [],
                lastSelected: null
            });
        }

        return expandHistory.get(path);
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
        const history = expandHistory.get(path);
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

        if (expandHistory.has(path)) {
            expandHistory.set(path, {
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

class SelectionAlign {
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
            } else if ((char == '#' && next == ' ') ||??(char == '"' && next == '"' && text.charAt(pos + 2) == '"')) { // python style commets
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

exports.activate = () => {
    const tools = new NovaTextTools();

    if (nova.inDevMode()) {
        console.log('Text Tools Activated');
    }

    // Text commands
    const commands = {
        tolowercase: 'toLowercase',
        touppercase: 'toUpperCase',
        tosnakecase: 'toSnakeCase',
        tocamelcase: 'toCamelCase',
        toconstantcase: 'toConstantCase',
        toheadercase: 'toHeaderCase',
        tonocase: 'toNoCase',
        todotcase: 'toDotCase',
        toparamcase: 'toParamCase',
        topascalcase: 'toPascalCase',
        topathcase: 'toPathCase',
        tosentencecase: 'toSentenceCase',
        tocapitalcase: 'toCapitalCase',
        tospongececase: 'toSpongeCase',
        totitlecase: 'toTitleCase',

        sortalphanumerically: 'sortLinesAlphanumerically',
        sortalphanumericallyreverse: 'sortLinesAlphanumericallyReverse',
        sortbylength: 'sortLinesByLength',
        sortbylengthreverse: 'sortLinesByLengthReverse',
        deleteduplicates: 'deleteDuplicates',
        deleteemptylines: 'deleteEmptyLines',
        filterduplucates: 'filterDuplicates',
        filterduplucatesnew: 'filterDuplicatesNewDoc',
        filteruniques: 'filterUniques',
        filteruniquesnew: 'filterUniquesNewDoc',
        deletelinesmatching: 'deleteLinesMatching',
        filterlinesmatching: 'filterLinesMatching',
        filterlinesmatchingnew: 'filterLinesMatchingNewDoc',
        reverselines: 'reverseLines',
        randomlines: 'randomLines',
        joinlines: 'joinLines',
        splittolines: 'splitToLines',
        addlinesnumber: 'addLinesNumbers',

        tobase64: 'base64Encode',
        decodebase64: 'base64Decode',
        urlencode: 'urlEncode',
        urldecode: 'urlDecode',
        encodehtml: 'htmlEncode',
        decodehtml: 'htmlDecode',
        encodespaces: 'spacesEncode',
        decodespaces: 'spacesDecode',
        htmlasciitodecimal: 'htmlAsciiToDecimal',
        asciitodecimal: 'asciiToDecimal',
        asciitohex: 'asciiToHex',
        texttobinary: 'textToBinary',
        binarytotext: 'binaryToText',

        stripslashes: 'stripSlashes',
        addslashes: 'addSlashes',
        smartquotes: 'smartQuotes',
        straightenquotes: 'straightenQuotes',
        quotessingletodouble: 'quotesSingleToDouble',
        quotessingletobackticks: 'quotesSingleToBackticks',
        quotesdoubletosingle: 'quotesDoubleToSingle',
        quotesdoubletobackticks: 'quotesDoubleToBackticks',

        wrapeachlinewith: 'wrapLinesWith',
        appendtolines: 'appendToLines',
        prependtolines: 'prependToLines',

        addallnumbers: 'addAllNumbers',
        substractallnumbers: 'substractAllNumbers',

        jsonstringparse: 'jsonStringParse'
    };

    for (const command in commands) {
        nova.commands.register(`biati.texttools.${command}`, (editor) => {
            const commandMethod = commands[command];
            return tools.process(editor, tools[commandMethod]);
        });
    }

    // Selection commands
    const selectionCommands = {
        selectlinesmatching: 'selectLinesMatching',
        selectallocurrencesmatching: 'selectAllOcurrencesMatching',
        selectocurrences: 'selectOcurrences'
    };

    for (const scommand in selectionCommands) {
        nova.commands.register(`biati.texttools.${scommand}`, (editor) => {
            const commandMethod = selectionCommands[scommand];
            tools.select(editor, tools[commandMethod]);
        });
    }

    // Insert commands
    const insertionCommands = {
        generateuuid: 'generateUUID',
        fakedata: 'generateFakeData',
        nonbreakingspace: 'nonBreakingSpace',
        generatedummyfile: 'generateDummyFile'
    };

    for (const scommand in insertionCommands) {
        nova.commands.register(`biati.texttools.${scommand}`, (editor) => {
            const commandMethod = insertionCommands[scommand];
            return tools.process(editor, tools[commandMethod], 'insert');
        });
    }

    nova.commands.register('biati.texttools.generatedummyfile', () => {
        return tools.generateDummyFile();
    });

    // Selection Expand/Shrink
    let expander = new SelectionExpander();
    nova.commands.register('biati.texttools.expandselection', (editor) => {
        expander.expand(editor);
    });
    nova.commands.register('biati.texttools.shrinkselection', (editor) => {
        expander.shrink(editor);
    });
    nova.workspace.onDidAddTextEditor((editor) => {
        return editor.onDidChangeSelection(() => {
            expander.maybeResetHistory(editor);
        });
    });

    // Selection Align
    let aligner = new SelectionAlign();
    nova.commands.register('biati.texttools.alignselection', (editor) => {
        aligner.align(editor);
    });
};

exports.deactivate = () => {};
