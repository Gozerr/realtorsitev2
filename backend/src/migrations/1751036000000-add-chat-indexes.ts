import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatIndexes1751036000000 implements MigrationInterface {
    name = 'AddChatIndexes1751036000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_message_conversationId" ON "message" ("conversationId")`
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_conversation_propertyId" ON "conversation" ("propertyId")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_message_conversationId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversation_propertyId"`);
    }
} 