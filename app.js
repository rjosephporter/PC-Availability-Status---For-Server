var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var onlineClients = {};
var allClients = [
  { pcNumber: 1,  mac: '1C-1B-0D-54-19-AD', active: false, updated: null },
  { pcNumber: 2,  mac: '1C-1B-0D-54-19-16', active: false, updated: null },
  { pcNumber: 3,  mac: '1C-1B-0D-54-18-B0', active: false, updated: null },
  { pcNumber: 4,  mac: '1C-1B-0D-54-19-8C', active: false, updated: null },
  { pcNumber: 5,  mac: '1C-1B-0D-54-19-0E', active: false, updated: null },
  { pcNumber: 6,  mac: '1C-1B-0D-54-19-20', active: false, updated: null },
  { pcNumber: 7,  mac: '1C-1B-0D-54-19-18', active: false, updated: null },
  { pcNumber: 8,  mac: '1C-1B-0D-54-19-1A', active: false, updated: null },
  { pcNumber: 10, mac: '1C-1B-0D-54-19-4E', active: false, updated: null },
  { pcNumber: 11, mac: '1C-1B-0D-54-19-D4', active: false, updated: null },
  { pcNumber: 13, mac: '1C-1B-0D-55-48-49', active: false, updated: null },
  { pcNumber: 15, mac: '1C-1B-0D-55-46-A4', active: false, updated: null },
  { pcNumber: 16, mac: '1C-1B-0D-54-1A-06', active: false, updated: null },
  { pcNumber: 17, mac: '1C-1B-0D-54-19-8D', active: false, updated: null },
  { pcNumber: 19, mac: '1C-1B-0D-54-19-A9', active: false, updated: null },
  { pcNumber: 20, mac: '1C-1B-0D-54-19-5E', active: false, updated: null },
  { pcNumber: 21, mac: '1C-1B-0D-54-19-AB', active: false, updated: null },
  { pcNumber: 22, mac: '1C-1B-0D-CB-6E-79', active: false, updated: null },
  { pcNumber: 23, mac: '1C-1B-0D-54-18-B1', active: false, updated: null },
  { pcNumber: 24, mac: '1C-1B-0D-54-19-8A', active: false, updated: null },

  //{ pcNumber: 98, mac: '00-FF-34-01-B8-81', active: false, updated: null },
  //{ pcNumber: 99, mac: '74:D4:35:87:7a:2c', active: false, updated: null },
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
