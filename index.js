const net = require('net'); // socket library

const { method_with_body, common_status } = require('./http_const');
const { routes } = require('./routes');
const { queryParser, httpParser } = require('./parser');

const PORT = 4000;

const requestHandler = (header, body, sock) => {
  const target = header.uri;
  const method = header.method;
  console.log(`getting to ${target}`);

  let reply_body;
  let status_code = 200;

  const sendResponse = (status_code, reply_body) => {
    const reply_body_length = Buffer.byteLength(reply_body, 'utf-8');

    sock.write([
      `HTTP/1.0 ${status_code} ${common_status[status_code]}`,
      `Content-Type: text/plain;charset=UTF-8`,
      `Content-Length: ${reply_body_length}`,
      '',
      reply_body.toString('utf8')
    ].join('\r\n'));
    sock.end();
  }

  if (!routes.some((route) => {
    const url_regex = new RegExp('^' + route.url.source + '(\\?(?<query>.+))?$');
    if (url_regex.test(target) && method === route.method) {
      console.log(`Matched ${route.method} ${route.url}`);

      const param = target.match(url_regex).groups;
      const query = queryParser(param.query || '');

      console.log('Passing to handler');

      route.handler(header, param, query, body, sendResponse);

      return true;
    } else {
      return false;
    }
  })) {
    status_code = 404;
    reply_body = '404 - Not found';
    sendResponse(status_code, reply_body);
  }
}

const client = net.createServer((sock) => {
  const id = Math.random().toString(36).substring(2);
  console.log(`Connection from ${sock.remoteAddress} ${sock.remotePort} ${id}`);

  let is_body = false;
  let body_left = 0;
  let header;
  const buffer = [];

  let encoding = 'latin1';

  sock.on('data', async (data) => {
    console.log(`Data for ${id}`);
    if (!is_body) {
      let body;
      ({ header, body } = httpParser(data.toString(encoding)));
      console.log(`Accept ${header['method']} request`);
      if (header['method'] && method_with_body.includes(header['method'])) {
        console.log(`Receiving ${header['content-length']} byte for body`);
        body_left = header['content-length'] - Buffer.byteLength(body, encoding);
        buffer.push(Buffer.from(body, encoding));
        is_body = body_left > 0;
      }
    } else if (body_left > 0) {
      buffer.push(data);
      body_left -= Buffer.byteLength(data, encoding);
    }

    if (body_left <= 0) {
      requestHandler(header, Buffer.concat(buffer), sock);
    }
  });

  sock.on('end', () => {
    console.log(`Close connection ${id}`)
  });
})

client.listen(PORT, () => {
  console.log(`Server started at ${PORT}`)
});
