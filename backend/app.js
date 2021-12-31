const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const {
  celebrate, Joi, errors, isCelebrateError,
} = require('celebrate');
const cors = require('cors');
const cardsRouter = require('./routes/cards');
const usersRouter = require('./routes/users');

const { requestLogger, errorLogger } = require('./middlewares/logger');
const { createUser, login } = require('./controllers/users');
const auth = require('./middlewares/auth');
const BadRequestError = require('./errors/bad-request-err');
const NotFoundError = require('./errors/not-found-err');
const ConflictError = require('./errors/conflict-err');

const { PORT = 3000 } = process.env;
const app = express();

app.use(helmet());

mongoose.connect('mongodb://localhost:27017/aroundb');

app.use(cors());
app.options('*', cors());
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use('/cards', auth, cardsRouter);
app.use('/users', auth, usersRouter);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Server will crash now');
  }, 0);
});

app.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      // eslint-disable-next-line prefer-regex-literals
      name: Joi.string().min(2).max(30).pattern(new RegExp('^[a-zA-Z-\\s]*$')),
      about: Joi.string().min(2).max(30),
      avatar: Joi.string().uri(),
      email: Joi.string().required().email(),
      password: Joi.string().min(8).required(),
    }),
  }),
  createUser,
);

app.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

app.get('*', () => {
  throw new NotFoundError('Requested resource not found.');
});

app.use(errorLogger);

app.use((err, req, res, next) => {
  if (isCelebrateError(err)) {
    throw new BadRequestError(
      'Request cannot be completed at this time.',
    );
  }
  next(err);
});

app.use(errors());

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;

  if (isCelebrateError(err)) {
    throw new ConflictError('User already taken.');
  }
  res
    .status(statusCode)
    .send({
      message:
        statusCode === 500 ? 'An error has occured on the server' : message,
    });
});

app.use(() => {
  throw new NotFoundError('Requested resource not found.');
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening at port ${PORT}`);
});
