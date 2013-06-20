function Message(name, link) {
  this.name = name;
  this.link = window.location.origin + '/' + link;
}

function socialViewModel() {
  var self = this;
  this.messages = ko.observableArray([]);
  this.connection = io.connect(window.location.origin);
  this.connection.on('message', function(message) {
    self.messages.push(new Message(message.name, message.link));
  });
  this.connection.emit('join');
}