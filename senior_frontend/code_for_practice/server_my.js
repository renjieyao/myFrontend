const http = require('http');

http.createServer((request, response)=>{
    let body = [];
    request.on('error',err=>{
        console.log(err);
    }).on('data',data=>{
        body.push(chunk);
    }).on('end',()=>{
        body = Buffer.concat(body).toString();
        console.log('body:',body);
        response.writeHead(200,{
            'Transfer-Encoding':'chunked',
            'Content-Type':'text/html',
        });
        response.end('Hello world\n')
    })
}).listen(8088);

console.log('server started');
