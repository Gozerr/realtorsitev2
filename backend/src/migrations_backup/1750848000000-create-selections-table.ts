import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateSelectionsTable1750848000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'selections',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'propertyIds',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'integer',
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: "CURRENT_TIMESTAMP",
          },
        ],
      })
    );
    await queryRunner.createForeignKey(
      'selections',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('selections');
  }
} 