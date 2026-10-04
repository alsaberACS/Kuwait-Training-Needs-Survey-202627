import { Router, type IRouter } from "express";
import healthRouter from "./health";
import responsesRouter from "./responses";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(responsesRouter);
router.use(adminRouter);

export default router;
