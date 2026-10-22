const movimientosArray = JSON.parse(localStorage.getItem("movimientos")) || [];
const todosMovimientos = document.getElementById("todosMovimientos");

function formatearImporte(valor) {
    return (Number.parseFloat(valor) || 0).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

const categorias = [
    {
        titulo: "Ingresos",
        tipo: "Ingreso",
        clase: "ingreso",
        signo: "+",
    },
    {
        titulo: "Gastos",
        tipo: "Gasto",
        clase: "gasto",
        signo: "-",
    },
    {
        titulo: "Sueldos",
        tipo: "Sueldo",
        clase: "gasto",
        signo: "-",
    },
    {
        titulo: "Ventas en efectivo",
        tipo: "Venta",
        metodo: "Efectivo",
        clase: "venta",
        signo: "+",
    },
    {
        titulo: "Ventas por transferencia",
        tipo: "Venta",
        metodo: "Transferencia",
        clase: "venta",
        signo: "+",
    },
    {
        titulo: "Ventas con tarjeta / QR",
        tipo: "Venta",
        metodos: ["Debito", "Credito", "Qr"],
        clase: "venta",
        signo: "+",
    },
];

todosMovimientos.innerHTML = "";

categorias.forEach((categoria) => {
    const movimientosCategoria = movimientosArray
        .map((movimiento, index) => ({ movimiento, index }))
        .filter(({ movimiento }) => {
            if (movimiento.tipoMovimiento !== categoria.tipo) {
                return false;
            }

            if (
                categoria.metodo &&
                movimiento.metodoPago !== categoria.metodo
            ) {
                return false;
            }

            if (
                categoria.metodos &&
                !categoria.metodos.includes(movimiento.metodoPago)
            ) {
                return false;
            }

            return true;
        })
        .reverse();

    if (movimientosCategoria.length === 0) return;

    const grupo = document.createElement("section");
    grupo.className = `grupoMovimientos ${categoria.clase}`;

    const encabezado = document.createElement("div");
    encabezado.className = "encabezadoGrupo";

    const titulo = document.createElement("h2");
    titulo.textContent = categoria.titulo;

    const total = movimientosCategoria.reduce(
        (suma, { movimiento }) =>
            suma + (Number.parseFloat(movimiento.monto) || 0),
        0
    );

    const cantidad = document.createElement("span");
    cantidad.textContent =
        `${movimientosCategoria.length} movimientos · $${formatearImporte(total)}`;

    encabezado.append(titulo, cantidad);
    grupo.appendChild(encabezado);

    movimientosCategoria.forEach(({ movimiento }) => {
        const item = document.createElement("div");
        item.className = "todosMov";

        const descripcion = document.createElement("h3");
        descripcion.className = "descripcionN";
        descripcion.textContent = movimiento.descripcion;

        const metodo = document.createElement("h3");
        metodo.className = "descripcion";
        metodo.textContent = movimiento.metodoPago;

        const importe = document.createElement("h3");
        importe.className = categoria.clase;
        importe.textContent =
            `${categoria.signo} $${formatearImporte(movimiento.monto)}`;

        const hora = document.createElement("h3");
        hora.className = "hora";
        hora.textContent = movimiento.hora;

        item.append(descripcion, metodo, importe, hora);
        grupo.appendChild(item);
    });

    todosMovimientos.appendChild(grupo);
});

if (todosMovimientos.children.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.textContent = "Todavía no hay movimientos registrados.";
    todosMovimientos.appendChild(mensaje);
}