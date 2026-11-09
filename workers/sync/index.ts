import { createD1Store, type D1Like } from './d1Store';
import { handle } from './handler';

export default {
  fetch: (req: Request, env: { DB: D1Like }) => handle(req, createD1Store(env.DB)),
};
