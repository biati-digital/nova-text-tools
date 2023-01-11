'use strict';

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
    let charsBeforeCharFound = "";
    let isNewline = true;
    while (pos < text.length) {
      let type;
      let char = text.charAt(pos);
      let next = text.charAt(pos + 1);
      let nextSeek = 1;
      let stringStarts = ['"', "'", "`"];
      let bracketStarts = ["{", "(", "["];
      let bracketEnds = ["}", ")", "]"];
      if (text.charCodeAt(pos) == 10) {
        type = "newline";
      } else if (char.match(/\s/)) {
        type = "whitespace";
      } else if (stringStarts.includes(char)) {
        type = "string";
      } else if (bracketStarts.includes(char)) {
        type = "blockStart";
      } else if (bracketEnds.includes(char)) {
        type = "blockEnd";
      } else if (char == "/" && (next == "/" && (pos > 0 ? text.charAt(pos - 1) : "") != ":" || next == "*")) {
        type = "comment";
      } else if (char == "#" && next == " " || char == '"' && next == '"' && text.charAt(pos + 2) == '"') {
        type = "comment";
      } else if (char == ":" && next != ":") {
        type = "colon";
      } else if (char == ":" && next == ":") {
        type = "word";
      } else if (char == "=" && next == ">") {
        type = "arrow";
        nextSeek = 2;
      } else if ((char == "=" || char == "!" || char == ">" || char == "<") && next == "=") {
        type = "word";
        nextSeek = 2;
        if ((char == "=" || char == "!") && text.charAt(pos + nextSeek) == "=") {
          nextSeek = 3;
        }
      } else if ((char == "+" || char == "-" || char == "*" || char == "/" || char == "%" || char == "~" || char == "|" || char == "^" || char == ".") && next == "=") {
        type = "assignment";
        nextSeek = 2;
      } else if (char == "=" && next != "=") {
        type = "assignment";
      } else {
        type = "word";
      }
      if (type == "newline") {
        charsBeforeCharFound = "";
        isNewline = true;
      }
      if (isNewline && type !== "newline") {
        charsBeforeCharFound += char;
      }
      if (type == "whitespace") {
        whiteSpaceBefore += 1;
      }
      if (type == "string" && !skipChars) {
        skipChars = true;
      } else if (type == "string" && skipChars) {
        skipChars = false;
      }
      if (type == "blockStart" && !skipChars) {
        skipChars = true;
      } else if (type == "blockEnd" && skipChars) {
        skipChars = false;
      }
      if (skipChars) {
        ++pos;
        continue;
      }
      if (isNewline && type == "assignment" || type == "arrow" || type == "colon") {
        charsBeforeCharFound = charsBeforeCharFound.slice(0, -1);
        isNewline = false;
        tokens.push({
          char,
          whiteSpaceBefore,
          charsBeforeCharFound,
          pos,
          type
        });
        charsBeforeCharFound = "";
      }
      if (type !== "whitespace") {
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
        let space = " ".repeat(toAdd);
        let pos = token.pos + offset;
        text = text.substring(0, pos) + space + text.substring(pos);
        offset += toAdd;
      }
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
    let bracketRegex = /(?:\[|{)([^\]}]+)+/gm;
    const bracketMatchs = [...text.matchAll(bracketRegex)];
    if (bracketMatchs && bracketMatchs.length) {
      bracketMatchs.forEach((match) => {
        if (/\n/.test(match[1])) {
          groups.push(match[1]);
        }
      });
    }
    return groups;
  }
  getExtension(editor) {
    let filePath = editor.document.path;
    let extension = nova.path.extname(filePath).substring(1);
    if (filePath.endsWith(".blade.php")) {
      extension = "html";
    } else if (extension == "vue") {
      extension = "html";
    }
    return extension;
  }
}

function escapeRegExp(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function trim(text) {
  const regStart = /^[ \t\n]*/;
  const regEnd = /[ \t\n]*$/;
  let rS = regStart.exec(text);
  let rE = regEnd.exec(text);
  let start = 0, end = text.length;
  if (rS) {
    start = rS[0].length;
  }
  if (rE) {
    end = rE.index;
  }
  if (rS && rE) {
    return {
      start,
      end
    };
  }
  return null;
}
function getLine(text, startIndex, endIndex) {
  const linebreakRe = /\n/;
  var newStartIndex = 0, newEndIndex = 0;
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
    end,
    start,
    selectionText: text.substring(start, end),
    type
  };
}
function isInsideTag(tag = "", text, startIndex, endIndex) {
  if (!tag) {
    return false;
  }
  let regexString = "(<" + tag + "\\b[^>]*>)([\\s\\S]*?)(</" + tag + "\\b[^>]*>)";
  let tagRegex = new RegExp(regexString, "gi");
  var r;
  while ((r = tagRegex.exec(text)) !== null) {
    if (r.length < 4 || r[2].trim() === "") {
      continue;
    }
    let tagStart = r.index + r[1].length;
    let tagEnd = tagRegex.lastIndex - r[3].length;
    if (tagEnd < startIndex) {
      continue;
    }
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
  const globalRegex = new RegExp(regex.source, "g");
  if (startIndex != endIndex) {
    let selection = text.substring(startIndex, endIndex);
    if ((selection.match(globalRegex) || []).length != selection.length) {
      return null;
    }
  }
  let searchIndex = startIndex - 1;
  var newStartIndex = 0, newEndIndex = 0;
  while (true) {
    if (searchIndex < 0) {
      newStartIndex = searchIndex + 1;
      break;
    }
    let char = text.substring(searchIndex, searchIndex + 1);
    if (!regex.test(char)) {
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
  while ((r = quotesRegex.exec(text)) !== null) {
    let quotesStart = r.index;
    let quotesEnd = quotesRegex.lastIndex;
    if (quotesEnd < startIndex) {
      continue;
    }
    if (quotesStart > startIndex) {
      return null;
    }
    if (startIndex == quotesStart && endIndex == quotesEnd) {
      return null;
    }
    let quotesContentStart = quotesStart + 1;
    let quotesContentEnd = quotesEnd - 1;
    if (startIndex == quotesContentStart && endIndex == quotesContentEnd) {
      return getResult(quotesStart, quotesEnd, text, "quotes");
    }
    if (startIndex > quotesStart && endIndex < quotesEnd) {
      return getResult(quotesContentStart, quotesContentEnd, text, "quotes");
    }
  }
  return null;
}

function expandToXMLNode(text, start, end) {
  let tagProperties = getTagProperties(text.substring(start, end));
  let tagName;
  if (tagProperties) {
    tagName = tagProperties["name"];
    if (tagProperties["type"] == "closing") {
      let stringStartToTagStart = text.substring(0, start);
      let openingTagPosition = findTag(stringStartToTagStart, "backward", tagName);
      if (openingTagPosition) {
        return getResult(openingTagPosition["start"], end, text, "complete_node");
      }
    } else if (tagProperties["type"] == "opening") {
      if (!isTextCloseTag(text.substring(start, end), tagName)) {
        let stringNodeEndToStringEnd = text.substring(end, text.length);
        let closingTagPosition = findTag(stringNodeEndToStringEnd, "forward", tagName);
        if (closingTagPosition) {
          return getResult(start, end + closingTagPosition["end"], text, "complete_node");
        }
      }
    }
  }
  let isWithinTagResult = isWithinTag(text, start, end);
  if (isWithinTagResult) {
    let inner_start = isWithinTagResult["start"] + 1;
    let inner_end = isWithinTagResult["end"] - 1;
    if (start == inner_start && end == inner_end) {
      return getResult(isWithinTagResult["start"], isWithinTagResult["end"], text, "complete_node");
    } else {
      return getResult(inner_start, inner_end, text, "inner_node");
    }
  }
  let stringStartToSelectionStart = text.substring(0, start);
  let parent_opening_tag = findTag(stringStartToSelectionStart, "backward");
  let newStart = 0, newEnd = 0;
  if (parent_opening_tag) {
    let stringNodeEndToStringEnd = text.substring(parent_opening_tag["end"], text.length);
    let closingTagPosition = findTag(stringNodeEndToStringEnd, "forward", parent_opening_tag["name"]);
    if (closingTagPosition) {
      newStart = parent_opening_tag["end"];
      newEnd = parent_opening_tag["end"] + closingTagPosition["start"];
    }
    if (newStart == start && newEnd == end) {
      newStart = parent_opening_tag["start"];
      newEnd = parent_opening_tag["end"] + closingTagPosition["end"];
    }
    return getResult(newStart, newEnd, text, "parent_node_content");
  }
  return null;
}
function isWithinTag(text, startIndex, endIndex) {
  let openingRe = /</;
  let closingRe = />/;
  let searchIndex = startIndex - 1;
  let newStartIndex = 0;
  while (true) {
    if (searchIndex < 0) {
      return false;
    }
    let char = text.substring(searchIndex, searchIndex + 1);
    if (openingRe.test(char)) {
      newStartIndex = searchIndex;
      break;
    }
    if (closingRe.test(char)) {
      return false;
    }
    searchIndex -= 1;
  }
  searchIndex = endIndex;
  while (true) {
    if (searchIndex > text.length - 1) {
      return false;
    }
    let char = text.substring(searchIndex, searchIndex + 1);
    if (closingRe.test(char)) {
      return { start: newStartIndex, end: searchIndex + 1 };
    }
    if (openingRe.test(char)) {
      return false;
    }
    searchIndex += 1;
  }
}
function getTagProperties(text) {
  text = text.replace(/\s\s+/g, " ").trim();
  var regex = /<\s*(\/?)\s*([^\s\/]*)\s*(?:.*?)(\/?)\s*>/;
  var tagName, tag_type;
  let void_elements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
  var result = regex.exec(text);
  if (!result) {
    return null;
  }
  tagName = result[2];
  if (result[1]) {
    tag_type = "closing";
  } else if (result[3]) {
    tag_type = "self_closing";
  } else if (void_elements.indexOf(tagName) !== -1) {
    tag_type = "self_closing";
  } else {
    tag_type = "opening";
  }
  return { name: tagName, type: tag_type };
}
function findTag(text, direction, tagName = "") {
  let regexString = "<s*[\\s\\S]+?>|</s*s*>";
  if (tagName) {
    regexString = "<s*" + tagName + "[\\s\\S]+?>|</s*" + tagName + "s*>";
  }
  let regex = new RegExp(regexString, "g");
  let targetTagType = direction == "forward" ? "closing" : "opening";
  let targetTagTypeCounterpart = direction == "forward" ? "opening" : "closing";
  let symbolStack = [];
  var tArr = [];
  var r;
  while ((r = regex.exec(text)) !== null) {
    let tagName2 = r[0];
    let start = r.index;
    let end = regex.lastIndex;
    tArr.push({
      name: tagName2,
      start,
      end
    });
  }
  if (direction == "backward") {
    tArr.reverse();
  }
  var result = null;
  tArr.forEach((value) => {
    let tag_string = value.name;
    if (result) {
      return;
    }
    if (tag_string.includes("<!--") || tag_string.includes("<![")) {
      return;
    }
    let tag_type = getTagProperties(tag_string)["type"];
    if (tag_type == targetTagType) {
      if (symbolStack.length === 0) {
        result = {
          start: value.start,
          end: value.end,
          name: getTagProperties(tag_string)["name"]
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
function isTextCloseTag(text, tagName = "") {
  let regexString = "<s*" + tagName + ".*?>|</s*" + tagName + "s*>";
  let regex = new RegExp(regexString, "g");
  let targetTagType = "closing";
  let targetTagTypeCounterpart = "opening";
  let symbolStack = [];
  var tArr = [];
  var r;
  while ((r = regex.exec(text)) !== null) {
    let tagName2 = r[0];
    let start = r.index;
    let end = regex.lastIndex;
    tArr.push({ name: tagName2, start, end });
  }
  tArr.forEach((value) => {
    let tag_string = value.name;
    if (tag_string.indexOf("<!--") === 0 || tag_string.indexOf("<![") === 0) {
      return;
    }
    let tag_type = getTagProperties(tag_string)["type"];
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
  return expandToRegexSet(text, startIndex, endIndex, regex, "word");
}

function expandToSemanticUnit(text, startIndex, endIndex) {
  const symbols = "([{)]}";
  const breakSymbols = ":|,;=&|\n\r";
  const lookBackBreakSymbols = breakSymbols + "([{";
  const lookForwardBreakSymbols = breakSymbols + ")]}";
  const symbolsRe = new RegExp(`[${escapeRegExp(symbols)}${escapeRegExp(breakSymbols)}]`);
  const counterparts = {
    "(": ")",
    "{": "}",
    "[": "]",
    ")": "(",
    "}": "{",
    "]": "["
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
  if (s.charAt(0) == ">") {
    if (text.substring(newStartIndex - 1, newStartIndex) == "=") {
      newStartIndex = newStartIndex - 1;
    }
  }
  return getResult(newStartIndex, newEndIndex, text, "semantic_unit");
}

function expandToSymbols(text, startIndex, endIndex) {
  const breakSymbols = [";", ","];
  const beforeBreak = ["}", "]", ")"];
  if (breakSymbols.includes(text.substring(endIndex, endIndex + 1)) && beforeBreak.includes(text.substring(endIndex - 1, endIndex))) {
    return null;
  }
  const openingSymbols = "([{";
  const closingSymbols = ")]}";
  const symbolsRegex = /[\(\[\{\)\]\}]/;
  const symbolsRegexGlobal = /[\(\[\{\)\]\}]/g;
  const quotesRegex = /(['\"])(?:\\.|.)*?\1/g;
  let quotesBlacklist = {};
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
    "(": ")",
    "{": "}",
    "[": "]",
    ")": "(",
    "}": "{",
    "]": "["
  };
  let selectionString = text.substring(startIndex, endIndex);
  let selectionQuotes = selectionString.match(symbolsRegexGlobal) || [];
  let backwardSymbolsStack = [];
  let forwardSymbolsStack = [];
  if (selectionQuotes.length != 0) {
    let inspect_index = 0;
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
    selectionQuotes.forEach((item) => {
      if (openingSymbols.indexOf(item) !== -1) {
        forwardSymbolsStack.push(item);
      } else if (closingSymbols.indexOf(item) !== -1) {
        backwardSymbolsStack.push(item);
      }
    });
  }
  let search_index = startIndex - 1;
  let symbolsStart = 0, symbolsEnd = 0;
  var symbol;
  while (true) {
    if (search_index < 0) {
      return null;
    }
    if (quotesBlacklist[search_index]) {
      search_index -= 1;
      continue;
    }
    let char = text.substring(search_index, search_index + 1);
    let r2 = symbolsRegex.exec(char);
    if (r2) {
      symbol = r2[0];
      if (openingSymbols.indexOf(symbol) !== -1 && backwardSymbolsStack.length == 0) {
        symbolsStart = search_index + 1;
        break;
      }
      if (backwardSymbolsStack.length > 0 && backwardSymbolsStack[backwardSymbolsStack.length - 1] === counterparts[symbol]) {
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
  while (true) {
    if (quotesBlacklist[search_index]) {
      search_index += 1;
      continue;
    }
    let character = text.substring(search_index, search_index + 1);
    let result = symbol_pair_regex.exec(character);
    if (result) {
      symbol = result[0];
      if (forwardSymbolsStack[forwardSymbolsStack.length - 1] == counterparts[symbol]) {
        forwardSymbolsStack.pop();
      } else {
        forwardSymbolsStack.push(symbol);
      }
      if (forwardSymbolsStack.length == 0) {
        symbolsEnd = search_index;
        break;
      }
    }
    if (search_index == text.length) {
      return;
    }
    search_index += 1;
  }
  if (startIndex == symbolsStart && endIndex == symbolsEnd) {
    return getResult(symbolsStart - 1, symbolsEnd + 1, text, "symbol");
  } else {
    let line = getLine(text, startIndex, endIndex);
    let lineText = text.substring(line.start, line.end);
    let firstLine = lineText.split("\n");
    let currentSelectedFirstLine = selectionString.split("\n");
    if (currentSelectedFirstLine.length) {
      currentSelectedFirstLine = currentSelectedFirstLine[0].trim();
    }
    if (firstLine.length) {
      firstLine = firstLine[0].trim();
      if (/^\w+:.*{$/.test(firstLine) && firstLine !== currentSelectedFirstLine) {
        return null;
      }
      if (/^\w+?[\s+]?\w+[\s+]?=[\s+]?{/.test(firstLine) && firstLine !== currentSelectedFirstLine) {
        return null;
      }
    }
    return getResult(symbolsStart, symbolsEnd, text, "symbol");
  }
}

function expandToLine(text, startIndex, endIndex) {
  const lineReg = /\n/;
  const spacesAndTabsRe = /(\s|\t)*/;
  var newStartIndex = 0, newEndIndex = 0;
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
  var s = text.substring(newStartIndex, newEndIndex);
  var r = spacesAndTabsRe.exec(s);
  if (r && r[0].length <= startIndex) {
    newStartIndex += r[0].length;
  }
  const lineEndingChars = [";", ","];
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
  return getResult(newStartIndex, newEndIndex, text, "line");
}

function expandToBackticks(text, startIndex, endIndex) {
  var quotesRegex = /([\`])(?:[\w\s\S])*?\1/g;
  var r;
  while ((r = quotesRegex.exec(text)) !== null) {
    let quotesStart = r.index;
    let quotesEnd = quotesRegex.lastIndex;
    if (quotesEnd < startIndex) {
      continue;
    }
    if (quotesStart > startIndex) {
      return null;
    }
    if (startIndex == quotesStart && endIndex == quotesEnd) {
      return null;
    }
    let quotesContentStart = quotesStart + 1;
    let quotesContentEnd = quotesEnd - 1;
    if (startIndex == quotesContentStart && endIndex == quotesContentEnd) {
      return getResult(quotesStart, quotesEnd, text, "backticks");
    }
    if (startIndex > quotesStart && endIndex < quotesEnd) {
      return getResult(quotesContentStart, quotesContentEnd, text, "backticks");
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
      expandStack.push("semantic_unit");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToBackticks(text, start, end);
    if (result) {
      expandStack.push("backticks");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSymbols(text, start, end);
    if (result) {
      expandStack.push("symbols");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToLine(text, start, end);
    if (result) {
      expandStack.push("line");
      result["expandStack"] = expandStack;
      return result;
    }
    return null;
  }
  expandAgainsLine(text, start, end, data) {
    let expandStack = [];
    let result = null;
    result = expandToWord(text, start, end);
    if (result) {
      expandStack.push("word");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToQuotes(text, start, end);
    if (result) {
      expandStack.push("quotes");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToBackticks(text, start, end);
    if (result) {
      expandStack.push("backticks");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSemanticUnit(text, start, end);
    if (result) {
      expandStack.push("semantic_unit");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSymbols(text, start, end);
    if (result) {
      expandStack.push("symbols");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToLine(text, start, end);
    if (result) {
      expandStack.push("line");
      result["expandStack"] = expandStack;
      return result;
    }
    return null;
  }
  expandAgainsString(text, start, end) {
    let expandStack = [];
    let result = expandToSemanticUnit(text, start, end);
    if (result) {
      expandStack.push("semantic_unit");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSymbols(text, start, end);
    if (result) {
      expandStack.push("symbols");
      result["expandStack"] = expandStack;
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
    if (isInsideTag("script", text, start, end)) {
      const jsExpander = new JavascriptExpander(this.editor);
      const expand = jsExpander.expand(text, start, end, data);
      if (expand) {
        return expand;
      }
    }
    if (isInsideTag("style", text, start, end)) {
      const jsExpander = new JavascriptExpander(this.editor);
      const expand = jsExpander.expand(text, start, end, data);
      if (expand) {
        return expand;
      }
    }
    result = expandToWord(text, start, end);
    if (result) {
      expandStack.push("word");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToQuotes(text, start, end);
    if (result) {
      expandStack.push("quotes");
      result["expandStack"] = expandStack;
      return result;
    }
    expandStack.push("xml_node");
    result = expandToXMLNode(text, start, end);
    if (result) {
      result["expandStack"] = expandStack;
      return result;
    }
    return null;
  }
}

const indentReg = /^(\s*)/;
function empty_line(text, line) {
  return text.substring(line.start, line.end).trim() === "";
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
    if (!(indent <= beforeIndent) && !empty_line(text, beforeLine)) {
      break;
    }
    if (!empty_line(text, beforeLine) && indent == beforeIndent) {
      start = beforeLine.start;
    }
  }
  let afterLine = line;
  while (true) {
    let pos = afterLine.end + 1;
    if (pos >= text.length) {
      break;
    }
    afterLine = getLine(text, pos, pos);
    let afterIndent = getIndent$1(text, afterLine);
    if (!(indent <= afterIndent) && !empty_line(text, afterLine)) {
      break;
    }
    if (!empty_line(text, afterLine)) {
      end = afterLine.end;
    }
  }
  return getResult(start, end, text, "indent");
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
      expandStack.push("line_no_indent");
      result["expandStack"] = expandStack;
      return result;
    }
    result = this.expandOverLineContinuation(text, start, end);
    if (result) {
      expandStack.push("line_continuation");
      result["expandStack"] = expandStack;
      return result;
    }
    result = this.expandPythonBlockFromStart(text, start, end);
    if (result) {
      expandStack.push("py_block_start");
      result["expandStack"] = expandStack;
      return result;
    }
    result = this.pyExpandToIndent(text, start, end);
    if (result) {
      expandStack.push("py_indent");
      result["expandStack"] = expandStack;
      return result;
    }
    if (result) {
      result["expandStack"] = expandStack;
      return result;
    }
    return null;
  }
  expandLineWithoutIndent(text, start, end) {
    const line = getLine(text, start, end);
    const indent = getIndent$1(text, line);
    let lstart = Math.min(start, line.start + indent);
    let lend = Math.max(end, line.end);
    if (lstart !== start || lend !== end) {
      return getResult(lstart, lend, text, "line_no_indent");
    }
    return null;
  }
  expandOverLineContinuation(text, start, end) {
    if (text.substring(end - 1, end) !== "\\") {
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
    return getResult(start, end, text, "line_continuation");
  }
  expandPythonBlockFromStart(text, start, end) {
    if (text.substring(end - 1, end) !== ":") {
      return null;
    }
    const result = expandToIndent(text, end + 1, end + 1);
    if (result) {
      const line = this.editor.getLineRangeForRange(new Range(start, end));
      const indent = getIndent$1(text, line);
      start = line.start + indent;
      end = result.end;
      return getResult(start, end, text, "py_block_start");
    }
    return null;
  }
  pyExpandToIndent(text, start, end) {
    const line = getLine(text, start, end);
    const indent = getIndent$1(text, line);
    if (indent == 0) {
      return null;
    }
    let result = expandToIndent(text, start - indent, end);
    if (!result) {
      return null;
    }
    let pos = result.start + indent - 1;
    while (true) {
      if (pos < 0) {
        break;
      }
      let beforeLine = getLine(text, pos, pos);
      let beforeIndent = getIndent$1(text, beforeLine);
      if (!empty_line(text, beforeLine) && beforeIndent < indent) {
        start = beforeLine.start;
        end = result.end;
        return getResult(start + beforeIndent, end, text, "py_indent");
      }
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
    if (isInsideTag("script", text, start, end)) {
      const jsExpander = new JavascriptExpander(this.editor);
      const expand = jsExpander.expand(text, start, end, data);
      if (expand) {
        return expand;
      }
    }
    if (isInsideTag("style", text, start, end)) {
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
    result = expandToWord(text, start, end);
    if (result) {
      expandStack.push("word");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToQuotes(text, start, end);
    if (result) {
      expandStack.push("quotes");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSemanticUnit(text, start, end);
    if (result) {
      expandStack.push("semantic_unit");
      result["expandStack"] = expandStack;
      return result;
    }
    result = this.expandToFunction(text, start, end);
    if (result) {
      expandStack.push("function");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSymbols(text, start, end);
    if (result) {
      expandStack.push("symbols");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToLine(text, start, end);
    if (result) {
      expandStack.push("line");
      result["expandStack"] = expandStack;
      return result;
    }
    return null;
  }
  expandAgainsLine(text, start, end, data) {
    let expandStack = [];
    let result = null;
    result = expandToWord(text, start, end);
    if (result) {
      expandStack.push("word");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToQuotes(text, start, end);
    if (result) {
      expandStack.push("quotes");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSemanticUnit(text, start, end);
    if (result) {
      expandStack.push("semantic_unit");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSymbols(text, start, end);
    if (result) {
      expandStack.push("symbols");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToLine(text, start, end);
    if (result) {
      expandStack.push("line");
      result["expandStack"] = expandStack;
      return result;
    }
    return null;
  }
  expandAgainsString(text, start, end) {
    let expandStack = [];
    let result = expandToSemanticUnit(text, start, end);
    if (result) {
      expandStack.push("semantic_unit");
      result["expandStack"] = expandStack;
      return result;
    }
    result = expandToSymbols(text, start, end);
    if (result) {
      expandStack.push("symbols");
      result["expandStack"] = expandStack;
    }
    return result;
  }
  expandToFunction(text, start, end) {
    const currentSelection = text.substring(start, end);
    if (currentSelection.trim().startsWith("{")) {
      const line = this.editor.getLineRangeForRange(new Range(start, end));
      const prevLine = this.editor.getLineRangeForRange(new Range(line.start - 2, line.start - 1));
      const prevLineText = text.substring(prevLine.start, prevLine.end);
      if (/^(?:\w+).+function.+\w+\(.*\)/.test(prevLineText.trim()) || /\s*class\s+.*/.test(prevLineText.trim())) {
        let indent = getIndent(text, prevLine);
        return getResult(prevLine.start + indent, end, text, "function");
      }
    }
    return null;
  }
}

const expandHistory = new Map();
class SelectionExpander {
  getExtension(editor) {
    let filePath = editor.document.path;
    let extension = nova.path.extname(filePath).substring(1);
    if (filePath.endsWith(".blade.php")) {
      extension = "html";
    } else if (extension == "vue") {
      extension = "html";
    }
    return extension;
  }
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
        case "html":
          exp = new HTMLExpander(editor);
          break;
        case "php":
          exp = new PHPExpander(editor);
          break;
        case "py":
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
          end: lineRange.end - 1 >= lineRange.start ? lineRange.end - 1 : lineRange.end
        },
        selectedText: editor.getTextInRange(new Range(start, end))
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
            index
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
  shrink(editor) {
    const path = editor.document.path;
    const history = this.getHistory(path);
    if (!history || !history.steps.length) {
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
  getHistoryLastSetp(path) {
    const history = this.getHistory(path);
    if (!history.steps || !history.steps[history.steps.length - 1]) {
      return false;
    }
    const steps = history.steps[history.steps.length - 1];
    if (steps && steps.length) {
      const lastStep = steps[steps.length - 1];
      if ((lastStep == null ? void 0 : lastStep.start) && (lastStep == null ? void 0 : lastStep.end)) {
        return lastStep;
      }
    }
    return false;
  }
  allowHistoryStep(path, range) {
    const lastStep = this.getHistoryLastSetp(path);
    if (!lastStep) {
      return true;
    }
    if (lastStep.start === range.start && lastStep.end === range.end) {
      return false;
    }
    return true;
  }
  maybeResetHistory(editor) {
    const path = editor.document.path;
    const history = expandHistory.get(path);
    const selected = editor.selectedRanges;
    if (!history) {
      return;
    }
    if (selected && history.lastSelected && selected[0].start == selected[0].end) {
      this.resetHistory(editor);
    }
    return;
  }
  resetHistory(editor) {
    const path = editor.document.path;
    if (expandHistory.has(path)) {
      expandHistory.set(path, {
        steps: [],
        selectedRanges: [],
        lastSelected: null
      });
      if (nova.inDevMode()) {
        console.log("reset selection data");
      }
    }
  }
}

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
Object.defineProperty(exports,"__esModule",{value:true});exports.bodyRegExps={xml:/&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,html4:/&(?:nbsp|iexcl|cent|pound|curren|yen|brvbar|sect|uml|copy|ordf|laquo|not|shy|reg|macr|deg|plusmn|sup2|sup3|acute|micro|para|middot|cedil|sup1|ordm|raquo|frac14|frac12|frac34|iquest|Agrave|Aacute|Acirc|Atilde|Auml|Aring|AElig|Ccedil|Egrave|Eacute|Ecirc|Euml|Igrave|Iacute|Icirc|Iuml|ETH|Ntilde|Ograve|Oacute|Ocirc|Otilde|Ouml|times|Oslash|Ugrave|Uacute|Ucirc|Uuml|Yacute|THORN|szlig|agrave|aacute|acirc|atilde|auml|aring|aelig|ccedil|egrave|eacute|ecirc|euml|igrave|iacute|icirc|iuml|eth|ntilde|ograve|oacute|ocirc|otilde|ouml|divide|oslash|ugrave|uacute|ucirc|uuml|yacute|thorn|yuml|quot|amp|lt|gt|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,html5:/&(?:AElig|AMP|Aacute|Acirc|Agrave|Aring|Atilde|Auml|COPY|Ccedil|ETH|Eacute|Ecirc|Egrave|Euml|GT|Iacute|Icirc|Igrave|Iuml|LT|Ntilde|Oacute|Ocirc|Ograve|Oslash|Otilde|Ouml|QUOT|REG|THORN|Uacute|Ucirc|Ugrave|Uuml|Yacute|aacute|acirc|acute|aelig|agrave|amp|aring|atilde|auml|brvbar|ccedil|cedil|cent|copy|curren|deg|divide|eacute|ecirc|egrave|eth|euml|frac12|frac14|frac34|gt|iacute|icirc|iexcl|igrave|iquest|iuml|laquo|lt|macr|micro|middot|nbsp|not|ntilde|oacute|ocirc|ograve|ordf|ordm|oslash|otilde|ouml|para|plusmn|pound|quot|raquo|reg|sect|shy|sup1|sup2|sup3|szlig|thorn|times|uacute|ucirc|ugrave|uml|uuml|yacute|yen|yuml|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g};exports.namedReferences={xml:{entities:{"&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&amp;":"&"},characters:{"<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;","&":"&amp;"}},html4:{entities:{"&apos;":"'","&nbsp":" ","&nbsp;":" ","&iexcl":"¡","&iexcl;":"¡","&cent":"¢","&cent;":"¢","&pound":"£","&pound;":"£","&curren":"¤","&curren;":"¤","&yen":"¥","&yen;":"¥","&brvbar":"¦","&brvbar;":"¦","&sect":"§","&sect;":"§","&uml":"¨","&uml;":"¨","&copy":"©","&copy;":"©","&ordf":"ª","&ordf;":"ª","&laquo":"«","&laquo;":"«","&not":"¬","&not;":"¬","&shy":"­","&shy;":"­","&reg":"®","&reg;":"®","&macr":"¯","&macr;":"¯","&deg":"°","&deg;":"°","&plusmn":"±","&plusmn;":"±","&sup2":"²","&sup2;":"²","&sup3":"³","&sup3;":"³","&acute":"´","&acute;":"´","&micro":"µ","&micro;":"µ","&para":"¶","&para;":"¶","&middot":"·","&middot;":"·","&cedil":"¸","&cedil;":"¸","&sup1":"¹","&sup1;":"¹","&ordm":"º","&ordm;":"º","&raquo":"»","&raquo;":"»","&frac14":"¼","&frac14;":"¼","&frac12":"½","&frac12;":"½","&frac34":"¾","&frac34;":"¾","&iquest":"¿","&iquest;":"¿","&Agrave":"À","&Agrave;":"À","&Aacute":"Á","&Aacute;":"Á","&Acirc":"Â","&Acirc;":"Â","&Atilde":"Ã","&Atilde;":"Ã","&Auml":"Ä","&Auml;":"Ä","&Aring":"Å","&Aring;":"Å","&AElig":"Æ","&AElig;":"Æ","&Ccedil":"Ç","&Ccedil;":"Ç","&Egrave":"È","&Egrave;":"È","&Eacute":"É","&Eacute;":"É","&Ecirc":"Ê","&Ecirc;":"Ê","&Euml":"Ë","&Euml;":"Ë","&Igrave":"Ì","&Igrave;":"Ì","&Iacute":"Í","&Iacute;":"Í","&Icirc":"Î","&Icirc;":"Î","&Iuml":"Ï","&Iuml;":"Ï","&ETH":"Ð","&ETH;":"Ð","&Ntilde":"Ñ","&Ntilde;":"Ñ","&Ograve":"Ò","&Ograve;":"Ò","&Oacute":"Ó","&Oacute;":"Ó","&Ocirc":"Ô","&Ocirc;":"Ô","&Otilde":"Õ","&Otilde;":"Õ","&Ouml":"Ö","&Ouml;":"Ö","&times":"×","&times;":"×","&Oslash":"Ø","&Oslash;":"Ø","&Ugrave":"Ù","&Ugrave;":"Ù","&Uacute":"Ú","&Uacute;":"Ú","&Ucirc":"Û","&Ucirc;":"Û","&Uuml":"Ü","&Uuml;":"Ü","&Yacute":"Ý","&Yacute;":"Ý","&THORN":"Þ","&THORN;":"Þ","&szlig":"ß","&szlig;":"ß","&agrave":"à","&agrave;":"à","&aacute":"á","&aacute;":"á","&acirc":"â","&acirc;":"â","&atilde":"ã","&atilde;":"ã","&auml":"ä","&auml;":"ä","&aring":"å","&aring;":"å","&aelig":"æ","&aelig;":"æ","&ccedil":"ç","&ccedil;":"ç","&egrave":"è","&egrave;":"è","&eacute":"é","&eacute;":"é","&ecirc":"ê","&ecirc;":"ê","&euml":"ë","&euml;":"ë","&igrave":"ì","&igrave;":"ì","&iacute":"í","&iacute;":"í","&icirc":"î","&icirc;":"î","&iuml":"ï","&iuml;":"ï","&eth":"ð","&eth;":"ð","&ntilde":"ñ","&ntilde;":"ñ","&ograve":"ò","&ograve;":"ò","&oacute":"ó","&oacute;":"ó","&ocirc":"ô","&ocirc;":"ô","&otilde":"õ","&otilde;":"õ","&ouml":"ö","&ouml;":"ö","&divide":"÷","&divide;":"÷","&oslash":"ø","&oslash;":"ø","&ugrave":"ù","&ugrave;":"ù","&uacute":"ú","&uacute;":"ú","&ucirc":"û","&ucirc;":"û","&uuml":"ü","&uuml;":"ü","&yacute":"ý","&yacute;":"ý","&thorn":"þ","&thorn;":"þ","&yuml":"ÿ","&yuml;":"ÿ","&quot":'"',"&quot;":'"',"&amp":"&","&amp;":"&","&lt":"<","&lt;":"<","&gt":">","&gt;":">","&OElig;":"Œ","&oelig;":"œ","&Scaron;":"Š","&scaron;":"š","&Yuml;":"Ÿ","&circ;":"ˆ","&tilde;":"˜","&ensp;":" ","&emsp;":" ","&thinsp;":" ","&zwnj;":"‌","&zwj;":"‍","&lrm;":"‎","&rlm;":"‏","&ndash;":"–","&mdash;":"—","&lsquo;":"‘","&rsquo;":"’","&sbquo;":"‚","&ldquo;":"“","&rdquo;":"”","&bdquo;":"„","&dagger;":"†","&Dagger;":"‡","&permil;":"‰","&lsaquo;":"‹","&rsaquo;":"›","&euro;":"€","&fnof;":"ƒ","&Alpha;":"Α","&Beta;":"Β","&Gamma;":"Γ","&Delta;":"Δ","&Epsilon;":"Ε","&Zeta;":"Ζ","&Eta;":"Η","&Theta;":"Θ","&Iota;":"Ι","&Kappa;":"Κ","&Lambda;":"Λ","&Mu;":"Μ","&Nu;":"Ν","&Xi;":"Ξ","&Omicron;":"Ο","&Pi;":"Π","&Rho;":"Ρ","&Sigma;":"Σ","&Tau;":"Τ","&Upsilon;":"Υ","&Phi;":"Φ","&Chi;":"Χ","&Psi;":"Ψ","&Omega;":"Ω","&alpha;":"α","&beta;":"β","&gamma;":"γ","&delta;":"δ","&epsilon;":"ε","&zeta;":"ζ","&eta;":"η","&theta;":"θ","&iota;":"ι","&kappa;":"κ","&lambda;":"λ","&mu;":"μ","&nu;":"ν","&xi;":"ξ","&omicron;":"ο","&pi;":"π","&rho;":"ρ","&sigmaf;":"ς","&sigma;":"σ","&tau;":"τ","&upsilon;":"υ","&phi;":"φ","&chi;":"χ","&psi;":"ψ","&omega;":"ω","&thetasym;":"ϑ","&upsih;":"ϒ","&piv;":"ϖ","&bull;":"•","&hellip;":"…","&prime;":"′","&Prime;":"″","&oline;":"‾","&frasl;":"⁄","&weierp;":"℘","&image;":"ℑ","&real;":"ℜ","&trade;":"™","&alefsym;":"ℵ","&larr;":"←","&uarr;":"↑","&rarr;":"→","&darr;":"↓","&harr;":"↔","&crarr;":"↵","&lArr;":"⇐","&uArr;":"⇑","&rArr;":"⇒","&dArr;":"⇓","&hArr;":"⇔","&forall;":"∀","&part;":"∂","&exist;":"∃","&empty;":"∅","&nabla;":"∇","&isin;":"∈","&notin;":"∉","&ni;":"∋","&prod;":"∏","&sum;":"∑","&minus;":"−","&lowast;":"∗","&radic;":"√","&prop;":"∝","&infin;":"∞","&ang;":"∠","&and;":"∧","&or;":"∨","&cap;":"∩","&cup;":"∪","&int;":"∫","&there4;":"∴","&sim;":"∼","&cong;":"≅","&asymp;":"≈","&ne;":"≠","&equiv;":"≡","&le;":"≤","&ge;":"≥","&sub;":"⊂","&sup;":"⊃","&nsub;":"⊄","&sube;":"⊆","&supe;":"⊇","&oplus;":"⊕","&otimes;":"⊗","&perp;":"⊥","&sdot;":"⋅","&lceil;":"⌈","&rceil;":"⌉","&lfloor;":"⌊","&rfloor;":"⌋","&lang;":"〈","&rang;":"〉","&loz;":"◊","&spades;":"♠","&clubs;":"♣","&hearts;":"♥","&diams;":"♦"},characters:{"'":"&apos;"," ":"&nbsp;","¡":"&iexcl;","¢":"&cent;","£":"&pound;","¤":"&curren;","¥":"&yen;","¦":"&brvbar;","§":"&sect;","¨":"&uml;","©":"&copy;","ª":"&ordf;","«":"&laquo;","¬":"&not;","­":"&shy;","®":"&reg;","¯":"&macr;","°":"&deg;","±":"&plusmn;","²":"&sup2;","³":"&sup3;","´":"&acute;","µ":"&micro;","¶":"&para;","·":"&middot;","¸":"&cedil;","¹":"&sup1;","º":"&ordm;","»":"&raquo;","¼":"&frac14;","½":"&frac12;","¾":"&frac34;","¿":"&iquest;","À":"&Agrave;","Á":"&Aacute;","Â":"&Acirc;","Ã":"&Atilde;","Ä":"&Auml;","Å":"&Aring;","Æ":"&AElig;","Ç":"&Ccedil;","È":"&Egrave;","É":"&Eacute;","Ê":"&Ecirc;","Ë":"&Euml;","Ì":"&Igrave;","Í":"&Iacute;","Î":"&Icirc;","Ï":"&Iuml;","Ð":"&ETH;","Ñ":"&Ntilde;","Ò":"&Ograve;","Ó":"&Oacute;","Ô":"&Ocirc;","Õ":"&Otilde;","Ö":"&Ouml;","×":"&times;","Ø":"&Oslash;","Ù":"&Ugrave;","Ú":"&Uacute;","Û":"&Ucirc;","Ü":"&Uuml;","Ý":"&Yacute;","Þ":"&THORN;","ß":"&szlig;","à":"&agrave;","á":"&aacute;","â":"&acirc;","ã":"&atilde;","ä":"&auml;","å":"&aring;","æ":"&aelig;","ç":"&ccedil;","è":"&egrave;","é":"&eacute;","ê":"&ecirc;","ë":"&euml;","ì":"&igrave;","í":"&iacute;","î":"&icirc;","ï":"&iuml;","ð":"&eth;","ñ":"&ntilde;","ò":"&ograve;","ó":"&oacute;","ô":"&ocirc;","õ":"&otilde;","ö":"&ouml;","÷":"&divide;","ø":"&oslash;","ù":"&ugrave;","ú":"&uacute;","û":"&ucirc;","ü":"&uuml;","ý":"&yacute;","þ":"&thorn;","ÿ":"&yuml;",'"':"&quot;","&":"&amp;","<":"&lt;",">":"&gt;","Œ":"&OElig;","œ":"&oelig;","Š":"&Scaron;","š":"&scaron;","Ÿ":"&Yuml;","ˆ":"&circ;","˜":"&tilde;"," ":"&ensp;"," ":"&emsp;"," ":"&thinsp;","‌":"&zwnj;","‍":"&zwj;","‎":"&lrm;","‏":"&rlm;","–":"&ndash;","—":"&mdash;","‘":"&lsquo;","’":"&rsquo;","‚":"&sbquo;","“":"&ldquo;","”":"&rdquo;","„":"&bdquo;","†":"&dagger;","‡":"&Dagger;","‰":"&permil;","‹":"&lsaquo;","›":"&rsaquo;","€":"&euro;","ƒ":"&fnof;","Α":"&Alpha;","Β":"&Beta;","Γ":"&Gamma;","Δ":"&Delta;","Ε":"&Epsilon;","Ζ":"&Zeta;","Η":"&Eta;","Θ":"&Theta;","Ι":"&Iota;","Κ":"&Kappa;","Λ":"&Lambda;","Μ":"&Mu;","Ν":"&Nu;","Ξ":"&Xi;","Ο":"&Omicron;","Π":"&Pi;","Ρ":"&Rho;","Σ":"&Sigma;","Τ":"&Tau;","Υ":"&Upsilon;","Φ":"&Phi;","Χ":"&Chi;","Ψ":"&Psi;","Ω":"&Omega;","α":"&alpha;","β":"&beta;","γ":"&gamma;","δ":"&delta;","ε":"&epsilon;","ζ":"&zeta;","η":"&eta;","θ":"&theta;","ι":"&iota;","κ":"&kappa;","λ":"&lambda;","μ":"&mu;","ν":"&nu;","ξ":"&xi;","ο":"&omicron;","π":"&pi;","ρ":"&rho;","ς":"&sigmaf;","σ":"&sigma;","τ":"&tau;","υ":"&upsilon;","φ":"&phi;","χ":"&chi;","ψ":"&psi;","ω":"&omega;","ϑ":"&thetasym;","ϒ":"&upsih;","ϖ":"&piv;","•":"&bull;","…":"&hellip;","′":"&prime;","″":"&Prime;","‾":"&oline;","⁄":"&frasl;","℘":"&weierp;","ℑ":"&image;","ℜ":"&real;","™":"&trade;","ℵ":"&alefsym;","←":"&larr;","↑":"&uarr;","→":"&rarr;","↓":"&darr;","↔":"&harr;","↵":"&crarr;","⇐":"&lArr;","⇑":"&uArr;","⇒":"&rArr;","⇓":"&dArr;","⇔":"&hArr;","∀":"&forall;","∂":"&part;","∃":"&exist;","∅":"&empty;","∇":"&nabla;","∈":"&isin;","∉":"&notin;","∋":"&ni;","∏":"&prod;","∑":"&sum;","−":"&minus;","∗":"&lowast;","√":"&radic;","∝":"&prop;","∞":"&infin;","∠":"&ang;","∧":"&and;","∨":"&or;","∩":"&cap;","∪":"&cup;","∫":"&int;","∴":"&there4;","∼":"&sim;","≅":"&cong;","≈":"&asymp;","≠":"&ne;","≡":"&equiv;","≤":"&le;","≥":"&ge;","⊂":"&sub;","⊃":"&sup;","⊄":"&nsub;","⊆":"&sube;","⊇":"&supe;","⊕":"&oplus;","⊗":"&otimes;","⊥":"&perp;","⋅":"&sdot;","⌈":"&lceil;","⌉":"&rceil;","⌊":"&lfloor;","⌋":"&rfloor;","〈":"&lang;","〉":"&rang;","◊":"&loz;","♠":"&spades;","♣":"&clubs;","♥":"&hearts;","♦":"&diams;"}},html5:{entities:{"&AElig":"Æ","&AElig;":"Æ","&AMP":"&","&AMP;":"&","&Aacute":"Á","&Aacute;":"Á","&Abreve;":"Ă","&Acirc":"Â","&Acirc;":"Â","&Acy;":"А","&Afr;":"𝔄","&Agrave":"À","&Agrave;":"À","&Alpha;":"Α","&Amacr;":"Ā","&And;":"⩓","&Aogon;":"Ą","&Aopf;":"𝔸","&ApplyFunction;":"⁡","&Aring":"Å","&Aring;":"Å","&Ascr;":"𝒜","&Assign;":"≔","&Atilde":"Ã","&Atilde;":"Ã","&Auml":"Ä","&Auml;":"Ä","&Backslash;":"∖","&Barv;":"⫧","&Barwed;":"⌆","&Bcy;":"Б","&Because;":"∵","&Bernoullis;":"ℬ","&Beta;":"Β","&Bfr;":"𝔅","&Bopf;":"𝔹","&Breve;":"˘","&Bscr;":"ℬ","&Bumpeq;":"≎","&CHcy;":"Ч","&COPY":"©","&COPY;":"©","&Cacute;":"Ć","&Cap;":"⋒","&CapitalDifferentialD;":"ⅅ","&Cayleys;":"ℭ","&Ccaron;":"Č","&Ccedil":"Ç","&Ccedil;":"Ç","&Ccirc;":"Ĉ","&Cconint;":"∰","&Cdot;":"Ċ","&Cedilla;":"¸","&CenterDot;":"·","&Cfr;":"ℭ","&Chi;":"Χ","&CircleDot;":"⊙","&CircleMinus;":"⊖","&CirclePlus;":"⊕","&CircleTimes;":"⊗","&ClockwiseContourIntegral;":"∲","&CloseCurlyDoubleQuote;":"”","&CloseCurlyQuote;":"’","&Colon;":"∷","&Colone;":"⩴","&Congruent;":"≡","&Conint;":"∯","&ContourIntegral;":"∮","&Copf;":"ℂ","&Coproduct;":"∐","&CounterClockwiseContourIntegral;":"∳","&Cross;":"⨯","&Cscr;":"𝒞","&Cup;":"⋓","&CupCap;":"≍","&DD;":"ⅅ","&DDotrahd;":"⤑","&DJcy;":"Ђ","&DScy;":"Ѕ","&DZcy;":"Џ","&Dagger;":"‡","&Darr;":"↡","&Dashv;":"⫤","&Dcaron;":"Ď","&Dcy;":"Д","&Del;":"∇","&Delta;":"Δ","&Dfr;":"𝔇","&DiacriticalAcute;":"´","&DiacriticalDot;":"˙","&DiacriticalDoubleAcute;":"˝","&DiacriticalGrave;":"`","&DiacriticalTilde;":"˜","&Diamond;":"⋄","&DifferentialD;":"ⅆ","&Dopf;":"𝔻","&Dot;":"¨","&DotDot;":"⃜","&DotEqual;":"≐","&DoubleContourIntegral;":"∯","&DoubleDot;":"¨","&DoubleDownArrow;":"⇓","&DoubleLeftArrow;":"⇐","&DoubleLeftRightArrow;":"⇔","&DoubleLeftTee;":"⫤","&DoubleLongLeftArrow;":"⟸","&DoubleLongLeftRightArrow;":"⟺","&DoubleLongRightArrow;":"⟹","&DoubleRightArrow;":"⇒","&DoubleRightTee;":"⊨","&DoubleUpArrow;":"⇑","&DoubleUpDownArrow;":"⇕","&DoubleVerticalBar;":"∥","&DownArrow;":"↓","&DownArrowBar;":"⤓","&DownArrowUpArrow;":"⇵","&DownBreve;":"̑","&DownLeftRightVector;":"⥐","&DownLeftTeeVector;":"⥞","&DownLeftVector;":"↽","&DownLeftVectorBar;":"⥖","&DownRightTeeVector;":"⥟","&DownRightVector;":"⇁","&DownRightVectorBar;":"⥗","&DownTee;":"⊤","&DownTeeArrow;":"↧","&Downarrow;":"⇓","&Dscr;":"𝒟","&Dstrok;":"Đ","&ENG;":"Ŋ","&ETH":"Ð","&ETH;":"Ð","&Eacute":"É","&Eacute;":"É","&Ecaron;":"Ě","&Ecirc":"Ê","&Ecirc;":"Ê","&Ecy;":"Э","&Edot;":"Ė","&Efr;":"𝔈","&Egrave":"È","&Egrave;":"È","&Element;":"∈","&Emacr;":"Ē","&EmptySmallSquare;":"◻","&EmptyVerySmallSquare;":"▫","&Eogon;":"Ę","&Eopf;":"𝔼","&Epsilon;":"Ε","&Equal;":"⩵","&EqualTilde;":"≂","&Equilibrium;":"⇌","&Escr;":"ℰ","&Esim;":"⩳","&Eta;":"Η","&Euml":"Ë","&Euml;":"Ë","&Exists;":"∃","&ExponentialE;":"ⅇ","&Fcy;":"Ф","&Ffr;":"𝔉","&FilledSmallSquare;":"◼","&FilledVerySmallSquare;":"▪","&Fopf;":"𝔽","&ForAll;":"∀","&Fouriertrf;":"ℱ","&Fscr;":"ℱ","&GJcy;":"Ѓ","&GT":">","&GT;":">","&Gamma;":"Γ","&Gammad;":"Ϝ","&Gbreve;":"Ğ","&Gcedil;":"Ģ","&Gcirc;":"Ĝ","&Gcy;":"Г","&Gdot;":"Ġ","&Gfr;":"𝔊","&Gg;":"⋙","&Gopf;":"𝔾","&GreaterEqual;":"≥","&GreaterEqualLess;":"⋛","&GreaterFullEqual;":"≧","&GreaterGreater;":"⪢","&GreaterLess;":"≷","&GreaterSlantEqual;":"⩾","&GreaterTilde;":"≳","&Gscr;":"𝒢","&Gt;":"≫","&HARDcy;":"Ъ","&Hacek;":"ˇ","&Hat;":"^","&Hcirc;":"Ĥ","&Hfr;":"ℌ","&HilbertSpace;":"ℋ","&Hopf;":"ℍ","&HorizontalLine;":"─","&Hscr;":"ℋ","&Hstrok;":"Ħ","&HumpDownHump;":"≎","&HumpEqual;":"≏","&IEcy;":"Е","&IJlig;":"Ĳ","&IOcy;":"Ё","&Iacute":"Í","&Iacute;":"Í","&Icirc":"Î","&Icirc;":"Î","&Icy;":"И","&Idot;":"İ","&Ifr;":"ℑ","&Igrave":"Ì","&Igrave;":"Ì","&Im;":"ℑ","&Imacr;":"Ī","&ImaginaryI;":"ⅈ","&Implies;":"⇒","&Int;":"∬","&Integral;":"∫","&Intersection;":"⋂","&InvisibleComma;":"⁣","&InvisibleTimes;":"⁢","&Iogon;":"Į","&Iopf;":"𝕀","&Iota;":"Ι","&Iscr;":"ℐ","&Itilde;":"Ĩ","&Iukcy;":"І","&Iuml":"Ï","&Iuml;":"Ï","&Jcirc;":"Ĵ","&Jcy;":"Й","&Jfr;":"𝔍","&Jopf;":"𝕁","&Jscr;":"𝒥","&Jsercy;":"Ј","&Jukcy;":"Є","&KHcy;":"Х","&KJcy;":"Ќ","&Kappa;":"Κ","&Kcedil;":"Ķ","&Kcy;":"К","&Kfr;":"𝔎","&Kopf;":"𝕂","&Kscr;":"𝒦","&LJcy;":"Љ","&LT":"<","&LT;":"<","&Lacute;":"Ĺ","&Lambda;":"Λ","&Lang;":"⟪","&Laplacetrf;":"ℒ","&Larr;":"↞","&Lcaron;":"Ľ","&Lcedil;":"Ļ","&Lcy;":"Л","&LeftAngleBracket;":"⟨","&LeftArrow;":"←","&LeftArrowBar;":"⇤","&LeftArrowRightArrow;":"⇆","&LeftCeiling;":"⌈","&LeftDoubleBracket;":"⟦","&LeftDownTeeVector;":"⥡","&LeftDownVector;":"⇃","&LeftDownVectorBar;":"⥙","&LeftFloor;":"⌊","&LeftRightArrow;":"↔","&LeftRightVector;":"⥎","&LeftTee;":"⊣","&LeftTeeArrow;":"↤","&LeftTeeVector;":"⥚","&LeftTriangle;":"⊲","&LeftTriangleBar;":"⧏","&LeftTriangleEqual;":"⊴","&LeftUpDownVector;":"⥑","&LeftUpTeeVector;":"⥠","&LeftUpVector;":"↿","&LeftUpVectorBar;":"⥘","&LeftVector;":"↼","&LeftVectorBar;":"⥒","&Leftarrow;":"⇐","&Leftrightarrow;":"⇔","&LessEqualGreater;":"⋚","&LessFullEqual;":"≦","&LessGreater;":"≶","&LessLess;":"⪡","&LessSlantEqual;":"⩽","&LessTilde;":"≲","&Lfr;":"𝔏","&Ll;":"⋘","&Lleftarrow;":"⇚","&Lmidot;":"Ŀ","&LongLeftArrow;":"⟵","&LongLeftRightArrow;":"⟷","&LongRightArrow;":"⟶","&Longleftarrow;":"⟸","&Longleftrightarrow;":"⟺","&Longrightarrow;":"⟹","&Lopf;":"𝕃","&LowerLeftArrow;":"↙","&LowerRightArrow;":"↘","&Lscr;":"ℒ","&Lsh;":"↰","&Lstrok;":"Ł","&Lt;":"≪","&Map;":"⤅","&Mcy;":"М","&MediumSpace;":" ","&Mellintrf;":"ℳ","&Mfr;":"𝔐","&MinusPlus;":"∓","&Mopf;":"𝕄","&Mscr;":"ℳ","&Mu;":"Μ","&NJcy;":"Њ","&Nacute;":"Ń","&Ncaron;":"Ň","&Ncedil;":"Ņ","&Ncy;":"Н","&NegativeMediumSpace;":"​","&NegativeThickSpace;":"​","&NegativeThinSpace;":"​","&NegativeVeryThinSpace;":"​","&NestedGreaterGreater;":"≫","&NestedLessLess;":"≪","&NewLine;":"\n","&Nfr;":"𝔑","&NoBreak;":"⁠","&NonBreakingSpace;":" ","&Nopf;":"ℕ","&Not;":"⫬","&NotCongruent;":"≢","&NotCupCap;":"≭","&NotDoubleVerticalBar;":"∦","&NotElement;":"∉","&NotEqual;":"≠","&NotEqualTilde;":"≂̸","&NotExists;":"∄","&NotGreater;":"≯","&NotGreaterEqual;":"≱","&NotGreaterFullEqual;":"≧̸","&NotGreaterGreater;":"≫̸","&NotGreaterLess;":"≹","&NotGreaterSlantEqual;":"⩾̸","&NotGreaterTilde;":"≵","&NotHumpDownHump;":"≎̸","&NotHumpEqual;":"≏̸","&NotLeftTriangle;":"⋪","&NotLeftTriangleBar;":"⧏̸","&NotLeftTriangleEqual;":"⋬","&NotLess;":"≮","&NotLessEqual;":"≰","&NotLessGreater;":"≸","&NotLessLess;":"≪̸","&NotLessSlantEqual;":"⩽̸","&NotLessTilde;":"≴","&NotNestedGreaterGreater;":"⪢̸","&NotNestedLessLess;":"⪡̸","&NotPrecedes;":"⊀","&NotPrecedesEqual;":"⪯̸","&NotPrecedesSlantEqual;":"⋠","&NotReverseElement;":"∌","&NotRightTriangle;":"⋫","&NotRightTriangleBar;":"⧐̸","&NotRightTriangleEqual;":"⋭","&NotSquareSubset;":"⊏̸","&NotSquareSubsetEqual;":"⋢","&NotSquareSuperset;":"⊐̸","&NotSquareSupersetEqual;":"⋣","&NotSubset;":"⊂⃒","&NotSubsetEqual;":"⊈","&NotSucceeds;":"⊁","&NotSucceedsEqual;":"⪰̸","&NotSucceedsSlantEqual;":"⋡","&NotSucceedsTilde;":"≿̸","&NotSuperset;":"⊃⃒","&NotSupersetEqual;":"⊉","&NotTilde;":"≁","&NotTildeEqual;":"≄","&NotTildeFullEqual;":"≇","&NotTildeTilde;":"≉","&NotVerticalBar;":"∤","&Nscr;":"𝒩","&Ntilde":"Ñ","&Ntilde;":"Ñ","&Nu;":"Ν","&OElig;":"Œ","&Oacute":"Ó","&Oacute;":"Ó","&Ocirc":"Ô","&Ocirc;":"Ô","&Ocy;":"О","&Odblac;":"Ő","&Ofr;":"𝔒","&Ograve":"Ò","&Ograve;":"Ò","&Omacr;":"Ō","&Omega;":"Ω","&Omicron;":"Ο","&Oopf;":"𝕆","&OpenCurlyDoubleQuote;":"“","&OpenCurlyQuote;":"‘","&Or;":"⩔","&Oscr;":"𝒪","&Oslash":"Ø","&Oslash;":"Ø","&Otilde":"Õ","&Otilde;":"Õ","&Otimes;":"⨷","&Ouml":"Ö","&Ouml;":"Ö","&OverBar;":"‾","&OverBrace;":"⏞","&OverBracket;":"⎴","&OverParenthesis;":"⏜","&PartialD;":"∂","&Pcy;":"П","&Pfr;":"𝔓","&Phi;":"Φ","&Pi;":"Π","&PlusMinus;":"±","&Poincareplane;":"ℌ","&Popf;":"ℙ","&Pr;":"⪻","&Precedes;":"≺","&PrecedesEqual;":"⪯","&PrecedesSlantEqual;":"≼","&PrecedesTilde;":"≾","&Prime;":"″","&Product;":"∏","&Proportion;":"∷","&Proportional;":"∝","&Pscr;":"𝒫","&Psi;":"Ψ","&QUOT":'"',"&QUOT;":'"',"&Qfr;":"𝔔","&Qopf;":"ℚ","&Qscr;":"𝒬","&RBarr;":"⤐","&REG":"®","&REG;":"®","&Racute;":"Ŕ","&Rang;":"⟫","&Rarr;":"↠","&Rarrtl;":"⤖","&Rcaron;":"Ř","&Rcedil;":"Ŗ","&Rcy;":"Р","&Re;":"ℜ","&ReverseElement;":"∋","&ReverseEquilibrium;":"⇋","&ReverseUpEquilibrium;":"⥯","&Rfr;":"ℜ","&Rho;":"Ρ","&RightAngleBracket;":"⟩","&RightArrow;":"→","&RightArrowBar;":"⇥","&RightArrowLeftArrow;":"⇄","&RightCeiling;":"⌉","&RightDoubleBracket;":"⟧","&RightDownTeeVector;":"⥝","&RightDownVector;":"⇂","&RightDownVectorBar;":"⥕","&RightFloor;":"⌋","&RightTee;":"⊢","&RightTeeArrow;":"↦","&RightTeeVector;":"⥛","&RightTriangle;":"⊳","&RightTriangleBar;":"⧐","&RightTriangleEqual;":"⊵","&RightUpDownVector;":"⥏","&RightUpTeeVector;":"⥜","&RightUpVector;":"↾","&RightUpVectorBar;":"⥔","&RightVector;":"⇀","&RightVectorBar;":"⥓","&Rightarrow;":"⇒","&Ropf;":"ℝ","&RoundImplies;":"⥰","&Rrightarrow;":"⇛","&Rscr;":"ℛ","&Rsh;":"↱","&RuleDelayed;":"⧴","&SHCHcy;":"Щ","&SHcy;":"Ш","&SOFTcy;":"Ь","&Sacute;":"Ś","&Sc;":"⪼","&Scaron;":"Š","&Scedil;":"Ş","&Scirc;":"Ŝ","&Scy;":"С","&Sfr;":"𝔖","&ShortDownArrow;":"↓","&ShortLeftArrow;":"←","&ShortRightArrow;":"→","&ShortUpArrow;":"↑","&Sigma;":"Σ","&SmallCircle;":"∘","&Sopf;":"𝕊","&Sqrt;":"√","&Square;":"□","&SquareIntersection;":"⊓","&SquareSubset;":"⊏","&SquareSubsetEqual;":"⊑","&SquareSuperset;":"⊐","&SquareSupersetEqual;":"⊒","&SquareUnion;":"⊔","&Sscr;":"𝒮","&Star;":"⋆","&Sub;":"⋐","&Subset;":"⋐","&SubsetEqual;":"⊆","&Succeeds;":"≻","&SucceedsEqual;":"⪰","&SucceedsSlantEqual;":"≽","&SucceedsTilde;":"≿","&SuchThat;":"∋","&Sum;":"∑","&Sup;":"⋑","&Superset;":"⊃","&SupersetEqual;":"⊇","&Supset;":"⋑","&THORN":"Þ","&THORN;":"Þ","&TRADE;":"™","&TSHcy;":"Ћ","&TScy;":"Ц","&Tab;":"\t","&Tau;":"Τ","&Tcaron;":"Ť","&Tcedil;":"Ţ","&Tcy;":"Т","&Tfr;":"𝔗","&Therefore;":"∴","&Theta;":"Θ","&ThickSpace;":"  ","&ThinSpace;":" ","&Tilde;":"∼","&TildeEqual;":"≃","&TildeFullEqual;":"≅","&TildeTilde;":"≈","&Topf;":"𝕋","&TripleDot;":"⃛","&Tscr;":"𝒯","&Tstrok;":"Ŧ","&Uacute":"Ú","&Uacute;":"Ú","&Uarr;":"↟","&Uarrocir;":"⥉","&Ubrcy;":"Ў","&Ubreve;":"Ŭ","&Ucirc":"Û","&Ucirc;":"Û","&Ucy;":"У","&Udblac;":"Ű","&Ufr;":"𝔘","&Ugrave":"Ù","&Ugrave;":"Ù","&Umacr;":"Ū","&UnderBar;":"_","&UnderBrace;":"⏟","&UnderBracket;":"⎵","&UnderParenthesis;":"⏝","&Union;":"⋃","&UnionPlus;":"⊎","&Uogon;":"Ų","&Uopf;":"𝕌","&UpArrow;":"↑","&UpArrowBar;":"⤒","&UpArrowDownArrow;":"⇅","&UpDownArrow;":"↕","&UpEquilibrium;":"⥮","&UpTee;":"⊥","&UpTeeArrow;":"↥","&Uparrow;":"⇑","&Updownarrow;":"⇕","&UpperLeftArrow;":"↖","&UpperRightArrow;":"↗","&Upsi;":"ϒ","&Upsilon;":"Υ","&Uring;":"Ů","&Uscr;":"𝒰","&Utilde;":"Ũ","&Uuml":"Ü","&Uuml;":"Ü","&VDash;":"⊫","&Vbar;":"⫫","&Vcy;":"В","&Vdash;":"⊩","&Vdashl;":"⫦","&Vee;":"⋁","&Verbar;":"‖","&Vert;":"‖","&VerticalBar;":"∣","&VerticalLine;":"|","&VerticalSeparator;":"❘","&VerticalTilde;":"≀","&VeryThinSpace;":" ","&Vfr;":"𝔙","&Vopf;":"𝕍","&Vscr;":"𝒱","&Vvdash;":"⊪","&Wcirc;":"Ŵ","&Wedge;":"⋀","&Wfr;":"𝔚","&Wopf;":"𝕎","&Wscr;":"𝒲","&Xfr;":"𝔛","&Xi;":"Ξ","&Xopf;":"𝕏","&Xscr;":"𝒳","&YAcy;":"Я","&YIcy;":"Ї","&YUcy;":"Ю","&Yacute":"Ý","&Yacute;":"Ý","&Ycirc;":"Ŷ","&Ycy;":"Ы","&Yfr;":"𝔜","&Yopf;":"𝕐","&Yscr;":"𝒴","&Yuml;":"Ÿ","&ZHcy;":"Ж","&Zacute;":"Ź","&Zcaron;":"Ž","&Zcy;":"З","&Zdot;":"Ż","&ZeroWidthSpace;":"​","&Zeta;":"Ζ","&Zfr;":"ℨ","&Zopf;":"ℤ","&Zscr;":"𝒵","&aacute":"á","&aacute;":"á","&abreve;":"ă","&ac;":"∾","&acE;":"∾̳","&acd;":"∿","&acirc":"â","&acirc;":"â","&acute":"´","&acute;":"´","&acy;":"а","&aelig":"æ","&aelig;":"æ","&af;":"⁡","&afr;":"𝔞","&agrave":"à","&agrave;":"à","&alefsym;":"ℵ","&aleph;":"ℵ","&alpha;":"α","&amacr;":"ā","&amalg;":"⨿","&amp":"&","&amp;":"&","&and;":"∧","&andand;":"⩕","&andd;":"⩜","&andslope;":"⩘","&andv;":"⩚","&ang;":"∠","&ange;":"⦤","&angle;":"∠","&angmsd;":"∡","&angmsdaa;":"⦨","&angmsdab;":"⦩","&angmsdac;":"⦪","&angmsdad;":"⦫","&angmsdae;":"⦬","&angmsdaf;":"⦭","&angmsdag;":"⦮","&angmsdah;":"⦯","&angrt;":"∟","&angrtvb;":"⊾","&angrtvbd;":"⦝","&angsph;":"∢","&angst;":"Å","&angzarr;":"⍼","&aogon;":"ą","&aopf;":"𝕒","&ap;":"≈","&apE;":"⩰","&apacir;":"⩯","&ape;":"≊","&apid;":"≋","&apos;":"'","&approx;":"≈","&approxeq;":"≊","&aring":"å","&aring;":"å","&ascr;":"𝒶","&ast;":"*","&asymp;":"≈","&asympeq;":"≍","&atilde":"ã","&atilde;":"ã","&auml":"ä","&auml;":"ä","&awconint;":"∳","&awint;":"⨑","&bNot;":"⫭","&backcong;":"≌","&backepsilon;":"϶","&backprime;":"‵","&backsim;":"∽","&backsimeq;":"⋍","&barvee;":"⊽","&barwed;":"⌅","&barwedge;":"⌅","&bbrk;":"⎵","&bbrktbrk;":"⎶","&bcong;":"≌","&bcy;":"б","&bdquo;":"„","&becaus;":"∵","&because;":"∵","&bemptyv;":"⦰","&bepsi;":"϶","&bernou;":"ℬ","&beta;":"β","&beth;":"ℶ","&between;":"≬","&bfr;":"𝔟","&bigcap;":"⋂","&bigcirc;":"◯","&bigcup;":"⋃","&bigodot;":"⨀","&bigoplus;":"⨁","&bigotimes;":"⨂","&bigsqcup;":"⨆","&bigstar;":"★","&bigtriangledown;":"▽","&bigtriangleup;":"△","&biguplus;":"⨄","&bigvee;":"⋁","&bigwedge;":"⋀","&bkarow;":"⤍","&blacklozenge;":"⧫","&blacksquare;":"▪","&blacktriangle;":"▴","&blacktriangledown;":"▾","&blacktriangleleft;":"◂","&blacktriangleright;":"▸","&blank;":"␣","&blk12;":"▒","&blk14;":"░","&blk34;":"▓","&block;":"█","&bne;":"=⃥","&bnequiv;":"≡⃥","&bnot;":"⌐","&bopf;":"𝕓","&bot;":"⊥","&bottom;":"⊥","&bowtie;":"⋈","&boxDL;":"╗","&boxDR;":"╔","&boxDl;":"╖","&boxDr;":"╓","&boxH;":"═","&boxHD;":"╦","&boxHU;":"╩","&boxHd;":"╤","&boxHu;":"╧","&boxUL;":"╝","&boxUR;":"╚","&boxUl;":"╜","&boxUr;":"╙","&boxV;":"║","&boxVH;":"╬","&boxVL;":"╣","&boxVR;":"╠","&boxVh;":"╫","&boxVl;":"╢","&boxVr;":"╟","&boxbox;":"⧉","&boxdL;":"╕","&boxdR;":"╒","&boxdl;":"┐","&boxdr;":"┌","&boxh;":"─","&boxhD;":"╥","&boxhU;":"╨","&boxhd;":"┬","&boxhu;":"┴","&boxminus;":"⊟","&boxplus;":"⊞","&boxtimes;":"⊠","&boxuL;":"╛","&boxuR;":"╘","&boxul;":"┘","&boxur;":"└","&boxv;":"│","&boxvH;":"╪","&boxvL;":"╡","&boxvR;":"╞","&boxvh;":"┼","&boxvl;":"┤","&boxvr;":"├","&bprime;":"‵","&breve;":"˘","&brvbar":"¦","&brvbar;":"¦","&bscr;":"𝒷","&bsemi;":"⁏","&bsim;":"∽","&bsime;":"⋍","&bsol;":"\\","&bsolb;":"⧅","&bsolhsub;":"⟈","&bull;":"•","&bullet;":"•","&bump;":"≎","&bumpE;":"⪮","&bumpe;":"≏","&bumpeq;":"≏","&cacute;":"ć","&cap;":"∩","&capand;":"⩄","&capbrcup;":"⩉","&capcap;":"⩋","&capcup;":"⩇","&capdot;":"⩀","&caps;":"∩︀","&caret;":"⁁","&caron;":"ˇ","&ccaps;":"⩍","&ccaron;":"č","&ccedil":"ç","&ccedil;":"ç","&ccirc;":"ĉ","&ccups;":"⩌","&ccupssm;":"⩐","&cdot;":"ċ","&cedil":"¸","&cedil;":"¸","&cemptyv;":"⦲","&cent":"¢","&cent;":"¢","&centerdot;":"·","&cfr;":"𝔠","&chcy;":"ч","&check;":"✓","&checkmark;":"✓","&chi;":"χ","&cir;":"○","&cirE;":"⧃","&circ;":"ˆ","&circeq;":"≗","&circlearrowleft;":"↺","&circlearrowright;":"↻","&circledR;":"®","&circledS;":"Ⓢ","&circledast;":"⊛","&circledcirc;":"⊚","&circleddash;":"⊝","&cire;":"≗","&cirfnint;":"⨐","&cirmid;":"⫯","&cirscir;":"⧂","&clubs;":"♣","&clubsuit;":"♣","&colon;":":","&colone;":"≔","&coloneq;":"≔","&comma;":",","&commat;":"@","&comp;":"∁","&compfn;":"∘","&complement;":"∁","&complexes;":"ℂ","&cong;":"≅","&congdot;":"⩭","&conint;":"∮","&copf;":"𝕔","&coprod;":"∐","&copy":"©","&copy;":"©","&copysr;":"℗","&crarr;":"↵","&cross;":"✗","&cscr;":"𝒸","&csub;":"⫏","&csube;":"⫑","&csup;":"⫐","&csupe;":"⫒","&ctdot;":"⋯","&cudarrl;":"⤸","&cudarrr;":"⤵","&cuepr;":"⋞","&cuesc;":"⋟","&cularr;":"↶","&cularrp;":"⤽","&cup;":"∪","&cupbrcap;":"⩈","&cupcap;":"⩆","&cupcup;":"⩊","&cupdot;":"⊍","&cupor;":"⩅","&cups;":"∪︀","&curarr;":"↷","&curarrm;":"⤼","&curlyeqprec;":"⋞","&curlyeqsucc;":"⋟","&curlyvee;":"⋎","&curlywedge;":"⋏","&curren":"¤","&curren;":"¤","&curvearrowleft;":"↶","&curvearrowright;":"↷","&cuvee;":"⋎","&cuwed;":"⋏","&cwconint;":"∲","&cwint;":"∱","&cylcty;":"⌭","&dArr;":"⇓","&dHar;":"⥥","&dagger;":"†","&daleth;":"ℸ","&darr;":"↓","&dash;":"‐","&dashv;":"⊣","&dbkarow;":"⤏","&dblac;":"˝","&dcaron;":"ď","&dcy;":"д","&dd;":"ⅆ","&ddagger;":"‡","&ddarr;":"⇊","&ddotseq;":"⩷","&deg":"°","&deg;":"°","&delta;":"δ","&demptyv;":"⦱","&dfisht;":"⥿","&dfr;":"𝔡","&dharl;":"⇃","&dharr;":"⇂","&diam;":"⋄","&diamond;":"⋄","&diamondsuit;":"♦","&diams;":"♦","&die;":"¨","&digamma;":"ϝ","&disin;":"⋲","&div;":"÷","&divide":"÷","&divide;":"÷","&divideontimes;":"⋇","&divonx;":"⋇","&djcy;":"ђ","&dlcorn;":"⌞","&dlcrop;":"⌍","&dollar;":"$","&dopf;":"𝕕","&dot;":"˙","&doteq;":"≐","&doteqdot;":"≑","&dotminus;":"∸","&dotplus;":"∔","&dotsquare;":"⊡","&doublebarwedge;":"⌆","&downarrow;":"↓","&downdownarrows;":"⇊","&downharpoonleft;":"⇃","&downharpoonright;":"⇂","&drbkarow;":"⤐","&drcorn;":"⌟","&drcrop;":"⌌","&dscr;":"𝒹","&dscy;":"ѕ","&dsol;":"⧶","&dstrok;":"đ","&dtdot;":"⋱","&dtri;":"▿","&dtrif;":"▾","&duarr;":"⇵","&duhar;":"⥯","&dwangle;":"⦦","&dzcy;":"џ","&dzigrarr;":"⟿","&eDDot;":"⩷","&eDot;":"≑","&eacute":"é","&eacute;":"é","&easter;":"⩮","&ecaron;":"ě","&ecir;":"≖","&ecirc":"ê","&ecirc;":"ê","&ecolon;":"≕","&ecy;":"э","&edot;":"ė","&ee;":"ⅇ","&efDot;":"≒","&efr;":"𝔢","&eg;":"⪚","&egrave":"è","&egrave;":"è","&egs;":"⪖","&egsdot;":"⪘","&el;":"⪙","&elinters;":"⏧","&ell;":"ℓ","&els;":"⪕","&elsdot;":"⪗","&emacr;":"ē","&empty;":"∅","&emptyset;":"∅","&emptyv;":"∅","&emsp13;":" ","&emsp14;":" ","&emsp;":" ","&eng;":"ŋ","&ensp;":" ","&eogon;":"ę","&eopf;":"𝕖","&epar;":"⋕","&eparsl;":"⧣","&eplus;":"⩱","&epsi;":"ε","&epsilon;":"ε","&epsiv;":"ϵ","&eqcirc;":"≖","&eqcolon;":"≕","&eqsim;":"≂","&eqslantgtr;":"⪖","&eqslantless;":"⪕","&equals;":"=","&equest;":"≟","&equiv;":"≡","&equivDD;":"⩸","&eqvparsl;":"⧥","&erDot;":"≓","&erarr;":"⥱","&escr;":"ℯ","&esdot;":"≐","&esim;":"≂","&eta;":"η","&eth":"ð","&eth;":"ð","&euml":"ë","&euml;":"ë","&euro;":"€","&excl;":"!","&exist;":"∃","&expectation;":"ℰ","&exponentiale;":"ⅇ","&fallingdotseq;":"≒","&fcy;":"ф","&female;":"♀","&ffilig;":"ﬃ","&fflig;":"ﬀ","&ffllig;":"ﬄ","&ffr;":"𝔣","&filig;":"ﬁ","&fjlig;":"fj","&flat;":"♭","&fllig;":"ﬂ","&fltns;":"▱","&fnof;":"ƒ","&fopf;":"𝕗","&forall;":"∀","&fork;":"⋔","&forkv;":"⫙","&fpartint;":"⨍","&frac12":"½","&frac12;":"½","&frac13;":"⅓","&frac14":"¼","&frac14;":"¼","&frac15;":"⅕","&frac16;":"⅙","&frac18;":"⅛","&frac23;":"⅔","&frac25;":"⅖","&frac34":"¾","&frac34;":"¾","&frac35;":"⅗","&frac38;":"⅜","&frac45;":"⅘","&frac56;":"⅚","&frac58;":"⅝","&frac78;":"⅞","&frasl;":"⁄","&frown;":"⌢","&fscr;":"𝒻","&gE;":"≧","&gEl;":"⪌","&gacute;":"ǵ","&gamma;":"γ","&gammad;":"ϝ","&gap;":"⪆","&gbreve;":"ğ","&gcirc;":"ĝ","&gcy;":"г","&gdot;":"ġ","&ge;":"≥","&gel;":"⋛","&geq;":"≥","&geqq;":"≧","&geqslant;":"⩾","&ges;":"⩾","&gescc;":"⪩","&gesdot;":"⪀","&gesdoto;":"⪂","&gesdotol;":"⪄","&gesl;":"⋛︀","&gesles;":"⪔","&gfr;":"𝔤","&gg;":"≫","&ggg;":"⋙","&gimel;":"ℷ","&gjcy;":"ѓ","&gl;":"≷","&glE;":"⪒","&gla;":"⪥","&glj;":"⪤","&gnE;":"≩","&gnap;":"⪊","&gnapprox;":"⪊","&gne;":"⪈","&gneq;":"⪈","&gneqq;":"≩","&gnsim;":"⋧","&gopf;":"𝕘","&grave;":"`","&gscr;":"ℊ","&gsim;":"≳","&gsime;":"⪎","&gsiml;":"⪐","&gt":">","&gt;":">","&gtcc;":"⪧","&gtcir;":"⩺","&gtdot;":"⋗","&gtlPar;":"⦕","&gtquest;":"⩼","&gtrapprox;":"⪆","&gtrarr;":"⥸","&gtrdot;":"⋗","&gtreqless;":"⋛","&gtreqqless;":"⪌","&gtrless;":"≷","&gtrsim;":"≳","&gvertneqq;":"≩︀","&gvnE;":"≩︀","&hArr;":"⇔","&hairsp;":" ","&half;":"½","&hamilt;":"ℋ","&hardcy;":"ъ","&harr;":"↔","&harrcir;":"⥈","&harrw;":"↭","&hbar;":"ℏ","&hcirc;":"ĥ","&hearts;":"♥","&heartsuit;":"♥","&hellip;":"…","&hercon;":"⊹","&hfr;":"𝔥","&hksearow;":"⤥","&hkswarow;":"⤦","&hoarr;":"⇿","&homtht;":"∻","&hookleftarrow;":"↩","&hookrightarrow;":"↪","&hopf;":"𝕙","&horbar;":"―","&hscr;":"𝒽","&hslash;":"ℏ","&hstrok;":"ħ","&hybull;":"⁃","&hyphen;":"‐","&iacute":"í","&iacute;":"í","&ic;":"⁣","&icirc":"î","&icirc;":"î","&icy;":"и","&iecy;":"е","&iexcl":"¡","&iexcl;":"¡","&iff;":"⇔","&ifr;":"𝔦","&igrave":"ì","&igrave;":"ì","&ii;":"ⅈ","&iiiint;":"⨌","&iiint;":"∭","&iinfin;":"⧜","&iiota;":"℩","&ijlig;":"ĳ","&imacr;":"ī","&image;":"ℑ","&imagline;":"ℐ","&imagpart;":"ℑ","&imath;":"ı","&imof;":"⊷","&imped;":"Ƶ","&in;":"∈","&incare;":"℅","&infin;":"∞","&infintie;":"⧝","&inodot;":"ı","&int;":"∫","&intcal;":"⊺","&integers;":"ℤ","&intercal;":"⊺","&intlarhk;":"⨗","&intprod;":"⨼","&iocy;":"ё","&iogon;":"į","&iopf;":"𝕚","&iota;":"ι","&iprod;":"⨼","&iquest":"¿","&iquest;":"¿","&iscr;":"𝒾","&isin;":"∈","&isinE;":"⋹","&isindot;":"⋵","&isins;":"⋴","&isinsv;":"⋳","&isinv;":"∈","&it;":"⁢","&itilde;":"ĩ","&iukcy;":"і","&iuml":"ï","&iuml;":"ï","&jcirc;":"ĵ","&jcy;":"й","&jfr;":"𝔧","&jmath;":"ȷ","&jopf;":"𝕛","&jscr;":"𝒿","&jsercy;":"ј","&jukcy;":"є","&kappa;":"κ","&kappav;":"ϰ","&kcedil;":"ķ","&kcy;":"к","&kfr;":"𝔨","&kgreen;":"ĸ","&khcy;":"х","&kjcy;":"ќ","&kopf;":"𝕜","&kscr;":"𝓀","&lAarr;":"⇚","&lArr;":"⇐","&lAtail;":"⤛","&lBarr;":"⤎","&lE;":"≦","&lEg;":"⪋","&lHar;":"⥢","&lacute;":"ĺ","&laemptyv;":"⦴","&lagran;":"ℒ","&lambda;":"λ","&lang;":"⟨","&langd;":"⦑","&langle;":"⟨","&lap;":"⪅","&laquo":"«","&laquo;":"«","&larr;":"←","&larrb;":"⇤","&larrbfs;":"⤟","&larrfs;":"⤝","&larrhk;":"↩","&larrlp;":"↫","&larrpl;":"⤹","&larrsim;":"⥳","&larrtl;":"↢","&lat;":"⪫","&latail;":"⤙","&late;":"⪭","&lates;":"⪭︀","&lbarr;":"⤌","&lbbrk;":"❲","&lbrace;":"{","&lbrack;":"[","&lbrke;":"⦋","&lbrksld;":"⦏","&lbrkslu;":"⦍","&lcaron;":"ľ","&lcedil;":"ļ","&lceil;":"⌈","&lcub;":"{","&lcy;":"л","&ldca;":"⤶","&ldquo;":"“","&ldquor;":"„","&ldrdhar;":"⥧","&ldrushar;":"⥋","&ldsh;":"↲","&le;":"≤","&leftarrow;":"←","&leftarrowtail;":"↢","&leftharpoondown;":"↽","&leftharpoonup;":"↼","&leftleftarrows;":"⇇","&leftrightarrow;":"↔","&leftrightarrows;":"⇆","&leftrightharpoons;":"⇋","&leftrightsquigarrow;":"↭","&leftthreetimes;":"⋋","&leg;":"⋚","&leq;":"≤","&leqq;":"≦","&leqslant;":"⩽","&les;":"⩽","&lescc;":"⪨","&lesdot;":"⩿","&lesdoto;":"⪁","&lesdotor;":"⪃","&lesg;":"⋚︀","&lesges;":"⪓","&lessapprox;":"⪅","&lessdot;":"⋖","&lesseqgtr;":"⋚","&lesseqqgtr;":"⪋","&lessgtr;":"≶","&lesssim;":"≲","&lfisht;":"⥼","&lfloor;":"⌊","&lfr;":"𝔩","&lg;":"≶","&lgE;":"⪑","&lhard;":"↽","&lharu;":"↼","&lharul;":"⥪","&lhblk;":"▄","&ljcy;":"љ","&ll;":"≪","&llarr;":"⇇","&llcorner;":"⌞","&llhard;":"⥫","&lltri;":"◺","&lmidot;":"ŀ","&lmoust;":"⎰","&lmoustache;":"⎰","&lnE;":"≨","&lnap;":"⪉","&lnapprox;":"⪉","&lne;":"⪇","&lneq;":"⪇","&lneqq;":"≨","&lnsim;":"⋦","&loang;":"⟬","&loarr;":"⇽","&lobrk;":"⟦","&longleftarrow;":"⟵","&longleftrightarrow;":"⟷","&longmapsto;":"⟼","&longrightarrow;":"⟶","&looparrowleft;":"↫","&looparrowright;":"↬","&lopar;":"⦅","&lopf;":"𝕝","&loplus;":"⨭","&lotimes;":"⨴","&lowast;":"∗","&lowbar;":"_","&loz;":"◊","&lozenge;":"◊","&lozf;":"⧫","&lpar;":"(","&lparlt;":"⦓","&lrarr;":"⇆","&lrcorner;":"⌟","&lrhar;":"⇋","&lrhard;":"⥭","&lrm;":"‎","&lrtri;":"⊿","&lsaquo;":"‹","&lscr;":"𝓁","&lsh;":"↰","&lsim;":"≲","&lsime;":"⪍","&lsimg;":"⪏","&lsqb;":"[","&lsquo;":"‘","&lsquor;":"‚","&lstrok;":"ł","&lt":"<","&lt;":"<","&ltcc;":"⪦","&ltcir;":"⩹","&ltdot;":"⋖","&lthree;":"⋋","&ltimes;":"⋉","&ltlarr;":"⥶","&ltquest;":"⩻","&ltrPar;":"⦖","&ltri;":"◃","&ltrie;":"⊴","&ltrif;":"◂","&lurdshar;":"⥊","&luruhar;":"⥦","&lvertneqq;":"≨︀","&lvnE;":"≨︀","&mDDot;":"∺","&macr":"¯","&macr;":"¯","&male;":"♂","&malt;":"✠","&maltese;":"✠","&map;":"↦","&mapsto;":"↦","&mapstodown;":"↧","&mapstoleft;":"↤","&mapstoup;":"↥","&marker;":"▮","&mcomma;":"⨩","&mcy;":"м","&mdash;":"—","&measuredangle;":"∡","&mfr;":"𝔪","&mho;":"℧","&micro":"µ","&micro;":"µ","&mid;":"∣","&midast;":"*","&midcir;":"⫰","&middot":"·","&middot;":"·","&minus;":"−","&minusb;":"⊟","&minusd;":"∸","&minusdu;":"⨪","&mlcp;":"⫛","&mldr;":"…","&mnplus;":"∓","&models;":"⊧","&mopf;":"𝕞","&mp;":"∓","&mscr;":"𝓂","&mstpos;":"∾","&mu;":"μ","&multimap;":"⊸","&mumap;":"⊸","&nGg;":"⋙̸","&nGt;":"≫⃒","&nGtv;":"≫̸","&nLeftarrow;":"⇍","&nLeftrightarrow;":"⇎","&nLl;":"⋘̸","&nLt;":"≪⃒","&nLtv;":"≪̸","&nRightarrow;":"⇏","&nVDash;":"⊯","&nVdash;":"⊮","&nabla;":"∇","&nacute;":"ń","&nang;":"∠⃒","&nap;":"≉","&napE;":"⩰̸","&napid;":"≋̸","&napos;":"ŉ","&napprox;":"≉","&natur;":"♮","&natural;":"♮","&naturals;":"ℕ","&nbsp":" ","&nbsp;":" ","&nbump;":"≎̸","&nbumpe;":"≏̸","&ncap;":"⩃","&ncaron;":"ň","&ncedil;":"ņ","&ncong;":"≇","&ncongdot;":"⩭̸","&ncup;":"⩂","&ncy;":"н","&ndash;":"–","&ne;":"≠","&neArr;":"⇗","&nearhk;":"⤤","&nearr;":"↗","&nearrow;":"↗","&nedot;":"≐̸","&nequiv;":"≢","&nesear;":"⤨","&nesim;":"≂̸","&nexist;":"∄","&nexists;":"∄","&nfr;":"𝔫","&ngE;":"≧̸","&nge;":"≱","&ngeq;":"≱","&ngeqq;":"≧̸","&ngeqslant;":"⩾̸","&nges;":"⩾̸","&ngsim;":"≵","&ngt;":"≯","&ngtr;":"≯","&nhArr;":"⇎","&nharr;":"↮","&nhpar;":"⫲","&ni;":"∋","&nis;":"⋼","&nisd;":"⋺","&niv;":"∋","&njcy;":"њ","&nlArr;":"⇍","&nlE;":"≦̸","&nlarr;":"↚","&nldr;":"‥","&nle;":"≰","&nleftarrow;":"↚","&nleftrightarrow;":"↮","&nleq;":"≰","&nleqq;":"≦̸","&nleqslant;":"⩽̸","&nles;":"⩽̸","&nless;":"≮","&nlsim;":"≴","&nlt;":"≮","&nltri;":"⋪","&nltrie;":"⋬","&nmid;":"∤","&nopf;":"𝕟","&not":"¬","&not;":"¬","&notin;":"∉","&notinE;":"⋹̸","&notindot;":"⋵̸","&notinva;":"∉","&notinvb;":"⋷","&notinvc;":"⋶","&notni;":"∌","&notniva;":"∌","&notnivb;":"⋾","&notnivc;":"⋽","&npar;":"∦","&nparallel;":"∦","&nparsl;":"⫽⃥","&npart;":"∂̸","&npolint;":"⨔","&npr;":"⊀","&nprcue;":"⋠","&npre;":"⪯̸","&nprec;":"⊀","&npreceq;":"⪯̸","&nrArr;":"⇏","&nrarr;":"↛","&nrarrc;":"⤳̸","&nrarrw;":"↝̸","&nrightarrow;":"↛","&nrtri;":"⋫","&nrtrie;":"⋭","&nsc;":"⊁","&nsccue;":"⋡","&nsce;":"⪰̸","&nscr;":"𝓃","&nshortmid;":"∤","&nshortparallel;":"∦","&nsim;":"≁","&nsime;":"≄","&nsimeq;":"≄","&nsmid;":"∤","&nspar;":"∦","&nsqsube;":"⋢","&nsqsupe;":"⋣","&nsub;":"⊄","&nsubE;":"⫅̸","&nsube;":"⊈","&nsubset;":"⊂⃒","&nsubseteq;":"⊈","&nsubseteqq;":"⫅̸","&nsucc;":"⊁","&nsucceq;":"⪰̸","&nsup;":"⊅","&nsupE;":"⫆̸","&nsupe;":"⊉","&nsupset;":"⊃⃒","&nsupseteq;":"⊉","&nsupseteqq;":"⫆̸","&ntgl;":"≹","&ntilde":"ñ","&ntilde;":"ñ","&ntlg;":"≸","&ntriangleleft;":"⋪","&ntrianglelefteq;":"⋬","&ntriangleright;":"⋫","&ntrianglerighteq;":"⋭","&nu;":"ν","&num;":"#","&numero;":"№","&numsp;":" ","&nvDash;":"⊭","&nvHarr;":"⤄","&nvap;":"≍⃒","&nvdash;":"⊬","&nvge;":"≥⃒","&nvgt;":">⃒","&nvinfin;":"⧞","&nvlArr;":"⤂","&nvle;":"≤⃒","&nvlt;":"<⃒","&nvltrie;":"⊴⃒","&nvrArr;":"⤃","&nvrtrie;":"⊵⃒","&nvsim;":"∼⃒","&nwArr;":"⇖","&nwarhk;":"⤣","&nwarr;":"↖","&nwarrow;":"↖","&nwnear;":"⤧","&oS;":"Ⓢ","&oacute":"ó","&oacute;":"ó","&oast;":"⊛","&ocir;":"⊚","&ocirc":"ô","&ocirc;":"ô","&ocy;":"о","&odash;":"⊝","&odblac;":"ő","&odiv;":"⨸","&odot;":"⊙","&odsold;":"⦼","&oelig;":"œ","&ofcir;":"⦿","&ofr;":"𝔬","&ogon;":"˛","&ograve":"ò","&ograve;":"ò","&ogt;":"⧁","&ohbar;":"⦵","&ohm;":"Ω","&oint;":"∮","&olarr;":"↺","&olcir;":"⦾","&olcross;":"⦻","&oline;":"‾","&olt;":"⧀","&omacr;":"ō","&omega;":"ω","&omicron;":"ο","&omid;":"⦶","&ominus;":"⊖","&oopf;":"𝕠","&opar;":"⦷","&operp;":"⦹","&oplus;":"⊕","&or;":"∨","&orarr;":"↻","&ord;":"⩝","&order;":"ℴ","&orderof;":"ℴ","&ordf":"ª","&ordf;":"ª","&ordm":"º","&ordm;":"º","&origof;":"⊶","&oror;":"⩖","&orslope;":"⩗","&orv;":"⩛","&oscr;":"ℴ","&oslash":"ø","&oslash;":"ø","&osol;":"⊘","&otilde":"õ","&otilde;":"õ","&otimes;":"⊗","&otimesas;":"⨶","&ouml":"ö","&ouml;":"ö","&ovbar;":"⌽","&par;":"∥","&para":"¶","&para;":"¶","&parallel;":"∥","&parsim;":"⫳","&parsl;":"⫽","&part;":"∂","&pcy;":"п","&percnt;":"%","&period;":".","&permil;":"‰","&perp;":"⊥","&pertenk;":"‱","&pfr;":"𝔭","&phi;":"φ","&phiv;":"ϕ","&phmmat;":"ℳ","&phone;":"☎","&pi;":"π","&pitchfork;":"⋔","&piv;":"ϖ","&planck;":"ℏ","&planckh;":"ℎ","&plankv;":"ℏ","&plus;":"+","&plusacir;":"⨣","&plusb;":"⊞","&pluscir;":"⨢","&plusdo;":"∔","&plusdu;":"⨥","&pluse;":"⩲","&plusmn":"±","&plusmn;":"±","&plussim;":"⨦","&plustwo;":"⨧","&pm;":"±","&pointint;":"⨕","&popf;":"𝕡","&pound":"£","&pound;":"£","&pr;":"≺","&prE;":"⪳","&prap;":"⪷","&prcue;":"≼","&pre;":"⪯","&prec;":"≺","&precapprox;":"⪷","&preccurlyeq;":"≼","&preceq;":"⪯","&precnapprox;":"⪹","&precneqq;":"⪵","&precnsim;":"⋨","&precsim;":"≾","&prime;":"′","&primes;":"ℙ","&prnE;":"⪵","&prnap;":"⪹","&prnsim;":"⋨","&prod;":"∏","&profalar;":"⌮","&profline;":"⌒","&profsurf;":"⌓","&prop;":"∝","&propto;":"∝","&prsim;":"≾","&prurel;":"⊰","&pscr;":"𝓅","&psi;":"ψ","&puncsp;":" ","&qfr;":"𝔮","&qint;":"⨌","&qopf;":"𝕢","&qprime;":"⁗","&qscr;":"𝓆","&quaternions;":"ℍ","&quatint;":"⨖","&quest;":"?","&questeq;":"≟","&quot":'"',"&quot;":'"',"&rAarr;":"⇛","&rArr;":"⇒","&rAtail;":"⤜","&rBarr;":"⤏","&rHar;":"⥤","&race;":"∽̱","&racute;":"ŕ","&radic;":"√","&raemptyv;":"⦳","&rang;":"⟩","&rangd;":"⦒","&range;":"⦥","&rangle;":"⟩","&raquo":"»","&raquo;":"»","&rarr;":"→","&rarrap;":"⥵","&rarrb;":"⇥","&rarrbfs;":"⤠","&rarrc;":"⤳","&rarrfs;":"⤞","&rarrhk;":"↪","&rarrlp;":"↬","&rarrpl;":"⥅","&rarrsim;":"⥴","&rarrtl;":"↣","&rarrw;":"↝","&ratail;":"⤚","&ratio;":"∶","&rationals;":"ℚ","&rbarr;":"⤍","&rbbrk;":"❳","&rbrace;":"}","&rbrack;":"]","&rbrke;":"⦌","&rbrksld;":"⦎","&rbrkslu;":"⦐","&rcaron;":"ř","&rcedil;":"ŗ","&rceil;":"⌉","&rcub;":"}","&rcy;":"р","&rdca;":"⤷","&rdldhar;":"⥩","&rdquo;":"”","&rdquor;":"”","&rdsh;":"↳","&real;":"ℜ","&realine;":"ℛ","&realpart;":"ℜ","&reals;":"ℝ","&rect;":"▭","&reg":"®","&reg;":"®","&rfisht;":"⥽","&rfloor;":"⌋","&rfr;":"𝔯","&rhard;":"⇁","&rharu;":"⇀","&rharul;":"⥬","&rho;":"ρ","&rhov;":"ϱ","&rightarrow;":"→","&rightarrowtail;":"↣","&rightharpoondown;":"⇁","&rightharpoonup;":"⇀","&rightleftarrows;":"⇄","&rightleftharpoons;":"⇌","&rightrightarrows;":"⇉","&rightsquigarrow;":"↝","&rightthreetimes;":"⋌","&ring;":"˚","&risingdotseq;":"≓","&rlarr;":"⇄","&rlhar;":"⇌","&rlm;":"‏","&rmoust;":"⎱","&rmoustache;":"⎱","&rnmid;":"⫮","&roang;":"⟭","&roarr;":"⇾","&robrk;":"⟧","&ropar;":"⦆","&ropf;":"𝕣","&roplus;":"⨮","&rotimes;":"⨵","&rpar;":")","&rpargt;":"⦔","&rppolint;":"⨒","&rrarr;":"⇉","&rsaquo;":"›","&rscr;":"𝓇","&rsh;":"↱","&rsqb;":"]","&rsquo;":"’","&rsquor;":"’","&rthree;":"⋌","&rtimes;":"⋊","&rtri;":"▹","&rtrie;":"⊵","&rtrif;":"▸","&rtriltri;":"⧎","&ruluhar;":"⥨","&rx;":"℞","&sacute;":"ś","&sbquo;":"‚","&sc;":"≻","&scE;":"⪴","&scap;":"⪸","&scaron;":"š","&sccue;":"≽","&sce;":"⪰","&scedil;":"ş","&scirc;":"ŝ","&scnE;":"⪶","&scnap;":"⪺","&scnsim;":"⋩","&scpolint;":"⨓","&scsim;":"≿","&scy;":"с","&sdot;":"⋅","&sdotb;":"⊡","&sdote;":"⩦","&seArr;":"⇘","&searhk;":"⤥","&searr;":"↘","&searrow;":"↘","&sect":"§","&sect;":"§","&semi;":";","&seswar;":"⤩","&setminus;":"∖","&setmn;":"∖","&sext;":"✶","&sfr;":"𝔰","&sfrown;":"⌢","&sharp;":"♯","&shchcy;":"щ","&shcy;":"ш","&shortmid;":"∣","&shortparallel;":"∥","&shy":"­","&shy;":"­","&sigma;":"σ","&sigmaf;":"ς","&sigmav;":"ς","&sim;":"∼","&simdot;":"⩪","&sime;":"≃","&simeq;":"≃","&simg;":"⪞","&simgE;":"⪠","&siml;":"⪝","&simlE;":"⪟","&simne;":"≆","&simplus;":"⨤","&simrarr;":"⥲","&slarr;":"←","&smallsetminus;":"∖","&smashp;":"⨳","&smeparsl;":"⧤","&smid;":"∣","&smile;":"⌣","&smt;":"⪪","&smte;":"⪬","&smtes;":"⪬︀","&softcy;":"ь","&sol;":"/","&solb;":"⧄","&solbar;":"⌿","&sopf;":"𝕤","&spades;":"♠","&spadesuit;":"♠","&spar;":"∥","&sqcap;":"⊓","&sqcaps;":"⊓︀","&sqcup;":"⊔","&sqcups;":"⊔︀","&sqsub;":"⊏","&sqsube;":"⊑","&sqsubset;":"⊏","&sqsubseteq;":"⊑","&sqsup;":"⊐","&sqsupe;":"⊒","&sqsupset;":"⊐","&sqsupseteq;":"⊒","&squ;":"□","&square;":"□","&squarf;":"▪","&squf;":"▪","&srarr;":"→","&sscr;":"𝓈","&ssetmn;":"∖","&ssmile;":"⌣","&sstarf;":"⋆","&star;":"☆","&starf;":"★","&straightepsilon;":"ϵ","&straightphi;":"ϕ","&strns;":"¯","&sub;":"⊂","&subE;":"⫅","&subdot;":"⪽","&sube;":"⊆","&subedot;":"⫃","&submult;":"⫁","&subnE;":"⫋","&subne;":"⊊","&subplus;":"⪿","&subrarr;":"⥹","&subset;":"⊂","&subseteq;":"⊆","&subseteqq;":"⫅","&subsetneq;":"⊊","&subsetneqq;":"⫋","&subsim;":"⫇","&subsub;":"⫕","&subsup;":"⫓","&succ;":"≻","&succapprox;":"⪸","&succcurlyeq;":"≽","&succeq;":"⪰","&succnapprox;":"⪺","&succneqq;":"⪶","&succnsim;":"⋩","&succsim;":"≿","&sum;":"∑","&sung;":"♪","&sup1":"¹","&sup1;":"¹","&sup2":"²","&sup2;":"²","&sup3":"³","&sup3;":"³","&sup;":"⊃","&supE;":"⫆","&supdot;":"⪾","&supdsub;":"⫘","&supe;":"⊇","&supedot;":"⫄","&suphsol;":"⟉","&suphsub;":"⫗","&suplarr;":"⥻","&supmult;":"⫂","&supnE;":"⫌","&supne;":"⊋","&supplus;":"⫀","&supset;":"⊃","&supseteq;":"⊇","&supseteqq;":"⫆","&supsetneq;":"⊋","&supsetneqq;":"⫌","&supsim;":"⫈","&supsub;":"⫔","&supsup;":"⫖","&swArr;":"⇙","&swarhk;":"⤦","&swarr;":"↙","&swarrow;":"↙","&swnwar;":"⤪","&szlig":"ß","&szlig;":"ß","&target;":"⌖","&tau;":"τ","&tbrk;":"⎴","&tcaron;":"ť","&tcedil;":"ţ","&tcy;":"т","&tdot;":"⃛","&telrec;":"⌕","&tfr;":"𝔱","&there4;":"∴","&therefore;":"∴","&theta;":"θ","&thetasym;":"ϑ","&thetav;":"ϑ","&thickapprox;":"≈","&thicksim;":"∼","&thinsp;":" ","&thkap;":"≈","&thksim;":"∼","&thorn":"þ","&thorn;":"þ","&tilde;":"˜","&times":"×","&times;":"×","&timesb;":"⊠","&timesbar;":"⨱","&timesd;":"⨰","&tint;":"∭","&toea;":"⤨","&top;":"⊤","&topbot;":"⌶","&topcir;":"⫱","&topf;":"𝕥","&topfork;":"⫚","&tosa;":"⤩","&tprime;":"‴","&trade;":"™","&triangle;":"▵","&triangledown;":"▿","&triangleleft;":"◃","&trianglelefteq;":"⊴","&triangleq;":"≜","&triangleright;":"▹","&trianglerighteq;":"⊵","&tridot;":"◬","&trie;":"≜","&triminus;":"⨺","&triplus;":"⨹","&trisb;":"⧍","&tritime;":"⨻","&trpezium;":"⏢","&tscr;":"𝓉","&tscy;":"ц","&tshcy;":"ћ","&tstrok;":"ŧ","&twixt;":"≬","&twoheadleftarrow;":"↞","&twoheadrightarrow;":"↠","&uArr;":"⇑","&uHar;":"⥣","&uacute":"ú","&uacute;":"ú","&uarr;":"↑","&ubrcy;":"ў","&ubreve;":"ŭ","&ucirc":"û","&ucirc;":"û","&ucy;":"у","&udarr;":"⇅","&udblac;":"ű","&udhar;":"⥮","&ufisht;":"⥾","&ufr;":"𝔲","&ugrave":"ù","&ugrave;":"ù","&uharl;":"↿","&uharr;":"↾","&uhblk;":"▀","&ulcorn;":"⌜","&ulcorner;":"⌜","&ulcrop;":"⌏","&ultri;":"◸","&umacr;":"ū","&uml":"¨","&uml;":"¨","&uogon;":"ų","&uopf;":"𝕦","&uparrow;":"↑","&updownarrow;":"↕","&upharpoonleft;":"↿","&upharpoonright;":"↾","&uplus;":"⊎","&upsi;":"υ","&upsih;":"ϒ","&upsilon;":"υ","&upuparrows;":"⇈","&urcorn;":"⌝","&urcorner;":"⌝","&urcrop;":"⌎","&uring;":"ů","&urtri;":"◹","&uscr;":"𝓊","&utdot;":"⋰","&utilde;":"ũ","&utri;":"▵","&utrif;":"▴","&uuarr;":"⇈","&uuml":"ü","&uuml;":"ü","&uwangle;":"⦧","&vArr;":"⇕","&vBar;":"⫨","&vBarv;":"⫩","&vDash;":"⊨","&vangrt;":"⦜","&varepsilon;":"ϵ","&varkappa;":"ϰ","&varnothing;":"∅","&varphi;":"ϕ","&varpi;":"ϖ","&varpropto;":"∝","&varr;":"↕","&varrho;":"ϱ","&varsigma;":"ς","&varsubsetneq;":"⊊︀","&varsubsetneqq;":"⫋︀","&varsupsetneq;":"⊋︀","&varsupsetneqq;":"⫌︀","&vartheta;":"ϑ","&vartriangleleft;":"⊲","&vartriangleright;":"⊳","&vcy;":"в","&vdash;":"⊢","&vee;":"∨","&veebar;":"⊻","&veeeq;":"≚","&vellip;":"⋮","&verbar;":"|","&vert;":"|","&vfr;":"𝔳","&vltri;":"⊲","&vnsub;":"⊂⃒","&vnsup;":"⊃⃒","&vopf;":"𝕧","&vprop;":"∝","&vrtri;":"⊳","&vscr;":"𝓋","&vsubnE;":"⫋︀","&vsubne;":"⊊︀","&vsupnE;":"⫌︀","&vsupne;":"⊋︀","&vzigzag;":"⦚","&wcirc;":"ŵ","&wedbar;":"⩟","&wedge;":"∧","&wedgeq;":"≙","&weierp;":"℘","&wfr;":"𝔴","&wopf;":"𝕨","&wp;":"℘","&wr;":"≀","&wreath;":"≀","&wscr;":"𝓌","&xcap;":"⋂","&xcirc;":"◯","&xcup;":"⋃","&xdtri;":"▽","&xfr;":"𝔵","&xhArr;":"⟺","&xharr;":"⟷","&xi;":"ξ","&xlArr;":"⟸","&xlarr;":"⟵","&xmap;":"⟼","&xnis;":"⋻","&xodot;":"⨀","&xopf;":"𝕩","&xoplus;":"⨁","&xotime;":"⨂","&xrArr;":"⟹","&xrarr;":"⟶","&xscr;":"𝓍","&xsqcup;":"⨆","&xuplus;":"⨄","&xutri;":"△","&xvee;":"⋁","&xwedge;":"⋀","&yacute":"ý","&yacute;":"ý","&yacy;":"я","&ycirc;":"ŷ","&ycy;":"ы","&yen":"¥","&yen;":"¥","&yfr;":"𝔶","&yicy;":"ї","&yopf;":"𝕪","&yscr;":"𝓎","&yucy;":"ю","&yuml":"ÿ","&yuml;":"ÿ","&zacute;":"ź","&zcaron;":"ž","&zcy;":"з","&zdot;":"ż","&zeetrf;":"ℨ","&zeta;":"ζ","&zfr;":"𝔷","&zhcy;":"ж","&zigrarr;":"⇝","&zopf;":"𝕫","&zscr;":"𝓏","&zwj;":"‍","&zwnj;":"‌"},characters:{"Æ":"&AElig;","&":"&amp;","Á":"&Aacute;","Ă":"&Abreve;","Â":"&Acirc;","А":"&Acy;","𝔄":"&Afr;","À":"&Agrave;","Α":"&Alpha;","Ā":"&Amacr;","⩓":"&And;","Ą":"&Aogon;","𝔸":"&Aopf;","⁡":"&af;","Å":"&angst;","𝒜":"&Ascr;","≔":"&coloneq;","Ã":"&Atilde;","Ä":"&Auml;","∖":"&ssetmn;","⫧":"&Barv;","⌆":"&doublebarwedge;","Б":"&Bcy;","∵":"&because;","ℬ":"&bernou;","Β":"&Beta;","𝔅":"&Bfr;","𝔹":"&Bopf;","˘":"&breve;","≎":"&bump;","Ч":"&CHcy;","©":"&copy;","Ć":"&Cacute;","⋒":"&Cap;","ⅅ":"&DD;","ℭ":"&Cfr;","Č":"&Ccaron;","Ç":"&Ccedil;","Ĉ":"&Ccirc;","∰":"&Cconint;","Ċ":"&Cdot;","¸":"&cedil;","·":"&middot;","Χ":"&Chi;","⊙":"&odot;","⊖":"&ominus;","⊕":"&oplus;","⊗":"&otimes;","∲":"&cwconint;","”":"&rdquor;","’":"&rsquor;","∷":"&Proportion;","⩴":"&Colone;","≡":"&equiv;","∯":"&DoubleContourIntegral;","∮":"&oint;","ℂ":"&complexes;","∐":"&coprod;","∳":"&awconint;","⨯":"&Cross;","𝒞":"&Cscr;","⋓":"&Cup;","≍":"&asympeq;","⤑":"&DDotrahd;","Ђ":"&DJcy;","Ѕ":"&DScy;","Џ":"&DZcy;","‡":"&ddagger;","↡":"&Darr;","⫤":"&DoubleLeftTee;","Ď":"&Dcaron;","Д":"&Dcy;","∇":"&nabla;","Δ":"&Delta;","𝔇":"&Dfr;","´":"&acute;","˙":"&dot;","˝":"&dblac;","`":"&grave;","˜":"&tilde;","⋄":"&diamond;","ⅆ":"&dd;","𝔻":"&Dopf;","¨":"&uml;","⃜":"&DotDot;","≐":"&esdot;","⇓":"&dArr;","⇐":"&lArr;","⇔":"&iff;","⟸":"&xlArr;","⟺":"&xhArr;","⟹":"&xrArr;","⇒":"&rArr;","⊨":"&vDash;","⇑":"&uArr;","⇕":"&vArr;","∥":"&spar;","↓":"&downarrow;","⤓":"&DownArrowBar;","⇵":"&duarr;","̑":"&DownBreve;","⥐":"&DownLeftRightVector;","⥞":"&DownLeftTeeVector;","↽":"&lhard;","⥖":"&DownLeftVectorBar;","⥟":"&DownRightTeeVector;","⇁":"&rightharpoondown;","⥗":"&DownRightVectorBar;","⊤":"&top;","↧":"&mapstodown;","𝒟":"&Dscr;","Đ":"&Dstrok;","Ŋ":"&ENG;","Ð":"&ETH;","É":"&Eacute;","Ě":"&Ecaron;","Ê":"&Ecirc;","Э":"&Ecy;","Ė":"&Edot;","𝔈":"&Efr;","È":"&Egrave;","∈":"&isinv;","Ē":"&Emacr;","◻":"&EmptySmallSquare;","▫":"&EmptyVerySmallSquare;","Ę":"&Eogon;","𝔼":"&Eopf;","Ε":"&Epsilon;","⩵":"&Equal;","≂":"&esim;","⇌":"&rlhar;","ℰ":"&expectation;","⩳":"&Esim;","Η":"&Eta;","Ë":"&Euml;","∃":"&exist;","ⅇ":"&exponentiale;","Ф":"&Fcy;","𝔉":"&Ffr;","◼":"&FilledSmallSquare;","▪":"&squf;","𝔽":"&Fopf;","∀":"&forall;","ℱ":"&Fscr;","Ѓ":"&GJcy;",">":"&gt;","Γ":"&Gamma;","Ϝ":"&Gammad;","Ğ":"&Gbreve;","Ģ":"&Gcedil;","Ĝ":"&Gcirc;","Г":"&Gcy;","Ġ":"&Gdot;","𝔊":"&Gfr;","⋙":"&ggg;","𝔾":"&Gopf;","≥":"&geq;","⋛":"&gtreqless;","≧":"&geqq;","⪢":"&GreaterGreater;","≷":"&gtrless;","⩾":"&ges;","≳":"&gtrsim;","𝒢":"&Gscr;","≫":"&gg;","Ъ":"&HARDcy;","ˇ":"&caron;","^":"&Hat;","Ĥ":"&Hcirc;","ℌ":"&Poincareplane;","ℋ":"&hamilt;","ℍ":"&quaternions;","─":"&boxh;","Ħ":"&Hstrok;","≏":"&bumpeq;","Е":"&IEcy;","Ĳ":"&IJlig;","Ё":"&IOcy;","Í":"&Iacute;","Î":"&Icirc;","И":"&Icy;","İ":"&Idot;","ℑ":"&imagpart;","Ì":"&Igrave;","Ī":"&Imacr;","ⅈ":"&ii;","∬":"&Int;","∫":"&int;","⋂":"&xcap;","⁣":"&ic;","⁢":"&it;","Į":"&Iogon;","𝕀":"&Iopf;","Ι":"&Iota;","ℐ":"&imagline;","Ĩ":"&Itilde;","І":"&Iukcy;","Ï":"&Iuml;","Ĵ":"&Jcirc;","Й":"&Jcy;","𝔍":"&Jfr;","𝕁":"&Jopf;","𝒥":"&Jscr;","Ј":"&Jsercy;","Є":"&Jukcy;","Х":"&KHcy;","Ќ":"&KJcy;","Κ":"&Kappa;","Ķ":"&Kcedil;","К":"&Kcy;","𝔎":"&Kfr;","𝕂":"&Kopf;","𝒦":"&Kscr;","Љ":"&LJcy;","<":"&lt;","Ĺ":"&Lacute;","Λ":"&Lambda;","⟪":"&Lang;","ℒ":"&lagran;","↞":"&twoheadleftarrow;","Ľ":"&Lcaron;","Ļ":"&Lcedil;","Л":"&Lcy;","⟨":"&langle;","←":"&slarr;","⇤":"&larrb;","⇆":"&lrarr;","⌈":"&lceil;","⟦":"&lobrk;","⥡":"&LeftDownTeeVector;","⇃":"&downharpoonleft;","⥙":"&LeftDownVectorBar;","⌊":"&lfloor;","↔":"&leftrightarrow;","⥎":"&LeftRightVector;","⊣":"&dashv;","↤":"&mapstoleft;","⥚":"&LeftTeeVector;","⊲":"&vltri;","⧏":"&LeftTriangleBar;","⊴":"&trianglelefteq;","⥑":"&LeftUpDownVector;","⥠":"&LeftUpTeeVector;","↿":"&upharpoonleft;","⥘":"&LeftUpVectorBar;","↼":"&lharu;","⥒":"&LeftVectorBar;","⋚":"&lesseqgtr;","≦":"&leqq;","≶":"&lg;","⪡":"&LessLess;","⩽":"&les;","≲":"&lsim;","𝔏":"&Lfr;","⋘":"&Ll;","⇚":"&lAarr;","Ŀ":"&Lmidot;","⟵":"&xlarr;","⟷":"&xharr;","⟶":"&xrarr;","𝕃":"&Lopf;","↙":"&swarrow;","↘":"&searrow;","↰":"&lsh;","Ł":"&Lstrok;","≪":"&ll;","⤅":"&Map;","М":"&Mcy;"," ":"&MediumSpace;","ℳ":"&phmmat;","𝔐":"&Mfr;","∓":"&mp;","𝕄":"&Mopf;","Μ":"&Mu;","Њ":"&NJcy;","Ń":"&Nacute;","Ň":"&Ncaron;","Ņ":"&Ncedil;","Н":"&Ncy;","​":"&ZeroWidthSpace;","\n":"&NewLine;","𝔑":"&Nfr;","⁠":"&NoBreak;"," ":"&nbsp;","ℕ":"&naturals;","⫬":"&Not;","≢":"&nequiv;","≭":"&NotCupCap;","∦":"&nspar;","∉":"&notinva;","≠":"&ne;","≂̸":"&nesim;","∄":"&nexists;","≯":"&ngtr;","≱":"&ngeq;","≧̸":"&ngeqq;","≫̸":"&nGtv;","≹":"&ntgl;","⩾̸":"&nges;","≵":"&ngsim;","≎̸":"&nbump;","≏̸":"&nbumpe;","⋪":"&ntriangleleft;","⧏̸":"&NotLeftTriangleBar;","⋬":"&ntrianglelefteq;","≮":"&nlt;","≰":"&nleq;","≸":"&ntlg;","≪̸":"&nLtv;","⩽̸":"&nles;","≴":"&nlsim;","⪢̸":"&NotNestedGreaterGreater;","⪡̸":"&NotNestedLessLess;","⊀":"&nprec;","⪯̸":"&npreceq;","⋠":"&nprcue;","∌":"&notniva;","⋫":"&ntriangleright;","⧐̸":"&NotRightTriangleBar;","⋭":"&ntrianglerighteq;","⊏̸":"&NotSquareSubset;","⋢":"&nsqsube;","⊐̸":"&NotSquareSuperset;","⋣":"&nsqsupe;","⊂⃒":"&vnsub;","⊈":"&nsubseteq;","⊁":"&nsucc;","⪰̸":"&nsucceq;","⋡":"&nsccue;","≿̸":"&NotSucceedsTilde;","⊃⃒":"&vnsup;","⊉":"&nsupseteq;","≁":"&nsim;","≄":"&nsimeq;","≇":"&ncong;","≉":"&napprox;","∤":"&nsmid;","𝒩":"&Nscr;","Ñ":"&Ntilde;","Ν":"&Nu;","Œ":"&OElig;","Ó":"&Oacute;","Ô":"&Ocirc;","О":"&Ocy;","Ő":"&Odblac;","𝔒":"&Ofr;","Ò":"&Ograve;","Ō":"&Omacr;","Ω":"&ohm;","Ο":"&Omicron;","𝕆":"&Oopf;","“":"&ldquo;","‘":"&lsquo;","⩔":"&Or;","𝒪":"&Oscr;","Ø":"&Oslash;","Õ":"&Otilde;","⨷":"&Otimes;","Ö":"&Ouml;","‾":"&oline;","⏞":"&OverBrace;","⎴":"&tbrk;","⏜":"&OverParenthesis;","∂":"&part;","П":"&Pcy;","𝔓":"&Pfr;","Φ":"&Phi;","Π":"&Pi;","±":"&pm;","ℙ":"&primes;","⪻":"&Pr;","≺":"&prec;","⪯":"&preceq;","≼":"&preccurlyeq;","≾":"&prsim;","″":"&Prime;","∏":"&prod;","∝":"&vprop;","𝒫":"&Pscr;","Ψ":"&Psi;",'"':"&quot;","𝔔":"&Qfr;","ℚ":"&rationals;","𝒬":"&Qscr;","⤐":"&drbkarow;","®":"&reg;","Ŕ":"&Racute;","⟫":"&Rang;","↠":"&twoheadrightarrow;","⤖":"&Rarrtl;","Ř":"&Rcaron;","Ŗ":"&Rcedil;","Р":"&Rcy;","ℜ":"&realpart;","∋":"&niv;","⇋":"&lrhar;","⥯":"&duhar;","Ρ":"&Rho;","⟩":"&rangle;","→":"&srarr;","⇥":"&rarrb;","⇄":"&rlarr;","⌉":"&rceil;","⟧":"&robrk;","⥝":"&RightDownTeeVector;","⇂":"&downharpoonright;","⥕":"&RightDownVectorBar;","⌋":"&rfloor;","⊢":"&vdash;","↦":"&mapsto;","⥛":"&RightTeeVector;","⊳":"&vrtri;","⧐":"&RightTriangleBar;","⊵":"&trianglerighteq;","⥏":"&RightUpDownVector;","⥜":"&RightUpTeeVector;","↾":"&upharpoonright;","⥔":"&RightUpVectorBar;","⇀":"&rightharpoonup;","⥓":"&RightVectorBar;","ℝ":"&reals;","⥰":"&RoundImplies;","⇛":"&rAarr;","ℛ":"&realine;","↱":"&rsh;","⧴":"&RuleDelayed;","Щ":"&SHCHcy;","Ш":"&SHcy;","Ь":"&SOFTcy;","Ś":"&Sacute;","⪼":"&Sc;","Š":"&Scaron;","Ş":"&Scedil;","Ŝ":"&Scirc;","С":"&Scy;","𝔖":"&Sfr;","↑":"&uparrow;","Σ":"&Sigma;","∘":"&compfn;","𝕊":"&Sopf;","√":"&radic;","□":"&square;","⊓":"&sqcap;","⊏":"&sqsubset;","⊑":"&sqsubseteq;","⊐":"&sqsupset;","⊒":"&sqsupseteq;","⊔":"&sqcup;","𝒮":"&Sscr;","⋆":"&sstarf;","⋐":"&Subset;","⊆":"&subseteq;","≻":"&succ;","⪰":"&succeq;","≽":"&succcurlyeq;","≿":"&succsim;","∑":"&sum;","⋑":"&Supset;","⊃":"&supset;","⊇":"&supseteq;","Þ":"&THORN;","™":"&trade;","Ћ":"&TSHcy;","Ц":"&TScy;","\t":"&Tab;","Τ":"&Tau;","Ť":"&Tcaron;","Ţ":"&Tcedil;","Т":"&Tcy;","𝔗":"&Tfr;","∴":"&therefore;","Θ":"&Theta;","  ":"&ThickSpace;"," ":"&thinsp;","∼":"&thksim;","≃":"&simeq;","≅":"&cong;","≈":"&thkap;","𝕋":"&Topf;","⃛":"&tdot;","𝒯":"&Tscr;","Ŧ":"&Tstrok;","Ú":"&Uacute;","↟":"&Uarr;","⥉":"&Uarrocir;","Ў":"&Ubrcy;","Ŭ":"&Ubreve;","Û":"&Ucirc;","У":"&Ucy;","Ű":"&Udblac;","𝔘":"&Ufr;","Ù":"&Ugrave;","Ū":"&Umacr;",_:"&lowbar;","⏟":"&UnderBrace;","⎵":"&bbrk;","⏝":"&UnderParenthesis;","⋃":"&xcup;","⊎":"&uplus;","Ų":"&Uogon;","𝕌":"&Uopf;","⤒":"&UpArrowBar;","⇅":"&udarr;","↕":"&varr;","⥮":"&udhar;","⊥":"&perp;","↥":"&mapstoup;","↖":"&nwarrow;","↗":"&nearrow;","ϒ":"&upsih;","Υ":"&Upsilon;","Ů":"&Uring;","𝒰":"&Uscr;","Ũ":"&Utilde;","Ü":"&Uuml;","⊫":"&VDash;","⫫":"&Vbar;","В":"&Vcy;","⊩":"&Vdash;","⫦":"&Vdashl;","⋁":"&xvee;","‖":"&Vert;","∣":"&smid;","|":"&vert;","❘":"&VerticalSeparator;","≀":"&wreath;"," ":"&hairsp;","𝔙":"&Vfr;","𝕍":"&Vopf;","𝒱":"&Vscr;","⊪":"&Vvdash;","Ŵ":"&Wcirc;","⋀":"&xwedge;","𝔚":"&Wfr;","𝕎":"&Wopf;","𝒲":"&Wscr;","𝔛":"&Xfr;","Ξ":"&Xi;","𝕏":"&Xopf;","𝒳":"&Xscr;","Я":"&YAcy;","Ї":"&YIcy;","Ю":"&YUcy;","Ý":"&Yacute;","Ŷ":"&Ycirc;","Ы":"&Ycy;","𝔜":"&Yfr;","𝕐":"&Yopf;","𝒴":"&Yscr;","Ÿ":"&Yuml;","Ж":"&ZHcy;","Ź":"&Zacute;","Ž":"&Zcaron;","З":"&Zcy;","Ż":"&Zdot;","Ζ":"&Zeta;","ℨ":"&zeetrf;","ℤ":"&integers;","𝒵":"&Zscr;","á":"&aacute;","ă":"&abreve;","∾":"&mstpos;","∾̳":"&acE;","∿":"&acd;","â":"&acirc;","а":"&acy;","æ":"&aelig;","𝔞":"&afr;","à":"&agrave;","ℵ":"&aleph;","α":"&alpha;","ā":"&amacr;","⨿":"&amalg;","∧":"&wedge;","⩕":"&andand;","⩜":"&andd;","⩘":"&andslope;","⩚":"&andv;","∠":"&angle;","⦤":"&ange;","∡":"&measuredangle;","⦨":"&angmsdaa;","⦩":"&angmsdab;","⦪":"&angmsdac;","⦫":"&angmsdad;","⦬":"&angmsdae;","⦭":"&angmsdaf;","⦮":"&angmsdag;","⦯":"&angmsdah;","∟":"&angrt;","⊾":"&angrtvb;","⦝":"&angrtvbd;","∢":"&angsph;","⍼":"&angzarr;","ą":"&aogon;","𝕒":"&aopf;","⩰":"&apE;","⩯":"&apacir;","≊":"&approxeq;","≋":"&apid;","'":"&apos;","å":"&aring;","𝒶":"&ascr;","*":"&midast;","ã":"&atilde;","ä":"&auml;","⨑":"&awint;","⫭":"&bNot;","≌":"&bcong;","϶":"&bepsi;","‵":"&bprime;","∽":"&bsim;","⋍":"&bsime;","⊽":"&barvee;","⌅":"&barwedge;","⎶":"&bbrktbrk;","б":"&bcy;","„":"&ldquor;","⦰":"&bemptyv;","β":"&beta;","ℶ":"&beth;","≬":"&twixt;","𝔟":"&bfr;","◯":"&xcirc;","⨀":"&xodot;","⨁":"&xoplus;","⨂":"&xotime;","⨆":"&xsqcup;","★":"&starf;","▽":"&xdtri;","△":"&xutri;","⨄":"&xuplus;","⤍":"&rbarr;","⧫":"&lozf;","▴":"&utrif;","▾":"&dtrif;","◂":"&ltrif;","▸":"&rtrif;","␣":"&blank;","▒":"&blk12;","░":"&blk14;","▓":"&blk34;","█":"&block;","=⃥":"&bne;","≡⃥":"&bnequiv;","⌐":"&bnot;","𝕓":"&bopf;","⋈":"&bowtie;","╗":"&boxDL;","╔":"&boxDR;","╖":"&boxDl;","╓":"&boxDr;","═":"&boxH;","╦":"&boxHD;","╩":"&boxHU;","╤":"&boxHd;","╧":"&boxHu;","╝":"&boxUL;","╚":"&boxUR;","╜":"&boxUl;","╙":"&boxUr;","║":"&boxV;","╬":"&boxVH;","╣":"&boxVL;","╠":"&boxVR;","╫":"&boxVh;","╢":"&boxVl;","╟":"&boxVr;","⧉":"&boxbox;","╕":"&boxdL;","╒":"&boxdR;","┐":"&boxdl;","┌":"&boxdr;","╥":"&boxhD;","╨":"&boxhU;","┬":"&boxhd;","┴":"&boxhu;","⊟":"&minusb;","⊞":"&plusb;","⊠":"&timesb;","╛":"&boxuL;","╘":"&boxuR;","┘":"&boxul;","└":"&boxur;","│":"&boxv;","╪":"&boxvH;","╡":"&boxvL;","╞":"&boxvR;","┼":"&boxvh;","┤":"&boxvl;","├":"&boxvr;","¦":"&brvbar;","𝒷":"&bscr;","⁏":"&bsemi;","\\":"&bsol;","⧅":"&bsolb;","⟈":"&bsolhsub;","•":"&bullet;","⪮":"&bumpE;","ć":"&cacute;","∩":"&cap;","⩄":"&capand;","⩉":"&capbrcup;","⩋":"&capcap;","⩇":"&capcup;","⩀":"&capdot;","∩︀":"&caps;","⁁":"&caret;","⩍":"&ccaps;","č":"&ccaron;","ç":"&ccedil;","ĉ":"&ccirc;","⩌":"&ccups;","⩐":"&ccupssm;","ċ":"&cdot;","⦲":"&cemptyv;","¢":"&cent;","𝔠":"&cfr;","ч":"&chcy;","✓":"&checkmark;","χ":"&chi;","○":"&cir;","⧃":"&cirE;","ˆ":"&circ;","≗":"&cire;","↺":"&olarr;","↻":"&orarr;","Ⓢ":"&oS;","⊛":"&oast;","⊚":"&ocir;","⊝":"&odash;","⨐":"&cirfnint;","⫯":"&cirmid;","⧂":"&cirscir;","♣":"&clubsuit;",":":"&colon;",",":"&comma;","@":"&commat;","∁":"&complement;","⩭":"&congdot;","𝕔":"&copf;","℗":"&copysr;","↵":"&crarr;","✗":"&cross;","𝒸":"&cscr;","⫏":"&csub;","⫑":"&csube;","⫐":"&csup;","⫒":"&csupe;","⋯":"&ctdot;","⤸":"&cudarrl;","⤵":"&cudarrr;","⋞":"&curlyeqprec;","⋟":"&curlyeqsucc;","↶":"&curvearrowleft;","⤽":"&cularrp;","∪":"&cup;","⩈":"&cupbrcap;","⩆":"&cupcap;","⩊":"&cupcup;","⊍":"&cupdot;","⩅":"&cupor;","∪︀":"&cups;","↷":"&curvearrowright;","⤼":"&curarrm;","⋎":"&cuvee;","⋏":"&cuwed;","¤":"&curren;","∱":"&cwint;","⌭":"&cylcty;","⥥":"&dHar;","†":"&dagger;","ℸ":"&daleth;","‐":"&hyphen;","⤏":"&rBarr;","ď":"&dcaron;","д":"&dcy;","⇊":"&downdownarrows;","⩷":"&eDDot;","°":"&deg;","δ":"&delta;","⦱":"&demptyv;","⥿":"&dfisht;","𝔡":"&dfr;","♦":"&diams;","ϝ":"&gammad;","⋲":"&disin;","÷":"&divide;","⋇":"&divonx;","ђ":"&djcy;","⌞":"&llcorner;","⌍":"&dlcrop;",$:"&dollar;","𝕕":"&dopf;","≑":"&eDot;","∸":"&minusd;","∔":"&plusdo;","⊡":"&sdotb;","⌟":"&lrcorner;","⌌":"&drcrop;","𝒹":"&dscr;","ѕ":"&dscy;","⧶":"&dsol;","đ":"&dstrok;","⋱":"&dtdot;","▿":"&triangledown;","⦦":"&dwangle;","џ":"&dzcy;","⟿":"&dzigrarr;","é":"&eacute;","⩮":"&easter;","ě":"&ecaron;","≖":"&eqcirc;","ê":"&ecirc;","≕":"&eqcolon;","э":"&ecy;","ė":"&edot;","≒":"&fallingdotseq;","𝔢":"&efr;","⪚":"&eg;","è":"&egrave;","⪖":"&eqslantgtr;","⪘":"&egsdot;","⪙":"&el;","⏧":"&elinters;","ℓ":"&ell;","⪕":"&eqslantless;","⪗":"&elsdot;","ē":"&emacr;","∅":"&varnothing;"," ":"&emsp13;"," ":"&emsp14;"," ":"&emsp;","ŋ":"&eng;"," ":"&ensp;","ę":"&eogon;","𝕖":"&eopf;","⋕":"&epar;","⧣":"&eparsl;","⩱":"&eplus;","ε":"&epsilon;","ϵ":"&varepsilon;","=":"&equals;","≟":"&questeq;","⩸":"&equivDD;","⧥":"&eqvparsl;","≓":"&risingdotseq;","⥱":"&erarr;","ℯ":"&escr;","η":"&eta;","ð":"&eth;","ë":"&euml;","€":"&euro;","!":"&excl;","ф":"&fcy;","♀":"&female;","ﬃ":"&ffilig;","ﬀ":"&fflig;","ﬄ":"&ffllig;","𝔣":"&ffr;","ﬁ":"&filig;",fj:"&fjlig;","♭":"&flat;","ﬂ":"&fllig;","▱":"&fltns;","ƒ":"&fnof;","𝕗":"&fopf;","⋔":"&pitchfork;","⫙":"&forkv;","⨍":"&fpartint;","½":"&half;","⅓":"&frac13;","¼":"&frac14;","⅕":"&frac15;","⅙":"&frac16;","⅛":"&frac18;","⅔":"&frac23;","⅖":"&frac25;","¾":"&frac34;","⅗":"&frac35;","⅜":"&frac38;","⅘":"&frac45;","⅚":"&frac56;","⅝":"&frac58;","⅞":"&frac78;","⁄":"&frasl;","⌢":"&sfrown;","𝒻":"&fscr;","⪌":"&gtreqqless;","ǵ":"&gacute;","γ":"&gamma;","⪆":"&gtrapprox;","ğ":"&gbreve;","ĝ":"&gcirc;","г":"&gcy;","ġ":"&gdot;","⪩":"&gescc;","⪀":"&gesdot;","⪂":"&gesdoto;","⪄":"&gesdotol;","⋛︀":"&gesl;","⪔":"&gesles;","𝔤":"&gfr;","ℷ":"&gimel;","ѓ":"&gjcy;","⪒":"&glE;","⪥":"&gla;","⪤":"&glj;","≩":"&gneqq;","⪊":"&gnapprox;","⪈":"&gneq;","⋧":"&gnsim;","𝕘":"&gopf;","ℊ":"&gscr;","⪎":"&gsime;","⪐":"&gsiml;","⪧":"&gtcc;","⩺":"&gtcir;","⋗":"&gtrdot;","⦕":"&gtlPar;","⩼":"&gtquest;","⥸":"&gtrarr;","≩︀":"&gvnE;","ъ":"&hardcy;","⥈":"&harrcir;","↭":"&leftrightsquigarrow;","ℏ":"&plankv;","ĥ":"&hcirc;","♥":"&heartsuit;","…":"&mldr;","⊹":"&hercon;","𝔥":"&hfr;","⤥":"&searhk;","⤦":"&swarhk;","⇿":"&hoarr;","∻":"&homtht;","↩":"&larrhk;","↪":"&rarrhk;","𝕙":"&hopf;","―":"&horbar;","𝒽":"&hscr;","ħ":"&hstrok;","⁃":"&hybull;","í":"&iacute;","î":"&icirc;","и":"&icy;","е":"&iecy;","¡":"&iexcl;","𝔦":"&ifr;","ì":"&igrave;","⨌":"&qint;","∭":"&tint;","⧜":"&iinfin;","℩":"&iiota;","ĳ":"&ijlig;","ī":"&imacr;","ı":"&inodot;","⊷":"&imof;","Ƶ":"&imped;","℅":"&incare;","∞":"&infin;","⧝":"&infintie;","⊺":"&intercal;","⨗":"&intlarhk;","⨼":"&iprod;","ё":"&iocy;","į":"&iogon;","𝕚":"&iopf;","ι":"&iota;","¿":"&iquest;","𝒾":"&iscr;","⋹":"&isinE;","⋵":"&isindot;","⋴":"&isins;","⋳":"&isinsv;","ĩ":"&itilde;","і":"&iukcy;","ï":"&iuml;","ĵ":"&jcirc;","й":"&jcy;","𝔧":"&jfr;","ȷ":"&jmath;","𝕛":"&jopf;","𝒿":"&jscr;","ј":"&jsercy;","є":"&jukcy;","κ":"&kappa;","ϰ":"&varkappa;","ķ":"&kcedil;","к":"&kcy;","𝔨":"&kfr;","ĸ":"&kgreen;","х":"&khcy;","ќ":"&kjcy;","𝕜":"&kopf;","𝓀":"&kscr;","⤛":"&lAtail;","⤎":"&lBarr;","⪋":"&lesseqqgtr;","⥢":"&lHar;","ĺ":"&lacute;","⦴":"&laemptyv;","λ":"&lambda;","⦑":"&langd;","⪅":"&lessapprox;","«":"&laquo;","⤟":"&larrbfs;","⤝":"&larrfs;","↫":"&looparrowleft;","⤹":"&larrpl;","⥳":"&larrsim;","↢":"&leftarrowtail;","⪫":"&lat;","⤙":"&latail;","⪭":"&late;","⪭︀":"&lates;","⤌":"&lbarr;","❲":"&lbbrk;","{":"&lcub;","[":"&lsqb;","⦋":"&lbrke;","⦏":"&lbrksld;","⦍":"&lbrkslu;","ľ":"&lcaron;","ļ":"&lcedil;","л":"&lcy;","⤶":"&ldca;","⥧":"&ldrdhar;","⥋":"&ldrushar;","↲":"&ldsh;","≤":"&leq;","⇇":"&llarr;","⋋":"&lthree;","⪨":"&lescc;","⩿":"&lesdot;","⪁":"&lesdoto;","⪃":"&lesdotor;","⋚︀":"&lesg;","⪓":"&lesges;","⋖":"&ltdot;","⥼":"&lfisht;","𝔩":"&lfr;","⪑":"&lgE;","⥪":"&lharul;","▄":"&lhblk;","љ":"&ljcy;","⥫":"&llhard;","◺":"&lltri;","ŀ":"&lmidot;","⎰":"&lmoustache;","≨":"&lneqq;","⪉":"&lnapprox;","⪇":"&lneq;","⋦":"&lnsim;","⟬":"&loang;","⇽":"&loarr;","⟼":"&xmap;","↬":"&rarrlp;","⦅":"&lopar;","𝕝":"&lopf;","⨭":"&loplus;","⨴":"&lotimes;","∗":"&lowast;","◊":"&lozenge;","(":"&lpar;","⦓":"&lparlt;","⥭":"&lrhard;","‎":"&lrm;","⊿":"&lrtri;","‹":"&lsaquo;","𝓁":"&lscr;","⪍":"&lsime;","⪏":"&lsimg;","‚":"&sbquo;","ł":"&lstrok;","⪦":"&ltcc;","⩹":"&ltcir;","⋉":"&ltimes;","⥶":"&ltlarr;","⩻":"&ltquest;","⦖":"&ltrPar;","◃":"&triangleleft;","⥊":"&lurdshar;","⥦":"&luruhar;","≨︀":"&lvnE;","∺":"&mDDot;","¯":"&strns;","♂":"&male;","✠":"&maltese;","▮":"&marker;","⨩":"&mcomma;","м":"&mcy;","—":"&mdash;","𝔪":"&mfr;","℧":"&mho;","µ":"&micro;","⫰":"&midcir;","−":"&minus;","⨪":"&minusdu;","⫛":"&mlcp;","⊧":"&models;","𝕞":"&mopf;","𝓂":"&mscr;","μ":"&mu;","⊸":"&mumap;","⋙̸":"&nGg;","≫⃒":"&nGt;","⇍":"&nlArr;","⇎":"&nhArr;","⋘̸":"&nLl;","≪⃒":"&nLt;","⇏":"&nrArr;","⊯":"&nVDash;","⊮":"&nVdash;","ń":"&nacute;","∠⃒":"&nang;","⩰̸":"&napE;","≋̸":"&napid;","ŉ":"&napos;","♮":"&natural;","⩃":"&ncap;","ň":"&ncaron;","ņ":"&ncedil;","⩭̸":"&ncongdot;","⩂":"&ncup;","н":"&ncy;","–":"&ndash;","⇗":"&neArr;","⤤":"&nearhk;","≐̸":"&nedot;","⤨":"&toea;","𝔫":"&nfr;","↮":"&nleftrightarrow;","⫲":"&nhpar;","⋼":"&nis;","⋺":"&nisd;","њ":"&njcy;","≦̸":"&nleqq;","↚":"&nleftarrow;","‥":"&nldr;","𝕟":"&nopf;","¬":"&not;","⋹̸":"&notinE;","⋵̸":"&notindot;","⋷":"&notinvb;","⋶":"&notinvc;","⋾":"&notnivb;","⋽":"&notnivc;","⫽⃥":"&nparsl;","∂̸":"&npart;","⨔":"&npolint;","↛":"&nrightarrow;","⤳̸":"&nrarrc;","↝̸":"&nrarrw;","𝓃":"&nscr;","⊄":"&nsub;","⫅̸":"&nsubseteqq;","⊅":"&nsup;","⫆̸":"&nsupseteqq;","ñ":"&ntilde;","ν":"&nu;","#":"&num;","№":"&numero;"," ":"&numsp;","⊭":"&nvDash;","⤄":"&nvHarr;","≍⃒":"&nvap;","⊬":"&nvdash;","≥⃒":"&nvge;",">⃒":"&nvgt;","⧞":"&nvinfin;","⤂":"&nvlArr;","≤⃒":"&nvle;","<⃒":"&nvlt;","⊴⃒":"&nvltrie;","⤃":"&nvrArr;","⊵⃒":"&nvrtrie;","∼⃒":"&nvsim;","⇖":"&nwArr;","⤣":"&nwarhk;","⤧":"&nwnear;","ó":"&oacute;","ô":"&ocirc;","о":"&ocy;","ő":"&odblac;","⨸":"&odiv;","⦼":"&odsold;","œ":"&oelig;","⦿":"&ofcir;","𝔬":"&ofr;","˛":"&ogon;","ò":"&ograve;","⧁":"&ogt;","⦵":"&ohbar;","⦾":"&olcir;","⦻":"&olcross;","⧀":"&olt;","ō":"&omacr;","ω":"&omega;","ο":"&omicron;","⦶":"&omid;","𝕠":"&oopf;","⦷":"&opar;","⦹":"&operp;","∨":"&vee;","⩝":"&ord;","ℴ":"&oscr;","ª":"&ordf;","º":"&ordm;","⊶":"&origof;","⩖":"&oror;","⩗":"&orslope;","⩛":"&orv;","ø":"&oslash;","⊘":"&osol;","õ":"&otilde;","⨶":"&otimesas;","ö":"&ouml;","⌽":"&ovbar;","¶":"&para;","⫳":"&parsim;","⫽":"&parsl;","п":"&pcy;","%":"&percnt;",".":"&period;","‰":"&permil;","‱":"&pertenk;","𝔭":"&pfr;","φ":"&phi;","ϕ":"&varphi;","☎":"&phone;","π":"&pi;","ϖ":"&varpi;","ℎ":"&planckh;","+":"&plus;","⨣":"&plusacir;","⨢":"&pluscir;","⨥":"&plusdu;","⩲":"&pluse;","⨦":"&plussim;","⨧":"&plustwo;","⨕":"&pointint;","𝕡":"&popf;","£":"&pound;","⪳":"&prE;","⪷":"&precapprox;","⪹":"&prnap;","⪵":"&prnE;","⋨":"&prnsim;","′":"&prime;","⌮":"&profalar;","⌒":"&profline;","⌓":"&profsurf;","⊰":"&prurel;","𝓅":"&pscr;","ψ":"&psi;"," ":"&puncsp;","𝔮":"&qfr;","𝕢":"&qopf;","⁗":"&qprime;","𝓆":"&qscr;","⨖":"&quatint;","?":"&quest;","⤜":"&rAtail;","⥤":"&rHar;","∽̱":"&race;","ŕ":"&racute;","⦳":"&raemptyv;","⦒":"&rangd;","⦥":"&range;","»":"&raquo;","⥵":"&rarrap;","⤠":"&rarrbfs;","⤳":"&rarrc;","⤞":"&rarrfs;","⥅":"&rarrpl;","⥴":"&rarrsim;","↣":"&rightarrowtail;","↝":"&rightsquigarrow;","⤚":"&ratail;","∶":"&ratio;","❳":"&rbbrk;","}":"&rcub;","]":"&rsqb;","⦌":"&rbrke;","⦎":"&rbrksld;","⦐":"&rbrkslu;","ř":"&rcaron;","ŗ":"&rcedil;","р":"&rcy;","⤷":"&rdca;","⥩":"&rdldhar;","↳":"&rdsh;","▭":"&rect;","⥽":"&rfisht;","𝔯":"&rfr;","⥬":"&rharul;","ρ":"&rho;","ϱ":"&varrho;","⇉":"&rrarr;","⋌":"&rthree;","˚":"&ring;","‏":"&rlm;","⎱":"&rmoustache;","⫮":"&rnmid;","⟭":"&roang;","⇾":"&roarr;","⦆":"&ropar;","𝕣":"&ropf;","⨮":"&roplus;","⨵":"&rotimes;",")":"&rpar;","⦔":"&rpargt;","⨒":"&rppolint;","›":"&rsaquo;","𝓇":"&rscr;","⋊":"&rtimes;","▹":"&triangleright;","⧎":"&rtriltri;","⥨":"&ruluhar;","℞":"&rx;","ś":"&sacute;","⪴":"&scE;","⪸":"&succapprox;","š":"&scaron;","ş":"&scedil;","ŝ":"&scirc;","⪶":"&succneqq;","⪺":"&succnapprox;","⋩":"&succnsim;","⨓":"&scpolint;","с":"&scy;","⋅":"&sdot;","⩦":"&sdote;","⇘":"&seArr;","§":"&sect;",";":"&semi;","⤩":"&tosa;","✶":"&sext;","𝔰":"&sfr;","♯":"&sharp;","щ":"&shchcy;","ш":"&shcy;","­":"&shy;","σ":"&sigma;","ς":"&varsigma;","⩪":"&simdot;","⪞":"&simg;","⪠":"&simgE;","⪝":"&siml;","⪟":"&simlE;","≆":"&simne;","⨤":"&simplus;","⥲":"&simrarr;","⨳":"&smashp;","⧤":"&smeparsl;","⌣":"&ssmile;","⪪":"&smt;","⪬":"&smte;","⪬︀":"&smtes;","ь":"&softcy;","/":"&sol;","⧄":"&solb;","⌿":"&solbar;","𝕤":"&sopf;","♠":"&spadesuit;","⊓︀":"&sqcaps;","⊔︀":"&sqcups;","𝓈":"&sscr;","☆":"&star;","⊂":"&subset;","⫅":"&subseteqq;","⪽":"&subdot;","⫃":"&subedot;","⫁":"&submult;","⫋":"&subsetneqq;","⊊":"&subsetneq;","⪿":"&subplus;","⥹":"&subrarr;","⫇":"&subsim;","⫕":"&subsub;","⫓":"&subsup;","♪":"&sung;","¹":"&sup1;","²":"&sup2;","³":"&sup3;","⫆":"&supseteqq;","⪾":"&supdot;","⫘":"&supdsub;","⫄":"&supedot;","⟉":"&suphsol;","⫗":"&suphsub;","⥻":"&suplarr;","⫂":"&supmult;","⫌":"&supsetneqq;","⊋":"&supsetneq;","⫀":"&supplus;","⫈":"&supsim;","⫔":"&supsub;","⫖":"&supsup;","⇙":"&swArr;","⤪":"&swnwar;","ß":"&szlig;","⌖":"&target;","τ":"&tau;","ť":"&tcaron;","ţ":"&tcedil;","т":"&tcy;","⌕":"&telrec;","𝔱":"&tfr;","θ":"&theta;","ϑ":"&vartheta;","þ":"&thorn;","×":"&times;","⨱":"&timesbar;","⨰":"&timesd;","⌶":"&topbot;","⫱":"&topcir;","𝕥":"&topf;","⫚":"&topfork;","‴":"&tprime;","▵":"&utri;","≜":"&trie;","◬":"&tridot;","⨺":"&triminus;","⨹":"&triplus;","⧍":"&trisb;","⨻":"&tritime;","⏢":"&trpezium;","𝓉":"&tscr;","ц":"&tscy;","ћ":"&tshcy;","ŧ":"&tstrok;","⥣":"&uHar;","ú":"&uacute;","ў":"&ubrcy;","ŭ":"&ubreve;","û":"&ucirc;","у":"&ucy;","ű":"&udblac;","⥾":"&ufisht;","𝔲":"&ufr;","ù":"&ugrave;","▀":"&uhblk;","⌜":"&ulcorner;","⌏":"&ulcrop;","◸":"&ultri;","ū":"&umacr;","ų":"&uogon;","𝕦":"&uopf;","υ":"&upsilon;","⇈":"&uuarr;","⌝":"&urcorner;","⌎":"&urcrop;","ů":"&uring;","◹":"&urtri;","𝓊":"&uscr;","⋰":"&utdot;","ũ":"&utilde;","ü":"&uuml;","⦧":"&uwangle;","⫨":"&vBar;","⫩":"&vBarv;","⦜":"&vangrt;","⊊︀":"&vsubne;","⫋︀":"&vsubnE;","⊋︀":"&vsupne;","⫌︀":"&vsupnE;","в":"&vcy;","⊻":"&veebar;","≚":"&veeeq;","⋮":"&vellip;","𝔳":"&vfr;","𝕧":"&vopf;","𝓋":"&vscr;","⦚":"&vzigzag;","ŵ":"&wcirc;","⩟":"&wedbar;","≙":"&wedgeq;","℘":"&wp;","𝔴":"&wfr;","𝕨":"&wopf;","𝓌":"&wscr;","𝔵":"&xfr;","ξ":"&xi;","⋻":"&xnis;","𝕩":"&xopf;","𝓍":"&xscr;","ý":"&yacute;","я":"&yacy;","ŷ":"&ycirc;","ы":"&ycy;","¥":"&yen;","𝔶":"&yfr;","ї":"&yicy;","𝕪":"&yopf;","𝓎":"&yscr;","ю":"&yucy;","ÿ":"&yuml;","ź":"&zacute;","ž":"&zcaron;","з":"&zcy;","ż":"&zdot;","ζ":"&zeta;","𝔷":"&zfr;","ж":"&zhcy;","⇝":"&zigrarr;","𝕫":"&zopf;","𝓏":"&zscr;","‍":"&zwj;","‌":"&zwnj;"}}};
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
  //      improved by: Rafał Kukawski
  // reimplemented by: Rafał Kukawski
  //           note 1: We feel the main purpose of this function should be
  //           note 1: to ease the transport of data between php & js
  //           note 1: Aiming for PHP-compatibility, we have to translate objects to arrays
  //        example 1: unserialize('a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}')
  //        returns 1: ['Kevin', 'van', 'Zonneveld']
  //        example 2: unserialize('a:2:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";}')
  //        returns 2: {firstName: 'Kevin', midName: 'van'}
  //        example 3: unserialize('a:3:{s:2:"ü";s:2:"ü";s:3:"四";s:3:"四";s:4:"𠜎";s:4:"𠜎";}')
  //        returns 3: {'ü': 'ü', '四': '四', '𠜎': '𠜎'}
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

var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
function mkFile(filePath, size) {
  return new Promise((resolve, reject) => {
    const docurl = new Process("/usr/bin/env", {
      args: ["mkfile", "-n", size.toString(), filePath]
    });
    let stdOut = "";
    let stdErr = "";
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
function compressFile(command) {
  return new Promise((resolve, reject) => {
    const docurl = new Process("/usr/bin/env", {
      args: command
    });
    let stdOut = "";
    let stdErr = "";
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
function dummyFile(filePath, fileName, size) {
  return __async(this, null, function* () {
    if (!filePath) {
      throw new Error("File path must be provided");
    }
    if (!fileName) {
      throw new Error("File name must be provided");
    }
    size = size.toLowerCase().replace(/\s/g, "").replace(/,/, "");
    size = size.replace(/([0-9.]+)(gigabytes|gigas|giga|gbs|gb)/i, (r1, r2) => {
      return r2 + "gb";
    });
    size = size.replace(/([0-9.]+)(megabytes|megabyte|mbs|mb)/i, (r1, r2) => {
      return r2 + "mb";
    });
    size = size.replace(/([0-9.]+)(kilobytes|kilobyte|kbs|kb)/i, (r1, r2) => {
      return r2 + "kb";
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
    if (fileName.endsWith(".zip")) {
      isZip = nova.path.join(filePath, fileName);
      fileName = fileName.replace(".zip", ".txt");
    }
    if (fileName.endsWith(".tar")) {
      isTar = nova.path.join(filePath, fileName);
      fileName = fileName.replace(".tar", ".txt");
    }
    filePath = nova.path.join(filePath, fileName);
    if (bMatch) {
      size = +bMatch[1];
    }
    if (kbMatch) {
      size = +kbMatch[1] * 1e3;
    }
    if (mbMatch) {
      size = +mbMatch[1] * 1e3 * 1e3;
    }
    if (gbMatch) {
      size = +gbMatch[1] * 1e3 * 1e3 * 1e3;
    }
    if (size < 0) {
      throw new Error("File size must be provided");
    }
    if (size >= 3e10) {
      throw new Error("File size limit is 30GB just in case");
    }
    mkFile(filePath, size).then((res) => {
      if (isZip) {
        return compressFile(["zip", "-m", "-0", isZip, filePath]);
      }
      if (isTar) {
        return compressFile(["tar", "-cf", isTar, filePath]);
      }
      return true;
    }).then(() => {
      return true;
    }).catch((error) => {
      console.error(error);
    });
  });
}

function log(message2) {
  const showLog = nova.workspace.config.get(nova.extension.identifier + ".log");
  if (nova.inDevMode() || showLog) {
    if (typeof message2 == "object") {
      message2 = JSON.stringify(message2, null, 2);
    }
    console.log(message2);
  }
}
function logPerformanceStart(id = "") {
  const showLog = nova.workspace.config.get(nova.extension.identifier + ".log");
  if (nova.inDevMode() || showLog) {
    console.time(id);
  }
}
function logPerformanceEnd(id = "") {
  const showLog = nova.workspace.config.get(nova.extension.identifier + ".log");
  if (nova.inDevMode() || showLog) {
    if (typeof message == "object") {
      message = JSON.stringify(message, null, " ");
    }
    console.timeEnd(id);
  }
}
function showNotification({ id = "", title, body, actions = false, type = "", cancellAll = true }) {
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
    if (typeof actions === "boolean") {
      request.actions = [nova.localize("OK")];
    } else {
      request.actions = actions.map((action) => nova.localize(action));
    }
  }
  nova.notifications.add(request).catch((err) => console.error(err, err.stack));
}

function titleCase(string) {
  const SMALL_WORDS = /\b(?:an?d?|a[st]|because|but|by|en|for|i[fn]|neither|nor|o[fnr]|only|over|per|so|some|tha[tn]|the|to|up|upon|vs?\.?|versus|via|when|with|without|yet)\b/i;
  const TOKENS = /[^\s:–—-]+|./g;
  const WHITESPACE = /\s/;
  const IS_MANUAL_CASE = /.(?=[A-Z]|\..)/;
  const ALPHANUMERIC_PATTERN = /[A-Za-z0-9\u00C0-\u00FF]/;
  let result = "";
  let m;
  while ((m = TOKENS.exec(string)) !== null) {
    const { 0: token, index } = m;
    if (!IS_MANUAL_CASE.test(token) && (!SMALL_WORDS.test(token) || index === 0 || index + token.length === string.length) && (string.charAt(index + token.length) !== ":" || WHITESPACE.test(string.charAt(index + token.length + 1)))) {
      result += token.replace(ALPHANUMERIC_PATTERN, (m2) => m2.toUpperCase());
      continue;
    }
    result += token;
  }
  return result;
}
function romanize(num) {
  if (isNaN(num)) {
    return NaN;
  }
  var digits = String(+num).split(""), key = [
    "",
    "C",
    "CC",
    "CCC",
    "CD",
    "D",
    "DC",
    "DCC",
    "DCCC",
    "CM",
    "",
    "X",
    "XX",
    "XXX",
    "XL",
    "L",
    "LX",
    "LXX",
    "LXXX",
    "XC",
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX"
  ], roman = "", i = 3;
  while (i--) {
    roman = (key[+digits.pop() + i * 10] || "") + roman;
  }
  return Array(+digits.join("") + 1).join("M") + roman;
}
function ordinalSuffix(i) {
  var j = i % 10, k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}
function randomArray(array) {
  var currentIndex = array.length, randomIndex;
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
    case "Full Name":
      val = faker.name.findName();
      break;
    case "Name":
      val = faker.name.firstName();
      break;
    case "Lastname":
      val = faker.name.lastName();
      break;
    case "Email":
      val = faker.internet.email();
      break;
    case "Phone":
      val = faker.phone.phoneNumber();
      break;
    case "Credit Card":
      val = faker.finance.creditCardNumber();
      break;
    case "User Name":
      val = faker.internet.userName();
      break;
    case "URL":
      val = faker.internet.url();
      break;
    case "Full Address":
      val = faker.address.streetAddress() + ", " + faker.address.city() + ", " + faker.address.country() + ", Zip Code " + faker.address.zipCode();
      break;
    case "Country":
      val = faker.address.country();
      break;
    case "City":
      val = faker.address.city();
      break;
    case "Street":
      val = faker.address.streetAddress();
      break;
    case "Zip Code":
      val = faker.address.zipCode();
      break;
    case "Company":
      val = faker.company.companyName();
      break;
    case "Lorem Paragraph":
      val = faker.lorem.paragraph();
      break;
    case "Lorem Paragraphs":
      val = faker.lorem.paragraphs();
      break;
    case "Number":
      val = faker.datatype.number().toString();
      break;
    case "JSON":
      val = faker.datatype.json();
      break;
    case "Array":
      val = faker.random.arrayElements();
      break;
    case "UUID":
      val = faker.datatype.uuid();
      break;
  }
  return val;
}
function quotesTransform(input, toChange, changeTo) {
  let result = "";
  let isBetweenQuotes = false;
  let quoteCharacter;
  for (let index = 0; index < input.length; index++) {
    const current = input[index];
    const next = input[index + 1];
    if (current === '"' || current === "'") {
      if (!isBetweenQuotes) {
        quoteCharacter = current;
        isBetweenQuotes = true;
        result += changeTo;
      } else if (quoteCharacter === current) {
        result += changeTo;
        isBetweenQuotes = false;
      } else {
        result += "\\" + changeTo;
      }
    } else if (current === "\\" && (next === "'" || next === '"')) {
      if (next === changeTo) {
        result += isBetweenQuotes && quoteCharacter === changeTo ? "\\" + changeTo : "\\\\" + changeTo;
        index++;
      } else if (next === toChange) {
        result += isBetweenQuotes ? toChange : changeTo;
        index++;
      } else {
        result += current;
      }
    } else if (current === "\\" && next === "\\") {
      result += "\\\\";
      index++;
    } else {
      result += current;
    }
  }
  return result;
}
function escape(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isRegexLike(string) {
  return /\\w|\\s|\\d|\\b|\\.|\.\*|\.\+/.test(string);
}
function toBinary(n) {
  let value = convertToBinary(n);
  let length = value.length;
  while (length < 8) {
    value = "0" + value;
    length++;
  }
  return value;
}
function fromBinary(binary) {
  let out = "";
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

var __async$1 = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
class NovaTextTools {
  constructor() {
  }
  process(command, editor, fn, action = "replace") {
    let selectedRanges = editor.selectedRanges;
    if (selectedRanges.length === 1 && selectedRanges[0].start === selectedRanges[0].end) {
      selectedRanges = [new Range(0, editor.document.length)];
    }
    let prevDeletedRange = 0;
    for (let range of selectedRanges) {
      const text = editor.getTextInRange(range);
      Promise.resolve(fn.apply(this, [text])).then((response) => {
        if (!response && typeof response !== "string") {
          return false;
        }
        if (action === "replace") {
          let deletedRange;
          if (response.length < range.length) {
            deletedRange = new Range(range.start + response.length, range.end);
            range = new Range(range.start, range.start + response.length);
          }
          if (prevDeletedRange > 0) {
            range = new Range(range.start - prevDeletedRange, range.start + response.length - prevDeletedRange);
            if (deletedRange) {
              deletedRange = new Range(deletedRange.start - prevDeletedRange, deletedRange.end - prevDeletedRange);
            }
          }
          editor.edit((e) => {
            if (deletedRange) {
              prevDeletedRange += deletedRange.length;
              e.delete(deletedRange);
            }
            e.replace(range, response);
          });
        }
        if (action === "insert") {
          console.log("action", action, response);
          editor.insert(response);
        }
      });
    }
  }
  deleteDuplicates(text) {
    const lines = text.split("\n");
    return [...new Set(lines)].join("\n");
  }
  filterDuplicates(text) {
    const lines = text.split("\n");
    const set = new Set(lines);
    const duplicates = lines.filter((line) => {
      if (set.has(line)) {
        set.delete(line);
      } else {
        return line;
      }
    });
    return [...new Set(duplicates)].join("\n");
  }
  filterDuplicatesNewDoc(text) {
    const lines = text.split("\n");
    const set = new Set(lines);
    const duplicates = lines.filter((line) => {
      if (set.has(line)) {
        set.delete(line);
      } else {
        return line;
      }
    });
    this.newDocument([...new Set(duplicates)].join("\n"));
    return false;
  }
  deleteEmptyLines(text) {
    const lines = text.split("\n");
    return lines.filter((line) => line.trim() !== "").join("\n");
  }
  deleteLinesMatching(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Delete Lines Matching...", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        resolve(this.filterLines(text, val, false));
      });
    });
  }
  filterUniques(text) {
    const lines = text.split("\n");
    return lines.filter((line) => {
      return lines.lastIndexOf(line) == lines.indexOf(line);
    }).join("\n");
  }
  filterUniquesNewDoc(text) {
    const filtered = this.filterUniques(text);
    this.newDocument(filtered);
    return false;
  }
  filterLinesMatching(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Keep Lines Matching...", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        resolve(this.filterLines(text, val, true));
      });
    });
  }
  filterLinesMatchingNewDoc(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Keep Lines Matching...", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        this.newDocument(this.filterLines(text, val, true));
        resolve(false);
      });
    });
  }
  filterLines(text, search, keep = true, caseSensitive = false) {
    const isFullRegex = search.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
    let isRegex = false;
    let isMatchStart = search.startsWith("^");
    let isMatchEnd = search.endsWith("$");
    let isNot = search.startsWith("!");
    let defaultModifier = caseSensitive ? "g" : "gi";
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
    const lines = text.split("\n");
    return lines.filter((line) => {
      if (line.trim() === "") {
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
        } catch (error) {
        }
      } else if (isMatchStart) {
        match = line.trimStart().startsWith(search);
      } else if (isMatchEnd) {
        match = line.trimEnd().endsWith(search);
      } else {
        match = line.includes(search);
      }
      if (match == true && isNot == true || match == false && isNot == true) {
        match = !match;
      }
      return match;
    }).join("\n");
  }
  wrapLinesWith(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Wrap Each Line With", {
        placeholder: "<li>$1</li>"
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        const lines = text.split("\n");
        const wrapped = lines.map((line) => {
          const whitespace = line.match(/^[\s]*/g);
          let newLine = val;
          if (whitespace && whitespace[0]) {
            newLine = whitespace[0] + newLine;
          }
          return newLine.replace("$1", line.trim());
        });
        resolve(wrapped.join("\n"));
      });
    });
  }
  appendToLines(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Enter text to add at the beginning", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        const lines = text.split("\n");
        const appended = lines.map((line) => {
          const whitespace = line.match(/^[\s]*/g);
          let newLine = val + line;
          if (whitespace && whitespace[0]) {
            newLine = whitespace[0] + val + line.trimStart();
          }
          return newLine;
        });
        resolve(appended.join("\n"));
      });
    });
  }
  prependToLines(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Enter text to add at the end", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        const lines = text.split("\n");
        const prepended = lines.map((line) => {
          return line + val;
        });
        resolve(prepended.join("\n"));
      });
    });
  }
  sortLinesAlphanumerically(text) {
    const lines = text.split("\n");
    const firstLineIndent = lines[0].match(/^[\s]*/g);
    const lastLineIndent = lines[lines.length - 1].match(/^[\s]*/g);
    const sorted = lines.sort((a, b) => {
      return a.localeCompare(b, void 0, { numeric: true, sensitivity: "case" });
    });
    if (firstLineIndent) {
      sorted[0] = sorted[0].replace(/^[\s]*/g, firstLineIndent[0]);
    }
    if (lastLineIndent) {
      sorted[lines.length - 1] = sorted[lines.length - 1].replace(/^[\s]*/g, lastLineIndent[0]);
    }
    return sorted.join("\n");
  }
  sortLinesAlphanumericallyReverse(text) {
    const lines = text.split("\n");
    const firstLineIndent = lines[0].match(/^[\s]*/g);
    const lastLineIndent = lines[lines.length - 1].match(/^[\s]*/g);
    const sorted = lines.sort((a, b) => {
      return a.localeCompare(b, void 0, { numeric: true, sensitivity: "case" });
    }).reverse();
    if (firstLineIndent) {
      sorted[0] = sorted[0].replace(/^[\s]*/g, firstLineIndent[0]);
    }
    if (lastLineIndent) {
      sorted[lines.length - 1] = sorted[lines.length - 1].replace(/^[\s]*/g, lastLineIndent[0]);
    }
    return sorted.join("\n");
  }
  sortLinesByLength(text) {
    const lines = text.split("\n");
    const firstLineIndent = lines[0].match(/^[\s]*/g);
    const lastLineIndent = lines[lines.length - 1].match(/^[\s]*/g);
    const sorted = lines.sort((a, b) => {
      return a.length - b.length;
    });
    if (firstLineIndent) {
      sorted[0] = sorted[0].replace(/^[\s]*/g, firstLineIndent[0]);
    }
    if (lastLineIndent) {
      sorted[lines.length - 1] = sorted[lines.length - 1].replace(/^[\s]*/g, lastLineIndent[0]);
    }
    return sorted.join("\n");
  }
  sortLinesByLengthReverse(text) {
    const lines = text.split("\n");
    const firstLineIndent = lines[0].match(/^[\s]*/g);
    const lastLineIndent = lines[lines.length - 1].match(/^[\s]*/g);
    const sorted = lines.sort((a, b) => {
      return b.length - a.length;
    });
    if (firstLineIndent) {
      sorted[0] = sorted[0].replace(/^[\s]*/g, firstLineIndent[0]);
    }
    if (lastLineIndent) {
      sorted[lines.length - 1] = sorted[lines.length - 1].replace(/^[\s]*/g, lastLineIndent[0]);
    }
    return sorted.join("\n");
  }
  reverseLines(text) {
    const lines = text.split("\n");
    const firstLineIndent = lines[0].match(/^[\s]*/g);
    const lastLineIndent = lines[lines.length - 1].match(/^[\s]*/g);
    return lines.reverse().map((line, index) => {
      if (index === 0 && firstLineIndent) {
        line = line.replace(/^[\s]*/g, firstLineIndent[0]);
      }
      if (index === lines.length - 1 && lastLineIndent) {
        line = line.replace(/^[\s]*/g, lastLineIndent[0]);
      }
      return line;
    }).join("\n");
  }
  joinLines(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Join Lines Delimiter", {
        placeholder: "Delimiter"
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        resolve(text.split("\n").join(val));
      });
    });
  }
  splitToLines(text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Split Text at Delimiter", {
        placeholder: "Delimiter"
      }, (val) => {
        if (!val) {
          resolve(false);
          return;
        }
        const splitted = text.split(val).map((line) => {
          return line.trimStart();
        });
        resolve(splitted.join("\n"));
      });
    });
  }
  randomLines(text) {
    return randomArray(text.split("\n")).join("\n");
  }
  toLowercase(text) {
    return text.toLowerCase();
  }
  toUpperCase(text) {
    return text.toUpperCase();
  }
  toSnakeCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return snakeCase(this.normalizeText(line));
    }).join("\n");
  }
  toPascalSnakeCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return pascalCase(this.normalizeText(line), { delimiter: "_" });
    }).join("\n");
  }
  toCamelSnakeCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return camelCase(this.normalizeText(line), { delimiter: "_" });
    }).join("\n");
  }
  toCapitalCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return line.replace(/(^|\s)\S/g, (l) => l.toUpperCase());
    }).join("\n");
  }
  toCamelCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return camelCase(this.normalizeText(line));
    }).join("\n");
  }
  toConstantCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return constantCase(this.normalizeText(line));
    }).join("\n");
  }
  toDotCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return dotCase(this.normalizeText(line));
    }).join("\n");
  }
  toHeaderCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return headerCase(line);
    }).join("\n");
  }
  toNoCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return noCase(this.normalizeText(line));
    }).join("\n");
  }
  toFlatCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return noCase(this.normalizeText(line), { delimiter: "" });
    }).join("\n");
  }
  toParamCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return paramCase(this.normalizeText(line));
    }).join("\n");
  }
  toScreamingParamCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return paramCase(this.normalizeText(line)).toUpperCase();
    }).join("\n");
  }
  toPascalCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return pascalCase(this.normalizeText(line));
    }).join("\n");
  }
  toPathCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return pathCase(this.normalizeText(line));
    }).join("\n");
  }
  toSentenceCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return sentenceCase(this.normalizeText(line));
    }).join("\n");
  }
  toSpongeCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      let result = "";
      for (let i = 0; i < line.length; i++) {
        result += Math.random() > 0.5 ? line[i].toUpperCase() : line[i].toLowerCase();
      }
      return result;
    }).join("\n");
  }
  toTitleCase(text) {
    const lines = text.split("\n");
    return lines.map((line) => {
      return titleCase(line.toLowerCase());
    }).join("\n");
  }
  addLinesNumbers(text, format = false) {
    return new Promise((resolve, reject) => {
      if (!format) {
        nova.workspace.showChoicePalette([
          "Add Line Numbers with 1 ",
          "Add Line Numbers with 1.",
          "Add Line Numbers with 1)",
          "Add Line Numbers with 1.-",
          "Add Line Numbers with 1 -",
          "Add Line Numbers with 1:",
          "Add Line Numbers with Ordinal",
          "Add Line Numbers with Roman Numerals"
        ], { placeholder: "" }, (sel) => {
          if (!sel) {
            resolve(false);
            return false;
          }
          sel = sel.replace("Add Line Numbers with 1", "");
          sel = sel.replace("Add Line Numbers with ", "");
          resolve(this.addLinesNumbers(text, sel));
        });
        return false;
      }
      const lines = text.split("\n");
      const firstLineIndent = lines[0].match(/^[\s]*/g);
      const lastLineIndent = lines[lines.length - 1].match(/^[\s]*/g);
      const ordered = lines.map((line, i) => {
        i = i + 1;
        let whitespace = line.match(/^[\s]*/g);
        let leading = "";
        if (whitespace && whitespace[0]) {
          leading = whitespace[0];
        }
        switch (format) {
          case "Ordinal":
            i = ordinalSuffix(i);
            line = `${leading}${i} ${line.trimStart()}`;
            break;
          case "Roman Numerals":
            i = romanize(i);
            line = `${leading}${i} ${line.trimStart()}`;
            break;
          default:
            line = `${leading}${i}${format} ${line.trimStart()}`;
        }
        return line;
      });
      if (firstLineIndent) {
        ordered[0] = ordered[0].replace(/^[\s]*/g, firstLineIndent[0]);
      }
      if (lastLineIndent) {
        ordered[lines.length - 1] = ordered[lines.length - 1].replace(/^[\s]*/g, lastLineIndent[0]);
      }
      resolve(ordered.join("\n"));
    });
  }
  base64Encode(text) {
    return btoa(text);
  }
  base64Decode(text) {
    return atob(text);
  }
  urlEncode(text) {
    return encodeURIComponent(text);
  }
  urlDecode(text) {
    return decodeURIComponent(text);
  }
  spacesEncode(text) {
    return text.replace(/ /g, "%20");
  }
  spacesDecode(text) {
    return text.replace(/%20/g, " ");
  }
  htmlEncode(text) {
    return index.encode(text);
  }
  htmlDecode(text) {
    return index.decode(text);
  }
  asciiToDecimal(text, fn = null) {
    let encoded = [];
    for (const letter of text) {
      let decimal = Number(letter.charCodeAt(0).toString(10));
      if (fn) {
        decimal = fn(decimal);
      }
      encoded.push(decimal);
    }
    return encoded.join(" ");
  }
  htmlAsciiToDecimal(text) {
    let encoded = this.asciiToDecimal(text, (decimal) => {
      decimal = decimal < 100 ? "0" + decimal : decimal;
      return "&#" + decimal + ";";
    });
    return encoded.replace(/ /g, "");
  }
  asciiToHex(text) {
    let encoded = [];
    for (const letter of text) {
      encoded.push(Number(letter.charCodeAt(0)).toString(16));
    }
    return encoded.join(" ").toUpperCase();
  }
  textToBinary(text) {
    let binary = [];
    for (const letter of text) {
      binary.push(toBinary(letter.charCodeAt(0)));
    }
    return binary.join(" ");
  }
  binaryToText(text) {
    let string = [];
    text.split(" ").forEach((binary) => {
      string.push(fromBinary(binary));
    });
    return string.join("");
  }
  rot13(text) {
    return text.replace(/[a-zA-Z]/g, function(c) {
      return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
  }
  stripSlashes(text) {
    return text.replace(/\\/g, "");
  }
  addSlashes(text) {
    return text.replace(/'|\\'/g, "\\'").replace(/"|\\"/g, '\\"');
  }
  smartQuotes(text) {
    return text.replace(/(^|[-\u2014\s(\["])'/g, "$1\u2018").replace(/'/g, "\u2019").replace(/(^|[-\u2014/\[(\u2018\s])"/g, "$1\u201C").replace(/"/g, "\u201D").replace(/--/g, "\u2014");
  }
  straightenQuotes(text) {
    return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[\u2026]/g, "...");
  }
  quotesSingleToDouble(text) {
    return quotesTransform(text, "'", '"');
  }
  quotesSingleToBackticks(text) {
    return quotesTransform(text, "'", "`");
  }
  quotesDoubleToSingle(text) {
    return quotesTransform(text, '"', "'");
  }
  quotesDoubleToBackticks(text) {
    return quotesTransform(text, '"', "`");
  }
  select(editor, fn) {
    return __async$1(this, null, function* () {
      let selectedRanges = [new Range(0, editor.document.length)];
      for (const range of selectedRanges) {
        const text = editor.getTextInRange(range);
        Promise.resolve(fn.apply(this, [editor, text])).then((response) => {
          if (!response || !response.length) {
            return false;
          }
          log("Matches found " + response.length);
          logPerformanceStart("Nova select");
          editor.selectedRanges = [new Range(response[0].start, response[0].end)];
          editor.selectedRanges = response;
          editor.scrollToPosition(response[0].start);
          logPerformanceEnd("Nova select");
        });
      }
    });
  }
  selectLinesMatching(editor, text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Select Lines Matching...", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve([]);
          return;
        }
        logPerformanceStart("select lines by match");
        const matched = this.filterLines(text, val, true);
        if (!matched || !matched.length) {
          resolve([]);
          return;
        }
        const lines = matched.split("\n");
        const allText = editor.getTextInRange(new Range(0, editor.document.length));
        const newRanges = [];
        for (let line of lines) {
          line = escape(line);
          const regex = new RegExp("^" + line + "$", "gm");
          const matchedInDoc = [...allText.matchAll(regex)];
          if (matchedInDoc && matchedInDoc.length) {
            matchedInDoc.forEach((match) => {
              const matchStart = match.index;
              const matchEnd = matchStart + match[0].length;
              const matchedrange = new Range(matchStart, matchEnd);
              const matchedLinerange = editor.getLineRangeForRange(matchedrange);
              const lineText = line;
              const leading = lineText.match(/^[\s]+/);
              let lineStartRange = matchedLinerange.start;
              let lineEndRange = matchedLinerange.end - 1;
              if (leading && leading.length === 1 && typeof leading[0] === "string") {
                lineStartRange += leading[0].length;
              }
              newRanges.push(new Range(lineStartRange, lineEndRange));
            });
          }
        }
        logPerformanceEnd("select lines by match");
        resolve(newRanges);
      });
    });
  }
  selectAllOcurrencesMatching(editor, text) {
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Select Ocurrences Matching...", {
        placeholder: ""
      }, (val) => {
        if (!val) {
          resolve([]);
          return;
        }
        const isFullRegex = val.match(/^([/~@;%#'])(.*?)\1([gimsuy]*)$/);
        let regex = false;
        let isMatchStart = val.startsWith("^");
        let isMatchEnd = val.endsWith("$");
        let isNot = val.startsWith("!");
        let defaultModifier =  "gi";
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
              console.log("defaultModifier", defaultModifier);
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
          matchedInDoc.forEach((match) => {
            let fullMatch = match[0];
            let matchStart = match.index;
            let matchEnd = matchStart + match[0].length;
            if (match.length <= 1) {
              newRanges.push(new Range(matchStart, matchEnd));
            } else {
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
      });
    });
  }
  selectOcurrences(editor, text) {
    let selected = editor.selectedText;
    if (!selected) {
      return false;
    }
    selected = escape(selected);
    const allText = editor.getTextInRange(new Range(0, editor.document.length));
    const regex = new RegExp(selected, "gi");
    const matchedInDoc = [...allText.matchAll(regex)];
    const newRanges = [];
    if (matchedInDoc && matchedInDoc.length) {
      matchedInDoc.forEach((match) => {
        newRanges.push(new Range(match.index, match.index + match[0].length));
      });
    }
    return newRanges;
  }
  addAllNumbers(text) {
    const lines = text.split("\n");
    const sum = lines.reduce((acc, val) => {
      let lineval = 0;
      if (val && val.trim()) {
        val = val.replace(/[^0-9\.,-]+/g, "");
        val = parseFloat(val.replace(/,/g, ""));
        lineval = val;
      }
      return acc + lineval;
    }, 0);
    return parseFloat(sum).toFixed(2).toString();
  }
  substractAllNumbers(text) {
    const lines = text.split("\n");
    const sum = lines.reduce((acc, val) => {
      let lineval = 0;
      if (val && val.trim()) {
        val = val.replace(/[^0-9\.,-]+/g, "");
        val = parseFloat(val.replace(/,/g, ""));
        lineval = val;
      }
      if (acc === null) {
        return lineval;
      }
      return acc - lineval;
    }, null);
    return parseFloat(sum).toFixed(2).toString();
  }
  jsonStringParse(text) {
    if (!text.trim()) {
      return false;
    }
    let parsed = false;
    try {
      parsed = this.maybeUnserialize(text);
      if (typeof parsed === "string" && parsed.startsWith("{")) {
        parsed = JSON.parse(parsed.replace(/\\/g, ""));
      }
      if (!parsed) {
        parsed = JSON.parse(text);
      }
      parsed = JSON.stringify(parsed, void 0, 2);
    } catch (error) {
      log(error);
      showNotification({
        title: "Text Tools",
        body: "JSON Error: " + error,
        actions: true
      });
    }
    return parsed;
  }
  maybeUnserialize(text) {
    let unserialized = false;
    try {
      unserialized = unserialize(text);
    } catch (error) {
      console.error(error);
    }
    return unserialized;
  }
  fakeDataTypes() {
    return [
      "Full Name",
      "Name",
      "Lastname",
      "Email",
      "Phone",
      "Credit Card",
      "User Name",
      "Full Address",
      "Country",
      "City",
      "Street",
      "Zip Code",
      "Company",
      "URL",
      "Lorem Paragraph",
      "Lorem Paragraphs",
      "Number",
      "JSON",
      "Array"
    ];
  }
  generateFakeData(text, format = false) {
    return new Promise((resolve, reject) => {
      if (!format) {
        nova.workspace.showChoicePalette(this.fakeDataTypes(), { placeholder: "" }, (sel) => {
          if (!sel) {
            resolve(false);
            return false;
          }
          resolve(this.generateFakeData(text, sel));
        });
        return false;
      }
      let val = fakeData(format);
      if (typeof val !== "string") {
        return false;
      }
      resolve(val);
    });
  }
  generateUUID() {
    return uuidRandom();
  }
  nonBreakingSpace() {
    return "&nbsp;";
  }
  generateDummyFile(fileName, fileSize) {
    if (!nova.workspace) {
      showNotification({
        title: "Text Tools",
        body: "ERROR: a workspace is required to create a dummy file",
        actions: true
      });
      return false;
    }
    return new Promise((resolve, reject) => {
      nova.workspace.showInputPalette("Enter file name with extension", {
        placeholder: "filename.txt"
      }, (filename) => {
        if (!filename) {
          resolve();
          return;
        }
        nova.workspace.showInputPalette("Enter file size, example: 10mb", {
          placeholder: "filesize for example: 500kb, 10mb, 1gb"
        }, (filesize) => {
          if (!filesize) {
            resolve();
            return;
          }
          dummyFile(nova.workspace.path, filename, filesize).then(() => {
            showNotification({
              title: "Text Tools",
              body: "File generated correctly"
            });
            resolve();
          }).catch((error) => {
            log(error);
            showNotification({
              title: "Text Tools",
              body: "ERROR: " + error,
              actions: true
            });
            resolve();
          });
        });
      });
    });
  }
  normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  normalizeLinesIndent(lines) {
  }
  newDocument(content) {
    if (!nova.workspace) {
      showNotification({
        title: "Text Tools",
        body: "ERROR: a workspace is required to create new documents",
        actions: true
      });
      return false;
    }
    nova.workspace.openNewTextDocument({
      content,
      line: 0
    });
  }
}

exports.activate = () => {
  const tools = new NovaTextTools();
  if (nova.inDevMode()) {
    console.log("Text Tools Activated");
  }
  const commands = {
    tolowercase: "toLowercase",
    touppercase: "toUpperCase",
    tosnakecase: "toSnakeCase",
    topascalsnakecase: "toPascalSnakeCase",
    tocamelsnakecase: "toCamelSnakeCase",
    tocamelcase: "toCamelCase",
    toconstantcase: "toConstantCase",
    toheadercase: "toHeaderCase",
    tonocase: "toNoCase",
    toflatcase: "toFlatCase",
    todotcase: "toDotCase",
    toparamcase: "toParamCase",
    toscreamingparamcase: "toScreamingParamCase",
    topascalcase: "toPascalCase",
    topathcase: "toPathCase",
    tosentencecase: "toSentenceCase",
    tocapitalcase: "toCapitalCase",
    tospongececase: "toSpongeCase",
    totitlecase: "toTitleCase",
    sortalphanumerically: "sortLinesAlphanumerically",
    sortalphanumericallyreverse: "sortLinesAlphanumericallyReverse",
    sortbylength: "sortLinesByLength",
    sortbylengthreverse: "sortLinesByLengthReverse",
    deleteduplicates: "deleteDuplicates",
    deleteemptylines: "deleteEmptyLines",
    filterduplucates: "filterDuplicates",
    filterduplucatesnew: "filterDuplicatesNewDoc",
    filteruniques: "filterUniques",
    filteruniquesnew: "filterUniquesNewDoc",
    deletelinesmatching: "deleteLinesMatching",
    filterlinesmatching: "filterLinesMatching",
    filterlinesmatchingnew: "filterLinesMatchingNewDoc",
    reverselines: "reverseLines",
    randomlines: "randomLines",
    joinlines: "joinLines",
    splittolines: "splitToLines",
    addlinesnumber: "addLinesNumbers",
    tobase64: "base64Encode",
    decodebase64: "base64Decode",
    urlencode: "urlEncode",
    urldecode: "urlDecode",
    encodehtml: "htmlEncode",
    decodehtml: "htmlDecode",
    encodespaces: "spacesEncode",
    decodespaces: "spacesDecode",
    htmlasciitodecimal: "htmlAsciiToDecimal",
    asciitodecimal: "asciiToDecimal",
    asciitohex: "asciiToHex",
    texttobinary: "textToBinary",
    binarytotext: "binaryToText",
    rot13: "rot13",
    stripslashes: "stripSlashes",
    addslashes: "addSlashes",
    smartquotes: "smartQuotes",
    straightenquotes: "straightenQuotes",
    quotessingletodouble: "quotesSingleToDouble",
    quotessingletobackticks: "quotesSingleToBackticks",
    quotesdoubletosingle: "quotesDoubleToSingle",
    quotesdoubletobackticks: "quotesDoubleToBackticks",
    wrapeachlinewith: "wrapLinesWith",
    appendtolines: "appendToLines",
    prependtolines: "prependToLines",
    addallnumbers: "addAllNumbers",
    substractallnumbers: "substractAllNumbers",
    jsonstringparse: "jsonStringParse"
  };
  for (const command in commands) {
    nova.commands.register(`biati.texttools.${command}`, (editor) => {
      const commandMethod = commands[command];
      return tools.process(command, editor, tools[commandMethod]);
    });
  }
  const selectionCommands = {
    selectlinesmatching: "selectLinesMatching",
    selectallocurrencesmatching: "selectAllOcurrencesMatching",
    selectocurrences: "selectOcurrences"
  };
  for (const scommand in selectionCommands) {
    nova.commands.register(`biati.texttools.${scommand}`, (editor) => {
      const commandMethod = selectionCommands[scommand];
      tools.select(editor, tools[commandMethod]);
    });
  }
  const insertionCommands = {
    generateuuid: "generateUUID",
    fakedata: "generateFakeData",
    nonbreakingspace: "nonBreakingSpace",
    generatedummyfile: "generateDummyFile"
  };
  for (const scommand in insertionCommands) {
    nova.commands.register(`biati.texttools.${scommand}`, (editor) => {
      const commandMethod = insertionCommands[scommand];
      return tools.process(scommand, editor, tools[commandMethod], "insert");
    });
  }
  nova.commands.register("biati.texttools.generatedummyfile", () => {
    return tools.generateDummyFile();
  });
  let expander = new SelectionExpander();
  nova.commands.register("biati.texttools.expandselection", (editor) => {
    expander.expand(editor);
  });
  nova.commands.register("biati.texttools.shrinkselection", (editor) => {
    expander.shrink(editor);
  });
  function onChange(textEditor) {
    expander.maybeResetHistory(textEditor);
  }
  function onSelectionChange(textEditor) {
    nova.subscriptions.add(textEditor.onDidChangeSelection(onChange));
  }
  nova.subscriptions.add(nova.workspace.onDidAddTextEditor(onSelectionChange));
  let aligner = new SelectionAlign();
  nova.commands.register("biati.texttools.alignselection", (editor) => {
    aligner.align(editor);
  });
};
exports.deactivate = () => {
};
