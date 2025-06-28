import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEducationEventFields1722100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "education_events" ADD COLUMN "link" varchar`);
        await queryRunner.query(`ALTER TABLE "education_events" ADD COLUMN "img" varchar`);
        await queryRunner.query(`ALTER TABLE "education_events" ADD COLUMN "place" varchar`);
        await queryRunner.query(`ALTER TABLE "education_events" ADD COLUMN "endDate" datetime`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "education_events" DROP COLUMN "link"`);
        await queryRunner.query(`ALTER TABLE "education_events" DROP COLUMN "img"`);
        await queryRunner.query(`ALTER TABLE "education_events" DROP COLUMN "place"`);
        await queryRunner.query(`ALTER TABLE "education_events" DROP COLUMN "endDate"`);
    }
} 