import { AppDataSource } from '../src/data-source';
import { RefreshToken } from '../src/users/refresh-token.entity';

async function clearRefreshTokens() {
  await AppDataSource.initialize();
  await AppDataSource.getRepository(RefreshToken).clear();
  console.log('All refresh tokens cleared!');
  process.exit(0);
}

clearRefreshTokens(); 