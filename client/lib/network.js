function Network(game, url, onConnected, onMessage) {
    this.game = game;
    this.url = url;
    this.onConnectedCallback = onConnected;
    this.onMessageCallback = onMessage;
    this.webSocket = null;
    return this;
}

Network.prototype.open = function(url, name) {
    game.showMessage('Connecting to server ' + url);

    this.webSocket = new WebSocket(url);

    this.webSocket.onopen = this.onOpen.bind(this);
    this.webSocket.onmessage = this.onMessage.bind(this);
    this.webSocket.onclose = this.onClose.bind(this);
}

Network.prototype.send = function(message) {
    if (this.webSocket.readyState === this.webSocket.OPEN) {
        this.webSocket.send(JSON.stringify(message));
    }
}

Network.prototype.onOpen = function(message) {
    game.showMessage('Waiting for other player...');
}

Network.prototype.onMessage = function(event) {
    var message = JSON.parse(event.data);
    switch (message.type) {
        case 'connected':
            game.hideMessage();
            this.onConnectedCallback(message);
            break;

        default:
            this.onMessageCallback(message);
            break;
    }
}

Network.prototype.onClose = function() {
    game.onClose();
}
