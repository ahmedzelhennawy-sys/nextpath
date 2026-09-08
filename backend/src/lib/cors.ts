export function setCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  return newResponse;
}
