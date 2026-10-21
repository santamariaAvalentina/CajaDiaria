let movimientosArray = JSON.parse(localStorage.getItem("movimientos")) || []
let todosMovimientos = document.getElementById("todosMovimientos")
movimientosArray.forEach(movimiento => {
    let color = ""
            if(movimiento.tipoMovimiento == "Venta" ){
                color = "venta"
            }
            else if(movimiento.tipoMovimiento == "Gasto" || movimiento.tipoMovimiento == "Sueldo"){
                color =  "gasto"
            }
            else{
                color = "ingreso"
            }
        let signo = ""
            if(movimiento.tipoMovimiento == "Gasto"|| movimiento.tipoMovimiento == "Sueldo"){
                signo = "-"
            }else{
                signo = "+"
            }
    let item =document.createElement("div")
        item.innerHTML = `<div class="todosMov">
                                   <h3 class="descripcionN">${movimiento.descripcion}</h3> 
                                    <h3 class=" descripcion"> ${movimiento.metodoPago}</h3>
                                    <h3 class=" ${color} "> ${signo} $${movimiento.monto}</h3>
                                    <h3 class=" hora">${movimiento.hora}</h3> 
                                </div>`
        todosMovimientos.appendChild(item)
    
});

