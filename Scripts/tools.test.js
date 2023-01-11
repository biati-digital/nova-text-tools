import NovaTextTools from './tools.js';

const tools = new NovaTextTools();

test('Text to Lower Case', () => {
    expect(tools.toLowercase('My Test')).toBe('my test');
});

test('Text to Upper Case', () => {
    expect(tools.toUpperCase('My Test')).toBe('MY TEST');
});

test('Text to Snake Case', () => {
    expect(tools.toSnakeCase('My Test')).toBe('my_test');
});

test('Text to Pascal Snake Case', () => {
    expect(tools.toPascalSnakeCase('My Test')).toBe('My_Test');
});

test('Text to Camel Snake Case', () => {
    expect(tools.toCamelSnakeCase('My Test')).toBe('my_Test');
});

test('Text to Camel Case', () => {
    expect(tools.toCamelCase('My Test')).toBe('myTest');
});

test('Text to Capital Case', () => {
    expect(tools.toCapitalCase('my test')).toBe('My Test');
});

test('Text to Constant Case', () => {
    expect(tools.toConstantCase('my test')).toBe('MY_TEST');
});

test('Text to Dot Case', () => {
    expect(tools.toDotCase('my test')).toBe('my.test');
});

test('Text to Header Case', () => {
    expect(tools.toHeaderCase('my test')).toBe('My-Test');
});

test('Text to No Case', () => {
    expect(tools.toNoCase('myTest')).toBe('my test');
});

test('Text to Flat Case', () => {
    expect(tools.toFlatCase('myTest')).toBe('mytest');
});

test('Text to Param Case', () => {
    expect(tools.toParamCase('myTest')).toBe('my-test');
});

test('Text to Screaming Param Case', () => {
    expect(tools.toScreamingParamCase('myTest')).toBe('MY-TEST');
});

test('Text to Pascal Case', () => {
    expect(tools.toPascalCase('my test')).toBe('MyTest');
});

test('Text to Path Case', () => {
    expect(tools.toPathCase('my test')).toBe('my/test');
});

test('Text to Sentence Case', () => {
    expect(tools.toSentenceCase('my test')).toBe('My test');
});

test('Text to Title Case', () => {
    expect(tools.toTitleCase('my test')).toBe('My Test');
});

test('Text Encode Spaces to %20', () => {
    expect(tools.spacesEncode('My Test')).toBe('My%20Test');
});

test('Text Decode %20 to Spaces', () => {
    expect(tools.spacesDecode('My%20Test')).toBe('My Test');
});

test('Text HTML Encode', () => {
    expect(tools.htmlEncode('<h1>My Test</h1>')).toBe('&lt;h1&gt;My Test&lt;/h1&gt;');
});

test('HTML to Decimal Entities', () => {
    expect(tools.htmlAsciiToDecimal('test@test.com')).toBe('&#116;&#101;&#115;&#116;&#064;&#116;&#101;&#115;&#116;&#046;&#099;&#111;&#109;');
});

test('Text to Binary', () => {
    expect(tools.textToBinary('hello')).toBe('01101000 01100101 01101100 01101100 01101111');
});

test('Binary to Text', () => {
    expect(tools.binaryToText('01101000 01100101 01101100 01101100 01101111')).toBe('hello');
});

test('ASCII to Decimal', () => {
    expect(tools.asciiToDecimal('test')).toBe('116 101 115 116');
});

test('ASCII to Hex', () => {
    expect(tools.asciiToHex('test')).toBe('74 65 73 74');
});

test('Text Decode %20 to Spaces', () => {
    expect(tools.htmlDecode('&lt;h1&gt;My Test&lt;/h1&gt;')).toBe('<h1>My Test</h1>');
});

test('Text Add Slashes', () => {
    // eslint-disable-next-line
    expect(tools.addSlashes("\"I don't know what, you. mean by 'glory'\"")).toBe("\\\"I don\\'t know what, you. mean by \\'glory\\'\\\"");
});

test('Text Strip Slashes', () => {
    // eslint-disable-next-line
    expect(tools.stripSlashes("Might\\'s Test")).toBe("Might's Test");
});

test('Text Straighten Quotes', () => {
    // eslint-disable-next-line
    expect(tools.straightenQuotes('“don’t know what you mean by ‘glory’”')).toBe("\"don't know what you mean by 'glory'\"");
});

test('Test Normalize for diacritics', () => {
    // eslint-disable-next-line
    expect(tools.toParamCase("Nom donné à l'adresse")).toBe('nom-donne-a-l-adresse');
});

test('Test Normalize for accents', () => {
    expect(tools.toCapitalCase('maría muñoz')).toBe('María Muñoz');
});

test('Reverse Lines', () => {
    expect(tools.reverseLines('Example 1\nExample 2\nExample 3')).toBe('Example 3\nExample 2\nExample 1');
});

//eslint-disable-next-line
test("Sort Lines by it's length smaller to larger", () => {
    expect(tools.sortLinesByLength('Michael\nMorphy Plertguies\nAdrianne Lay')).toBe('Michael\nAdrianne Lay\nMorphy Plertguies');
});

//eslint-disable-next-line
test("Sort Lines by it's length larger to smaller", () => {
    expect(tools.sortLinesByLengthReverse('Michael\nMorphy Plertguies\nAdrianne Lay')).toBe('Morphy Plertguies\nAdrianne Lay\nMichael');
});
