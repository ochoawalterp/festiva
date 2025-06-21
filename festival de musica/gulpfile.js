import path from 'path'
import fs from 'fs'
import {glob} from 'glob'
import {src, dest, watch, series} from 'gulp'
import  * as dartSass from 'sass'
import gulpSass from 'gulp-sass'

const sass = gulpSass(dartSass)

import terser from 'gulp-terser';
import sharp from 'sharp';


export function js(done){
    src('src/js/app.js') //archivo de entrada
        .pipe(terser()) //minifica el archivo js
        .pipe(dest('build/js')) //archivo de salida
    done()
}

export function css(done) {
    //ubica el archivo
    src('src/scss/app.scss' , {sourcemaps : true})
        .pipe(sass({
            outputStyle: 'compressed' //estilo de salida,compressed,
        }).on('error', sass.logError)) //manda a llamar la funcion sass que se declaro arriba
        .pipe(dest('build/css', {sourcemaps:true})) //destino de la salida

    done()
}
//Nos permite crear imagenes en miniatura de las imagenes que estan en la carpeta full
//src/img/gallery/full y las guarda en la carpeta src/img/gallery/thumb
export async function crop(done) {
    const inputFolder = 'src/img/gallery/full'
    const outputFolder = 'src/img/gallery/thumb';
    const width = 250;
    const height = 180;
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true })
    }
    const images = fs.readdirSync(inputFolder).filter(file => {
        return /\.(jpg)$/i.test(path.extname(file));
    });
    try {
        images.forEach(file => {
            const inputFile = path.join(inputFolder, file)
            const outputFile = path.join(outputFolder, file)
            sharp(inputFile) 
                .resize(width, height, {
                    position: 'centre'
                })
                .toFile(outputFile)
        });

        done()
    } catch (error) {
        console.log(error)
    }
}


export async function imagenes(done) {
    const srcDir = './src/img';
    const buildDir = './build/img';
    const images =  await glob('./src/img/**/*{jpg,png}')

    images.forEach(file => {
        const relativePath = path.relative(srcDir, path.dirname(file));
        const outputSubDir = path.join(buildDir, relativePath);
        procesarImagenes(file, outputSubDir);
    });
    done();
}

function procesarImagenes(file, outputSubDir) {
    if (!fs.existsSync(outputSubDir)) {
        fs.mkdirSync(outputSubDir, { recursive: true })
    }
    const baseName = path.basename(file, path.extname(file))
    const extName = path.extname(file)
    const outputFile = path.join(outputSubDir, `${baseName}${extName}`)
    const outputFileWebp = path.join(outputSubDir, `${baseName}.webp`)
    const outputFileAvif = path.join(outputSubDir, `${baseName}.avif`)

    const options = { quality: 80 }
    sharp(file).jpeg(options).toFile(outputFile)
    sharp(file).webp(options).toFile(outputFileWebp)
    sharp(file).avif().toFile(outputFileAvif)//si se pone option te genera un archivo mas grande
}



// se agrego /**/*.scss para que se ejecuten todos los archivos no importanto enq ue
// carpeta estan */
export function dev(){
    watch('src/scss/**/*.scss', css) //cuando se detecte un cambio en el archivo, ejecuta la funcion css
    watch('src/js/**/*.js', js) //cuando se detecte un cambio en el archivo, ejecuta la funcion css
    watch('src/img/**/*.{png,jpg}', imagenes) //cuando se detecte un cambio en el archivo, ejecuta la funcion css
}

export default series(crop, js, css, imagenes, dev) //ejecuta las funciones en el orden que se declaran



