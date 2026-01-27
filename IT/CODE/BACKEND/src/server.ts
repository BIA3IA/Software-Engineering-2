import express from "express"
import cors from "cors"
import routesV1 from "./routes/v1/index.js"
import cookieParser from "cookie-parser"
import { errorHandler, notFoundHandler, httpLogger } from "./middleware/index.js"
import logger from "./utils/logger.js"

const app = express()

// This is needed for nginx, it makes express proxy aware
app.set("trust proxy", 1);

app.use(express.json())
app.use(cookieParser())

const PORT = Number(process.env.PORT ?? 3000)

app.use(
  cors({
    origin: true,
    credentials: true,
  })
)

app.use(httpLogger)

// healthcheck
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", routesV1)

app.use(notFoundHandler)
app.use(errorHandler)

// Used for testing
export { app };

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
}