import gulp from 'gulp';
import yargs from 'yargs';
const sass = require("gulp-sass")(require("sass"));
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps  from 'gulp-sourcemaps';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import uglify from 'gulp-uglify';
import named from 'vinyl-named';
import browserSync from 'browser-sync';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';

// Variable con las rutas ( paths )
const paths = {
    styles: {
        src: 'src/scss/style.scss',
        dest: 'dist/css'
    },
    images: {
        src: 'src/images/**/*',
        dest: 'dist/images'
    },
    scripts: {
        src: 'src/js/main.js',
        dest: 'dist/js'
    },
    other: {
        src: ['src/**/*', '!src/{images,js,scss}', '!src/{images,js,scss}/**/*'],
        dest: 'dist/'
    },
    extern_images: {
        src: ['node_modules/lightgallery/images/*'],
        dest: 'dist/images'
    },
    extern_fonts: {
        src: ['node_modules/lightgallery/fonts/*'],
        dest: 'dist/fonts'
    },
}

// Yarg > creamos variable de produccion
const PRODUCTION = yargs.argv.prod;

// Browser sync > crear servidor
// const server = browserSync.create();

// Browser sync > TAREA iniciar el servidor
// export const serve = (done) => {
//     server.init({
//         proxy: "http://argos3/"
//     })
//     done();
// }

// // Browser sync > TAREA refrescar servidor
// export const reload = (done) => {
//     server.reload();
//     done();
// }

// Del > TAREA para borrar la carpeta de la distribucion ( dist )
export const clean = () => {
    return del(['dist'])
}

// TAREA para compilar sass y generar el sourcemap ( produccion y desarrollo - gulpif )
export const styles = () => {
    return gulp.src(paths.styles.src)
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([ autoprefixer() ]))
        .pipe(gulpif(PRODUCTION, cleanCSS({compatibility: 'ie8'})))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(gulp.dest(paths.styles.dest))
        // .pipe(server.stream()); // ?? Para que era esta funcion? 
}

// TAREA para las imagenes + compresion
export const images = () => {
    return gulp.src(paths.images.src)
        .pipe(gulpif(PRODUCTION, imagemin()))
        .pipe(gulp.dest(paths.images.dest))
}

// TAREA para copiar cualquier archivo que no sea sass, imagenes o js
export const copy = () => {
    return gulp.src(paths.other.src)
        .pipe(gulp.dest(paths.other.dest))
}

// TAREA para copiar cualquier archivo que no sea sass, imagenes o js
export const copyExtImages = () => {
    return gulp.src(paths.extern_images.src)
        .pipe(gulp.dest(paths.extern_images.dest))
}

// TAREA para copiar cualquier archivo que no sea sass, imagenes o js
export const copyExtFonts = () => {
    return gulp.src(paths.extern_fonts.src)
        .pipe(gulp.dest(paths.extern_fonts.dest))
}

// TAREA para "vigilar" si se hace un cambio (si se hace un cambio, hace la correspondiente funcion)
export const watch = () => {
    gulp.watch('src/scss/**/*.scss', styles ); // ?? En el styles no hace falta reload por el stream de arriba?
    gulp.watch('src/js/**/*.js', scripts);
    // gulp.watch('**/*.php', copy);
    gulp.watch(paths.images.src, images);
    gulp.watch(paths.other.src, copy);
}

// Webpack
export const scripts = () => {
    return gulp.src(paths.scripts.src)
        .pipe(named()) // ?? Como funciona exactamente vinyl-named?
        .pipe(webpack({
            module: {
                rules: [
                    {
		                test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['@babel/preset-env'] //or ['babel-preset-env']
                            }
			            }
		            }
		        ]
            },
	        output: {
	            filename: '[name].js'
            },
            externals: {
                jquery: 'jQuery' // ?? Como funcionan exactamente los externals??
            },
	        devtool: !PRODUCTION ? 'inline-source-map' : false,
            mode: PRODUCTION ? 'production' : 'development' //add this
	    }))
	    .pipe(gulpif(PRODUCTION, uglify())) //you can skip this now since mode will already minify
	    .pipe(gulp.dest(paths.scripts.dest));
}

// TAREA para trabajar > dev & production
// series: hace una funcion cuando acaba la anterior
// parallel: hace las funciones a la vez
export const dev = gulp.series(clean, gulp.parallel(styles, scripts, images, copy, copyExtImages, copyExtFonts), watch);
export const build = gulp.series(clean, gulp.parallel(styles, scripts, images, copy, copyExtImages, copyExtFonts));
export const library = gulp.series(copyExtImages, copyExtFonts);

// Asignamos dev como "por defecto"
export default dev;

// Produccion
// Para produccion hay que usar 'gulp build --prod' para que haga todas las funciones correctamente