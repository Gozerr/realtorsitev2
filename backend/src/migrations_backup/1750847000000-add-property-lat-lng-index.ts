import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyLatLngIndex1750847000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_property_lat_lng ON property (lat, lng);`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_property_lat_lng;`);
    }
} 