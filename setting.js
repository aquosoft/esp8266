import variables from "./ENV.json";
let setting = {
    wsApi : {
        host : variables.hostActual,
        port : variables.portActualCliente,
        wsPort : variables.wsPortActual,
    },
    MailConfigTransport: {
        service: variables.Mail_Service,
        host: variables.Mail_Host,
        port: variables.Mail_Port,
        secure: variables.Mail_Secure, 
        auth: {
            user: variables.Mail_User,
            pass: variables.Mail_Pass
        }
    },
    MailConfigFrom: variables.Mail_From     

}


export {
    setting
}