const net = require('net');

class ResponseParser {
    constructor() {
        this.WAITING_STATUS_LINE = 0;
        this.WAITING_STATUS_LINE_END = 1;
        this.WAITING_HEADER_NAME = 2;
        this.WAITING_HEADER_SPACE = 3;
        this.WAITING_HEADER_VALUE = 4;
        this.WAITING_HEADER_LINE_END = 5;
        this.WAITING_HEADER_BLOCK_END = 6;
        this.WAITING_BODY = 7;

        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue= '';
        this.bodyParser = null;
    }

    get isFineshed(){
        return this.bodyParser && this.bodyParser.isFineshed;
    }
    get response(){
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            
        }
    }
    receive(str) {
        for (let i = 0; i < str.length; i++) {
            this.receiveChar(str.charAt(i));
        }
    }

    receiveChar(char) {
        let {
            current,
            WAITING_STATUS_LINE,
            WAITING_STATUS_LINE_END,
            WAITING_HEADER_NAME,
            WAITING_HEADER_SPACE,
            WAITING_HEADER_VALUE,
            WAITING_HEADER_LINE_END,
            WAITING_HEADER_BLOCK_END,
            WAITING_BODY,
            statusLine,
            headerName,
            headerValue,
        } = this;
        if(current === WAITING_STATUS_LINE){
            if(char === '\r'){
                current = WAITING_STATUS_LINE_END;
            }else{
                statusLine += char;
            }
        }else if(current === WAITING_STATUS_LINE_END){
            if(char === '\n'){
                current = WAITING_HEADER_NAME;
            }
        }else if(current = WAITING_HEADER_NAME){
            if(char === ':'){
                current = WAITING_HEADER_SPACE;
            }else if(char === '\r'){
                current = WAITING_HEADER_BLOCK_END
            }else{
                headerName += char;
            }
        }else if(current === WAITING_HEADER_SPACE){
            if(char === ' '){
                current = WAITING_HEADER_VALUE
            }
        }else if(current === WAITING_HEADER_VALUE){
            if(char === '\r'){
                current = WAITING_HEADER_LINE_END;
                headers[headerName] = headerValue;
                headerName = '';
                headerValue = '';
            }else{
                headerValue += char;
            }
        }else if(current === WAITING_HEADER_LINE_END){
            if(char === '\n'){
                current = WAITING_HEADER_NAME;
            }
        }else if(current === WAITING_HEADER_BLOCK_END){
            if(char === '\n'){
                current = WAITING_BODY
            }
        }else if(current === WAITING_BODY){
            console.log(char);
        }
        
    }
}

class Request {
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || '80';
        this.path = '/';
        this.body = options.body || {};
        this.headers = options.headers || {};
        if (!this.headers['Content-Type']) {
            this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if (this.headers['Content-Type'] === 'application/json') {
            this.bodyText = JSON.stringify(this.body);
        } else if (this.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }

        this.headers['Content-Length'] = this.bodyText.length;
    }

    send(connection) {
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser;
            console.log(parser);

            if (connection) {
                connection.write(this.toString());
            } else {
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    connection.write(this.toString())
                })
            }
            connection.on('data', data => {
                console.log(data.toString());
                parser.receive(data.toString());
                if (parser.isFineshed) {
                    resolve(parser);
                    connection.end();
                }
            })
            connection.on('err', err => {
                reject(err);
                connection.end();
            })
            resolve();
        });
    }

    toString() {
        // return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(this.headers)
        //     .map(key => `${key}: ${this.headers[key]}`)
        //     .join('\r\n')}\r\n\r\n${this.bodyText}`;
        let request = `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
        return request
    }
}

void async function () {
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '8088',
        path: '/',
        headers: {
            ['X-Foo2']: 'customed'
        },
        body: {
            name: 'charles'
        }
    });

    let response = await request.send();

    console.log(response);
}()