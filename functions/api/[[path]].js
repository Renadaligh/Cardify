// Cloudflare Pages Function: every request to /api/* goes to the server router.
import { handle } from "../../server/router.js";

export const onRequest = (context) => handle(context.request, context.env, context);
