const fs = require('fs');
const path = require('path');

// Extensiones donde NestJS busca definiciones de GraphQL
const extensions = ['.ts', '.graphql', '.gql', '.js'];
const rootDir = path.join(process.cwd(), 'src');

console.log('🔍 Buscando el archivo culpable del error U+00C2 (Â)...');

function checkFile(filePath) {
    const content = fs.readFileSync(filePath);
    
    // El carácter U+00C2 en binario UTF-8 suele aparecer como 0xC2
    // Buscamos específicamente si el archivo empieza con bytes problemáticos
    // o si contiene la secuencia de "espacio de no ruptura" mal codificado.
    
    const hasC2 = content.includes(0xC2);
    const hasBOM = content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF;

    if (hasC2 || hasBOM) {
        console.log(`\n⚠️  ¡ARCHIVO SOSPECHOSO ENCONTRADO!: ${filePath}`);
        if (hasBOM) console.log('   - Tiene un BOM (Byte Order Mark) de UTF-8.');
        if (hasC2) console.log('   - Contiene el byte 0xC2 (posible carácter Â invisible).');
        
        // Intentar limpiar
        let text = content.toString('utf8');
        const cleanText = text
            .replace(/\uFEFF/g, '') // Quitar BOM
            .replace(/\u00C2/g, '') // Quitar Â
            .replace(/\u00A0/g, ' '); // Cambiar NBSP por espacio normal
            
        fs.writeFileSync(filePath, cleanText, 'utf8');
        console.log('   ✅ Archivo saneado automáticamente.');
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (extensions.includes(path.extname(file))) {
            checkFile(fullPath);
        }
    });
}

try {
    walk(rootDir);
    console.log('\n✨ Escaneo finalizado.');
    console.log('Si se limpiaron archivos, intenta correr:');
    console.log('rd /s /q dist && npm run start:dev');
} catch (e) {
    console.error('Error durante el escaneo:', e);
}