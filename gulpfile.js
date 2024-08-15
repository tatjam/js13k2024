const gulp = require('gulp');

const lintHTML = require('gulp-htmllint');
const lintJS = require('gulp-eslint');
const deleteFiles = require('gulp-rimraf');
const minifyHTML = require('gulp-minify-html');
const minifyJS = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const replaceHTML = require('gulp-html-replace');
const imagemin = require('gulp-imagemin');
const zip = require('gulp-zip');
const checkFileSize = require('gulp-check-filesize');

var server = require('gulp-webserver');

const paths = {
    src: {
        html: 'src/**.html',
        css: 'src/css/**.css',
        js: 'src/js/**.js',
    },
    dist: {
        dir: 'dist',
        css: 'm.css',
        js: 'm.js',
    }
};

gulp.task('lintHTML', () => {
    return gulp.src('src/**.html')
        .pipe(lintHTML());
});

gulp.task('lintJS', () => {
    return gulp.src(paths.src.js)
        .pipe(lintJS())
        .pipe(lintJS.failAfterError());
});

gulp.task('cleanDist', () => {
    return gulp.src('dist/**/*', { read: false })
        .pipe(deleteFiles());
});

gulp.task('buildHTML', () => {
    return gulp.src(paths.src.html)
        .pipe(replaceHTML({
            css: paths.dist.css,
            js: paths.dist.js
        }))
        .pipe(minifyHTML())
        .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('buildJS', () => {
    return gulp.src(paths.src.js)
        .pipe(concat(paths.dist.js))
        .pipe(minifyJS({
            keep_fnames: false,
            mangle: {
                toplevel: true
            }
        }))
        .pipe(gulp.dest(paths.dist.dir));
});

gulp.task('zip', () => {
    const thirteenKb = 13 * 1024;

    gulp.src('zip/*')
        .pipe(deleteFiles());

    return gulp.src(`${paths.dist.dir}/**`)
        .pipe(zip('game.zip'))
        .pipe(gulp.dest('zip'))
        .pipe(checkFileSize({ fileSizeLimit: thirteenKb }));
});

gulp.task('test', gulp.parallel(
    'lintHTML',
    'lintJS'
));

gulp.task('build', gulp.series(
    'cleanDist',
    gulp.parallel('buildHTML', 'buildJS'),
    'zip'
));

gulp.task('watch', () => {
    gulp.watch(paths.src.html, gulp.series('buildHTML', 'zip'));
    gulp.watch(paths.src.js, gulp.series('buildJS', 'zip'));
    gulp.src('dist').pipe(server({
        livereload: true,
        open: true,
        port: 8000
    }));
});

gulp.task('default', gulp.series(
    'build',
    'watch'
));
