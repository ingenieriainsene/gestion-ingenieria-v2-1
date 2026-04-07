const fs = require('fs');
const path = require('path');

// RUTAS DE ARCHIVOS
const ANTIGUO_CSV = path.join(__dirname, '..', 'Clientes_bd_antiguo.csv');
const EXPORT_CSV = path.join(__dirname, '..', 'clientes_exportacion.csv');
const OUTPUT_FILE = path.join(__dirname, '..', 'sql', 'import_clientes_completo.sql');

function cleanSQL(val) {
    if (val === null || val === undefined || val === '' || val === 'NULL') return 'NULL';
    return `'${String(val).replace(/'/g, "''")}'`;
}

function cleanDNI(dni) {
    if (!dni) return '';
    return dni.toString().replace(/\s/g, '').replace(/"/g, '').toUpperCase();
}

console.log('--- Iniciando FUSIÓN FINAL DEDUPLICADA (SÓLO TABLA CLIENTES) ---');

try {
    // 1. CARGAR DATOS ADICIONALES (EMAIL/TLF) DESDE EL ARCHIVO ANTIGUO (Mapping por DNI)
    const rawAntiguo = fs.readFileSync(ANTIGUO_CSV, 'latin1');
    const mapping = {};
    
    rawAntiguo.split(/\r?\n/).forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(';');
        if (parts.length < 9) return;

        let dni = cleanDNI(parts[4]);
        if (dni.length < 5) return;

        // Guardamos el primero que encontremos o el que tenga más info
        if (!mapping[dni]) {
            mapping[dni] = {
                email: (parts[6] || '').trim().toLowerCase(),
                telefono: (parts[7] || '').trim(),
                codigo_postal: (parts[8] || '').trim()
            };
        }
    });
    console.log(`- Mapeo de datos antiguos cargado: ${Object.keys(mapping).length} DNIs únicos.`);

    // 2. PROCESAR EXPORTACIÓN LIMPIA (ESTRUCTURA DE VERDAD PARA IDS Y NOMBRES)
    const rawExport = fs.readFileSync(EXPORT_CSV, 'latin1');
    const lines = rawExport.split(/\r?\n/).filter((l, i) => i > 0 && l.trim());
    
    let sqlContent = `-- IMPORTACIÓN MAESTRA DE CLIENTES (DEDUPLICADA POR DNI)\n`;
    sqlContent += `-- Generado: ${new Date().toISOString()}\n\n`;
    sqlContent += `BEGIN;\n\n`;
    sqlContent += `-- Asegurar existencia de columna telefono en tabla clientes\n`;
    sqlContent += `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);\n\n`;

    let processedCount = 0;
    let dnisProcesados = new Set();
    let batch = [];
    const BATCH_SIZE = 100;

    lines.forEach(line => {
        const parts = line.split(';').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length < 5) return;

        let id_cliente = parseInt(parts[0]);
        let nombre = parts[1];
        let ap1 = parts[2];
        let ap2 = parts[3];
        let dni = cleanDNI(parts[4]);
        let direccion = parts[5] || '';
        
        if (isNaN(id_cliente) || dni.length < 5) return;

        // EVITAR DUPLICADOS DE DNI (Postgres UNIQUE CONSTRAINT)
        if (dnisProcesados.has(dni)) {
            console.warn(`! Saltando DNI duplicado: ${dni} (ID: ${id_cliente})`);
            return;
        }
        dnisProcesados.add(dni);

        let extra = mapping[dni] || { email: '', telefono: '', codigo_postal: '' };

        batch.push(`(${id_cliente}, ${cleanSQL(nombre)}, ${cleanSQL(ap1)}, ${cleanSQL(ap2)}, ${cleanSQL(dni)}, ${cleanSQL(direccion)}, ${cleanSQL(extra.codigo_postal)}, ${cleanSQL(extra.email)}, ${cleanSQL(extra.telefono)}, 'Fusión Final')`);

        if (batch.length >= BATCH_SIZE) {
            sqlContent += `INSERT INTO clientes (id_cliente, nombre, apellido1, apellido2, dni, direccion_fiscal_completa, codigo_postal, email, telefono, creado_por) VALUES \n` + batch.join(',\n') + `\nON CONFLICT (id_cliente) DO UPDATE SET dni = EXCLUDED.dni, nombre = EXCLUDED.nombre, email = EXCLUDED.email, telefono = EXCLUDED.telefono;\n\n`;
            batch = [];
        }

        processedCount++;
    });

    // Procesar último lote
    if (batch.length > 0) {
        sqlContent += `INSERT INTO clientes (id_cliente, nombre, apellido1, apellido2, dni, direccion_fiscal_completa, codigo_postal, email, telefono, creado_por) VALUES \n` + batch.join(',\n') + `\nON CONFLICT (id_cliente) DO UPDATE SET dni = EXCLUDED.dni, nombre = EXCLUDED.nombre, email = EXCLUDED.email, telefono = EXCLUDED.telefono;\n\n`;
    }

    // Sincronizar secuencia
    sqlContent += `\n-- Sincronización de secuencia de IDs\n`;
    sqlContent += `SELECT setval('clientes_id_cliente_seq', (SELECT MAX(id_cliente) FROM clientes));\n\n`;
    sqlContent += `COMMIT;\n`;

    fs.writeFileSync(OUTPUT_FILE, sqlContent, 'utf8');
    
    console.log(`--- Proceso finalizado ---`);
    console.log(`Total clientes únicos procesados: ${processedCount}`);
    console.log(`Archivo MAESTRO generado: sql/import_clientes_completo.sql`);

} catch (err) {
    console.error('ERROR FATAL:', err);
}
