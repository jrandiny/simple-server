function queryParser(query_string) {
  const query_list = query_string.split('&');
  const return_obj = {};

  query_list.forEach((item) => {
    const part = item.split('=');
    return_obj[part[0]] = part[1];
  });

  return return_obj;
}

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

module.exports = { queryParser, httpParser };