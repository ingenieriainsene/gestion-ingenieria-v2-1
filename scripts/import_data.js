const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '..', 'clientes_exportacion.csv');
const sqlFilePath = path.join(__dirname, '..', 'sql', 'import_clientes.sql');

function normalizeName(str) {
    if (!str) return "";
    str = str.replace(/^"|"$/g, '').trim(); // Remove quotes and trim
    if (str === "") return "";
    
    return str.toLowerCase().split(' ').map(word => {
        if (word.length === 0) return "";
        // Special cases can be added here
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function cleanDNI(str) {
    if (!str) return "";
    return str.replace(/^"|"$/g, '').trim().toUpperCase();
}

function escapeSQL(str) {
    if (!str) return "NULL";
    return "'" + str.replace(/'/g, "''") + "'";
}

function processCSV() {
    console.log('>>> Leyendo CSV...');
    const data = fs.readFileSync(csvFilePath, 'latin1');
    const lines = data.split(/\r?\n/);
    
    const headers = lines[0].split(';');
    console.log('>>> Cabeceras detectedas:', headers);

    let sqlEntries = [];
    const BATCH_SIZE = 500;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(';');
        if (columns.length < 5) continue;

        // "Id";"Nombre cliente";"Apellido 1";"Apellido 2";"DNI";"Dirección"
        const nombre = normalizeName(columns[1]);
        const apellido1 = normalizeName(columns[2]);
        const apellido2 = normalizeName(columns[3]);
        const dni = cleanDNI(columns[4]);
        const direccion = columns[5] ? columns[5].replace(/^"|"$/g, '').trim() : "";

        if (!dni) continue;

        sqlEntries.push(`(${escapeSQL(nombre)}, ${escapeSQL(apellido1)}, ${escapeSQL(apellido2)}, ${escapeSQL(dni)}, ${escapeSQL(direccion)}, 'import_access')`);
    }

    console.log(`>>> Procesados ${sqlEntries.length} registros.`);

    let sqlOutput = `-- SCRIPT DE IMPORTACIÓN DE CLIENTES\n`;
    sqlOutput += `-- Generado automáticamente el ${new Date().toISOString()}\n\n`;
    sqlOutput += `BEGIN;\n\n`;

    for (let i = 0; i < sqlEntries.length; i += BATCH_SIZE) {
        const batch = sqlEntries.slice(i, i + BATCH_SIZE);
        sqlOutput += `INSERT INTO clientes (nombre, apellido1, apellido2, dni, direccion_fiscal_completa, creado_por)\n`;
        sqlOutput += `VALUES\n  ` + batch.join(',\n  ') + `\n`;
        sqlOutput += `ON CONFLICT (dni) DO NOTHING;\n\n`;
    }

    sqlOutput += `COMMIT;\n`;

    fs.writeFileSync(sqlFilePath, sqlOutput);
    console.log(`>>> Script SQL generado en: ${sqlFilePath}`);
}

processCSV();
