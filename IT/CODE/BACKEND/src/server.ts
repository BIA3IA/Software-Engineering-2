import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routesV1 from './routes/v1/index.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: `http://localhost:${PORT}`,
    credentials: true,
}));

app.use(morgan('tiny'));

app.use('/api/v1', routesV1); 


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});