/* =========================
   FECHA
========================= */

const fecha = document.getElementById("fecha");
const hoy = new Date();

fecha.textContent = hoy.toLocaleDateString("es-AR");

/* =========================
   CAJA INICIAL
========================= */

const cajaInEfectivo = document.getElementById("cajaInicialEfectivo");
const cajaInTransferencia = document.getElementById("cajaInicialTransferencia");

cajaInEfectivo.value = localStorage.getItem("cajaEfectivo") ?? "";
cajaInTransferencia.value = localStorage.getItem("cajaInTransf") ?? "";

cajaInEfectivo.addEventListener("input", () => {
  localStorage.setItem("cajaEfectivo", cajaInEfectivo.value);
});

cajaInTransferencia.addEventListener("input", () => {
  localStorage.setItem("cajaInTransf", cajaInTransferencia.value);
});

/* =========================
   BOTÓN CARGAR CAJA
========================= */

const botonCargar = document.getElementById("cargar");

botonCargar.addEventListener("click", () => {
  location.reload();
});

/* =========================
   ELEMENTOS DEL FORMULARIO
========================= */

const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipoMovimiento = document.getElementById("seleccionarTipo");
const tipoMetodo = document.getElementById("seleccionarMetodo");
const agregar = document.getElementById("btnAgregar");
const listaMovimientos = document.getElementById("listaMovimientos");

let movimientosArray = JSON.parse(localStorage.getItem("movimientos")) || [];

/* =========================
   CARGAR TIPOS DE MOVIMIENTO
========================= */

fetch("./db/dataTipos.json")
  .then((respuesta) => {
    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los tipos de movimiento");
    }

    return respuesta.json();
  })
  .then((tipos) => {
    tipos.forEach((tipo) => {
      const option = document.createElement("option");

      option.value = tipo.nombre;
      option.textContent = tipo.nombre;

      tipoMovimiento.appendChild(option);
    });
  })
  .catch((error) => console.error(error));

/* =========================
   CARGAR MÉTODOS DE PAGO
========================= */

fetch("./db/dataMetodos.json")
  .then((respuesta) => {
    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los métodos de pago");
    }

    return respuesta.json();
  })
  .then((metodos) => {
    metodos.forEach((metodo) => {
      const option = document.createElement("option");

      option.value = metodo.nombre;
      option.textContent = metodo.nombre;

      tipoMetodo.appendChild(option);
    });
  })
  .catch((error) => console.error(error));

/* =========================
   UTILIDADES
========================= */

function obtenerMonto(movimiento) {
  return Number.parseFloat(movimiento.monto) || 0;
}

function formatearImporte(valor) {
  return valor.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function guardarMovimientos() {
  localStorage.setItem("movimientos", JSON.stringify(movimientosArray));
}

function sumarMovimientos(filtro) {
  return movimientosArray
    .filter(filtro)
    .reduce((total, movimiento) => total + obtenerMonto(movimiento), 0);
}

function actualizarResumenes() {
  renderMovimientos(movimientosArray);
  renderCierreEfectivo();
  renderCierreTransferencia();
  renderIngresos();
  renderSueldos();
  cierreTarjetas();
  renderVentasTotales();
  renderGastosTotales();
}

/* =========================
   AGREGAR MOVIMIENTO
========================= */

agregar.addEventListener("click", () => {
  const detalles = descripcion.value.trim();
  const montoIngresado = monto.value.trim();
  const movimiento = tipoMovimiento.value;
  const metodo = tipoMetodo.value;
  const montoNumerico = Number(montoIngresado);

  if (
    detalles === "" ||
    montoIngresado === "" ||
    movimiento === "" ||
    metodo === "" ||
    !Number.isFinite(montoNumerico) ||
    montoNumerico <= 0
  ) {
    Swal.fire({
      title: "Revisá los datos",
      text: "Completá todos los campos e ingresá un monto mayor que cero.",
      icon: "error",
    });

    return;
  }

  const nuevoMovimiento = {
    descripcion: detalles,
    monto: montoNumerico,
    tipoMovimiento: movimiento,
    metodoPago: metodo,
    hora: new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  movimientosArray.push(nuevoMovimiento);

  guardarMovimientos();
  actualizarResumenes();

  Toastify({
    text: `${nuevoMovimiento.tipoMovimiento} AGREGADO/A`,
    duration: 3000,
    gravity: "bottom",
    position: "center",
    style: {
      background: "#28A745",
    },
  }).showToast();

  descripcion.value = "";
  monto.value = "";
  tipoMovimiento.value = "";
  tipoMetodo.value = "";
});

/* =========================
   LISTA DE MOVIMIENTOS
========================= */

function renderMovimientos(array) {
  listaMovimientos.innerHTML = "";

  // Área desplazable para los movimientos.
  const contenedorLista = document.createElement("div");
  contenedorLista.className = "listaMovimientosScroll";

  // Mostrar primero los movimientos más recientes.
  // Conservar el índice original para eliminar el correcto.
  const movimientosOrdenados = array
    .map((movimiento, indexOriginal) => ({
      movimiento,
      indexOriginal,
    }))
    .reverse();

  movimientosOrdenados.forEach(({ movimiento, indexOriginal }) => {
    let color = "ingreso";
    let signo = "+";

    if (movimiento.tipoMovimiento === "Venta") {
      color = "venta";
    } else if (
      movimiento.tipoMovimiento === "Gasto" ||
      movimiento.tipoMovimiento === "Sueldo"
    ) {
      color = "gasto";
      signo = "-";
    }

    const itemMovim = document.createElement("div");

    itemMovim.innerHTML = `
            <div class="renderMov">
                <h3 class="descripcionN"></h3>
                <h3 class="descripcion"></h3>
                <h3 class="${color}"></h3>
                <h3 class="hora"></h3>
                <button
                    class="btnEliminar"
                    type="button"
                    aria-label="Eliminar movimiento"
                >❌</button>
            </div>
        `;

    itemMovim.querySelector(".descripcionN").textContent =
      movimiento.descripcion;

    itemMovim.querySelector(".descripcion").textContent = movimiento.metodoPago;

    itemMovim.querySelector(`.${color}`).textContent =
      `${signo} $${formatearImporte(obtenerMonto(movimiento))}`;

    itemMovim.querySelector(".hora").textContent = movimiento.hora;

    const btnEliminar = itemMovim.querySelector(".btnEliminar");

    btnEliminar.addEventListener("click", () => {
      Swal.fire({
        title: "¿Eliminar movimiento?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (!result.isConfirmed) return;

        movimientosArray.splice(indexOriginal, 1);

        guardarMovimientos();
        actualizarResumenes();

        Toastify({
          text: "MOVIMIENTO ELIMINADO",
          duration: 3000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "#f03a17",
          },
        }).showToast();
      });
    });

    contenedorLista.appendChild(itemMovim);
  });

  // Primero se agrega el listado desplazable.
  listaMovimientos.appendChild(contenedorLista);

  // El botón queda fuera del scroll, debajo de la lista.
  const divVerMas = document.createElement("div");
  divVerMas.className = "verMas";

  divVerMas.innerHTML = `
        <a href="./pages/movimientos.html">
            <button type="button">Ver todos los movimientos</button>
        </a>
    `;

  listaMovimientos.appendChild(divVerMas);
}

/* =========================
   INGRESOS DEL DÍA
========================= */

function renderIngresos() {
  const ingresosEfectivo = sumarMovimientos(
    (m) => m.tipoMovimiento === "Ingreso" && m.metodoPago === "Efectivo",
  );

  const ingresosTransf = sumarMovimientos(
    (m) => m.tipoMovimiento === "Ingreso" && m.metodoPago === "Transferencia",
  );

  const resumenIngreso = document.getElementById("resumenIngresos");

  resumenIngreso.innerHTML = `
        <div class="ventasFinales">
            <h3>Ingresos en efectivo: $${formatearImporte(ingresosEfectivo)}</h3>
            <h3>Ingresos por transferencia: $${formatearImporte(ingresosTransf)}</h3>
        </div>
    `;

  return ingresosEfectivo + ingresosTransf;
}

/* =========================
   SUELDOS
========================= */

function renderSueldos() {
  const sueldo = sumarMovimientos(
    (m) =>
      m.tipoMovimiento === "Sueldo" &&
      ["Efectivo", "Transferencia"].includes(m.metodoPago),
  );

  const sueldosEmpleados = document.getElementById("sueldosDetallados");

  sueldosEmpleados.innerHTML = `
        <h3 class="ventasFinales">
            Total de sueldos: $${formatearImporte(sueldo)}
        </h3>
    `;

  return sueldo;
}

/* =========================
   CIERRE DE CAJA EN EFECTIVO
========================= */

function renderCierreEfectivo() {
  const cajaInicial =
    Number.parseFloat(localStorage.getItem("cajaEfectivo")) || 0;

  const ventasEfectivo = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Efectivo",
  );

  const gastosEfectivo = sumarMovimientos(
    (m) =>
      ["Gasto", "Sueldo"].includes(m.tipoMovimiento) &&
      m.metodoPago === "Efectivo",
  );

  const ingresosEfectivo = sumarMovimientos(
    (m) => m.tipoMovimiento === "Ingreso" && m.metodoPago === "Efectivo",
  );

  const cajaFinalEfect =
    cajaInicial + ventasEfectivo - gastosEfectivo + ingresosEfectivo;

  const resumenEfectivo = document.getElementById("resumenEfectivo");

  resumenEfectivo.innerHTML = `
        <div class="ventasFinales">
            <h3>Caja inicial: $${formatearImporte(cajaInicial)}</h3>
            <h3>Ingresos: + $${formatearImporte(ingresosEfectivo)}</h3>
            <h3>Ventas: + $${formatearImporte(ventasEfectivo)}</h3>
            <h3>Gastos y sueldos: - $${formatearImporte(gastosEfectivo)}</h3>
            <p>--------------------------</p>
            <h3>Caja final: $${formatearImporte(cajaFinalEfect)}</h3>
        </div>
    `;

  return cajaFinalEfect;
}

/* =========================
   CIERRE DE CAJA POR TRANSFERENCIA
========================= */

function renderCierreTransferencia() {
  const cajaInicial =
    Number.parseFloat(localStorage.getItem("cajaInTransf")) || 0;

  const ventasTransf = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Transferencia",
  );

  const gastosTransf = sumarMovimientos(
    (m) =>
      ["Gasto", "Sueldo"].includes(m.tipoMovimiento) &&
      m.metodoPago === "Transferencia",
  );

  const ingresosTransf = sumarMovimientos(
    (m) => m.tipoMovimiento === "Ingreso" && m.metodoPago === "Transferencia",
  );

  const cajaFinalTransf =
    cajaInicial + ventasTransf - gastosTransf + ingresosTransf;

  const resumenTransf = document.getElementById("resumenTransferencia");

  resumenTransf.innerHTML = `
        <div class="ventasFinales">
            <h3>Caja inicial: $${formatearImporte(cajaInicial)}</h3>
            <h3>Ingresos: + $${formatearImporte(ingresosTransf)}</h3>
            <h3>Ventas: + $${formatearImporte(ventasTransf)}</h3>
            <h3>Gastos y sueldos: - $${formatearImporte(gastosTransf)}</h3>
            <p>--------------------------</p>
            <h3>Caja final: $${formatearImporte(cajaFinalTransf)}</h3>
        </div>
    `;

  return cajaFinalTransf;
}

/* =========================
   VENTAS CON TARJETA Y QR
========================= */

function cierreTarjetas() {
  const ventasDebito = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Debito",
  );

  const ventasCredito = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Credito",
  );

  const ventasQr = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Qr",
  );

  const resumenTarj = document.getElementById("resumenTarjeta");

  resumenTarj.innerHTML = `
        <div class="ventasFinales">
            <h3>Débitos: $${formatearImporte(ventasDebito)}</h3>
            <h3>Créditos: $${formatearImporte(ventasCredito)}</h3>
            <h3>QR: $${formatearImporte(ventasQr)}</h3>
        </div>
    `;

  return ventasDebito + ventasCredito + ventasQr;
}

/* =========================
   VENTAS TOTALES DEL DÍA
========================= */

function renderVentasTotales() {
  const ventasEfectivo = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Efectivo",
  );

  const ventasTransferencia = sumarMovimientos(
    (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Transferencia",
  );

  const ventasTarjetasQr = sumarMovimientos(
    (m) =>
      m.tipoMovimiento === "Venta" &&
      ["Debito", "Credito", "Qr"].includes(m.metodoPago),
  );

  const total = ventasEfectivo + ventasTransferencia + ventasTarjetasQr;

  const resumen = document.getElementById("resumenVentasTotales");

  resumen.innerHTML = `
        <div class="ventasFinales">
            <h3>Efectivo: $${formatearImporte(ventasEfectivo)}</h3>
            <h3>Transferencias: $${formatearImporte(ventasTransferencia)}</h3>
            <h3>Tarjetas / QR: $${formatearImporte(ventasTarjetasQr)}</h3>
            <h3 class="totalVentasDestacado">
                TOTAL: $${formatearImporte(total)}
            </h3>
        </div>
    `;

  return total;
}

/* =========================
   GASTOS TOTALES DEL DÍA
========================= */

function renderGastosTotales() {
  const totalGastos = sumarMovimientos((m) => m.tipoMovimiento === "Gasto");

  const resumen = document.getElementById("resumenGastosTotales");

  resumen.innerHTML = `
        <div class="ventasFinales">
            <h3 class="totalGastosDestacado">
                Total de gastos: $${formatearImporte(totalGastos)}
            </h3>
        </div>
    `;

  return totalGastos;
}

/* =========================
   CIERRE Y ENVÍO POR WHATSAPP
========================= */

const botonEnviar = document.getElementById("btnWhatsapp");

botonEnviar.addEventListener("click", () => {
  Swal.fire({
    title: "¿Cerrás la caja?",
    text: "Se enviará el cierre por WhatsApp y se reiniciarán los datos del día.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, cerrar caja",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (!result.isConfirmed) return;

    const cajaInicialEfectivo =
      Number.parseFloat(localStorage.getItem("cajaEfectivo")) || 0;

    const cajaInicialTransferencia =
      Number.parseFloat(localStorage.getItem("cajaInTransf")) || 0;

    const ventasEfectivo = sumarMovimientos(
      (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Efectivo",
    );

    const ventasTransferencia = sumarMovimientos(
      (m) => m.tipoMovimiento === "Venta" && m.metodoPago === "Transferencia",
    );

    const gastosEfectivo = sumarMovimientos(
      (m) => m.tipoMovimiento === "Gasto" && m.metodoPago === "Efectivo",
    );

    const gastosTransferencia = sumarMovimientos(
      (m) => m.tipoMovimiento === "Gasto" && m.metodoPago === "Transferencia",
    );

    const sueldosEfectivo = sumarMovimientos(
      (m) => m.tipoMovimiento === "Sueldo" && m.metodoPago === "Efectivo",
    );

    const sueldosTransferencia = sumarMovimientos(
      (m) => m.tipoMovimiento === "Sueldo" && m.metodoPago === "Transferencia",
    );

    const ingresosEfectivo = sumarMovimientos(
      (m) => m.tipoMovimiento === "Ingreso" && m.metodoPago === "Efectivo",
    );

    const ingresosTransferencia = sumarMovimientos(
      (m) => m.tipoMovimiento === "Ingreso" && m.metodoPago === "Transferencia",
    );

    const totalTarjetas = cierreTarjetas();
    const totalIngresos = renderIngresos();
    const totalSueldos = renderSueldos();
    const totalGastos = renderGastosTotales();

    const ventasTotales = ventasEfectivo + ventasTransferencia + totalTarjetas;

    const cajaFinalEfectivo =
      cajaInicialEfectivo +
      ventasEfectivo -
      gastosEfectivo -
      sueldosEfectivo +
      ingresosEfectivo;

    const cajaFinalTransferencia =
      cajaInicialTransferencia +
      ventasTransferencia -
      gastosTransferencia -
      sueldosTransferencia +
      ingresosTransferencia;

    const mensaje = `
CIERRE DE CAJA - ${hoy.toLocaleDateString("es-AR")}

Ingresos: $${formatearImporte(totalIngresos)}
Gastos: $${formatearImporte(totalGastos)}
Sueldos: $${formatearImporte(totalSueldos)}

Ventas en efectivo: $${formatearImporte(ventasEfectivo)}
Ventas por transferencia: $${formatearImporte(ventasTransferencia)}
Ventas con tarjeta / QR / credito: $${formatearImporte(totalTarjetas)}

VENTAS TOTALES: $${formatearImporte(ventasTotales)}
        `.trim();

    window.open(
      `https://wa.me/5493512290218?text=${encodeURIComponent(mensaje)}`,
      "_blank",
    );

    localStorage.removeItem("movimientos");
    localStorage.removeItem("cajaInTransf");
    localStorage.removeItem("cajaEfectivo");

    cajaInEfectivo.value = "";
    cajaInTransferencia.value = "";

    movimientosArray = [];

    guardarMovimientos();
    actualizarResumenes();

    Swal.fire({
      title: "Caja cerrada",
      text: "El cierre fue realizado con éxito.",
      icon: "success",
    });
  });
});

/* =========================
   INICIALIZAR RESÚMENES
========================= */

actualizarResumenes();
