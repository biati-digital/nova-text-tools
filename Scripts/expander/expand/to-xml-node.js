import { getResult } from '../expander-utils.js';

export function expandToXMLNode(text, start, end) {
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

export function isWithinTag(text, startIndex, endIndex) {
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



export function getTagProperties(text) {
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

export function findTag(text, direction, tagName = '') {
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
export function isTextCloseTag(text, tagName = '') {
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

    var result = null;
    tArr.forEach((value) => {
        let tag_string = value.name;
        // ignore comments
        if (result) {
            return;
        }
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
