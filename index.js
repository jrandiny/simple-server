const net = require('net'); // socket library
const fs = require('fs');

const { method_with_body, common_status } = require('./http_const');
const { routes } = require('./routes');

const PORT = 4000;

function httpParser(data) {
  const data_unfolded = data.replace(/\r\n(\t| )+/, ' ');

  const data_per_line = data_unfolded.split(/\r\n/);

  const body_separator_index = data_per_line.indexOf('');

  const request_line = data_per_line[0];
  const header_line = data_per_line.slice(1, body_separator_index - 1);
  const body_data = data_per_line.slice(body_separator_index + 1).join('\r\n');

  console.log('Request : ', request_line);

  const header_data = {};

  header_line.forEach((element) => {
    const header_part = element.match(/^([\w-]+): (.*)$/);
    header_data[header_part[1].toLowerCase()] = header_part[2];
  });

  const request_line_part = request_line.match(/(\w+) (.+) ([\w\/.]+)/);

  header_data['method'] = request_line_part[1];
  header_data['uri'] = request_line_part[2];
  header_data['version'] = request_line_part[3];

  return {
    header: header_data,
    body: body_data
  };
}

function query_parser(query_string) {
  const query_list = query_string.split('&');
  const return_obj = {};

  query_list.forEach((item) => {
    const part = item.split('=');
    return_obj[part[0]] = part[1];
  });

  return return_obj;
}

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
      const query = query_parser(param.query || '');

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
      console.log(header);
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
