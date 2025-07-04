import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropertyStatusReserved1750845554421 implements MigrationInterface {
    name = 'PropertyStatusReserved1750845554421';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "property" (
                "id" SERIAL PRIMARY KEY NOT NULL,
                "title" varchar NOT NULL,
                "description" text NOT NULL,
                "address" varchar NOT NULL,
                "price" decimal NOT NULL,
                "area" float NOT NULL,
                "bedrooms" integer NOT NULL,
                "bathrooms" integer NOT NULL,
                "status" varchar CHECK(
                    "status" IN ('for_sale', 'in_deal', 'reserved', 'sold')
                ) NOT NULL DEFAULT ('for_sale'),
                "isExclusive" boolean NOT NULL DEFAULT (0),
                "photos" text,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "agentId" integer,
                "lat" float,
                "lng" float,
                CONSTRAINT "FK_3df22387cc25ecbbe851a57fd32" FOREIGN KEY ("agentId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "property"
        `);
    }
}
