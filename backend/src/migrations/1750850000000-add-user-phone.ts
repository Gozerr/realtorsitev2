import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhone1750850000000 implements MigrationInterface {
    name = 'AddUserPhone1750850000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "phone" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
    }
} 