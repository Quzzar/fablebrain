import { supabase } from "../services/supabase";
import { createResponse } from "../utils";

export default async function user(req: Request): Promise<Response> {
  //const headers = req.headers.toJSON();
  //const body = await req.json();

  // Get user
/*   if (req.method === "GET") {
    const match = req.url.match(/user\/(\d+)\/?$/);
    const userId = match ? match[1] : null;
    if (userId) {
      return await getUser(req, userId);
    }
  } */

  // Create new user
  if (req.method === "POST") {
    try {
      return await createUser(req);
    } catch(e) {
      return createResponse(`Error creating user: ${e}`, 500);
    }
  }

  // Delete user
/*   if (req.method === "DELETE") {
    const match = req.url.match(/user\/(\d+)\/?$/);
    const userId = match ? match[1] : null;
    if (userId) {
      return await deleteUser(req, userId);
    }
  } */

  return createResponse(`Unknown method: ${req.method}`, 405);
}

/* async function getUser(req: Request, userId: string): Promise<Response> {
  
  const ref = db.collection('users').doc('userId');
  const doc = await ref.get();
  if (!doc.exists) {

    return new Response(JSON.stringify({
      message: `User not found`
    }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  } else {

    return new Response(JSON.stringify({
      message: `User found`,
      data: doc.data()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  }

} */

async function createUser(req: Request): Promise<Response> {

  const body = await req.json<any>();
  const email = body.email;
  const password = body.password;

  if(email && password) {

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if(error) {
      return createResponse(`Error creating user: ${error}`, 500);
    }
    
    return createResponse(`User created`, 201, { id: data.user?.id });

  } else {

    return createResponse(`Need email and password`, 400);

  }

}


/* async function deleteUser(req: Request, userId: string): Promise<Response> {
  try {
    await db.collection('users').doc(userId).delete();

    return new Response(JSON.stringify({
      message: `User deleted`,
      data: { id: userId }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {

    console.error("Error deleting user: ", e);
    return new Response(JSON.stringify({
      message: `Error deleting user: ${e}`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });

  }
} */
