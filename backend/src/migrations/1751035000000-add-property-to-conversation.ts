import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyToConversation1751035000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Сначала добавляем поле propertyId (nullable)
        await queryRunner.query(`ALTER TABLE conversation ADD COLUMN propertyId integer;`);
        // Затем удаляем старые чаты без propertyId и связанные сообщения
        await queryRunner.query(`DELETE FROM message WHERE conversationId IN (SELECT id FROM conversation WHERE propertyId IS NULL);`);
        await queryRunner.query(`DELETE FROM conversation_participants_user WHERE conversationId IN (SELECT id FROM conversation WHERE propertyId IS NULL);`);
        await queryRunner.query(`DELETE FROM conversation WHERE propertyId IS NULL;`);
        // Внешний ключ не добавляем (ограничение SQLite)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE conversation DROP COLUMN propertyId;`);
    }
} 