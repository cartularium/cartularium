

Spreadsheet users often create formulas that suit their immediate needs, but over time, these can become difficult to understand or adjust when data or requirements change. Billions use spreadsheets, but poorly maintained formulas cost businesses hours in debugging or adjusting.



| Store 1     |         |     |     | Store 2     |         |     |     | Store 3     |         |     |     | Store 4     |         |     |
| ----------- | ------- | --- | --- | ----------- | ------- | --- | --- | ----------- | ------- | --- | --- | ----------- | ------- | --- |
| Warehouse A | Apples  | 299 |     | Warehouse A | Apples  | 840 |     | Warehouse A | Apples  | 219 |     | Warehouse A | Apples  | 310 |
| Warehouse A | Bananas | 232 |     | Warehouse A | Bananas | 436 |     | Warehouse A | Bananas | 28  |     | Warehouse A | Bananas | 633 |
| Warehouse A | Oranges | 498 |     | Warehouse A | Oranges | 930 |     | Warehouse A | Oranges | 19  |     | Warehouse A | Oranges | 208 |
| Warehouse B | Apples  | 374 |     | Warehouse B | Apples  | 519 |     | Warehouse B | Apples  | 250 |     | Warehouse B | Apples  | 302 |
| Warehouse B | Bananas | 697 |     | Warehouse B | Bananas | 920 |     | Warehouse B | Bananas | 845 |     | Warehouse B | Bananas | 794 |
| Warehouse B | Oranges | 604 |     | Warehouse B | Oranges | 183 |     | Warehouse B | Oranges | 544 |     | Warehouse B | Oranges | 83  |
| Warehouse C | Apples  | 557 |     | Warehouse C | Apples  | 611 |     | Warehouse C | Apples  | 560 |     | Warehouse C | Apples  | 851 |
| Warehouse C | Bananas | 688 |     | Warehouse C | Bananas | 12  |     | Warehouse C | Bananas | 328 |     | Warehouse C | Bananas | 393 |
| Warehouse C | Oranges | 955 |     | Warehouse C | Oranges | 69  |     | Warehouse C | Oranges | 393 |     | Warehouse C | Oranges | 931 |

One common task for inventory management is to sum a particular product for all the stores. Most users rely on formulas like [[SUMIF]]

```
=SUMIF(B2:B10,"Apples",C2:C10)+SUMIF(F2:F10,"Apples",G2:G10)+SUMIF(J2:J10,"Apples",K2:K10)+SUMIF(N2:N10,"Apples",O2:O10)
```

While this does achieve the desired result, it comes with downsides; for example, if a store closed down which [[SUMIF]] is it, if new criteria, like quality or bundle types (e.g., 4-apple or 16-apple bundles), are added, requiring a [[SUMIFS]] function.

```
=INDEX(LET(
product,"Apples",
store_1,N(B2:B10=product)*C2:C10,
store_2,N(F2:F10=product)*G2:G10,
store_3,N(J2:J10=product)*K2:K10,
store_4,N(N2:N10=product)*O2:O10,
SUM(store_1,store_2,store_3,store_4)))
```

[[LET]] is extremely useful for documenting formulas allowing co-workers or our future selves to easily determine what the formula is doing, what each part is, and the ability to make changes with reduced chance of making a mistake.

[[N]] converts TRUE/FALSE to 1/0, enabling array multiplication for flexible criteria. For example

```
store_1,N(B2:B10=product)*C2:C10
```


| Apples  | 323 |
| ------- | --- |
| Bananas | 673 |
| Oranges | 904 |
| Apples  | 892 |
| Bananas | 64  |
| Oranges | 721 |
| Apples  | 131 |
| Bananas | 763 |
| Oranges | 95  |

N(B2:B10=product) This step makes

| 1   |
| --- |
| 0   |
| 0   |
| 1   |
| 0   |
| 0   |
| 1   |
| 0   |
| 0   |

Multiply that against the inventory column and you get

| 323 |
| --- |
| 0   |
| 0   |
| 892 |
| 0   |
| 0   |
| 131 |
| 0   |
| 0   |

One common data structure is a pivoted table structure


| Person | Product | 6/1 | 6/2 | 6/3 | 6/4 | 6/5 | 6/6 | 6/7 |
| ------ | ------- | --- | --- | --- | --- | --- | --- | --- |
| Bob    | Apples  | 9   | 1   | 5   | 2   | 3   | 3   | 8   |
| Sally  | Apples  | 9   | 2   | 9   | 6   | 1   | 10  | 2   |
| Sarah  | Apples  | 7   | 4   | 4   | 9   | 5   | 7   | 6   |
| George | Apples  | 10  | 4   | 7   | 3   | 2   | 8   | 1   |
| Bob    | Oranges | 10  | 3   | 1   | 7   | 3   | 9   | 1   |
| Sally  | Oranges | 5   | 4   | 6   | 1   | 7   | 7   | 2   |
| Sarah  | Oranges | 9   | 5   | 3   | 3   | 6   | 9   | 4   |
| George | Oranges | 3   | 10  | 8   | 9   | 7   | 10  | 10  |

[[SUMIFS]] struggles with pivoted data, as it cannot directly handle multiple dimensions. Usually this path leads to a nested [[FILTER]] where we filter the rows where the product = "Apples" then [[FILTER]] that based on the date.

```
=SUM(FILTER(FILTER(C2:I9,B2:B9="Apples"),C1:I1=DATEVALUE("6/2/2025")))
```

This might be difficult to adjust later as you add more dimensions causing many nests.

```
=INDEX(LET(
products,N(B2:B9="Apples"),
dates,N(C1:I1=DATEVALUE("6/2/2025")),
sales,C2:I9,
SUM(products*dates*sales)))
```

N(B2:B9="Apples")
outputs

| 1   |
| --- |
| 1   |
| 1   |
| 1   |
| 0   |
| 0   |
| 0   |
| 0   |

N(C1:I1=DATEVALUE("6/2/2025"))
outputs


| 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| --- | --- | --- | --- | --- | --- | --- |

matrix multiplication of these two outputs


| 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| --- | --- | --- | --- | --- | --- | --- |
| 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |

Which you can see are the same dimensions as the sales


| 9   | 1   | 5   | 2   | 3   | 3   | 8   |
| --- | --- | --- | --- | --- | --- | --- |
| 9   | 2   | 9   | 6   | 1   | 10  | 2   |
| 7   | 4   | 4   | 9   | 5   | 7   | 6   |
| 10  | 4   | 7   | 3   | 2   | 8   | 1   |
| 10  | 3   | 1   | 7   | 3   | 9   | 1   |
| 5   | 4   | 6   | 1   | 7   | 7   | 2   |
| 9   | 5   | 3   | 3   | 6   | 9   | 4   |
| 3   | 10  | 8   | 9   | 7   | 10  | 10  |

which when you multiply those together you get


| 0   | 1   | 0   | 0   | 0   | 0   | 0   |
| --- | --- | --- | --- | --- | --- | --- |
| 0   | 2   | 0   | 0   | 0   | 0   | 0   |
| 0   | 4   | 0   | 0   | 0   | 0   | 0   |
| 0   | 4   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| 0   | 0   | 0   | 0   | 0   | 0   | 0   |

which gives us all the apples for that date!

It is arguably more abstract, however, you can add any number of criteria and label those criteria making things significantly more sustainable.

Array-based methods, while scalable, demand a learning curve and careful data structuring. Unlike [[SUMIF]]’s intuitive setup, [[LET]]/[[N]] requires understanding array multiplication, but its flexibility outweighs the initial complexity for multidimensional tasks, especially once you start adding even more dimensions to your data.

4D such as
Person Product Grade Date

or 5D such as

Region, Person, Product, Price, Date

or 6D

Region, Person, Brand, Product, Price, Date

all the way to n-dimensions as data demands. 

This allows us to by simply adding another line to the formula to add more criteria as we need.


| Region   | Person | Brand   | Product | 6/1 | 6/2 | 6/3 | 6/4 | 6/5 |
| -------- | ------ | ------- | ------- | --- | --- | --- | --- | --- |
| Region A | Bob    | Brand A | Apples  | 20  | 4   | 12  | 20  | 11  |
| Region A | Sally  | Brand A | Oranges | 17  | 7   | 15  | 1   | 8   |
| Region A | Sarah  | Brand B | Oranges | 18  | 3   | 1   | 11  | 9   |
| Region B | Bob    | Brand B | Apples  | 16  | 16  | 19  | 4   | 12  |
| Region B | Sally  | Brand B | Apples  | 11  | 5   | 17  | 7   | 17  |
| Region B | George | Brand A | Oranges | 7   | 1   | 8   | 3   | 11  |
| Region B | Sarah  | Brand B | Apples  | 9   | 17  | 14  | 7   | 15  |

```
=INDEX(LET(
regions,N(B2:B9="Region B"),
products,N(C2:C9="Apples"),
brands,N(D2:D9="Brand A"),
dates,N(E1:I1=DATEVALUE("6/2/2025")),
sales,E2:I9,
SUM(products*dates*sales*regions*brands)))
```

These methods apply to financial models such as revenue by region, product, quarter or logistics, for example, shipments by route, vehicle, date.

By applying this type of mentality, we can enable robust multidimensional analysis without the burden of nested filters that are hard to read, maintain, or debug.

