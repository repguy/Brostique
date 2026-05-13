import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import usersRouter from "./users";
import billingRouter from "./billing";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(usersRouter);
router.use(billingRouter);
router.use(adminRouter);

export default router;
