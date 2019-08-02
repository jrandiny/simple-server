# Simple Web Server

A simple web server

## Running

```bash
npm start
```

## Usage

This server by default accept two possible routes as defined in `routes.js`

- GET `/execute/<millis>`
- POST `/execute?duration=<millis>`

Both routes are the same, it will wait for `<millis>` ms and then return current epoch

## Performance

Response time for 128 request of 4 second

![Response time](stat.png)