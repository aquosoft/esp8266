
var commands = {};



function getTimeMSFloat() {
    var hrtime = process.hrtime();
    return ( hrtime[0] * 1000000 + hrtime[1] / 1000 ) / 1000;
}

exports.registrar = function(cmd) {
  commands[cmd.name] = cmd;
};

exports.esCommando = function(name)
{
  return commands[name] != undefined;
};

exports.ejecutar = function(identity, name, cb, args) {
  ;

  var start = getTimeMSFloat();
  console.log('>>>>> ejecutando comando: {0}'.format(name));
  
  commands[name].ejecutar(identity, function(data) {
    cb(data);
    var end = getTimeMSFloat();
    console.log('<<<<< comando: {0} ejecutado en: {1} ms'.format(name, end-start));

  }, args);

}

