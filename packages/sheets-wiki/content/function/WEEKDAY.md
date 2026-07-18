---
name: WEEKDAY
category: date
syntax: WEEKDAY(date, [type])
status: imported
description: Returns a number representing the day of the week of the date provided.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092985?hl=en).

Returns a number representing the day of the week of the date provided.

### Sample Usage

```gse
WEEKDAY(DATE(1969,7,20))
WEEKDAY(A2)
WEEKDAY(40909)
WEEKDAY(40909,3)
```

### Syntax

```gse
WEEKDAY(date, [type])
```

- `date` - The date for which to determine the day of the week. Must be a reference to a cell containing a date, a function returning a date type, or a number.
- `type` - **[** OPTIONAL - `1` by default **]** - A number indicating which numbering system to use to represent weekdays. By default counts starting with Sunday = 1.

  + If `type` is `1`, days are counted from Sunday and the value of Sunday is 1, therefore the value of Saturday is 7.
  + If `type` is `2`, days are counted from Monday and the value of Monday is 1, therefore the value of Sunday is 7.
  + If `type` is `3`, days are counted from Monday and the value of Monday is 0, therefore the value of Sunday is 6.

### Notes

- Ensure that the input to the function is either a reference to a cell containing a date, a function which returns a date object such as [[DATE]], [[DATEVALUE]] or [[TO_DATE]], or a date serial number of the type returned by the [[N]] function. Google Sheets represents dates internally as numbers for ease of use in calculation, and while this conversion is done automatically when a date in the form of a string is input into a cell, this function does not perform this conversion.
- `WEEKDAY` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `WEEKDAY(10/10/2000)` is interpreted as `WEEKDAY(0.0005)`, the quotient of 10 divided by 10 divided by 2000.
- `WEEKDAY` returns the day of week in numeric form, not as a letter (e.g. 'M' or 'F') an abbreviation (e.g. 'Tue' or 'Thu') nor as a full day name (e.g. 'Wednesday'). To get the name of the weekday, use the [[TEXT]] function or change the [number formatting](https://support.google.com/docs/answer/56470) on the cell.

### See Also

[[YEAR]]: Returns the year specified by a given date.

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

[[MONTH]]: Returns the month of the year a specific date falls in, in numeric format.

[[DAY]]: Returns the day of the month that a specific date falls on, in numeric format.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

[[TEXT]]: Converts a number into text according to a specified format.

### Examples

Returns the number representing the day of the week for the specified date value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdG1IYUp1WmhjU0hGOTlWcHk1VFp5VUE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/1gMOkFJLs78ZzkGVr7zHMFErYZvQi8I9wIsLJeTX_MqY/copy)