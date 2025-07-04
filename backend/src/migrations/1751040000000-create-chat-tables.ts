import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1751040000000 implements MigrationInterface {
  name = 'CreateChatTables1751040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chats" (
        "id" SERIAL PRIMARY KEY,
        "property_id" integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        "user_a_id" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "user_b_id" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "UQ_property_users" UNIQUE ("property_id", "user_a_id", "user_b_id")
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" SERIAL PRIMARY KEY,
        "chat_id" integer NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        "author_id" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "text" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "status" VARCHAR(16) DEFAULT 'sent'
      );
    `);
    await queryRunner.query(`CREATE INDEX "IDX_chats_user" ON "chats" ("user_a_id", "user_b_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_chats_property" ON "chats" ("property_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_chat" ON "messages" ("chat_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_chat"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chats_property"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chats_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chats"`);
  }
} 