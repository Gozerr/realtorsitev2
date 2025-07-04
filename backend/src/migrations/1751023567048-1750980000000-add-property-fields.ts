import { MigrationInterface, QueryRunner } from "typeorm";

export class PropertyFieldsExt1751023567048 implements MigrationInterface {
    name = 'PropertyFieldsExt1751023567048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temporary_property" (
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
                "lat" float,
                "lng" float,
                "agentId" integer,
                "floor" integer,
                "totalFloors" integer,
                "link" varchar,
                "pricePerM2" decimal,
                "externalId" varchar,
                "seller" varchar,
                "datePublished" varchar,
                CONSTRAINT "FK_3df22387cc25ecbbe851a57fd32" FOREIGN KEY ("agentId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_property"(
                    "id",
                    "title",
                    "description",
                    "address",
                    "price",
                    "area",
                    "bedrooms",
                    "bathrooms",
                    "status",
                    "isExclusive",
                    "photos",
                    "createdAt",
                    "lat",
                    "lng",
                    "agentId"
                )
            SELECT "id",
                "title",
                "description",
                "address",
                "price",
                "area",
                "bedrooms",
                "bathrooms",
                "status",
                "isExclusive",
                "photos",
                "createdAt",
                "lat",
                "lng",
                "agentId"
            FROM "property"
        `);
        await queryRunner.query(`
            DROP TABLE "property"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_property"
                RENAME TO "property"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "property"
                RENAME TO "temporary_property"
        `);
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
                "lat" float,
                "lng" float,
                "agentId" integer,
                CONSTRAINT "FK_3df22387cc25ecbbe851a57fd32" FOREIGN KEY ("agentId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "property"(
                    "id",
                    "title",
                    "description",
                    "address",
                    "price",
                    "area",
                    "bedrooms",
                    "bathrooms",
                    "status",
                    "isExclusive",
                    "photos",
                    "createdAt",
                    "lat",
                    "lng",
                    "agentId"
                )
            SELECT "id",
                "title",
                "description",
                "address",
                "price",
                "area",
                "bedrooms",
                "bathrooms",
                "status",
                "isExclusive",
                "photos",
                "createdAt",
                "lat",
                "lng",
                "agentId"
            FROM "temporary_property"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_property"
        `);
    }

}
