const net = require('net');

class Rquest {
  constructor(opt) {
    const {
      method = 'GET',
      host,
      port = 80,
      path = '/',
      headers,
      body = {},
    } = opt;

    this.method = method;
    this.host = host;
    this.port = port;
    this.path = path;
    this.body = body;
    this.headers = headers;
    this.bodyText = null;

    if (!this.headers['Content-Type']) {
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    if (this.headers['Content-Type'] === 'application/json') {
      this.bodyText = JSON.stringify(this.body);
    } else {
      this.bodyText = Object.keys(this.body)
        .map(key => `${key}=${encodeURIComponent(this.body[key])}`)
        .join('&');
    }

    this.headers['Content-Length'] = this.bodyText.length;
  }

  send(connection) {
    return new Promise((resolve, reject) => {
      const parser = new ResponseParser();

      if (connection) {
        connection.write(this.toString());
      } else {
        connection = net.createConnection(
          {
            host: this.host,
            port: this.port,
          },
          () => {
            console.log(`this.toString() >>`, this.toString());
            connection.write(this.toString());
          }
        );
      }

      connection.on('data', data => {
        console.log(`data.toString() >>`, data.toString());
        parser.receive(data.toString());
        if (parser.isFinished) {
          resolve(parser.response);
          connection.end();
        }
      });

      connection.on('error', err => {
        reject(err);
        connection.end();
      });
    });
  }

  toString() {
    return `${this.method} ${this.path} HTTP/1.1\r\n${Object.keys(this.headers)
      .map(key => `${key}: ${this.headers[key]}`)
      .join('\r\n')}\r\n\r\n${this.bodyText}`;
  }
}

class ResponseParser {
  constructor() {
    this.WATTING_STATUS_LINE = 0;
    this.WATTING_STATUS_LINE_END = 1;
    this.WATTING_HEADER_NAME = 2;
    this.WATTING_HEADER_SPACE = 3;
    this.WATTING_HEADER_VALUE = 4;
    this.WATTING_HEADER_LINE_END = 5;
    this.WATTING_HEADER_BLOCK_END = 6;
    this.WATTING_BODY = 7;

    this.current = this.WATTING_STATUS_LINE;
    this.statusLine = '';
    this.headers = {};
    this.headerName = '';
    this.headerValue = '';
    this.bodyParser = null;
  }

  get isFinished() {
    return this.bodyParser && this.bodyParser.isFinished;
  }

  get response() {
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      headers: this.headers,
      body: this.bodyParser.content.join(''),
    };
  }

  receive(string) {
    // 'HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Type: text/html\r\nDate: Sun, 05 Sep 2021 03:04:37 GMT\r\nConnection: keep-alive\r\n\r\nb\r\nHello World\r\n0\r\n\r\n'
    for (let char of string) {
      this.receiveChar(char);
    }
    // console.log(this);
  }

  receiveChar(char) {
    if (this.current === this.WATTING_STATUS_LINE) {
      if (char === '\r') {
        this.current = this.WATTING_STATUS_LINE_END;
      } else {
        this.statusLine += char;
      }
    } else if (this.current === this.WATTING_STATUS_LINE_END) {
      if (char === '\n') {
        this.current = this.WATTING_HEADER_NAME;
      }
    } else if (this.current === this.WATTING_HEADER_NAME) {
      if (char === ':') {
        this.current = this.WATTING_HEADER_SPACE;
      } else if (char === '\r') {
        this.current = this.WATTING_HEADER_BLOCK_END;
        if (this.headers['Transfer-Encoding'] === 'chunked') {
          this.bodyParser = new ChunkedBodyParser();
        }
      } else {
        this.headerName += char;
      }
    } else if (this.current === this.WATTING_HEADER_SPACE) {
      if (char === ' ') {
        this.current = this.WATTING_HEADER_VALUE;
      }
    } else if (this.current === this.WATTING_HEADER_VALUE) {
      if (char === '\r') {
        this.current = this.WATTING_HEADER_LINE_END;
        this.headers[this.headerName] = this.headerValue;
        this.headerName = '';
        this.headerValue = '';
      } else {
        this.headerValue += char;
      }
    } else if (this.current === this.WATTING_HEADER_LINE_END) {
      if (char === '\n') {
        this.current = this.WATTING_HEADER_NAME;
      }
    } else if (this.current === this.WATTING_HEADER_BLOCK_END) {
      if (char === '\n') {
        this.headerName = '';
        this.headerValue = '';
        this.current = this.WATTING_BODY;
      }
    } else if (this.current === this.WATTING_BODY) {
      this.bodyParser.receiveChar(char);
    }
  }
}

class ChunkedBodyParser {
  constructor() {
    this.WATTING_LENGTH = 0;
    this.WATTING_LENGTH_LINE_END = 1;
    this.READING_CHUNK = 2;
    this.WATTING_NEW_LINE = 3;
    this.WATTING_NEW_LINE_END = 4;

    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.current = this.WATTING_LENGTH;
  }

  receiveChar(char) {
    if (this.current === this.WATTING_LENGTH) {
      if (char === '\r') {
        if (this.length === 0) {
          this.isFinished = true;
        }
        this.current = this.WATTING_LENGTH_LINE_END;
      } else {
        this.length *= 16;
        this.length += parseInt(char, 16);
      }
    } else if (this.current === this.WATTING_LENGTH_LINE_END) {
      if (char === '\n') {
        this.current = this.READING_CHUNK;
      }
    } else if (this.current === this.READING_CHUNK) {
      this.content.push(char);
      this.length --;
      if (this.length === 0) {
        this.current = this.WATTING_NEW_LINE;
      }
    } else if (this.current === this.WATTING_NEW_LINE) {
      if (char === '\r') {
        this.current = this.WATTING_NEW_LINE_END;
      }
    } else if (this.current === this.WATTING_NEW_LINE_END) {
      if (char === '\n') {
        this.current = this.WATTING_LENGTH;
      }
    }
  }
}

void (async function () {
  let request = new Rquest({
    method: 'POST',
    host: '127.0.0.1',
    port: '8080',
    path: '/',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      name: 'lx',
    },
  });

  let response = await request.send();

  console.log(`response >>`, response);
})();
