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

  const header_data = {};

  header_line.forEach((element) => {
    const header_part = element.match(/(\w+): (.*)/);
    header_data[header_part[1].toLowerCase()] = header_part[2];
  });

  const request_line_part = request_line.match(/(\w+) (.+) ([\w\/.]+)/);

  header_data['method'] = request_line_part[1];
  header_data['uri'] = request_line_part[2];
  header_data['version'] = request_line_part[3];

  return {
    header: header_data,
    body: body_data
  }
}

const buffer = [];

const client = net.createServer((sock) => {
  console.log(`Connection from ${sock.remoteAddress} ${sock.remotePort}`);


  sock.on('data', async (data) => {
    // console.log(data.toString('ascii'));
    console.log('c');
    buffer.push(data.toString('ascii'));
    console.log(buffer.length)
  });

  sock.on('close', () => {
    console.log(buffer.length)
    setTimeout(() => {
      console.log('end');
      console.log(buffer.length)
      const decoded_data = httpParser(buffer.join());

      fs.writeFileSync('a.pdf', decoded_data.body);
      sock.end();
    }, 1000)
  });
})

client.listen(PORT, () => {
  console.log(`Server started at ${PORT}`)
});
