import * as yup from 'yup';
import validator from 'koa-yup-validator';
import 'firebase-functions';

import {SessionType} from '../../../../shared/src/types/Session';
import {createRouter} from '../../lib/routers';

import {getSessions} from '../../models/session';
import * as sessionControler from '../../controllers/sessions';

const sessionsRouter = createRouter();

sessionsRouter.get('/', async ctx => {
  const {response, user} = ctx;

  const sessions = await getSessions(user.id);

  response.status = 200;
  ctx.body = sessions;
});

const CreateSessionSchema = yup.object().shape({
  contentId: yup.string().required(),
  type: yup.mixed<SessionType>().oneOf(Object.values(SessionType)).required(),
  startTime: yup.string().required(),
});

type CreateSession = yup.InferType<typeof CreateSessionSchema>;

sessionsRouter.post('/', validator({body: CreateSessionSchema}), async ctx => {
  const {contentId, type, startTime} = ctx.request.body as CreateSession;
  const user = ctx.user;

  ctx.body = await sessionControler.createSession(user.id, {
    contentId,
    type,
    startTime,
  });
});

sessionsRouter.delete('/:id', async ctx => {
  const {id} = ctx.params;

  try {
    await sessionControler.removeSession(ctx.user.id, id);
  } catch {
    ctx.status = 500;
  }

  ctx.status = 200;
  ctx.body = 'Session deleted successfully';
});

const UpdateSessionSchema = yup
  .object({
    started: yup.boolean(),
    ended: yup.boolean(),
  })
  .test(
    'nonEmptyObject',
    'object may not be empty',
    test => Object.keys(test).length > 0,
  );

export type UpdateSession = yup.InferType<typeof UpdateSessionSchema>;

sessionsRouter.put(
  '/:id',
  validator({body: UpdateSessionSchema}),
  async ctx => {
    const {id} = ctx.params;
    const body = ctx.request.body as UpdateSession;
    try {
      const updatedSession = await sessionControler.updateSession(
        ctx.user.id,
        id,
        body,
      );
      ctx.status = 200;
      ctx.body = updatedSession;
    } catch (err) {
      ctx.status = 500;
      throw err;
    }
  },
);

const ExerciseStateUpdateSchema = yup
  .object({
    index: yup.number(),
    playing: yup.boolean(),
    dailySpotlightId: yup.string(),
    ended: yup.boolean(),
  })
  .test(
    'nonEmptyObject',
    'object may not be empty',
    test => Object.keys(test).length > 0,
  );

export type ExerciseStateUpdate = yup.InferType<
  typeof ExerciseStateUpdateSchema
>;

sessionsRouter.put(
  '/:id/exerciseState',
  validator({body: ExerciseStateUpdateSchema}),
  async ctx => {
    const {id} = ctx.params;
    const data = ctx.request.body as ExerciseStateUpdate;

    try {
      const updatedSession = await sessionControler.updateExerciseState(
        ctx.user.id,
        id,
        data,
      );
      ctx.body = updatedSession;
    } catch (err) {
      ctx.status = 500;
      throw err;
    }
  },
);

export {sessionsRouter};
