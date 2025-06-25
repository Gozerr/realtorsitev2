import { MigrationInterface, QueryRunner } from "typeorm";

export class UserNotificationSettings1750843905606 implements MigrationInterface {
    name = 'UserNotificationSettings1750843905606'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_notification_settings" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "property" boolean NOT NULL DEFAULT (1), "education" boolean NOT NULL DEFAULT (1), "system" boolean NOT NULL DEFAULT (1), CONSTRAINT "UQ_984f3e1d8fe9c03831b20b8d7a4" UNIQUE ("userId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_notification_settings"`);
    }

}
