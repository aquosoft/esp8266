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

function encode(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
            keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

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
const wsAllPort = new webSocket.Server({ port: WS_ALLSOCKETPORT }, () => console.log(`WS EMAIL escuchando en port   ${WS_ALLSOCKETPORT} `));
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

var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file) {
          var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


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
    let dir = "";
    let carpetaActual = String(DateActual);    
    let imageIndex = 0;
    let DataImg = false;
    
    const fechahoraactual = function(){
        let ta = new Date();
        return ta.toISOString();
    }

    const EnviarEmailServer = function(obj,lstAdjuntos,cb) {
        let mailEnvio = 'aquosoft@gmail.com'
        
        //let unaCarpeta = params.Carpeta;
        if (mailEnvio != '') {
            let argsMail = {
                unMail: mailEnvio,
                unAsunto: 'ALARMA ESP8266',
                unTextoCuerpo: `ALARMA DISPARADA A LAS :  ${fechahoraactual()}. Datos: ${JSON.stringify(obj)}`,
                unHtmlCuerpo: '',
                adjuntos: lstAdjuntos
            }
            console.log(JSON.stringify(argsMail));
            // if (lstAdjuntos.length > 0){
            //     if (files.length > 0){
            //         files.forEach(file => { 
            //             let AdjuntoActual =  `${unaCarpeta}/${file}`
            //             argsMail.adjuntos.push(AdjuntoActual);  
            //         });
            //     }   
            // }

            comandos.ejecutar(identity, "EnviarMail", function (rta) {
                if (lstAdjuntos.length > 0){
                    setTimeout(() => {
                        console.log("SE BIRRARAB TODOS LOS ARCHIVOS DE {0}".format(dir));
                        deleteFolderRecursive(dir);    
                    }, 10000);
                } 

                if (cb) cb(JSON.stringify(rta))
            }, argsMail);
            
        } else {
            if (cb) cb('No hay mail configurado')
        }
    }


    wsi.on("close", (code, reason) => {
        console.log("se desconecto");
        console.log(DataImg);
        if (DataImg){
            let unaLista = [];
            let unaCarpeta = `${dir}/AllFotogramas`
            console.log(unaCarpeta);
            fs.readdir(unaCarpeta, function(err, files) {
                if (files){
                    if (files.length > 0){
                        files.forEach(file => { 
                            let AdjuntoActual =  `${unaCarpeta}/${file}`
                            unaLista.push(AdjuntoActual);  
                        });
                    }  
                }
                console.log(unaLista);
                EnviarEmailServer(JS, unaLista,function (data) {
                    io.emit('disparoESP8266', 'Fotos enviadas por mail a las {0}'.format(fechahoraactual()));
                    console.log(data)
                })                  
            });   
        }

        return;
    });

    wsi.on("message", data => {
        wsi.isAlive = true;
        
        if (typeof (data) === 'string') {
            if (!isJson(data)){ 
                wsi.isAlive = false;
                Fail = true;

                wsi.send('El json recibido es incorrecto.');
                wsi.close();
                wsi.terminate();
                return;       
            }
            JS = JSON.parse(data);
            DataImg = false;
            //tipoInformacion = JS.IdTipoInformacion; //MUY IMPORTANTE!!!
            console.log(JSON.stringify(data));
            EnviarEmailServer(JS, [],function (data) {
                io.emit('disparoESP8266', 'Alarma disparada a las {0}'.format(fechahoraactual()));
                console.log(data)
            })

        } else { //ACA RECIBE IMAGENES!!!
            DataImg = true;
            dir = `public/${carpetaActual}`;
            !fs.existsSync(dir) && fs.mkdirSync(dir);
            
            let arrayBuffer;   
                
                
            arrayBuffer = data;

            let dirAF = `${dir}/AllFotogramas`;
            !fs.existsSync(dirAF) && fs.mkdirSync(dirAF);

            let filePath = `${dirAF}/imagen_${imageIndex}.jpg`;
            var bytes = new Uint8Array(arrayBuffer);

            fs.writeFile(filePath, encode(bytes), 'base64', function (err) {

            });
            imageIndex = imageIndex + 1;
        }
    });    
});

app.options('/img', cors());
app.get('/img', cors(), function (req, res) {
    let unaImg = req.query.imgname;
    let pathImg = path.join(__dirname + unaImg)
    let pathNoImg = path.join(__dirname + '/public/noimage1.jpeg')
    let pathNoVideo = path.join(__dirname + '/public/creandovideo.gif');
    let tipo = (unaImg.indexOf('.mp4') > 0 ? 2 : 1);
    fs.access(pathImg, fs.F_OK, (err) => {
        if (err) {
            if (tipo == 1){
                res.sendFile(pathNoImg);
            } else {
                res.sendFile(pathNoVideo);
            }
            

        } else {
            res.sendFile(pathImg);
        }

        //file exists
    });
    //res.sendFile( unaImg );


});


















