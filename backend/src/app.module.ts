import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { AgenciesModule } from './agencies/agencies.module';
import { Agency } from './agencies/agency.entity';
import { PropertiesModule } from './properties/properties.module';
import { Property } from './properties/property.entity';
import { ClientsModule } from './clients/clients.module';
import { Client } from './clients/client.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Agency, Property, Client],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    AgenciesModule,
    PropertiesModule,
    ClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
