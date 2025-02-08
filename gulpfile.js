'use strict';

// gulp
import gulp from 'gulp';
import gulpif from 'gulp-if';
import browserSync from 'browser-sync';
import rename from 'gulp-rename';
import { deleteSync } from 'del';

import errorNotify from 'gulp-notify';
import plumber from 'gulp-plumber';

// html*pug
import htmlmin from 'gulp-htmlmin';
import gulppug from 'gulp-pug';
import prettyHtml from 'gulp-pretty-html';

// css
import sass from 'sass';
import gulpSass from 'gulp-sass';
const compSass = gulpSass(sass);

import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import gcmq from 'gulp-group-css-media-queries';
import { stream as critical } from 'critical';

// js
import terser from 'gulp-terser';
import webpackStream from 'webpack-stream';
import webpack from 'webpack';

//img
import tinypng from 'gulp-tinypng-compress';
import gulpImg from 'gulp-image';
import gulpWebp from 'gulp-webp';
import gulpAvif from 'gulp-avif';
import svgSprite from 'gulp-svg-sprite';

let dev = false;

const path = {
  docs: {
    base: 'docs/',
    html: 'docs/',
    js: 'docs/js/',
    css: 'docs/css/',
    cssIndex: 'docs/css/style.min.css',
    img: 'docs/img/',
    fonts: 'docs/fonts/',
  },
  src: {
    base: 'src/',
    html: 'src/*.html',
    pug: 'src/pug/*.pug',
    scss: 'src/scss/**/*.scss',
    //! Все js файлы через массив
    js: [
      './src/js/main.js',
      './src/js/map.js',
      './src/js/datepicker.js',
      './src/js/weather.js',
      './src/js/validate.js',
      './src/js/forecast.js',
      './src/js/graph.js',
    ],
    img: 'src/img/**/*.*',
    svg: 'src/svg/**/*.svg',
    imgF: 'src/img/**/*.{jpg,jpeg,png}',
    assets: [
      'src/fonts/**/*.*',
      'src/icons/**/*.*',
      'src/video/**/*.*',
      'src/public/**/*.*',
    ],
  },
  watch: {
    html: 'src/*.html',
    js: 'src/**/*.js',
    pug: 'src/**/*.pug',
    css: 'src/**/*.scss',
    svg: 'src/svg/**/*.svg',
    img: 'src/img/**/*.*',
    imgF: 'src/img/**/*.{jpg,jpeg,png}',
  },
};


// ? ФУНКЦИЯ НОТИФИКАЦИИ ОШИБОК
function plumberNotify(title) {
  return {
    errorHandler: errorNotify.onError({
      title: title,
      message: 'Error <%= error.message %>',
      sound: false,
    })
  }
}

// ! HTML

export const html = () =>
  gulp
    .src(path.src.html)
    .pipe(plumber(plumberNotify('HTML')))
    .pipe(
      gulpif(
        !dev, // * Если сборка не development, то минимизируем
        htmlmin({
          removeComments: true,
          collapseWhitespace: true,
        }),
      ),
    )
    .pipe(gulp.dest(path.docs.html))
    .pipe(browserSync.stream());

// ! Styles
export const scss = () =>
  gulp
    .src(path.src.scss)
    .pipe(plumber(plumberNotify('Styles')))
    // * Если сборка development, то делаем sourcemap
    .pipe(gulpif(dev, sourcemaps.init()))
    .pipe(compSass().on('error', compSass.logError))
    .pipe(
      gulpif(
        !dev,
        autoprefixer({
          cascade: false,
          grid: false,
        }),
      ),
    )
    .pipe(gulpif(!dev, gcmq()))
    .pipe(gulpif(!dev, gulp.dest(path.docs.css)))
    .pipe(
      gulpif(
        !dev,
        cleanCSS({
          2: {
            specialComments: 0,
          },
        }),
      ),
    )
    .pipe(
      rename({
        suffix: '.min',
      }),
    )
    .pipe(gulpif(dev, sourcemaps.write()))
    .pipe(gulp.dest(path.docs.css))
    .pipe(browserSync.stream());

// js

const webpackConf = {
  mode: dev ? 'development' : 'production',
  devtool: dev ? 'eval-source-map' : false,
  optimization: {
    minimize: false,
  },
  output: {
    filename: 'script.js',
  },
  module: {
    rules: [],
  },
};

if (!dev) {
  webpackConf.module.rules.push({
    test: /\.(js)$/,
    exclude: /(node_modules)/,
    loader: 'babel-loader',
  });
}

export const js = () =>
  gulp
    .src(path.src.js)
    .pipe(plumber(plumberNotify('JavaScript')))
    .pipe(webpackStream(webpackConf, webpack))
    .pipe(gulpif(!dev, gulp.dest(path.docs.js)))
    .pipe(gulpif(!dev, terser()))
    .pipe(
      rename({
        suffix: '.min',
      }),
    )
    .pipe(gulp.dest(path.docs.js))
    .pipe(browserSync.stream());

export const img = () =>
  gulp
    .src(path.src.img)
    // .pipe(gulpif(!dev, tinypng({
    // 	key: 'API_KEY',
    // 	summarize: true,
    // 	log: true
    // })))
    .pipe(
      gulpif(
        !dev,
        gulpImg({
          optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
          pngquant: ['--speed=1', '--force', 256],
          zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
          jpegRecompress: [
            '--strip',
            '--quality',
            'medium',
            '--min',
            40,
            '--max',
            80,
          ],
          mozjpeg: ['-optimize', '-progressive'],
          gifsicle: ['--optimize'],
          svgo: true,
        }),
      ),
    )
    .pipe(gulp.dest(path.docs.img))
    .pipe(
      browserSync.stream({
        once: true,
      }),
    );

export const svg = () =>
  gulp
    .src(path.src.svg)
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg',
          },
        },
      }),
    )
    .pipe(gulp.dest(path.docs.img))
    .pipe(
      browserSync.stream({
        once: true,
      }),
    );

export const webp = () =>
  gulp
    .src(path.src.imgF)
    .pipe(
      gulpWebp({
        quality: dev ? 100 : 60,
      }),
    )
    .pipe(gulp.dest(path.docs.img))
    .pipe(
      browserSync.stream({
        once: true,
      }),
    );

export const avif = () =>
  gulp
    .src(path.src.imgF)
    .pipe(
      gulpAvif({
        quality: dev ? 100 : 50,
      }),
    )
    .pipe(gulp.dest(path.docs.img))
    .pipe(
      browserSync.stream({
        once: true,
      }),
    );

export const critCSS = () =>
  gulp
    .src(path.src.html)
    .pipe(
      critical({
        base: path.docs.base,
        inline: true,
        css: [path.docs.cssIndex],
      }),
    )
    .on('error', (err) => {
      console.error(err.message);
    })
    .pipe(gulp.dest(path.docs.base));

export const copy = () =>
  gulp
    .src(path.src.assets, {
      base: path.src.base,
    })
    .pipe(gulp.dest(path.docs.base))
    .pipe(
      browserSync.stream({
        once: true,
      }),
    );

export const server = () => {
  browserSync.init({
    ui: false,
    notify: false,
    host: 'localhost',
    port: 3001,
    // tunnel: true,
    server: {
      baseDir: 'docs',
    },
  });

  gulp.watch(path.watch.html, html);
  // gulp.watch(path.watch.pug, pug);
  gulp.watch(path.watch.css, scss);
  gulp.watch(path.watch.js, js);
  gulp.watch(path.watch.svg, svg);
  gulp.watch(path.watch.img, img);
  gulp.watch(path.watch.imgF, webp);
  gulp.watch(path.watch.imgF, avif);
};

export const clear = (done) => {
  deleteSync([path.docs.base], {
    force: true,
  });
  done();
};

const develop = (ready) => {
  dev = true;
  ready();
};

export const base = gulp.parallel(html, scss, js, img, svg, webp, avif, copy);

export const build = gulp.series(clear, base, critCSS);

export default gulp.series(develop, base, server);