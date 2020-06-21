/* eslint-disable max-len */
const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

const generateComponents = ({
  buildPath,
  breakpoints,
  config,
  files,
  lazyload,
  sizes,
  targetPath,
  webp,
}) => {
  const tasks = [];
  let srcAttr;

  files.forEach((file) => {
    const {alt: altText, className} = config[file];

    const classNames = [];
    if (className) classNames.push(className);

    if (lazyload) {
      srcAttr = 'data-srcset';
      classNames.push('img--lazyload');
    } else {
      srcAttr = 'srcset';
      classNames.push('img--no-lazyload');
    }

    let output = `<picture class="${classNames.join(' ')}">\n`;

    const imgSizes = sizes[file];

    const basename = slugify(file, {lower: true});

    if (webp) {
      const webps = [];
      breakpoints.forEach((width, breakpoint) => {
        let source = '';

        if (breakpoint === 'max') {
          const size = imgSizes.xl2x;
          const srcSet = `/${buildPath}/${basename}/${basename}-${size}w.webp`;

          source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
        } else if (breakpoint === 'xs') {
          const size = imgSizes.xs;
          const size2x = imgSizes.xs2x;
          const size3x = imgSizes.xs3x;

          const srcSet = `/${buildPath}/${basename}/${basename}-${size}w.webp`;
          const srcSet2x = `/${buildPath}/${basename}/${basename}-${size2x}w.webp`;
          const srcSet3x = `/${buildPath}/${basename}/${basename}-${size3x}w.webp`;

          source += `  <source media="(min-resolution: 384dpi)" ${srcAttr}="${srcSet3x}" />\n`;
          source += `  <source media="(-webkit-min-device-pixel-ratio: 3)" ${srcAttr}="${srcSet3x}" />\n`;
          source += `  <source media="(min-resolution: 192dpi)" srcSet="${srcSet2x}" />\n`;
          source += `  <source media="(-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
          source += `  <source ${srcAttr}="${srcSet}" />\n`;
        } else {
          const size = imgSizes[breakpoint];
          const size2x = imgSizes[`${breakpoint}2x`];

          const srcSet = `/${buildPath}/${basename}/${basename}-${size}w.webp`;
          const srcSet2x = `/${buildPath}/${basename}/${basename}-${size2x}w.webp`;

          source += `  <source media="(min-width: ${width}px) and (min-resolution: 192dpi)" ${srcAttr}="${srcSet2x}" />\n`;
          source += `  <source media="(min-width: ${width}px) and (-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
          source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
        }

        webps.push(source);
      });

      for (let i = webps.length - 1; i >= 0; i -= 1) {
        output += webps[i];
      }
    }

    const jpgs = [];
    breakpoints.forEach((width, breakpoint) => {
      let source = '';

      if (breakpoint === 'max') {
        const size = imgSizes.xl2x;
        const srcSet = `/${buildPath}/${basename}/${basename}-${size}w.jpg`;

        source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
      } else if (breakpoint === 'xs') {
        const size = imgSizes.xs;
        const size2x = imgSizes.xs2x;
        const size3x = imgSizes.xs3x;

        const srcSet = `/${buildPath}/${basename}/${basename}-${size}w.jpg`;
        const srcSet2x = `/${buildPath}/${basename}/${basename}-${size2x}w.jpg`;
        const srcSet3x = `/${buildPath}/${basename}/${basename}-${size3x}w.jpg`;

        source += `  <source media="(min-resolution: 384dpi)" ${srcAttr}="${srcSet3x}" />\n`;
        source += `  <source media="(-webkit-min-device-pixel-ratio: 3)" ${srcAttr}="${srcSet3x}" />\n`;
        source += `  <source media="(min-resolution: 192dpi)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source ${srcAttr}="${srcSet}" />\n`;
      } else {
        const size = imgSizes[breakpoint];
        const size2x = imgSizes[`${breakpoint}2x`];

        const srcSet = `/${buildPath}/${basename}/${basename}-${size}w.jpg`;
        const srcSet2x = `/${buildPath}/${basename}/${basename}-${size2x}w.jpg`;

        source += `  <source media="(min-width: ${width}px) and (min-resolution: 192dpi)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(min-width: ${width}px) and (-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
      }

      jpgs.push(source);
    });

    for (let i = jpgs.length - 1; i >= 0; i -= 1) {
      output += jpgs[i];
    }

    output += `  <img ${lazyload ? 'class="lazyload" data-src' : 'src'}="/${buildPath}/${basename}/${basename}-${imgSizes.xl2x}w.jpg" alt="${altText}" />\n`;

    output += '</picture>\n';

    const task = new Promise((resolve, reject) => fs.writeFile(
        path.join(targetPath, basename, 'index.html'),
        output,
        (err) => err ? reject(err) : resolve(),
    ));

    tasks.push(task);
  });

  return Promise.all(tasks);
};

module.exports = generateComponents;
