"use strict"
/* Configuration */
var path = {
    src:{
      views: "front/src/views/*.html",
      styles: "front/src/scss/**/*.scss",
      scripts: "front/src/js/**/*.js",
      img: "front/src/img/",
      json:"front/src/data/*.json",
      vendors: "front/src/lib/"
    },
    dest:{
      views: "front/public/views/",
      styles: "front/public/css/",
      js:"front/public/js/",
      img: "front/public/img/",
      font:"front/public/fonts/",
      json:"front/public/data/",
      vendors:"front/public/lib/"
    }
};

var configBower = {
    directory: process.cwd()+'/front/src/lib'
}

/*----------------*/
/*  GULP REQUIRES */
/*----------------*/



var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss    = require('gulp-minify-css'),
    jshint       = require('gulp-jshint'),
    uglify       = require('gulp-uglify'),
    rename       = require('gulp-rename'),
    concat       = require('gulp-concat'),
    plumber      = require('gulp-plumber'),
    browserSync  = require('browser-sync').create(),
    cssshrink    = require('gulp-cssshrink'),
    cp           = require('child_process'),
    changed      = require('gulp-changed'),
    imagemin     = require('gulp-imagemin'),
    size         = require('gulp-size'),
    extend       = require('gulp-html-extend'),
    notify       = require('gulp-notify'),
    iconfont     = require('gulp-iconfont'),
    iconfontCss  = require('gulp-iconfont-css'),
    bower        = require('gulp-bower'),
    run          = require('gulp-run'),
    nodemon      = require('gulp-nodemon');


/*-------------*/
/*  GULP TASK  */
/*-------------*/


var onError = function(err) {
  notify.onError({
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Frog"
  })(err);
  this.emit('end');
};

gulp.task('install', function () {
    bower({ directory: configBower.directory, interactive: true, cmd: 'install'});
    run('npm install').exec();
});

gulp.task('update', function () {
    bower({ directory: configBower.directory, interactive: true, cmd: 'update'});
    run('npm install').exec();
});

gulp.task('compile', function () {
    gulp.start('styles', 'views', 'index-ionic', 'scripts', 'vendors-scripts', 'vendors-styles', 'vendors-fonts', 'images');
});


gulp.task('json', function () {
    gulp.src(path.src.json)
      .pipe(plumber({errorHandler: onError}))
      .pipe(gulp.dest(path.dest.json))
      .pipe(browserSync.reload({stream:true}));
});

gulp.task('views', function () {
    gulp.src(path.src.views)
      .pipe(plumber({errorHandler: onError}))
      .pipe(gulp.dest(path.dest.views))
      .pipe(browserSync.reload({stream:true}));
});

gulp.task('index-ionic', function () {
     gulp.src('front/src/index.html')
      .pipe(plumber({errorHandler: onError}))
      .pipe(gulp.dest('front/public'))
      .pipe(browserSync.reload({stream:true}));
});


gulp.task('styles', function() {
   gulp.src(path.src.styles)
    .pipe(plumber({errorHandler: onError}))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(cssshrink())
    .pipe(gulp.dest(path.dest.styles))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('scripts', function() {
  gulp.src(path.src.scripts)
    //.pipe(jshint('.jshintrc'))
    //.pipe(jshint.reporter('default'))
    .pipe(plumber())
    .pipe(concat('app.js'))
    .pipe(rename({suffix: '.min'}))
    // .pipe(uglify())
    .pipe(gulp.dest(path.dest.js))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('vendors-fonts', function() {
  return gulp.src([
      path.src.vendors+'bootstrap/dist/fonts/glyphicons-halflings-regular.eot',
      path.src.vendors+'bootstrap/dist/fonts/glyphicons-halflings-regular.svg',
      path.src.vendors+'bootstrap/dist/fonts/glyphicons-halflings-regular.ttf',
      path.src.vendors+'bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
      path.src.vendors+'bootstrap/dist/fonts/glyphicons-halflings-regular.woff2'
    ])
    .pipe(gulp.dest(path.dest.font))
    .pipe(browserSync.reload({stream:true}));
});


gulp.task('vendors-styles', function() {
  return gulp.src([
      path.src.vendors+'bootstrap/dist/css/bootstrap.min.css'
    ])
    .pipe(plumber({errorHandler: onError}))
    .pipe(concat('vendors.css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    // .pipe(cssshrink())
    .pipe(gulp.dest(path.dest.styles))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('vendors-scripts', function() {
  return gulp.src([
      path.src.vendors+'angular/angular.min.js',
      path.src.vendors+'jquery/dist/jquery.min.js',
      path.src.vendors+'bootstrap/dist/js/bootstrap.min.js',
      path.src.vendors+'ngprogress/build/ngprogress.min.js',
      path.src.vendors+'angular-facebook/lib/angular-facebook.js',
      path.src.vendors+'angular-ui-router/release/angular-ui-router.min.js',
      path.src.vendors+'angular-cookies/angular-cookies.min.js',
      path.src.vendors+'async/dist/async.min.js'
    ])
    .pipe(plumber())
    .pipe(concat('vendors.js'))
    .pipe(rename({suffix: '.min'}))
    // .pipe(uglify())
    .pipe(gulp.dest(path.dest.js))
    .pipe(browserSync.reload({stream:true}));
});
// Optimizes the images that exists
gulp.task('images', function () {
   gulp.src(path.src.img+'**/**')
    .pipe(changed(path.dest.img))
    .pipe(imagemin({
      // Lossless conversion to progressive JPGs
      progressive: true,
      // Interlace GIFs for progressive rendering
      interlaced: true
    }))
    .pipe(gulp.dest(path.dest.img))
    .pipe(size({title: 'images'}))
    .pipe(browserSync.reload({stream:true}));
});



gulp.task('serve', ['styles', 'json', 'views', 'index-ionic', 'scripts', 'vendors-scripts', 'vendors-styles', 'vendors-fonts', 'images'], function() { //script
  nodemon({
    script : 'api/app.js',
    ext : 'js',
    env: { 'NODE_ENV': 'development' }
  });
  browserSync.init({
    server: {
      baseDir: "./front/public",
      injectChanges: true // this is new
    }
  });
  // exec('ionic serve', function (err, stdout, stderr) {});
});

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe(ghPages());
});

gulp.task('watch', function() {
  // Watch .html files
  gulp.watch('front/src/index.html', ['index-ionic',browserSync.reload])
  gulp.watch(path.src.views, ['views',browserSync.reload]);

  gulp.watch(path.src.json, ['json',browserSync.reload])
  // Watch .sass files
  gulp.watch(path.src.styles, ['styles', browserSync.reload]);
  // Watch .js files
  gulp.watch(path.src.scripts, ['scripts', browserSync.reload]);

  gulp.watch(path.src.vendors+'**/*.js', ['vendors-scripts', browserSync.reload]);
  // Watch image files
  gulp.watch(path.src.img+'**/*', ['images', browserSync.reload]);
});

gulp.task('default', function() {
    gulp.start('styles', 'json', 'views', 'index-ionic', 'scripts', 'vendors-scripts', 'vendors-styles', 'vendors-fonts', 'images', 'watch', 'serve');
});
