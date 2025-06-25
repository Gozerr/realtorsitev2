import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserCityRegion1750846000000 implements MigrationInterface {
    name = 'AddUserCityRegion1750846000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "city" varchar`);
        await queryRunner.query(`ALTER TABLE "user" ADD "region" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "region"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "city"`);
    }
} 