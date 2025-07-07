import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTelegramWhatsappToUser1751050000000 implements MigrationInterface {
    name = 'AddTelegramWhatsappToUser1751050000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "telegramUsername" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "whatsappNumber" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "whatsappNumber"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "telegramUsername"`);
    }
} 