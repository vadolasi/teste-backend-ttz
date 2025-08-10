import { Hypertable, TimeColumn } from "@timescaledb/typeorm"
import { Column, Entity, Index } from "typeorm"

const EventCategories = {
	COMBAT: "COMBAT",
	CHAT: "CHAT",
	GAME: "GAME",
	SYSTEM: "SYSTEM",
	INFO: "INFO"
} as const

const EventTypes = {
	// COMBAT
	BOSS_DEFEAT: "BOSS_DEFEAT",
	BOSS_DAMAGE: "BOSS_DAMAGE",
	BOSS_FIGHT_START: "BOSS_FIGHT_START",
	DEATH: "DEATH",

	// CHAT
	MESSAGE: "MESSAGE",

	// GAME
	QUEST_START: "QUEST_START",
	QUEST_COMPLETE: "QUEST_COMPLETE",
	ITEM_PICKUP: "ITEM_PICKUP",
	PLAYER_RESPAN: "PLAYER_RESPAWN",
	SCORE: "SCORE",
	ZONE_ENTER: "ZONE_ENTER",
	ZONE_EXIT: "ZONE_EXIT",

	// SYSTEM
	SERVER_ANNOUNCEMENT: "SERVER_ANNOUNCEMENT",

	// INFO
	PLAYER_JOIN: "PLAYER_JOIN"
} as const

@Entity("events")
@Hypertable({
	compression: {
		compress: true,
		compress_orderby: "time",
		compress_segmentby: "type",
		policy: {
			schedule_interval: "7 days"
		}
	}
})
@Index("idx_events_caterory_type", { synchronize: false })
export class Event {
	@TimeColumn()
	time!: Date

	@Column({
		type: "enum",
		enum: EventCategories
	})
	category!: (typeof EventCategories)[keyof typeof EventCategories]

	@Column({
		type: "enum",
		enum: EventTypes
	})
	type!: (typeof EventTypes)[keyof typeof EventTypes]

	@Column({ type: "jsonb", nullable: true })
	@Index("idx_events_data", { synchronize: false })
	data?: Record<string, string | number>
}
