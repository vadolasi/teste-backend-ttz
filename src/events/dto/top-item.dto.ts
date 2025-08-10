import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsString } from "class-validator"

export class TopItemDto {
	@IsString()
	@ApiProperty({
		description: "Nome do item mais coletado",
		type: String,
		example: "Espada Lendária"
	})
	itemName: string

	@IsInt()
	@ApiProperty({
		description: "Quantidade total coletada do item",
		type: Number,
		example: 150
	})
	totalCollected: number
}
