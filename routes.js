function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function second_range(input) {
  if (input < 1000) {
    return 1000;
  } else if (input > 2147483647) {
    return 2147483647;
  } else {
    return input;
  }
}

async function executeGet(header, param, query, body, send) {
  const second = second_range(param.time);

  await timeout(second);

  send(200, (Date.now() / 1000).toString());
}

async function executePost(header, param, query, body, send) {
  try {
    const second = second_range(parseInt(query.duration));

    await timeout(second);

    send(200, (Date.now() / 1000).toString());
  } catch (error) {
    send(500, error.toString());
  }

}

const routes = [
  {
    url: /\/execute/,
    method: 'POST',
    handler: executePost
  },
  {
    url: /\/execute\/(?<time>[0-9]+)/,
    method: 'GET',
    handler: executeGet
  }
]

module.exports = { routes }