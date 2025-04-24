import { router } from "../trpc";
import { authRouter } from "./authRouter";
import { usersRouter } from "./usersRouter";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
});
export type AppRouter = typeof appRouter;
