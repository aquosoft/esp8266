

const comandos = require('../comando');
const setting = require('../settingServer');
let nodemailer = require('nodemailer');

comandos.registrar({
    name: 'EnviarMail',
    ejecutar: function (identity, cb, args) {
        let transporter = crearTransporter();
        send(transporter, args, cb);

    }
});


function crearTransporter() {
    var transporter = nodemailer.createTransport(
        setting.MailConfigTransport
    );


    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
            rta = {
                cod: 999,
                mensaje: "",
                txt: error
            }
            //responderJSON(res, rta);
        } else {
            console.log("Transporter ok");
        }
    });

    return transporter;
}


// Definimos el email
function inputmail(args) {
    ///////Email

    let adjuntos = [];
    const from = setting.MailConfigFrom;

    const to = args.unMail;
    const subject = args.unAsunto;
    const text = args.unTextoCuerpo;
    const html = args.unHtmlCuerpo;

    const wsApi = {
        host: setting.wsApi.host,
        port: setting.wsApi.port
    }
    if ((args.adjuntos) && (args.adjuntos.length > 0)) {
        for (let i = 0; i < args.adjuntos.length; i++) {
            const element = args.adjuntos[i];
            let obj = {
                filename: element.substring(element.lastIndexOf('/') + 1),
                path: `${wsApi.host}${wsApi.port ? ':' + wsApi.port : ''}/img?imgname=/${element}`
            }
            adjuntos.push(obj);
        }
    }


    var mailOption = {
        from: from,
        to: to,
        subject: subject,
        text: text,
        html: html,
        attachments: adjuntos
    }
    return mailOption;
}
// Enviamos el email
function send(transporter, args, cb) {
    transporter.sendMail(inputmail(args), function (err, success) {
        // Object.assign(args, dto); 
        let rta = {
            cod: 0,
            mensaje: "",
            txt: {}
        }
        if (err) {
            // events.emit('error', err);
            console.log(err);
            rta = {
                cod: 999,
                mensaje: "",
                txt: err
            }
            cb(rta);
            //responderJSON(res, rta);
            //res.sendStatus(500);    
        }
        if (success) {
            // events.emit('success', success);
            console.log(JSON.stringify(success));
            rta = {
                cod: 10,
                mensaje: "",
                txt: {
                    aceptadas: success.accepted.join(','),
                    rechazadas: success.rejected.join(','),
                    texto: success.response,
                }
            }
            cb(rta);
            //responderJSON(res, rta);    
            //res.sendStatus(200);
        }
    });
}

