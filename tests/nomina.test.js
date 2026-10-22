// Pruebas del motor. Ejecutar con: node tests/nomina.test.js
const assert = require('assert');
const M = require('../src/nomina');
const E = require('../data/escenarios.json');

let ok = 0;
const t = (nombre, fn) => { fn(); ok++; console.log('✓', nombre); };

t('SMI: retención IRPF 0 %', () => {
  const n = M.calcularNomina(17094);
  assert.strictEqual(n.tipoIrpf, 0);
});

t('Cotización del trabajador ≈ 6,50 % en indefinido', () => {
  const n = M.calcularNomina(20000);
  assert.ok(Math.abs(n.seguridadSocialAnual - 20000 * 0.065) < 0.01);
});

t('Temporal cotiza más por desempleo que indefinido', () => {
  const a = M.calcularNomina(20000, { contrato: 'indefinido' });
  const b = M.calcularNomina(20000, { contrato: 'temporal' });
  assert.ok(b.seguridadSocialAnual > a.seguridadSocialAnual);
});

t('El IRPF crece con el salario y el neto nunca baja', () => {
  let prevTipo = -1, prevNeto = 0;
  for (let b = 16000; b <= 40000; b += 100) {
    const n = M.calcularNomina(b);
    assert.ok(n.tipoIrpf >= prevTipo, `tipo no monótono en ${b}`);
    assert.ok(n.netoAnual > prevNeto, `neto no crece en ${b}`);
    prevTipo = n.tipoIrpf; prevNeto = n.netoAnual;
  }
});

t('Tipos razonables (referencia AEAT aproximada)', () => {
  const n20 = M.calcularNomina(20000);
  const n30 = M.calcularNomina(30000);
  assert.ok(n20.tipoIrpf > 3 && n20.tipoIrpf < 11, `20k: ${n20.tipoIrpf}`);
  assert.ok(n30.tipoIrpf > 13 && n30.tipoIrpf < 19, `30k: ${n30.tipoIrpf}`);
});

t('12 y 14 pagas dan el mismo neto anual', () => {
  const a = M.calcularNomina(20000, { pagas: 12 });
  const b = M.calcularNomina(20000, { pagas: 14 });
  assert.strictEqual(a.netoAnual, b.netoAnual);
});

t('Entradas no válidas lanzan error', () => {
  assert.throws(() => M.calcularNomina(-1));
  assert.throws(() => M.calcularNomina(NaN));
  assert.throws(() => M.calcularNomina(20000, { pagas: 13 }));
});

t('Presupuesto: detecta descuadre y regla 50/30/20', () => {
  const r = M.evaluarPresupuesto(1300, { vivienda: 587, suministros: 50, comida: 250, transporte: 20, movil: 20, ocio: 150, ahorro: 130 });
  assert.strictEqual(r.cuadra, true);
  const mal = M.evaluarPresupuesto(1300, { vivienda: 1250, comida: 250 });
  assert.strictEqual(mal.cuadra, false);
});

t('Año simulado reproducible con la misma semilla', () => {
  const n = M.calcularNomina(18500);
  const a = M.simularAnio({ nomina: n, gastoMensual: 1100, semilla: 7 });
  const b = M.simularAnio({ nomina: n, gastoMensual: 1100, semilla: 7 });
  assert.deepStrictEqual(a, b);
  assert.strictEqual(a.meses.length, 12);
});

console.log(`\n${ok} pruebas superadas\n`);
console.log('Ofertas de ejemplo (neto mensual equivalente):');
for (const o of E.ofertas) {
  const n = M.calcularNomina(o.brutoAnual, o);
  const c = E.ciudades[o.ciudad];
  console.log(`  ${o.puesto.padEnd(48)} ${String(o.brutoAnual).padStart(6)} € → neto ${n.netoMensualEquivalente.toFixed(2)} €/mes · IRPF ${n.tipoIrpf} % · esfuerzo habitación ${c.nombre}: ${M.tasaEsfuerzo(n.netoMensualEquivalente, c.habitacion, E.gastosBase.suministrosHabitacion)} %`);
}
