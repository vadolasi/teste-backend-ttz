import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator"
import { EventCategories, EventTypes } from "../entities/event.entity"

export class GetLastEventsDto {
	@IsInt()
	@IsOptional()
	@Min(1)
	@Max(1000)
	@Transform(({ value }) => Number(value))
	@ApiProperty({
		description: "Número máximo de eventos a serem retornados",
		default: 100,
		minimum: 1,
		maximum: 1000,
		required: false
	})
	readonly limit?: number

	@IsEnum(EventCategories)
	@IsOptional()
	@ApiProperty({
		description: "Categoria dos eventos a serem filtrados",
		enum: EventCategories,
		required: false,
		example: EventCategories.COMBAT
	})
	readonly category?: (typeof EventCategories)[keyof typeof EventCategories]

	@IsEnum(EventTypes)
	@IsOptional()
	@ApiProperty({
		description: "Tipo dos eventos a serem filtrados",
		enum: EventTypes,
		required: false,
		example: EventTypes.BOSS_DEFEAT
	})
	readonly type?: (typeof EventTypes)[keyof typeof EventTypes]
}
