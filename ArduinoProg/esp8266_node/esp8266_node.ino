#include <ESP8266WiFi.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
#include <NTPClient.h> //3.01 version... 
#include <WiFiUdp.h>

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

char* ssid = "Fibertel WiFi639";
char* password = "freedom0307";


String formattedDate;
String FechaHoraActual;
int Encendido;

String websocket_server_all = "ws://192.168.0.66:3333/";   //LOCAL
String urlWSclient = "";
String JSONMessage = "";

using namespace websockets;

WebsocketsClient client;
WebsocketsServer server;
 
void SetupRELOJTOKEN(){
  formattedDate = timeClient.getFormattedDate();
  // Extraer fecha hora actual
  FechaHoraActual = formattedDate.substring(0, formattedDate.length()-1);
  
  Serial.println(FechaHoraActual);  
}
IPAddress ip(192,168,0,73);     
IPAddress gateway(192,168,0,1);   
IPAddress subnet(255,255,255,0);  

void setup() {
  Serial.begin(9600);
  //Serial.begin(921600);
  //Serial.setDebugOutput(true);
  Serial.println(); 
  WiFi.disconnect();
  WiFi.mode(WIFI_STA);
  WiFi.config(ip, gateway, subnet);
  WiFi.begin(ssid, password, 5, NULL, true);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(WiFi.status());
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("esp8266 Ready! Use 'http://");
  Serial.print(WiFi.localIP());
  urlWSclient = "ws://192.168.0.73:81";
  Serial.println("' to connect");  

 
  timeClient.begin();  
  timeClient.setTimeOffset(-10800);
  Serial.println("actualizando reloj"); 
  Serial.println("time updated"); 
  SetupRELOJTOKEN();
  Serial.println("Conectando a "+websocket_server_all); 
  while (!client.connect(websocket_server_all)) {
    delay(500);
    Serial.print(".");
  }  
  server.listen(81);
  delay(200);
  //Serial.print("Is server live: ");
  
  //Serial.println(server.available());  
  
  //Serial.println("Conectando al endPoint: "+websocket_server_all);
  //JSONMessage = " {\"id\": \""+randomNumber+"\", \"codigo\": 0, \"texto\": \"aca un texto\" }";

  //JSONMessage = " {\"url\": \""+urlWSclient+"\", \"codigo\": 0, \"texto\": \"PROBANDO SENSOR\", \"fechaHora\":\""+FechaHoraActual+"\", \"externalIp\":\""+ExternalIP+"\" }";       
  //Serial.println(JSONMessage);
  

  //client.send(JSONMessage);   
  //Serial.println("MENSAJE ENVIADO");
 
  pinMode(5, INPUT);// pin D1(GPIO5) como entrada
  pinMode(4,OUTPUT);// pin D2(GPIO4) como Salida
  
  pinMode(0,OUTPUT);// pin D3(GPIO0) como Salida
  pinMode(1,OUTPUT);// pin tx(GPIO1) como Salida
  delay(100);
  digitalWrite(0,HIGH);
  digitalWrite(1,HIGH);
  Encendido = 1;
    
}

void callAlarma(){
    SetupRELOJTOKEN();
    Serial.println("Alarma Activada"); //Imprime por el monitor serial
    JSONMessage = " {\"url\": \""+urlWSclient+"\", \"codigo\": 1, \"texto\": \"TEST ALARMA\", \"fechaHora\":\""+FechaHoraActual+"\" }";       
    //Serial.println(JSONMessage);
    while (!client.connect(websocket_server_all)) {
      delay(500);
      Serial.print(".");
    }      
    client.send(JSONMessage); 
    digitalWrite(0,LOW);
    digitalWrite(1,LOW);
    delay(2000);
    digitalWrite(0,HIGH);
    digitalWrite(1,HIGH);  
}

void Alarma(){
  //timeClient.update();
  
  int Sensor = digitalRead(5); // variable para almacenar los estados del PIR
  if (Sensor == HIGH) {
    SetupRELOJTOKEN();
    Serial.println("Alarma Activada"); //Imprime por el monitor serial
    JSONMessage = " {\"url\": \""+urlWSclient+"\", \"codigo\": 2, \"texto\": \"SE DISPARO ALARMA!\", \"fechaHora\":\""+FechaHoraActual+"\" }";       
    //Serial.println(JSONMessage);
    while (!client.connect(websocket_server_all)) {
      delay(500);
      Serial.print(".");
    }      
    client.send(JSONMessage); 
    digitalWrite(0,LOW);
    digitalWrite(1,LOW);
    delay(2000);
    digitalWrite(0,HIGH);
    digitalWrite(1,HIGH);
  }
  
}

void clienteEscucha(){
  auto cl = server.accept();
  if(cl.available()) { //cl
    //String unMensaje = "";
    auto msg = cl.readBlocking();
    // log
    Serial.print("Got Message: ");
    Serial.println(msg.data());
   
//    cl.close();


    DynamicJsonDocument doc(1024);
    deserializeJson(doc, msg.data());
    //msg.empty();
    JsonObject obj = doc.as<JsonObject>();
    if (obj["id"] == 2){
      //reset
      Serial.println("Reset..");
      cl.send("RESPUESTA DE ESP8266: RESET SYSTEM");
      delay(500);
      ESP.restart();          
    } else if (obj["id"] == 3){
      //power
      if (Encendido == 1){
        Encendido = 0;  
        cl.send("RESPUESTA DE ESP8266: ALARMA DESACTIVADA");
      } else {
        Encendido = 1;
        cl.send("RESPUESTA DE ESP8266: ALARMA ACTIVADA");
      }
    } else if (obj["id"] == 4){
      //APAGAR RELAYS
        digitalWrite(0,HIGH);
        digitalWrite(1,HIGH);
        cl.send("RESPUESTA DE ESP8266: RELAYS APAGADOS");
    } else if (obj["id"] == 5){
      //ENCENDER RELAYS
        digitalWrite(0,LOW);
        digitalWrite(1,LOW);
        cl.send("RESPUESTA DE ESP8266: RELAYS ENCENDIDOS");      
    } else if (obj["id"] == 6){
      //test alarm
        callAlarma();
        cl.send("RESPUESTA DE ESP8266: PROBANDO ALARMA");    
    } else if (obj["id"] == 99){
        //estado alarma
      if (Encendido == 1){
        cl.send("ACTIVADA");
      } else {
        cl.send("DESACTIVADA");
      }    
    } else {
      cl.send("RESPUESTA DE ESP8266: " + msg.data());
    }
    
    // close the connection
    cl.close();

  }
}

void loop() {
  if(server.poll()){
      clienteEscucha();
  }
  if (Encendido==1){
      Serial.println("CALL VERIFICAR ALARMA");
      //callAlarma();
      //delay(5000);
      Alarma();
  }   

}
