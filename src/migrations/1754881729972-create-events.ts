import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateEvents1754881729972 implements MigrationInterface {
	name = "CreateEvents1754881729972"

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TYPE "public"."events_category_enum" AS ENUM('COMBAT', 'CHAT', 'GAME', 'SYSTEM', 'INFO')`
		)
		await queryRunner.query(
			`CREATE TYPE "public"."events_type_enum" AS ENUM('BOSS_DEFEAT', 'BOSS_DAMAGE', 'BOSS_FIGHT_START', 'DEATH', 'MESSAGE', 'QUEST_START', 'QUEST_COMPLETE', 'ITEM_PICKUP', 'PLAYER_RESPAWN', 'SCORE', 'ZONE_ENTER', 'ZONE_EXIT', 'SERVER_ANNOUNCEMENT', 'PLAYER_JOIN')`
		)
		await queryRunner.query(
			`CREATE TABLE "events" ("time" TIMESTAMP WITH TIME ZONE NOT NULL, "category" "public"."events_category_enum" NOT NULL, "type" "public"."events_type_enum" NOT NULL, "data" jsonb, CONSTRAINT "PK_1daf3131c66a0cac34ac9951ceb" PRIMARY KEY ("time"))`
		)
		await queryRunner.query(
			`CREATE INDEX "idx_events_caterory_type" ON "events" ("category", "type", "time" DESC)`
		)
		await queryRunner.query(
			`CREATE INDEX "idx_events_data" ON "events" USING GIN ("data" jsonb_path_ops)`
		)
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_events_data"`)
		await queryRunner.query(`DROP INDEX "public"."idx_events_caterory_type"`)
		await queryRunner.query(`DROP TABLE "events"`)
		await queryRunner.query(`DROP TYPE "public"."events_type_enum"`)
		await queryRunner.query(`DROP TYPE "public"."events_category_enum"`)
	}
}
