import NovaTextTools from './tools.js';

const tools = new NovaTextTools();

test('Text to Lower Case', () => {
    expect(tools.toLowercase('My Test')).toBe('my test');
});

test('Text to Upper Case', () => {
    expect(tools.toUpperCase('My Test')).toBe('MY TEST');
});

test('Text to Snale Case', () => {
    expect(tools.toSnakeCase('My Test')).toBe('my_test');
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

test('Text to Param Case', () => {
    expect(tools.toParamCase('myTest')).toBe('my-test');
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

test('Text Decode %20 to Spaces', () => {
    expect(tools.htmlDecode('&lt;h1&gt;My Test&lt;/h1&gt;')).toBe('<h1>My Test</h1>');
});

test('Text Add Slashes', () => {
    expect(tools.addSlashes("\"I don't know what, you. mean by 'glory'\"")).toBe("\\\"I don\\'t know what, you. mean by \\'glory\\'\\\"");
});

test('Text Strip Slashes', () => {
    expect(tools.stripSlashes("Might\\'s Test")).toBe("Might's Test");
});

test('Text Straighten Quotes', () => {
    expect(tools.straightenQuotes('“don’t know what you mean by ‘glory’”')).toBe("\"don't know what you mean by 'glory'\"");
});

test('Test Normalize for diacritics', () => {
    expect(tools.toParamCase("Nom donné à l'adresse")).toBe('nom-donne-a-l-adresse');
});

test('Test Normalize for accents', () => {
    expect(tools.toCapitalCase('maría muñoz')).toBe('María Muñoz');
});
