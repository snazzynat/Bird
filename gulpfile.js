'use strict';

/* file paths */
var gulp = require('gulp'),
imagemin = require('gulp-imagemin'),
    req = require('gulp-load-plugins')(), //Use load plugins to load plugins on demand
    del = require('del'), //plugins that doesnt start with 'gulp-'' needs to be defined here
    sequal = require('run-sequence'), //this plugin will help with asynchronous issue
    arg = require('yargs').argv, //pass arguments in/from terminal
    map = require('map-stream'),//Create a through stream from an asyncronous function.
    webserver = require('gulp-webserver'); //it's the webserver

var declare = require('gulp-declare');
var concat = require('gulp-concat');
var merge = require('merge-stream');

var path = require('path');
var wrap = require('gulp-wrap');
var concat = require('gulp-concat');
var handlebars = require('gulp-handlebars');

// Development Paths
var pathDev = {
  js: ['app/assets/js/*.js', '!app/assets/js/vendor/', '!app/assets/js/lib/'],
  images: ['app/assets/images/*','app/assets/images/**/*'],
  data: ['app/assets/data/*.json','app/assets/data/**/*.json'],
  css: ['app/assets/sass/*.scss', 'app/assets/sass/**/*.scss', '!app/assets/sass/lib/'],
  tempCss: 'app/assets/css/'
}

var currentClient = '';

// Production Paths
var pathProd = {
  images: 'dist/assets/images/',
  data: 'dist/assets/data/',
  brochures: 'dist/assets/brochures/',
  js: 'dist/assets/js/',
  mainRoot: 'dist'
}

// Check main gulp task parameter
var gulpTask = (arg._[0] == 'build') ? true : false;

// IF env in production (--prod) set isProd and sass/compass config
var isProd = true,
    sassStyle = 'compressed',
    sourceMap = false;

if(!arg.prod){
    isProd = false,
    sassStyle = 'nested',
    sourceMap = true;
}

// set autropefixer browsers versions
var autoprefix_browsers = [
  'last 2 version',
  'safari >= 5',
  'ie >= 8',
  'opera >= 12.1',
  'ios >= 6',
  'ie_mob >= 10',
  'android >= 4',
  'bb >= 10'
];

//Copy assets to dist
// Fonts
/*gulp.task('fonts', function(){
  console.log(' DO FONTS ');
  return gulp.src(['app/assets/fonts/**'])
    .pipe(gulp.dest('dist/assets/fonts'))
    .pipe(req.size({title: 'fonts'}));
});*/


gulp.task('do-templates', function() {
  // Assume all partials start with an underscore
  // You could also put them in a folder such as source/templates/partials/*.hbs
  var partials = gulp.src('app/templates/partials/*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
      imports: {
        processPartialName: function(fileName) {
          // Strip the extension and the underscore
       //   console.log('fileName', fileName);
          // Escape the output with JSON.stringify
          return JSON.stringify(path.basename(fileName, '.js'));
        }
      }
    }));

  var templates = gulp.src(['app/templates/partials/*.hbs', 'app/templates/modules/*.hbs'])
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'MB.POS',
      noRedeclare: true // Avoid duplicate declarations
    }));

  // Output both the partials and the templates as build/js/templates.js
  return merge(partials, templates)
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('app/assets/js/'));
});


gulp.task('compile-templates', function() {
  console.log('COMPICLE');
  gulp.src(['app/templates/modules/*.hbs','app/templates/partials/*.hbs'])
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'HBTemplates',
      noRedeclare: true
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('app/assets/js/'));
});


gulp.task('templatesFiles', function(){
   var src_path = 'app/templates/**';
  return gulp.src([src_path])
    .pipe(concat('combined.js'))
    .pipe(concat.header('// file: <%= file.path %>\n'))
    .pipe(concat.footer('\n// end\n'))
    .pipe(gulp.dest('dist/'));
});


gulp.task('index_page', function(){
  return gulp.src(['/frame.html'])
    .pipe(gulp.dest('dist/'))
    .pipe(req.size({title: 'index'}));
});


gulp.task('fonts', function(){
  console.log(' DO FONTS ');
  return gulp.src(['app/assets/fonts/**'])
    .pipe(gulp.dest('dist/assets/fonts'))
    .pipe(req.size({title: 'fonts'}));
});

gulp.task('video', function(){
  console.log(' DO VIDEOS ');
  return gulp.src(['app/assets/video/**'])
    .pipe(gulp.dest('dist/assets/video'))
    .pipe(req.size({title: 'Videos'}));
});

// Data
gulp.task('data', function(){
  var src_path = ['app/assets/data/**'];
  return gulp.src(src_path)
    .pipe(gulp.dest('dist/assets/data'))
    .pipe(req.size({title: 'data'}));
});

// Brochures
gulp.task('brochures', function(){
  var src_path = ['app/assets/brochures/**'];
  return gulp.src(src_path)
    .pipe(gulp.dest('dist/assets/brochures'))
    .pipe(req.size({title: 'brochures'}));
});

// Templates
gulp.task('templates', function(){
  var src_path = 'app/templates/**';
  return gulp.src(src_path)
    .pipe(gulp.dest('dist/templates'))
    .pipe(req.size({title: 'templates'}));
});


// Optimize and copy images to dist. Run task only on build */
gulp.task('images', function() {
  var src_path =  ['app/assets/images/**/*'];//,'app/client-resources/'+currentClient+'/assets/images/**/*']; //dist/clients/'+currentClient+'/assets/data'
  var dest_path = 'dist/assets/images';
  return gulp.src(src_path)
    .pipe(req.newer(dest_path)) //check if image exist already
   // .pipe(req.imagemin({
   //   progressive: true,
   //   interlaced: true,
   ///   optimizationLevel:5
   // })) //optimize images*/
    .pipe(gulp.dest(dest_path)) //move to dist folder
    .pipe(req.size({title: 'Optimization of images'}));
});

var errorFlag = false;
gulp.task('jshint', function () {
  console.log( 'STARTING JSHINT ');
 var src_path =  ['app/assets/js/*.js', '!app/assets/js/vendor/', '!app/assets/js/lib/','!app/assets/js/templates.js']
  return gulp.src(src_path)
    .pipe(req.jshint())
    .pipe(req.jshint.reporter('jshint-stylish'))
    .pipe(req.jshint.reporter('default'))
    //Stop gulp only if error but keep working if is a warning.
    .pipe(map(function (file, cb) {

      if (!file.jshint.success) {
        file.jshint.results.forEach(function (err) {
          var checkError = err.error.code
          if(checkError.charAt(0) === 'W'){
            console.log('it is a warning')
          }else{
            console.log('it is an Error')
            errorFlag = true;
          }
        });
      }
      cb(null, file);
    }))
    //.pipe(req.jshint.reporter('fail'))
    .pipe(req.size({title: 'Linting JS files'}))
    .on('end', function () {
        if (errorFlag) {
          process.exit(1);
        }
    });
});
/*
// Don't stop gulp if error is a warning (jenkins benefit)
var errorFlag = false;
gulp.task('jshint', function () {
 console.log(' DO JSHINT ');

  var src_path =  ['app/assets/js/*.js', '!app/assets/js/vendor/', '!app/assets/js/lib/','!app/assets/js/templates.js']

  return gulp.src(src_path)
    .pipe(req.jshint())
    .pipe(req.jshint.reporter('jshint-stylish'))
    .pipe(req.jshint.reporter('default'))
    //Stop gulp only if error but keep working if is a warning.
    .pipe(map(function (file, cb) {

      if (!file.jshint.success) {
        file.jshint.results.forEach(function (err) {
          var checkError = err.error.code
          if(checkError.charAt(0) === 'W'){
            //console.log('it is a warning')
          }else{
            //console.log('it is an Error')
            errorFlag = true;
          }
        });
      }

      cb(null, file);
    }))
    //.pipe(req.jshint.reporter('fail'))
    .pipe(req.size({title: 'Linting JS files'}))
    .on('end', function () {
        if (errorFlag) {
          process.exit(1);
        }
    });
});*/

//CSS task. The concatenation and minification will be done in the html task
gulp.task('css', function () {
   console.log(' DO CSS ');
  return gulp.src(pathDev.css)
    .pipe(req.compass({
      //config_file: 'config.rb',
      css: 'app/assets/css/',
      sass: 'app/assets/sass/',
      output_style: sassStyle
    }))
    // If add on error this will keep compiling without stop on issue
    // .on('error', function(error){
    //   // console.log(error.message);
    //   console.log(error);
    //   this.emit('end');
    // })
    .pipe(req.autoprefixer({browsers: autoprefix_browsers}))
    .pipe(gulp.dest(pathDev.tempCss))
    .pipe(req.size({title: 'Compiled SASS and saved in app -> CSS folder'}));
});


// Generate the final file with concat and/or min files "css and js"
// The Css and Js will be transfered to assets root
/*
gulp.task('html', function(){
  var assets = req.useref.assets();
   console.log(' DO HTML ASSETS ');

  var dest_path = 'dist/';
 
  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe(req.if(isProd, req.if('*.js', req.uglify({mangle: false}))))
    .on('error', function( e ){
      console.log(' EROR ', e);
    })
    .pipe(req.if(isProd, req.if('*.css',  req.minifyCss())))
    .pipe(assets.restore())
    .pipe(req.useref())
    .pipe(gulp.dest(dest_path))
    .pipe(req.size(req.if(isProd, {title: 'Concat and Min files'}, {title: 'Concat files only'})));
});

*/
// Generate the final file with concat and/or min files "css and js"
// The Css and Js will be transfered to assets root
gulp.task('html', function(){
 // var assets = req.useref.assets();
  return gulp.src('app/*.html')
   // .pipe(assets)
    //.pipe(req.if(  isProd,req.ngAnnotate()  ))
    .pipe(req.if(isProd, req.if('*.js', req.uglify({mangle: false}))))
    .pipe(req.if(isProd, req.if('*.css',  req.minifyCss())))
   // .pipe(assets.restore())
    .pipe(req.useref())
    .pipe(gulp.dest(pathProd.mainRoot))
    .pipe(req.size(req.if(isProd, {title: 'Concat and Min files'}, {title: 'Concat files only'})));
});


// Minify index.html only after all the other tasks are done.
// The minify task will be used in the dist version
gulp.task('minhtml', function(){
  var opts = {
    conditionals: true,
    empty: true
  };

  return gulp.src('dist/*.html')
  //  .pipe(req.if(isProd, req.minifyHtml(opts)))
    .pipe(gulp.dest(pathProd.mainRoot))
    .pipe(req.size({title: 'Html Minified'}));
});


// Minify index.html only after all the other tasks are done.
// The minify task will be used in the dist version
/*
gulp.task('minhtml', function(){
  var opts = {
    conditionals: true,
    empty: true
  };

  return gulp.src('dist/*.html')
    .pipe(req.if(isProd, req.minifyHtml(opts)))
    .pipe(gulp.dest(pathProd.mainRoot))
    .pipe(req.size({title: 'Html Minified'}));
});
*/


/** Clean Dist folder before adding new files. you can clean other folder adding it to the array **/
gulp.task('clean', function(cb) {
    del(['dist']).then(function(){
      cb();
    });
});


/* Webserver with livereload facility */
gulp.task('webserver', function() {
  gulp.src('app')
    .pipe(webserver({
      livereload: true,
      directoryListing: false,
      open: true
      //fallback: 'index.html'
    }));
});
/* webserver dist folder */
gulp.task('webserver_dist', function() {
  gulp.src('dist')
    .pipe(req.webserver({
      livereload: true,
      directoryListing: false,
      open: true
      //fallback: 'index.html'
    }));
});


//Task to watch changes on folders and file. 
gulp.task('watch', function () {
  gulp.watch(['app/*.html']);
  gulp.watch(pathDev.js, ['jshint']);
  gulp.watch(pathDev.css, ['css']);
  gulp.watch('app/templates/**/*.hbs', ['do-templates']);
 // gulp.watch(pathDev.images);
  gulp.watch(pathDev.data);
  gulp.watch(pathDev.brochures);
});


//gulp.task('build', ['clean'], function(cb){
gulp.task('build', ['clean'], function(cb){
    console.log(" Starting.")
    sequal(['fonts', 'data', 'brochures','index_page','video'],'css', 'jshint', ['images'], ['html'], 'minhtml', function(){
     console.log(" all complete....."+ currentClient);
    });

});

// Task to start server and watch assets 
gulp.task('server', ['webserver', 'watch'], function(){});
// Run server on dist folder to check if minification is working
gulp.task('server:dist', ['webserver_dist'], function(){});