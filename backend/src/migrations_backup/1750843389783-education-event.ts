import { MigrationInterface, QueryRunner } from "typeorm";

export class EducationEvent1750843389783 implements MigrationInterface {
    name = 'EducationEvent1750843389783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "education_events" ("id" SERIAL PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar, "date" datetime NOT NULL, "type" varchar NOT NULL DEFAULT ('course'), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "education_events"`);
    }

}
