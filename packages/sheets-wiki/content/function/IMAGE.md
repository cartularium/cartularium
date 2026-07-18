---
name: IMAGE
category: google
syntax: IMAGE(url, [mode], [height], [width])
status: imported
description: Inserts an image into a cell.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093333?hl=en).

Inserts an image into a cell.

**Important:** You can only use URLs that aren't hosted at [drive.google.com](https://drive.google.com). SVG file format isn't supported.

Volatility restrictions: you cannot directly or indirectly reference a volatile function in the base URL, the consistent part of the website's address, of the IMAGE function.

- `NOW(), RAND(), RANDARRAY(), RANDBETWEEN()` are examples of volatile functions.

### Sample Usage

```gse
IMAGE("https://www.google.com/images/srpr/logo3w.png")
IMAGE(A2,2)
IMAGE(A2,4,120,200)
```

### Syntax

```gse
IMAGE(url, [mode], [height], [width])
```

- `url` - The URL of the image, including protocol (e.g. `http://`).

  + The value for `url` must either be enclosed in quotation marks or be a reference to a cell containing the appropriate text.
- `mode` - **[** OPTIONAL - `1` by default **]** - The sizing mode for the image

  + `1` resizes the image to fit inside the cell, maintaining aspect ratio.
  + `2` stretches or compresses the image to fit inside the cell, ignoring aspect ratio.
  + `3` leaves the image at original size, which may cause cropping.
  + `4` allows the specification of a custom size.
  + Note that no mode causes the cell to be resized to fit the image.
- `height` - **[** OPTIONAL **]** - The height of the image in pixels. `mode` must be set to `4` in order to set a custom height.
- `width` - **[** OPTIONAL **]** - The width of the image in pixels. `mode` must be set to `4` in order to set a custom width.

### Examples

Inserts an image inside of a cell.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEh3bU52UmNGdjFmRFZmdzkxdXVJRnc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

### Related resources

- [Learn more about Import functions](https://support.google.com/docs/answer/12188454)