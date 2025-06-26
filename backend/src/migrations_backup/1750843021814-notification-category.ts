import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationCategory1750843021814 implements MigrationInterface {
    name = 'NotificationCategory1750843021814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "title" varchar NOT NULL, "description" varchar, "isNew" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "category" varchar NOT NULL DEFAULT ('property'))`);
        await queryRunner.query(`INSERT INTO "temporary_notifications"("id", "userId", "type", "title", "description", "isNew", "createdAt") SELECT "id", "userId", "type", "title", "description", "isNew", "createdAt" FROM "notifications"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`ALTER TABLE "temporary_notifications" RENAME TO "notifications"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" RENAME TO "temporary_notifications"`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "title" varchar NOT NULL, "description" varchar, "isNew" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "notifications"("id", "userId", "type", "title", "description", "isNew", "createdAt") SELECT "id", "userId", "type", "title", "description", "isNew", "createdAt" FROM "temporary_notifications"`);
        await queryRunner.query(`DROP TABLE "temporary_notifications"`);
    }

}
