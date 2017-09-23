var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var onlineClients = {};
var allClients = [
  /* Insert here the individual info of PC in the following format: */
  /*
  { 
    pcNumber: 1,  
    mac: '2D-XX-XX-XX-12-34', // PC's mac address 
    active: false, 
    updated: null 
  },
  */
];

app.listen(8181);

function handler (request, response) {

  var filePath = '.' + request.url;
  if (filePath == './')
      filePath = './index.html';

  var extname = path.extname(filePath);
  var contentType = 'text/html';
  switch (extname) {
      case '.js':
          contentType = 'text/javascript';
          break;
      case '.css':
          contentType = 'text/css';
          break;
      case '.json':
          contentType = 'application/json';
          break;
      case '.png':
          contentType = 'image/png';
          break;      
      case '.jpg':
          contentType = 'image/jpg';
          break;
      case '.wav':
          contentType = 'audio/wav';
          break;
  }

  fs.readFile(filePath, function(error, content) {
      if (error) {
          if(error.code == 'ENOENT'){
              fs.readFile('./404.html', function(error, content) {
                  response.writeHead(200, { 'Content-Type': contentType });
                  response.end(content, 'utf-8');
              });
          }
          else {
              response.writeHead(500);
              response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
              response.end(); 
          }
      }
      else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
      }
  });

}

function updateClient(mac, status, timestamp) {
  allClients.forEach(function(client, index){
    if( client.mac.toLowerCase() == mac.toLowerCase() ) {
      allClients[index].active = (status == 'active') ? true : false;
      allClients[index].updated = timestamp;
      return;
    }
  });
} 

io.on('connection', function (socket) {

  // Add new client when someone new is connected
  socket.on('client-connected', function(client) {
    console.log('Client connected: ' + client.mac + ' on ' + client.updated);  
    onlineClients[socket.id] = client;
    updateClient(client.mac, 'active', client.updated);
    socket.broadcast.emit('retrieve-clients', allClients);
  });

  socket.on('request-clients', function(data){
    io.emit('retrieve-clients', allClients);
  });
  
  socket.on('disconnect', function() { 
    console.log('Client disconnected!');

    if(onlineClients[socket.id]) {
      updateClient(onlineClients[socket.id].mac, 'inactive', moment().format('YYYY-MM-DD HH:mm:ss'));
      delete onlineClients[socket.id]; 
    }

    socket.broadcast.emit('retrieve-clients', allClients);
  });
});
