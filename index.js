const net = require('net'); // socket library
const fs = require('fs');

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

const method_with_body = ['POST', 'PUT'];

const handler = (header, body, sock) => {
  const target = header.uri;
  console.log(`getting to ${target}`);

  const reply_body = 'Hello';

  const reply_body_length = Buffer.byteLength(reply_body, 'utf-8');

  fs.writeFileSync('a.pdf', body);

  sock.write([
    'HTTP/1.0 200 OK',
    'Content-Type: text/plain;charset=UTF-8',
    `Content-Length: ${reply_body_length}`,
    '',
    reply_body
  ].join('\r\n'));
  sock.end();
}

const client = net.createServer((sock) => {
  const id = Math.random().toString(36).substring(7);
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
      console.log(`Accept ${header['method']}`);
      if (header['method'] && method_with_body.includes(header['method'])) {
        console.log('should have body of ', header['content-length']);
        body_left = header['content-length'] - Buffer.byteLength(body, encoding);
        console.log(`body left ${body_left}`);
        buffer.push(Buffer.from(body, encoding));
        is_body = body_left > 0;
      }
    } else if (body_left > 0) {
      buffer.push(data);
      body_left -= Buffer.byteLength(data, encoding);
    }

    if (body_left <= 0) {
      handler(header, Buffer.concat(buffer), sock);
    }
  });

  sock.on('end', () => {
    console.log(`Close ${id}`)
  })
})

client.listen(PORT, () => {
  console.log(`Server started at ${PORT}`)
});
