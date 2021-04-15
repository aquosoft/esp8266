var socket = io.connect();

limpiarPantalla();
bindObj();

function comandos(cmd,obj){
    socket.emit(cmd, obj);
}
socket.on('saludo',function(data){
    console.log(data)
});
socket.on('respuestaESP8266',function(data){
    console.log('ESTO LO TENGO EN EL CLIENTE. MOSTRAR EN PANTALLA')
    console.log(data)
    $('#terminal').html('');
    $('#terminal').html('<p>'+data+'</p>');
})
socket.on('estadoESP8266',function(data){
    $('#estado').val('');
    $('#estado').val(data);
})
socket.on('disparoESP8266',function(data){
    $('#ultimodisparo').val('');
    $('#ultimodisparo').val(data);
})

verEstado();
function verEstado(){
    var obj = {
        id : 99,
        comando :'ver estado'
    }
    comandos('estado_ESP8266',obj);    
}


function bindObj(){
    $('#reset').off();
    $('#power').off();
    $('#relayon').off();
    $('#relayoff').off();
    $('#testalarm').off();

    $('#reset').on('click', function(){
        var obj = {
            id : 2,
            comando : 'reset'
        }
        comandos('cmd_ESP8266',obj);
        limpiarPantalla();
    });    
    $('#power').on('click', function(){
        debugger;
        var obj = {
            id : 3,
            comando : 'power',
        }
        comandos('cmd_ESP8266',obj);
        verEstado();
        limpiarPantalla();
    });    
    $('#relayon').on('click', function(){
        var obj = {
            id : 5,
            comando : 'relayon',
        }
        comandos('cmd_ESP8266',obj);
        limpiarPantalla();
    });  
    $('#relayoff').on('click', function(){
        var obj = {
            id : 4,
            comando : 'relayoff',
        }
        comandos('cmd_ESP8266',obj);
        limpiarPantalla();
    });            
    $('#testalarm').on('click', function(){
        var obj = {
            id : 6,
            comando : 'testalarm',
        }
        comandos('cmd_ESP8266',obj);
        limpiarPantalla();        
    });
    $('#fotos').on('click', function(){
        var obj = {
            id : 7,
            comando : 'fotos',
        }
        comandos('cmd_ESP8266',obj);
        limpiarPantalla();        
    });    
}

function limpiarPantalla(){
    $('#texto').val('');
}