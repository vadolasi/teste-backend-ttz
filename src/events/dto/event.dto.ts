import { ApiProperty } from "@nestjs/swagger"
import { IsDate, IsEnum, IsObject } from "class-validator"
import { EventCategories, EventTypes } from "../entities/event.entity"

export class EventDto {
	@IsDate()
	@ApiProperty({
		description: "Data e hora do evento",
		type: Date,
		example: "2023-10-01T12:00:00Z"
	})
	time: Date

	@IsEnum(EventCategories)
	@ApiProperty({
		description: "Categoria do evento",
		enum: EventCategories,
		example: EventCategories.COMBAT
	})
	category: string

	@IsEnum(EventTypes)
	@ApiProperty({
		description: "Tipo do evento",
		enum: EventTypes,
		example: EventTypes.BOSS_DEFEAT
	})
	type: string

	@IsObject()
	@ApiProperty({
		description: "Dados adicionais do evento",
		type: Object,
		example: { damage: 1500, player: "Player1" },
		required: false
	})
	data?: Record<string, string | number | [number, number]>
}
