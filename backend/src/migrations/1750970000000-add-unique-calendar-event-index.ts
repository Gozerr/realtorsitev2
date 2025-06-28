import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueCalendarEventIndex1750970000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS uniq_event ON calendar_events (title, start, end, type);`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX IF EXISTS uniq_event;`
        );
    }
} 