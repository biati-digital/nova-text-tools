//const faker = require('faker');

export function romanize(num) {
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

export function ordinal_suffix(i) {
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

export function titleCase(string) {
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

export function randomArray(array) {
    var currentIndex = array.length,
        randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

export function fakeData(format, amount = 1) {
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
        default:
    }
    return val;
}
