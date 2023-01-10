import SelectionAlign from './align/align.js';
import SelectionExpander from './expander/expander.js';
import NovaTextTools from './tools.js';

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
        topascalsnakecase: 'toPascalSnakeCase',
        tocamelsnakecase: 'toCamelSnakeCase',
        tocamelcase: 'toCamelCase',
        toconstantcase: 'toConstantCase',
        toheadercase: 'toHeaderCase',
        tonocase: 'toNoCase',
        toflatcase: 'toflatCase',
        todotcase: 'toDotCase',
        toparamcase: 'toParamCase',
        toscreamingparamcase: 'toScreamingParamCase',
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
        rot13: 'rot13',

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
            return tools.process(command, editor, tools[commandMethod]);
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
            return tools.process(scommand, editor, tools[commandMethod], 'insert');
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

    function onChange(textEditor) {
        expander.maybeResetHistory(textEditor);
    }
    function onSelectionChange(textEditor) {
        nova.subscriptions.add(textEditor.onDidChangeSelection(onChange));
    }
    nova.subscriptions.add(nova.workspace.onDidAddTextEditor(onSelectionChange));

    // Selection Align
    let aligner = new SelectionAlign();
    nova.commands.register('biati.texttools.alignselection', (editor) => {
        aligner.align(editor);
    });
};

exports.deactivate = () => {};
