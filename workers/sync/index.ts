import { createD1Store, type D1Like } from './d1Store';
import { handle, type CreateLimiter } from './handler';

export default {
  fetch: (req: Request, env: { DB: D1Like; CREATE_LIMITER?: CreateLimiter }) =>
    handle(req, createD1Store(env.DB), undefined, env.CREATE_LIMITER),
};
