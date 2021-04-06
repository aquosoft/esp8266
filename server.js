console.log('Initializing... esp8266 server');
var express = require('express');

var fs = require('fs');
var path = require('path');
var session = require('express-session');
var cors = require('cors');
var app = express();
var http = require('http').createServer(app);
const port = 2222;
var io = require('socket.io')(http);

const webSocket = require("ws");
const comandos = require('./comando');
require('./common');
//const fetch = require('node-fetch');
//const sha256 = require('crypto-js/sha256');
//const URL = require('url').URL;

/**comandos*/
require("./comandos_sistema/comando_email");




app.use(express.static(path.join(__dirname,'public')));

app.get('/',function(req,res){
    res.sendFile(__dirname + '/public/index.html');
    res.end();
})

io.on('connection',function(cliente){
    console.log(`cliente conectado id: ${cliente.id}`);
    io.emit('saludo',`bienvenido: ${cliente.id}`);
    
    //console.log(cliente);
    cliente.on('comando',function(data){
        console.log(JSON.stringify(data));
    });
    cliente.on('cmd_ESP8266',function(data){
        SendDataToEsp8266(data,function(rta){
            io.emit('respuestaESP8266', rta)
        })
    });
    cliente.on('estado_ESP8266',function(data){
        SendDataToEsp8266(data,function(rta){
            //ACTIVADA O DESACTIVADA
            io.emit('estadoESP8266', rta)
        })
    });    

})

http.listen(port, function(){
    console.log(`servidor corriendo en: http://localhost:${port}`)
});

app.get('/prueba',function(req,res){
    res.send('HOLA MUNDO');
    res.end();
})

function isJson(item) {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
}

function indiceDateActual(){
    let d = new Date();

    var day = ("0" + d.getDate()).slice(-2);
    var month = ("0" + (d.getMonth() + 1)).slice(-2);
    var hour = ("0" + d.getHours()).slice(-2);
    var min = ("0" + d.getMinutes()).slice(-2);
    var segun = ("0" + d.getSeconds()).slice(-2);
    var ms = ("00" + d.getMilliseconds()).slice(-3);

    return d.getFullYear() +(month) + (day) + hour + min + segun + ms;

}
/*
2222 NODE WEB
3333 NODE WS
4444 ESP8266 WS
*/


const WS_ALLSOCKETPORT = 3333;
const wsAllPort = new webSocket.Server({ port: WS_ALLSOCKETPORT }, () => console.log(`WS Imagenes escuchando en port   ${WS_ALLSOCKETPORT} `));
const clienteWs = require('websocket').client;



function SendDataToEsp8266(cmd, cb){
    let wsClient = new clienteWs();
    //const wsClient = new webSocket.Server({ host: 'ws://192.168.0.73',port: 81 }, () => console.log(`conectado a esp82 en puerto 81`));
    wsClient.connect('ws://192.168.0.73:81');
    wsClient.on('connectFailed',function(error){
        console.log('connect error: {0}'.format(error.toString()));
    });
    let espConnection;    
    wsClient.on('connect',function(esp8266){
        console.log('conectado con el esp8266');
        esp8266.on('message',function(mensaje){
            
            console.log('mensaje recibido: {0}'.format(mensaje.utf8Data))
            if (cb) cb(mensaje.utf8Data)
        })
    
        console.log('ENVIANDO MENSAJE: {0}'.format(JSON.stringify(cmd)));
        esp8266.send(JSON.stringify(cmd),function(err){
            //esp8266.close(esp8266.CLOSE_REASON_NORMAL, 'conexion cerrada');
            console.log(JSON.stringify(err))
        });
    });


}

function responderJSON(res, data) {

    var r_json = JSON.stringify(data);

    res.writeHead(200, {
        'Content-type': 'application/json',
        'Content-Length': Buffer.byteLength(r_json),
    });
    res.write(r_json);
    res.end();
}



wsAllPort.on("connection", (wsi, req) => {
    console.log('se conecto');
    wsi.send('bienvenido. te conectaste!!!');
    let DateActual = parseFloat(indiceDateActual());
    let JS = {}
    wsi.isAlive = true;
    let comando = '';
    let identity = {
        token: ''
    };    
    
    const fechahoraactual = function(){
        let ta = new Date();
        return ta.toISOString();
    }

    const EnviarEmailServer = function(obj,cb) {
        let mailEnvio = 'aquosoft@gmail.com'
        
        //let unaCarpeta = params.Carpeta;
        if (mailEnvio != '') {
            let argsMail = {
                unMail: mailEnvio,
                unAsunto: 'ALARMA ESP8266',
                unTextoCuerpo: `ALARMA DISPARADA A LAS :  ${fechahoraactual()}. Datos: ${JSON.stringify(obj)}`,
                unHtmlCuerpo: '',
                adjuntos: []
            }
            comandos.ejecutar(identity, "EnviarMail", function (rta) {
                if (cb) cb(JSON.stringify(rta))
            }, argsMail);
            
        } else {
            if (cb) cb('No hay mail configurado')
        }
    }


    wsi.on("close", (code, reason) => {

        //FinalizarRecepcionXTiempo(listaImagenesVideo[token],token);
        return;
    });

    wsi.on("message", data => {
        wsi.isAlive = true;

        if (typeof (data) === 'string') {
            if (!isJson(data)){ 
                wsi.isAlive = false;
                Fail = true;
                console.log('INI*******EL DATO RECIBIDO ES NO ES UN JSON CORRECTO*******');
                console.log(data);
                console.log('FIN*******EL DATO RECIBIDO ES NO ES UN JSON CORRECTO*******');

                wsi.send('El json recibido es incorrecto.');
                wsi.close();
                wsi.terminate();
                return;       
            }
            JS = JSON.parse(data)
            //tipoInformacion = JS.IdTipoInformacion; //MUY IMPORTANTE!!!
            console.log(JSON.stringify(data));
            EnviarEmailServer(JS, function (data) {
                io.emit('disparoESP8266', 'Alarma disparada a las {0}'.format(fechahoraactual()));
                console.log(data)
            })

        };
    });    
});




















