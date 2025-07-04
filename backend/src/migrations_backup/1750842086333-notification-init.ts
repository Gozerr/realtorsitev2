import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationInit1750842086333 implements MigrationInterface {
    name = 'NotificationInit1750842086333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL PRIMARY KEY NOT NULL, "userId" integer NOT NULL, "type" varchar NOT NULL DEFAULT ('info'), "title" varchar NOT NULL, "description" varchar, "isNew" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notifications"`);
    }

}
