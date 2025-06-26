import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCalendarEventsTable1750850000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'calendar_events',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'start', type: 'datetime' },
          { name: 'end', type: 'datetime', isNullable: true },
          { name: 'type', type: 'varchar', default: `'personal'` },
          { name: 'userId', type: 'integer', isNullable: true },
          { name: 'relatedObjectId', type: 'integer', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      })
    );
    await queryRunner.createForeignKey(
      'calendar_events',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('calendar_events');
  }
} 