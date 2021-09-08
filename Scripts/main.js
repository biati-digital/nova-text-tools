import NovaTextTools from './tools.js';

exports.activate = () => {
    console.log('Text Tools Activated');
    const tools = new NovaTextTools();

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
        stripslashes: 'stripSlashes',
        addslashes: 'addSlashes',
        smartquotes: 'smartQuotes',
        straightenquotes: 'straightenQuotes',

        wrapeachlinewith: 'wrapLinesWith',
        appendtolines: 'appendToLines',
        prependtolines: 'prependToLines',

        addallnumbers: 'addAllNumbers',
        substractallnumbers: 'substractAllNumbers',

        jsonstringparse: 'jsonStringParse',
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
        selectocurrencesmatching: 'selectOcurrencesMatching',
        selectocurrences: 'selectOcurrences',
    };

    for (const scommand in selectionCommands) {
        nova.commands.register(`biati.texttools.${scommand}`, (editor) => {
            const commandMethod = selectionCommands[scommand];
            return tools.select(editor, tools[commandMethod]);
        });
    }

    // Insert commands
    const insertionCommands = {
        generateuuid: 'generateUUID',
        fakedata: 'generateFakeData',
    };

    for (const scommand in insertionCommands) {
        nova.commands.register(`biati.texttools.${scommand}`, (editor) => {
            const commandMethod = insertionCommands[scommand];
            return tools.process(editor, tools[commandMethod], 'insert');
        });
    }
};

exports.deactivate = () => {};
