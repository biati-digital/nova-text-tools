<p align="center">
<img src="https://i.ibb.co/4j2qmM5/extension.png" width="80" height="80">
</p>
<h1 align="center">Nova Text Tools</h1>

**Swiss Army knife for text manipulation and selection**. This extension provides 50+ commands to manipulate and select text in your files. The commands are available globally and ready to be used any time with any file. **If you have text selected it will perform the actions in the current selections otherwise it will perform the action in the entire file.**

### Text commands

-  Sort Alphanumerically
-  Sort Alphanumerically Reverse
-  Sort Lines by length
-  Sort Lines by length Reverse
-  Delete Duplicate Lines
-  Delete Empty Lines
-  Filter Duplicate Lines (In case you only want to know the duplicate values)
-  Filter Duplicate Lines as New Document (same as above but result will be added in a new document)
-  Delete Lines Matching... (Delete all lines that contains certain text or matches a regex)
-  Filter Lines Matching...  (Filter all lines that contains certain text or matches a regex)
-  Filter Lines Matching as New Document (same as above but result will be added in a new document)
-  Reverse Lines
-  Randomize Lines
-  Join Lines (Join lines using a specified delimiter)
-  Add Lines number with multiple formats: 1, 1., 1), 1.-, 1 -, 1:, Ordinal, Roman Numerals
-  Make Camel Case: `test string` becomes `testString`
-  Make Constant Case: `test string` becomes `TEST_STRING`
-  Make Dot Case: `test string` becomes `test.string`
-  Make Header Case: `test string` becomes `Test-String`
-  Make No Case: `testString` becomes `test string`
-  Make Snake Case: `Test string` becomes `test_string`
-  Make Param Case: `Test string` becomes `test-string`
-  Make Pascal Case: `test string` becomes `TestString`
-  Make Path Case: `test string` becomes `test/string`
-  Make Sentence Case: `testString` becomes `Test string`
-  Make Sponge Case: `Test string` becomes `tEsT StRiNG`
-  Make Capital Case: `Test string` becomes `Test String`
-  Make Lower Case: `Test string` becomes `test string`
-  Make Upper Case: `Test string` becomes `TEST STRING`
-  Make Title Case: `step-by-step instructions` becomes `Step-by-Step Instructions`
-  Encode Base64
-  Decode Base64
-  URL Encode
-  URL Decode
-  Encode Spaces: converts spaces to `%20`
-  Decode Spaces: converts `%20` to spaces
-  Encode HTML Entities
-  Decode HTML Entities
-  Add Slashes
-  Strip Slashes
-  Smart Quotes `"I don't know you"` becomes `“I don’t know you”`
-  Straighten Quotes `“don’t know what you mean by ‘glory’”` becomes `"don't know what you mean by 'glory'"`

### Selection commands

-  Select Lines Matching... (Selects lines that contains certain text or matches a regex)
-  Select Words Matching... (Select all words that contains certain text or matches a regex)
-  Select All Ocurrences (grabs your currently selected word and will select all ocurrences in the file)

To learn more please checkout the examples below.

### Wrap and Append/Prepend

-  Wrap Each Line With... (for example: `<li>$1</li>`, read more below.)
-  Add Text At Beginning of Lines... (adds at the beginning of each line the text you entered)
-  Add Text At Ends of Lines... (adds at the end of each line the text you entered)

### Numbers

-  Add All Numbers (View the examples below)
-  Substract All Numbers (View the examples below)

### JSON
-  JSON String Parse (Pretty print a JSON encoded string with support for serialized strings, this way you can easily print a serialized array from a database)

&nbsp;
&nbsp;

## Mastering commands with Matching...

This is an advanced way to filter by entering a simple query or a regular expression, this works for any command that includes in it's name `Matching...` for example: **Delete Lines Matching..., Keep Lines Matching..., Select Lines Matching**, etc.
Here are some examples of how to use it.

&nbsp;

#### Filter with a simple query:

Having the following text, if we for example call the command "Keep Lines Matching..." and we enter `gmail` it will leave only the lines that contains `gmail`
```
marquardt.gudrun@gmail.com
okuneva.gerhard@yahoo.com
miracle47@olson.org
uruecker@kemmer.com
lulu.gerhold@yahoo.com
xfranecki@gmail.com
```

result will be:

```
marquardt.gudrun@gmail.com
xfranecki@gmail.com
```

&nbsp;

#### Filter lines that begins with:

To match lines at the beggining, when calling the command (for example "Keep Lines Matching...") we just need to enter our query starting with a `^` so if we enter `^ma`

```
marquardt.gudrun@gmail.com
okuneva.gerhard@yahoo.com
miracle47@olson.org
uruecker@kemmer.com
matilda.qkieu@gmail.com
lulu.gerhold@yahoo.com
```

result will be:

```
marquardt.gudrun@gmail.com
matilda.qkieu@gmail.com
```

&nbsp;

#### Filter lines that ends with:

To match lines that ends with, when calling the command (for example "Keep Lines Matching...") we just need to enter our query ending with a `$` so if we enter `org$`

```
marquardt.gudrun@gmail.com
miracle47@olson.org
doggyhelp@welovedogs.org.xyz
lulu.gerhold@yahoo.com
```

result will be:

```
miracle47@olson.org
```

&nbsp;

#### Filter lines that DO NOT contain certain text:

To match lines that do not contain some text, when calling the command (for example "Keep Lines Matching...") we just need start our query with a `!` so if we enter `!gmail.com` we are basically saying keep only lines that do not contain `gmail.com`

```
marquardt.gudrun@gmail.com
miracle47@olson.org
doggyhelp@welovedogs.org.xyz
almendra.gerhold@gmail.com
```

result will be:

```
miracle47@olson.org
doggyhelp@welovedogs.org.xyz
```

&nbsp;

### Wrap Each Line With

With this command you can wrap each line with any text you want, you can use `$1` as placeholder to represent the line content, for example: `<li>$1</li>`

```
Duncan Prewett
Ernesto Gladi
Wava Fodor
Annamarie Dianei
```

result will be:

```
<li>Duncan Prewett</li>
<li>Ernesto Gladi</li>
<li>Wava Fodor</li>
<li>Annamarie Dianei</li>
```


&nbsp;

### Numbers

You can easily add or substract all the numbers in your document, each value must be in it's own line, if the line contains other text it will be removed to leave only the numbers. **Important: for now it only supports numbers with comma as thousand separator and dot as decimal separator**

```
130.23
Price $2,000.00
Discount 40
```

result will be:

```
2170.23
```

### ¡Have an idea for another tool!
If you have one in mind do not hestiate to share it with us, if it can help a lot of people we'll surely implement it.
