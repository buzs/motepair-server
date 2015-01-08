'use strict';
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

var http = require("http")
var express = require("express")
var app = express()
var ws = require('ws');

var port = process.env.PORT || 3000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)


module.exports = WsEmitterServer

inherits(WsEmitterServer, EventEmitter)

var emit = ws.super_.prototype.emit

var connections = {}

function WsEmitterServer (port) {

  this.ws = new ws.Server({ server: server });

  this.ws.on("connection", function connect(conn){

    this.emit("connection", conn);

    conn.on('message', function message(message){
      var json = JSON.parse(message),
          event = json.event,
          data = json.data;

      emit.apply(conn, [event, data]);
    }.bind(this));


    conn.on("close", function close(code, message){
      connections[this.sessionId] = connections[this.sessionId].filter(function remove(el) {
        return el.getId() !== this.getId();
      }.bind(this));
    });

  }.bind(this));

}

ws.prototype.write = function(event, message) {
  // emit.apply(this, [event, message])

  var data = { event: event, data: message}

  this.send(JSON.stringify(data))
}

ws.prototype.createSession = function(sessionId) {
  if (connections[sessionId] === undefined) {
    connections[sessionId] = []
  }

  connections[sessionId].push(this)

  this.sessionId = sessionId
}

ws.prototype.broadcast = function(event, message){
  var senderId = this.getId();

  console.log(this.sessionId)
  if (this.sessionId !== undefined) {
    connections[this.sessionId].forEach(function each(conn){
      var id = conn.getId();

      if (senderId !== id){

        var data = { event: event, data: message}

        conn.send(JSON.stringify(data))
      }
    });
  }
}

ws.prototype.getId = function(){
  return this.upgradeReq.headers['sec-websocket-key'];
}


