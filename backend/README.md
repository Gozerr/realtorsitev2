<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Real Estate CRM Backend

NestJS backend для CRM системы недвижимости с поддержкой загрузки аватаров.

## Установка и запуск

```bash
npm install
npm run start:dev
```

## Функциональность

### Загрузка аватаров
- Поддерживаются форматы: JPG, PNG, GIF, WebP
- Максимальный размер файла: 2MB
- Файлы сохраняются в папку `uploads/`
- Старые аватары автоматически удаляются при обновлении
- Доступ к файлам: `http://localhost:3000/uploads/filename`

### API Endpoints

#### Загрузка аватара
```
POST /upload/avatar
Content-Type: multipart/form-data
Body: avatar (file)
```

#### Обновление профиля
```
PUT /users/profile
Authorization: Bearer <token>
Body: { firstName, lastName, photo }
```

## Структура проекта

- `uploads/` - папка для загруженных файлов
- `src/app.controller.ts` - контроллер для загрузки файлов
- `src/users/` - модуль пользователей с поддержкой аватаров
- `src/main.ts` - настройка статических файлов

## Безопасность

- Валидация типов файлов (только изображения)
- Ограничение размера файлов
- Уникальные имена файлов для предотвращения конфликтов
- Автоматическая очистка старых файлов

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Authentication Flow & Security Best Practices

## How Authentication Works

- **Login:**
  - User logs in via `/auth/login`.
  - Backend returns `access_token` (JWT) in response body and sets `refresh_token` as httpOnly cookie.
- **Access Token Usage:**
  - Frontend stores `access_token` in localStorage (or in-memory for better security).
  - All API requests include `Authorization: Bearer <access_token>` header.
- **Token Refresh:**
  - When `access_token` expires (API returns 401), frontend automatically calls `/auth/refresh` (cookie sent automatically).
  - Backend validates `refresh_token` from cookie, issues new `access_token`.
  - Frontend updates `access_token` in localStorage and retries the original request.
- **Logout:**
  - Frontend calls `/auth/logout`.
  - Backend deletes `refresh_token` from DB and clears cookie.
  - Frontend removes `access_token` from localStorage and redirects to login.

## Security Recommendations

- **Access Token:**
  - Prefer storing in memory (not localStorage) to reduce XSS risk.
  - If using localStorage, ensure strict Content Security Policy (CSP) and sanitize all user input.
- **Refresh Token:**
  - Always stored as httpOnly, Secure cookie (never accessible from JS).
  - Cookie should have `SameSite=Lax` or `Strict` and `Secure` in production.
- **CORS:**
  - Only allow your frontend origin (e.g., `https://yourdomain.com`).
  - `credentials: true` must be set for cookies to work.
- **CSRF:**
  - For APIs using only httpOnly cookies for auth, CSRF risk is low if CORS is strict.
  - For extra protection, consider double-submit cookie or CSRF tokens for sensitive endpoints.
- **HTTPS:**
  - Always use HTTPS in production, otherwise Secure cookies will not work.
- **Rate Limiting:**
  - Already enabled via express-rate-limit.
- **Logging:**
  - Log all suspicious refresh attempts (invalid/expired tokens).

## Example CORS Setup (see `src/main.ts`):

```
app.enableCors({
  origin: [
    'http://localhost:3000',
    // 'https://your-production-domain.com',
  ],
  credentials: true,
});
```

## Example Auth Flow Diagram

1. User logs in → gets access_token (localStorage) + refresh_token (cookie)
2. User makes API call with access_token
3. If access_token expired → frontend calls /auth/refresh (cookie sent automatically)
4. Backend validates refresh_token, issues new access_token
5. Frontend updates access_token and retries request
6. On logout, both tokens are invalidated

---

For more details, see `src/auth/` and `frontend/src/services/api.ts`.
