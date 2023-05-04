

export default async function action(req: Request): Promise<Response> {

  const headers = req.headers;
  const body = await req.json();

  console.log('headers', headers.toJSON());
  console.log('body', body);

  

  return new Response(`Home page!`);

}
