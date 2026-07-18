---
author: Chris Carpenter/Aliafriend
tags:
  - tutorial
  - data-organization
  - google-sheets
---
## Fixing Anti-Patterns: Merged Cells Where Data Resides

Merged cells are one of the most seductive traps in spreadsheets. They look clean and organized at first glance — perfect for titles, grouped weeks, category headings, or "pretty" reports — but when the **merged cells actually hold important data** (names, dates, values, notes), they become a nightmare for formulas. Merged cells only contain the value in the top-left most cell meaning for example FILTER() can only read the top-left most cell of a merged cell.

### Common Merged-Cell Anti-Patterns

1. **Merged row/column labels repeated across groups**  
   Example: Person names merged vertically over several rows of their transactions.

<table border="1" style="border-collapse: collapse; width: 50%;">
  <tr>
    <th>Person (merged)</th>
    <th>Category</th>
    <th>Amount</th>
  </tr>
  <tr>
    <td rowspan="3">Bob</td>
    <td>Gas</td>
    <td>-$25</td>
  </tr>
  <tr>
    <td>Food</td>
    <td>-$18</td>
  </tr>
  <tr>
    <td>Movies</td>
    <td>-$12</td>
  </tr>
  <tr>
    <td rowspan="3">Sally</td>
    <td>Rent</td>
    <td>-$800</td>
  </tr>
  <tr>
    <td>Food</td>
    <td>-$45</td>
  </tr>
  <tr>
    <td>Gifts</td>
    <td>-$60</td>
  </tr>
</table>

   Looks nice in a printed report… but try to:
   - Filter only Sally’s expenses
   - Sum food spending per person
   - Sort by amount, category, or person

2. **Merged headers over date groups**  
   Example: Weeks or months merged across several date columns.

<table border="1" style="border-collapse: collapse; width: 100%;">
  <tr>
    <th></th>
    <th colspan="5">Week of Jan 1</th>
    <th colspan="5">Week of Jan 8</th>
  </tr>
  <tr>
    <td>Item</td>
    <td>Mon</td>
    <td>Tue</td>
    <td>Wed</td>
    <td>Thu</td>
    <td>Fri</td>
    <td>Mon</td>
    <td>Tue</td>
    <td>Wed</td>
    <td>Thu</td>
    <td>Fri</td>
  </tr>
  <tr>
    <td>Apples</td>
    <td>5</td>
    <td>3</td>
    <td>8</td>
    <td>2</td>
    <td>6</td>
    <td>4</td>
    <td>7</td>
    <td>9</td>
    <td>3</td>
    <td>5</td>
  </tr>
</table>

   You can’t easily filter by a single day, use date-based functions, or expand the table without manual labor each time.

3. **Merged cells for subtotals or notes**  
   A single merged cell spanning multiple rows/columns with a comment or total — impossible to sort, filter, or reference reliably.

**The core problem**: Merged cells violate the **tabular data rule** — every cell should contain exactly one atomic piece of information, and every row should be a complete, independent observation.

### The Fix: Unmerge + Fill Down (or Fill Right)

Once you have it back in tabular form you can create a new sheet and reference the table with the merged format that looks the way you want to. That way you will both have it look nice, yet able to do analysis that often comes with spreadsheeting.
