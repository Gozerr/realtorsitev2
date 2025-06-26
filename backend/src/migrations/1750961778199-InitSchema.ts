import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1750961778199 implements MigrationInterface {
    name = 'InitSchema1750961778199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "agency" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "property" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "address" varchar NOT NULL, "price" decimal NOT NULL, "area" float NOT NULL, "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "status" varchar CHECK( "status" IN ('for_sale','in_deal','reserved','sold') ) NOT NULL DEFAULT ('for_sale'), "isExclusive" boolean NOT NULL DEFAULT (0), "photos" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "lat" float, "lng" float, "agentId" integer)`);
        await queryRunner.query(`CREATE TABLE "client" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "phone" varchar NOT NULL, "status" varchar CHECK( "status" IN ('new','negotiation','contract','deposit','success','refused') ) NOT NULL DEFAULT ('new'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "agentId" integer, CONSTRAINT "UQ_6436cc6b79593760b9ef921ef12" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "photo" varchar, "phone" varchar, "city" varchar, "region" varchar, "role" varchar CHECK( "role" IN ('agent','director') ) NOT NULL DEFAULT ('agent'), "telegramId" varchar, "agencyId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "message" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "authorId" integer, "conversationId" varchar)`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" varchar PRIMARY KEY NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "category" varchar NOT NULL DEFAULT ('property'), "title" varchar NOT NULL, "description" varchar, "isNew" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE TABLE "user_notification_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "property" boolean NOT NULL DEFAULT (1), "education" boolean NOT NULL DEFAULT (1), "system" boolean NOT NULL DEFAULT (1), CONSTRAINT "UQ_984f3e1d8fe9c03831b20b8d7a4" UNIQUE ("userId"))`);
        await queryRunner.query(`CREATE TABLE "education_events" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" varchar, "date" datetime NOT NULL, "type" varchar NOT NULL DEFAULT ('course'), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "selections" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "propertyIds" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer)`);
        await queryRunner.query(`CREATE TABLE "calendar_events" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text, "start" datetime NOT NULL, "end" datetime, "type" varchar NOT NULL DEFAULT ('personal'), "userId" integer, "relatedObjectId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "conversation_participants_user" ("conversationId" varchar NOT NULL, "userId" integer NOT NULL, PRIMARY KEY ("conversationId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4928ef292e3fb48783034b82f7" ON "conversation_participants_user" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d93fb1843f96fbdefea37dae8" ON "conversation_participants_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "temporary_property" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "address" varchar NOT NULL, "price" decimal NOT NULL, "area" float NOT NULL, "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "status" varchar CHECK( "status" IN ('for_sale','in_deal','reserved','sold') ) NOT NULL DEFAULT ('for_sale'), "isExclusive" boolean NOT NULL DEFAULT (0), "photos" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "lat" float, "lng" float, "agentId" integer, CONSTRAINT "FK_3df22387cc25ecbbe851a57fd32" FOREIGN KEY ("agentId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_property"("id", "title", "description", "address", "price", "area", "bedrooms", "bathrooms", "status", "isExclusive", "photos", "createdAt", "lat", "lng", "agentId") SELECT "id", "title", "description", "address", "price", "area", "bedrooms", "bathrooms", "status", "isExclusive", "photos", "createdAt", "lat", "lng", "agentId" FROM "property"`);
        await queryRunner.query(`DROP TABLE "property"`);
        await queryRunner.query(`ALTER TABLE "temporary_property" RENAME TO "property"`);
        await queryRunner.query(`CREATE TABLE "temporary_client" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "phone" varchar NOT NULL, "status" varchar CHECK( "status" IN ('new','negotiation','contract','deposit','success','refused') ) NOT NULL DEFAULT ('new'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "agentId" integer, CONSTRAINT "UQ_6436cc6b79593760b9ef921ef12" UNIQUE ("email"), CONSTRAINT "FK_626d76371510025cccd6c0ff75d" FOREIGN KEY ("agentId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_client"("id", "name", "email", "phone", "status", "createdAt", "updatedAt", "agentId") SELECT "id", "name", "email", "phone", "status", "createdAt", "updatedAt", "agentId" FROM "client"`);
        await queryRunner.query(`DROP TABLE "client"`);
        await queryRunner.query(`ALTER TABLE "temporary_client" RENAME TO "client"`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "photo" varchar, "phone" varchar, "city" varchar, "region" varchar, "role" varchar CHECK( "role" IN ('agent','director') ) NOT NULL DEFAULT ('agent'), "telegramId" varchar, "agencyId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "FK_ffe98999bc6a1edce7af102f74c" FOREIGN KEY ("agencyId") REFERENCES "agency" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "email", "password", "firstName", "lastName", "photo", "phone", "city", "region", "role", "telegramId", "agencyId") SELECT "id", "email", "password", "firstName", "lastName", "photo", "phone", "city", "region", "role", "telegramId", "agencyId" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE TABLE "temporary_message" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "authorId" integer, "conversationId" varchar, CONSTRAINT "FK_c72d82fa0e8699a141ed6cc41b3" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_message"("id", "content", "createdAt", "authorId", "conversationId") SELECT "id", "content", "createdAt", "authorId", "conversationId" FROM "message"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`ALTER TABLE "temporary_message" RENAME TO "message"`);
        await queryRunner.query(`CREATE TABLE "temporary_selections" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "propertyIds" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer, CONSTRAINT "FK_8a067bad8ee4a8e699449aa0e2b" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_selections"("id", "title", "propertyIds", "createdAt", "userId") SELECT "id", "title", "propertyIds", "createdAt", "userId" FROM "selections"`);
        await queryRunner.query(`DROP TABLE "selections"`);
        await queryRunner.query(`ALTER TABLE "temporary_selections" RENAME TO "selections"`);
        await queryRunner.query(`CREATE TABLE "temporary_calendar_events" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text, "start" datetime NOT NULL, "end" datetime, "type" varchar NOT NULL DEFAULT ('personal'), "userId" integer, "relatedObjectId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_1c7bc3511809b48395c3eec5484" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_calendar_events"("id", "title", "description", "start", "end", "type", "userId", "relatedObjectId", "createdAt", "updatedAt") SELECT "id", "title", "description", "start", "end", "type", "userId", "relatedObjectId", "createdAt", "updatedAt" FROM "calendar_events"`);
        await queryRunner.query(`DROP TABLE "calendar_events"`);
        await queryRunner.query(`ALTER TABLE "temporary_calendar_events" RENAME TO "calendar_events"`);
        await queryRunner.query(`DROP INDEX "IDX_4928ef292e3fb48783034b82f7"`);
        await queryRunner.query(`DROP INDEX "IDX_5d93fb1843f96fbdefea37dae8"`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation_participants_user" ("conversationId" varchar NOT NULL, "userId" integer NOT NULL, CONSTRAINT "FK_4928ef292e3fb48783034b82f7a" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_5d93fb1843f96fbdefea37dae86" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("conversationId", "userId"))`);
        await queryRunner.query(`INSERT INTO "temporary_conversation_participants_user"("conversationId", "userId") SELECT "conversationId", "userId" FROM "conversation_participants_user"`);
        await queryRunner.query(`DROP TABLE "conversation_participants_user"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation_participants_user" RENAME TO "conversation_participants_user"`);
        await queryRunner.query(`CREATE INDEX "IDX_4928ef292e3fb48783034b82f7" ON "conversation_participants_user" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d93fb1843f96fbdefea37dae8" ON "conversation_participants_user" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_5d93fb1843f96fbdefea37dae8"`);
        await queryRunner.query(`DROP INDEX "IDX_4928ef292e3fb48783034b82f7"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants_user" RENAME TO "temporary_conversation_participants_user"`);
        await queryRunner.query(`CREATE TABLE "conversation_participants_user" ("conversationId" varchar NOT NULL, "userId" integer NOT NULL, PRIMARY KEY ("conversationId", "userId"))`);
        await queryRunner.query(`INSERT INTO "conversation_participants_user"("conversationId", "userId") SELECT "conversationId", "userId" FROM "temporary_conversation_participants_user"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation_participants_user"`);
        await queryRunner.query(`CREATE INDEX "IDX_5d93fb1843f96fbdefea37dae8" ON "conversation_participants_user" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4928ef292e3fb48783034b82f7" ON "conversation_participants_user" ("conversationId") `);
        await queryRunner.query(`ALTER TABLE "calendar_events" RENAME TO "temporary_calendar_events"`);
        await queryRunner.query(`CREATE TABLE "calendar_events" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text, "start" datetime NOT NULL, "end" datetime, "type" varchar NOT NULL DEFAULT ('personal'), "userId" integer, "relatedObjectId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "calendar_events"("id", "title", "description", "start", "end", "type", "userId", "relatedObjectId", "createdAt", "updatedAt") SELECT "id", "title", "description", "start", "end", "type", "userId", "relatedObjectId", "createdAt", "updatedAt" FROM "temporary_calendar_events"`);
        await queryRunner.query(`DROP TABLE "temporary_calendar_events"`);
        await queryRunner.query(`ALTER TABLE "selections" RENAME TO "temporary_selections"`);
        await queryRunner.query(`CREATE TABLE "selections" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "propertyIds" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer)`);
        await queryRunner.query(`INSERT INTO "selections"("id", "title", "propertyIds", "createdAt", "userId") SELECT "id", "title", "propertyIds", "createdAt", "userId" FROM "temporary_selections"`);
        await queryRunner.query(`DROP TABLE "temporary_selections"`);
        await queryRunner.query(`ALTER TABLE "message" RENAME TO "temporary_message"`);
        await queryRunner.query(`CREATE TABLE "message" ("id" varchar PRIMARY KEY NOT NULL, "content" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "authorId" integer, "conversationId" varchar)`);
        await queryRunner.query(`INSERT INTO "message"("id", "content", "createdAt", "authorId", "conversationId") SELECT "id", "content", "createdAt", "authorId", "conversationId" FROM "temporary_message"`);
        await queryRunner.query(`DROP TABLE "temporary_message"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "photo" varchar, "phone" varchar, "city" varchar, "region" varchar, "role" varchar CHECK( "role" IN ('agent','director') ) NOT NULL DEFAULT ('agent'), "telegramId" varchar, "agencyId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "user"("id", "email", "password", "firstName", "lastName", "photo", "phone", "city", "region", "role", "telegramId", "agencyId") SELECT "id", "email", "password", "firstName", "lastName", "photo", "phone", "city", "region", "role", "telegramId", "agencyId" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`ALTER TABLE "client" RENAME TO "temporary_client"`);
        await queryRunner.query(`CREATE TABLE "client" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "phone" varchar NOT NULL, "status" varchar CHECK( "status" IN ('new','negotiation','contract','deposit','success','refused') ) NOT NULL DEFAULT ('new'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "agentId" integer, CONSTRAINT "UQ_6436cc6b79593760b9ef921ef12" UNIQUE ("email"))`);
        await queryRunner.query(`INSERT INTO "client"("id", "name", "email", "phone", "status", "createdAt", "updatedAt", "agentId") SELECT "id", "name", "email", "phone", "status", "createdAt", "updatedAt", "agentId" FROM "temporary_client"`);
        await queryRunner.query(`DROP TABLE "temporary_client"`);
        await queryRunner.query(`ALTER TABLE "property" RENAME TO "temporary_property"`);
        await queryRunner.query(`CREATE TABLE "property" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "description" text NOT NULL, "address" varchar NOT NULL, "price" decimal NOT NULL, "area" float NOT NULL, "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "status" varchar CHECK( "status" IN ('for_sale','in_deal','reserved','sold') ) NOT NULL DEFAULT ('for_sale'), "isExclusive" boolean NOT NULL DEFAULT (0), "photos" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "lat" float, "lng" float, "agentId" integer)`);
        await queryRunner.query(`INSERT INTO "property"("id", "title", "description", "address", "price", "area", "bedrooms", "bathrooms", "status", "isExclusive", "photos", "createdAt", "lat", "lng", "agentId") SELECT "id", "title", "description", "address", "price", "area", "bedrooms", "bathrooms", "status", "isExclusive", "photos", "createdAt", "lat", "lng", "agentId" FROM "temporary_property"`);
        await queryRunner.query(`DROP TABLE "temporary_property"`);
        await queryRunner.query(`DROP INDEX "IDX_5d93fb1843f96fbdefea37dae8"`);
        await queryRunner.query(`DROP INDEX "IDX_4928ef292e3fb48783034b82f7"`);
        await queryRunner.query(`DROP TABLE "conversation_participants_user"`);
        await queryRunner.query(`DROP TABLE "calendar_events"`);
        await queryRunner.query(`DROP TABLE "selections"`);
        await queryRunner.query(`DROP TABLE "education_events"`);
        await queryRunner.query(`DROP TABLE "user_notification_settings"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "client"`);
        await queryRunner.query(`DROP TABLE "property"`);
        await queryRunner.query(`DROP TABLE "agency"`);
    }

}
