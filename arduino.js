var SerialPort = require('serialport'),
	EventEmitter = require('events').EventEmitter,
	serial, rxBuf, rxBufLen;

module.exports = new EventEmitter();

function processData() {
	if(rxBufLen === 0) {
		rxBufLen = rxBuf[0];
		rxBuf = rxBuf.slice(1);
	}
	
	if(rxBuf.length >= rxBufLen) {
		module.exports.emit('req', rxBuf[0], rxBuf[1], rxBuf.slice(2, rxBufLen));
		rxBuf = rxBuf.slice(rxBufLen);
		rxBufLen = 0;
		rxBuf.length && processData();
	}
}

module.exports.connect = function(port) {
	serial = new SerialPort.SerialPort(port || '/dev/tty.usbserial', {
		parser: SerialPort.parsers.raw,
		baudrate: 19200
	});
	rxBufLen = 0;
	serial.on('data', function(data) {
		if(!rxBuf) rxBuf = data;
		else rxBuf = Buffer.concat([rxBuf, data]);
		processData();
	});
	serial.on('error', function(err) {
		serial.close(function() {
			serial = null;
			module.exports.emit('error', err);
		});
	});
};

module.exports.req = function(device, func, data) {
	if(!serial) return module.exports.emit('error', new Error('You should call Arduino.connect() before calling Arduino.req()'));
	var buffer = Buffer.concat([new Buffer([device, func]), data]);
	serial.write(new Buffer([buffer.length]));
	serial.write(buffer);
};

module.exports.numToBuffer = function(num, length) {
	length = length || 4;
	var buff = new Buffer(length);
	for(var x=length - 1;x>=0;x--) {
	   buff[x] = num & (255);
	   num = num / 256;
	}
	return buff;
}
