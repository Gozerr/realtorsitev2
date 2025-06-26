import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTelegramIdToUser1750851000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('user', new TableColumn({
      name: 'telegramId',
      type: 'varchar',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'telegramId');
  }
} 