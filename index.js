const fs = require('fs-extra');
const gm = require('gm');
const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminMozJPEG = require('imagemin-mozjpeg');
const path = require('path');
const Promise = require('promise');
const sizeOf = require('image-size');
const slugify = require('slugify');

const argv = require('./argv');

const {
  buildPath,
  className,
  configFile,
  lazyload,
  source,
} = argv;

const config = require(path.join(__dirname, configFile));

const generateComponents = require('./generateComponents');

const srcPath = path.join(__dirname, source);
const tmpPath = path.join(__dirname, 'tmp');
const targetPath = path.join(__dirname, buildPath);

const breakpoints = new Map();
breakpoints.set('xs', 0);
breakpoints.set('sm', 600);
breakpoints.set('md', 1200);
breakpoints.set('lg', 1800);
breakpoints.set('xl', 2400);
breakpoints.set('max', 3000);

const generateSizes = (base) => {
  const xs = Math.round(base / 3);
  const sm = xs * 2;
  const md = base;
  const lg = xs * 4;
  const xl = xs * 5;

  const xs2x = sm;
  const xs3x = md;
  const sm2x = lg;
  const md2x = md * 2;
  const lg2x = lg * 2;
  const xl2x = xl * 2;

  return {
    xs,
    sm,
    md,
    lg,
    xl,
    xs2x,
    xs3x,
    sm2x,
    md2x,
    lg2x,
    xl2x,
  };
};

const sizes = {};

Object.keys(config).forEach((key) => {
  sizes[key] = generateSizes(config[key].size);
});

const imgList = [];

// Remove temporary directory.
const removeTmp = () => new Promise((resolve, reject) => fs.remove(
    tmpPath,
    (err) => err ? reject(err) : resolve(),
));

// Cleanup directories before processing images.
const cleanup = () => new Promise((resolve, reject) => {
  const removeBuild = fs.remove(
      targetPath,
      (err) => err ? reject(err) : resolve(),
  );

  return Promise.all([removeTmp(), removeBuild]);
});

// Resize images.
const resize = async () => {
  fs.mkdirSync(tmpPath);
  fs.mkdtempSync(tmpPath);
  const imgs = fs.readdirSync(srcPath);
  const tasks = [];

  imgs.forEach((img) => {
    if (img === '.DS_Store') return;
    const imgPath = path.join(srcPath, img);
    const ext = path.extname(img);
    const baseName = path.basename(img, ext);
    const imgSizes = sizes[baseName];
    const processedSizes = [];
    const {width: srcWidth} = sizeOf(imgPath);

    // Store base names for later use.
    imgList.push(baseName);

    Object.keys(imgSizes).forEach((key) => {
      const size = imgSizes[key];
      if (processedSizes.includes(size)) return;

      if (size > srcWidth) {
        console.warn('Target size larger than original!\n');
        console.warn(`Target width: ${size}\n`);
        console.warn(`Source width: ${srcWidth}\n`);
      }

      const basename = slugify(baseName, {lower: true});

      const resizeName = `${basename}-${size}w${ext.toLowerCase()}`;

      const task = new Promise((resolve, reject) =>
        gm(imgPath)
            .resize(size)
            .noProfile()
            .write(`${tmpPath}/${resizeName}`, (err) =>
              err ? reject(err) : resolve(),
            ),
      );

      tasks.push(task);

      processedSizes.push(size);
    });
  });

  return Promise.all(tasks);
};

const processWebp = () => imagemin([path.join(tmpPath, '*.jpg')], {
  destination: path.join(targetPath, 'webp'),
  plugins: [
    imageminWebp({quality: 80}),
  ],
});

const processJPEG = () => imagemin([path.join(tmpPath, '*.jpg')], {
  destination: path.join(targetPath, 'jpg'),
  plugins: [
    imageminMozJPEG({quality: 80}),
  ],
});

const sortImgs = async () => {
  const tasks = [];
  imgList.forEach((baseName) => {
    const basename = slugify(baseName, {lower: true});
    fs.mkdirSync(path.join(targetPath, basename));

    const imgSizes = sizes[baseName];

    const processedSizes = [];
    Object.keys(imgSizes).forEach((key) => {
      const size = imgSizes[key];

      if (processedSizes.includes(size)) return;

      const jpg = `${basename}-${size}w.jpg`;
      const webp = `${basename}-${size}w.webp`;

      const renameWebp = new Promise((resolve, reject) => {
        fs.rename(
            path.join(targetPath, 'webp', webp),
            path.join(targetPath, basename, webp),
            (err) => err ? reject(err) : resolve(),
        );
      });

      const renameJpg = new Promise((resolve, reject) => {
        fs.rename(
            path.join(targetPath, 'jpg', jpg),
            path.join(targetPath, basename, jpg),
            (err) => err ? reject(err) : resolve(),
        );
      });

      tasks.push(renameWebp);
      tasks.push(renameJpg);

      processedSizes.push(size);
    });
  });

  await Promise.all(tasks);

  const removeWebpDir = new Promise((resolve, reject) => fs.remove(
      path.join(targetPath, 'webp'),
      (err) => err ? reject(err) : resolve(),
  ));

  const removeJpgDir = new Promise((resolve, reject) => fs.remove(
      path.join(targetPath, 'jpg'),
      (err) => err ? reject(err) : resolve(),
  ));

  return Promise.all([removeWebpDir, removeJpgDir]);
};

const process = async () => {
  console.log('Cleaning up directories.');

  await cleanup();

  console.log('Done! Now resizing images.');

  await resize();

  console.log('Resizing done! Now generating optimised assets...');

  await Promise.all([processWebp(), processJPEG()]);

  console.log('Assets generated successfully.');
  console.log('Sorting files and removing tmp files...');

  await removeTmp();

  await Promise.all([removeTmp(), sortImgs()]);

  console.log('Done! Now generating your HTML code...');

  await generateComponents({
    buildPath,
    breakpoints,
    className,
    config,
    files: imgList,
    lazyload,
    sizes,
    targetPath,
  });

  console.log('Done!!!');
};

process();
