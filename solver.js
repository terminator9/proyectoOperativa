class LinearProgrammingSolver {
    constructor() {
        this.variables = 2;
    }
  
    solve() {
        // Recopilar datos del problema
        const objectiveType = document.getElementById('objectiveType').value;
        const c1 = parseFloat(document.getElementById('c1').value);
        const c2 = parseFloat(document.getElementById('c2').value);
  
        // Recopilar restricciones
        const constraints = [];
        const A = [];
        const b = [];
        const operadores = [];
  
        document.querySelectorAll('.constraint-container').forEach(container => {
            const inputs = container.querySelectorAll('input');
            const sign = container.querySelector('select').value;
  
            A.push([
                parseFloat(inputs[0].value) || 0,
                parseFloat(inputs[1].value) || 0
            ]);
            b.push(parseFloat(inputs[2].value) || 0);
            operadores.push(sign);
        });
  
        // Resolver usando el método apropiado
        let result;
        if (objectiveType === 'max') {
            result = this.simplexMaximizar([c1, c2], A, b, operadores);
        } else {
            result = this.simplexMinimizar([c1, c2], A, b, operadores);
        }
  
        return this.formatResult(result, objectiveType);
    }
  
    simplexMaximizar(c, A, b, operadores) {
        const m = A.length; // Número de restricciones
        const n = A[0].length; // Número de variables
  
        // Crear tabla simplex
        const tabla = [];
        for (let i = 0; i <= m; i++) {
            tabla[i] = [];
            for (let j = 0; j <= m + n; j++) {
                tabla[i][j] = 0;
            }
        }
  
        // Llenar la tabla
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                tabla[i][j] = A[i][j];
            }
            tabla[i][n + i] = 1;
            tabla[i][m + n] = b[i];
  
            if (operadores[i] === "<=") {
                tabla[i][m + n + 1 + i] = 1;
            } else if (operadores[i] === ">=") {
                tabla[i][m + n + 1 + i] = -1;
            }
        }
  
        for (let j = 0; j < n; j++) {
            tabla[m][j] = -c[j];
        }
        tabla[m][m + n] = 0;
  
        // Iteración del método simplex
        while (true) {
            let columnaPivote = 0;
            for (let j = 1; j <= m + n; j++) {
                if (tabla[m][j] < tabla[m][columnaPivote]) {
                    columnaPivote = j;
                }
            }
  
            if (tabla[m][columnaPivote] >= 0) break;
  
            let filaPivote = -1;
            for (let i = 0; i < m; i++) {
                if (tabla[i][columnaPivote] > 0) {
                    if (filaPivote === -1 || 
                        tabla[i][m + n] / tabla[i][columnaPivote] < 
                        tabla[filaPivote][m + n] / tabla[filaPivote][columnaPivote]) {
                        filaPivote = i;
                    }
                }
            }
  
            if (filaPivote === -1) {
                throw new Error("El problema es ilimitado");
            }
  
            // Operaciones de pivote
            const elementoPivote = tabla[filaPivote][columnaPivote];
            for (let j = 0; j <= m + n; j++) {
                tabla[filaPivote][j] /= elementoPivote;
            }
  
            for (let i = 0; i <= m; i++) {
                if (i !== filaPivote) {
                    const factor = tabla[i][columnaPivote];
                    for (let j = 0; j <= m + n; j++) {
                        tabla[i][j] -= factor * tabla[filaPivote][j];
                    }
                }
            }
        }
  
        // Extraer solución
        const solucion = new Array(n).fill(0);
        let valorMaximizado = 0;
  
        for (let j = 0; j < n; j++) {
            let valor = 0;
            let filaPivote = -1;
            for (let i = 0; i < m; i++) {
                if (Math.abs(tabla[i][j]) > valor) {
                    valor = Math.abs(tabla[i][j]);
                    filaPivote = i;
                }
            }
            if (filaPivote !== -1) {
                solucion[j] = tabla[filaPivote][m + n] / tabla[filaPivote][j];
                valorMaximizado += c[j] * solucion[j];
            }
        }
  
        return {
            solucion,
            valorObjetivo: valorMaximizado,
            tabla
        };
    }
  
    simplexMinimizar(c, A, b, operadores) {
        // Similar al maximizar pero con los ajustes necesarios para minimización
        const resultado = this.simplexMaximizar(
            c.map(v => -v),
            A,
            b,
            operadores
        );
  
        return {
            solucion: resultado.solucion,
            valorObjetivo: -resultado.valorObjetivo,
            tabla: resultado.tabla
        };
    }
  
    formatResult(result, objectiveType) {
        return {
            optimal: true,
            objectiveValue: result.valorObjetivo,
            variables: [
                { name: 'X1', value: result.solucion[0] },
                { name: 'X2', value: result.solucion[1] }
            ],
            constraints: result.tabla.slice(1, -1).map((row, i) => ({
                slack: row[row.length - 1],
                dual: row[0]
            }))
        };
    }
  
    formatSolution(result) {
        return `
            <h4>SOLUCIÓN ÓPTIMA</h4>
            <p>Valor de la Función Objetivo = ${result.objectiveValue.toFixed(3)}</p>
  
            <h5>Variables</h5>
            <table class="table table-sm results-table">
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.variables.map(v => `
                        <tr>
                            <td>${v.name}</td>
                            <td>${v.value.toFixed(3)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
  }
  
  // Inicialización
  document.addEventListener('DOMContentLoaded', () => {
    const solver = new LinearProgrammingSolver();
  
    document.getElementById('solve').addEventListener('click', () => {
        const result = solver.solve();
        document.getElementById('solution').innerHTML = solver.formatSolution(result);
        updateVisualization(result);
    });
  });