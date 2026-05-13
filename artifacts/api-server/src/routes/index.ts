import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import usersRouter from "./users";
import billingRouter from "./billing";
import adminRouter from "./admin";
import leaderboardRouter from "./leaderboard";
import referralsRouter from "./referrals";
import emailRouter from "./email";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(usersRouter);
router.use(billingRouter);
router.use(adminRouter);
router.use(leaderboardRouter);
router.use(referralsRouter);
router.use(emailRouter);

export default router;
