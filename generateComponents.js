/* eslint-disable max-len */
const fs = require('fs');
const path = require('path');
const camelcase = require('camelcase');

const generateComponents = ({
  alt,
  breakpoints,
  buildPath,
  className,
  files,
  lazyload,
  sizes,
  srcPath,
}) => {
  const tasks = [];
  const classNames = [];
  let srcAttr;

  if (className) classNames.push(className);

  if (lazyload) {
    srcAttr = 'data-srcset';
    classNames.push('img--lazyload');
  } else {
    srcAttr = 'srcset';
    classNames.push('img--no-lazyload');
  }

  files.forEach((file) => {
    const altText = alt[file];
    let output = `<picture class="${classNames.join(' ')}">\n`;

    const FileName = camelcase(file, {pascalCase: true});

    const webps = [];
    breakpoints.forEach((width, breakpoint) => {
      let source = '';

      if (breakpoint === 'max') {
        const size = sizes.xl2x;
        const srcSet = `/${srcPath}/${FileName}/${file}-${size}w.webp`;

        source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
      } else if (breakpoint === 'xs') {
        const size = sizes.xs;
        const size2x = sizes.xs2x;
        const size3x = sizes.xs3x;

        const srcSet = `/${srcPath}/${FileName}/${file}-${size}w.webp`;
        const srcSet2x = `/${srcPath}/${FileName}/${file}-${size2x}w.webp`;
        const srcSet3x = `/${srcPath}/${FileName}/${file}-${size3x}w.webp`;

        source += `  <source media="(min-resolution: 384dpi)" ${srcAttr}="${srcSet3x}" />\n`;
        source += `  <source media="(-webkit-min-device-pixel-ratio: 3)" ${srcAttr}="${srcSet3x}" />\n`;
        source += `  <source media="(min-resolution: 192dpi)" srcSet="${srcSet2x}" />\n`;
        source += `  <source media="(-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source ${srcAttr}="${srcSet}" />\n`;
      } else {
        const size = sizes[breakpoint];
        const size2x = sizes[`${breakpoint}2x`];

        const srcSet = `/${srcPath}/${FileName}/${file}-${size}w.webp`;
        const srcSet2x = `/${srcPath}/${FileName}/${file}-${size2x}w.webp`;

        source += `  <source media="(min-width: ${width}px) and (min-resolution: 192dpi)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(min-width: ${width}px) and (-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
      }

      webps.push(source);
    });

    for (let i = webps.length - 1; i >= 0; i -= 1) {
      output += webps[i];
    }

    const jpgs = [];
    breakpoints.forEach((width, breakpoint) => {
      let source = '';

      if (breakpoint === 'max') {
        const size = sizes.xl2x;
        const srcSet = `/${srcPath}/${FileName}/${file}-${size}w.jpg`;

        source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
      } else if (breakpoint === 'xs') {
        const size = sizes.xs;
        const size2x = sizes.xs2x;
        const size3x = sizes.xs3x;

        const srcSet = `/${srcPath}/${FileName}/${file}-${size}w.jpg`;
        const srcSet2x = `/${srcPath}/${FileName}/${file}-${size2x}w.jpg`;
        const srcSet3x = `/${srcPath}/${FileName}/${file}-${size3x}w.jpg`;

        source += `  <source media="(min-resolution: 384dpi)" ${srcAttr}="${srcSet3x}" />\n`;
        source += `  <source media="(-webkit-min-device-pixel-ratio: 3)" ${srcAttr}="${srcSet3x}" />\n`;
        source += `  <source media="(min-resolution: 192dpi)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source ${srcAttr}="${srcSet}" />\n`;
      } else {
        const size = sizes[breakpoint];
        const size2x = sizes[`${breakpoint}2x`];

        const srcSet = `/${srcPath}/${FileName}/${file}-${size}w.jpg`;
        const srcSet2x = `/${srcPath}/${FileName}/${file}-${size2x}w.jpg`;

        source += `  <source media="(min-width: ${width}px) and (min-resolution: 192dpi)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(min-width: ${width}px) and (-webkit-min-device-pixel-ratio: 2)" ${srcAttr}="${srcSet2x}" />\n`;
        source += `  <source media="(min-width: ${width}px)" ${srcAttr}="${srcSet}" />\n`;
      }

      jpgs.push(source);
    });

    for (let i = jpgs.length - 1; i >= 0; i -= 1) {
      output += jpgs[i];
    }

    output += `  <img ${lazyload ? 'data-src' : 'src'}="/${srcPath}/${FileName}/${file}-${sizes.xl2x}w.jpg" alt="${altText}" />\n`;

    output += '</picture>\n';

    const task = new Promise((resolve, reject) => fs.writeFile(
        path.join(buildPath, FileName, 'index.html'),
        output,
        (err) => err ? reject(err) : resolve(),
    ));

    tasks.push(task);
  });

  return Promise.all(tasks);
};

module.exports = generateComponents;
