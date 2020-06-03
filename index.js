const path = require('path');
const fs = require('fs-extra');
const Promise = require('promise');
const gm = require('gm');
const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminMozJPEG = require('imagemin-mozjpeg');
const camelcase = require('camelcase');
const argv = require('./argv');

const {
  alt,
  baseSize,
  build,
  source,
} = argv;

const altText = require(`./${alt}`);

const generateComponents = require('./generateComponents');

const srcPath = path.join(__dirname, source);
const tmpPath = path.join(__dirname, 'tmp');
const buildPath = path.join(__dirname, build);

const breakpoints = new Map();
breakpoints.set('xs', 0);
breakpoints.set('sm', 600);
breakpoints.set('md', 1200);
breakpoints.set('lg', 1800);
breakpoints.set('xl', 2400);
breakpoints.set('max', 3000);

const generateSizes = (base) => {
  const xs = base / 3;
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

const sizes = generateSizes(baseSize);
const imgList = [];

// Remove temporary directory.
const removeTmp = () => new Promise((resolve, reject) => fs.remove(
    tmpPath,
    (err) => err ? reject(err) : resolve(),
));

// Cleanup directories before processing images.
const cleanup = () => new Promise((resolve, reject) => {
  const removeBuild = fs.remove(
      buildPath,
      (err) => err ? reject(err) : resolve(),
  );

  return Promise.all([removeTmp(), removeBuild]);
});

// Resize images.
const resize = async () => {
  fs.mkdirSync(tmpPath);
  const imgs = fs.readdirSync(srcPath);
  const tasks = [];

  imgs.forEach((img) => {
    const imgPath = path.join(srcPath, img);
    const ext = path.extname(img);
    const baseName = path.basename(img, ext);
    const processedSizes = [];

    // Store base names for later use.
    imgList.push(baseName);

    Object.keys(sizes).forEach((key) => {
      const size = sizes[key];
      if (processedSizes.includes(size)) return;

      const resizeName = `${baseName}-${size}w${ext}`;

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
  destination: path.join(buildPath, 'webp'),
  plugins: [
    imageminWebp({quality: 80}),
  ],
});

const processJPEG = () => imagemin([path.join(tmpPath, '*.jpg')], {
  destination: path.join(buildPath, 'jpg'),
  plugins: [
    imageminMozJPEG({quality: 80}),
  ],
});

const sortImgs = async () => {
  const tasks = [];
  imgList.forEach((img) => {
    const Img = camelcase(img, {pascalCase: true});
    fs.mkdirSync(path.join(buildPath, Img));

    const processedSizes = [];
    Object.keys(sizes).forEach((key) => {
      const size = sizes[key];

      if (processedSizes.includes(size)) return;

      const jpg = `${img}-${size}w.jpg`;
      const webp = `${img}-${size}w.webp`;

      const renameWebp = new Promise((resolve, reject) => {
        fs.rename(
            path.join(buildPath, 'webp', webp),
            path.join(buildPath, Img, webp),
            (err) => err ? reject(err) : resolve(),
        );
      });

      const renameJpg = new Promise((resolve, reject) => {
        fs.rename(
            path.join(buildPath, 'jpg', jpg),
            path.join(buildPath, Img, jpg),
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
      path.join(buildPath, 'webp'),
      (err) => err ? reject(err) : resolve(),
  ));

  const removeJpgDir = new Promise((resolve, reject) => fs.remove(
      path.join(buildPath, 'jpg'),
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

  console.log('Done! Now generating your React components...');

  await generateComponents({
    alt: altText,
    breakpoints,
    buildPath,
    files: imgList,
    sizes,
    srcPath: build,
  });

  console.log('Done!!!');
};

process();
