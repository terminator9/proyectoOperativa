function updateVisualization(result) {
    const ctx = document.getElementById('graphCanvas').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Obtener los datos del problema
    const constraints = getConstraintsData();
    const { feasiblePoints, boundaries } = calculateFeasibleRegion(constraints);
    
    // Encontrar los límites del gráfico
    const maxX = Math.max(...feasiblePoints.map(p => p.x)) * 1.2;
    const maxY = Math.max(...feasiblePoints.map(p => p.y)) * 1.2;

    // Crear el nuevo gráfico
    window.myChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                // Región factible
                {
                    label: 'Región Factible',
                    data: feasiblePoints,
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderColor: 'rgba(0, 123, 255, 0.5)',
                    showLine: true,
                    fill: true,
                    pointRadius: 0
                },
                // Líneas de restricción
                ...boundaries.map((boundary, index) => ({
                    label: `Restricción ${index + 1}`,
                    data: boundary,
                    borderColor: `hsl(${index * 360/boundaries.length}, 70%, 50%)`,
                    showLine: true,
                    fill: false,
                    pointRadius: 0
                })),
                // Punto óptimo
                {
                    label: 'Solución Óptima',
                    data: [{
                        x: result.variables[0].value,
                        y: result.variables[1].value
                    }],
                    backgroundColor: 'red',
                    pointRadius: 5,
                    pointStyle: 'circle'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: maxX,
                    title: {
                        display: true,
                        text: 'X₁'
                    }
                },
                y: {
                    min: 0,
                    max: maxY,
                    title: {
                        display: true,
                        text: 'X₂'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function getConstraintsData() {
    const constraints = [];
    document.querySelectorAll('.constraint-container').forEach(container => {
        const inputs = container.querySelectorAll('input');
        const sign = container.querySelector('select').value;
        constraints.push({
            a: parseFloat(inputs[0].value) || 0,
            b: parseFloat(inputs[1].value) || 0,
            sign: sign,
            rhs: parseFloat(inputs[2].value) || 0
        });
    });
    return constraints;
}

function calculateFeasibleRegion(constraints) {
    // Encontrar los puntos de intersección
    const intersectionPoints = [];
    
    // Añadir puntos de intersección con los ejes
    constraints.forEach(c => {
        if (c.a !== 0) intersectionPoints.push({x: c.rhs/c.a, y: 0});
        if (c.b !== 0) intersectionPoints.push({x: 0, y: c.rhs/c.b});
    });

    // Encontrar intersecciones entre restricciones
    for(let i = 0; i < constraints.length; i++) {
        for(let j = i + 1; j < constraints.length; j++) {
            const point = findIntersection(constraints[i], constraints[j]);
            if (point) intersectionPoints.push(point);
        }
    }

    // Filtrar puntos factibles
    const feasiblePoints = intersectionPoints.filter(point => 
        point.x >= 0 && point.y >= 0 && 
        constraints.every(c => 
            evaluateConstraint(c, point)
        )
    );

    // Ordenar puntos para formar el polígono
    const centroid = calculateCentroid(feasiblePoints);
    feasiblePoints.sort((a, b) => 
        Math.atan2(a.y - centroid.y, a.x - centroid.x) - 
        Math.atan2(b.y - centroid.y, b.x - centroid.x)
    );

    // Generar líneas de restricción
    const boundaries = constraints.map(c => generateBoundaryLine(c, feasiblePoints));

    return { feasiblePoints, boundaries };
}

function findIntersection(c1, c2) {
    const det = c1.a * c2.b - c2.a * c1.b;
    if (det === 0) return null; // Líneas paralelas

    const x = (c1.rhs * c2.b - c2.rhs * c1.b) / det;
    const y = (c1.a * c2.rhs - c2.a * c1.rhs) / det;

    return { x, y };
}

function evaluateConstraint(constraint, point) {
    const value = constraint.a * point.x + constraint.b * point.y;
    switch(constraint.sign) {
        case '<=': return value <= constraint.rhs;
        case '>=': return value >= constraint.rhs;
        case '=': return Math.abs(value - constraint.rhs) < 0.0001;
        default: return false;
    }
}

function calculateCentroid(points) {
    const sum = points.reduce((acc, p) => ({x: acc.x + p.x, y: acc.y + p.y}), {x: 0, y: 0});
    return {
        x: sum.x / points.length,
        y: sum.y / points.length
    };
}

function generateBoundaryLine(constraint, feasiblePoints) {
    if (feasiblePoints.length === 0) return [];

    const maxX = Math.max(...feasiblePoints.map(p => p.x)) * 1.2;
    const maxY = Math.max(...feasiblePoints.map(p => p.y)) * 1.2;

    const points = [];
    if (constraint.b === 0) {
        // Línea vertical
        const x = constraint.rhs / constraint.a;
        points.push({x, y: 0}, {x, y: maxY});
    } else {
        // Línea general
        points.push({x: 0, y: constraint.rhs / constraint.b});
        if (constraint.a !== 0) {
            const x = constraint.rhs / constraint.a;
            points.push({x, y: 0});
        } else {
            points.push({x: maxX, y: constraint.rhs / constraint.b});
        }
    }

    return points;
}