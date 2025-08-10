import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class PlayerDto {
	@IsString()
	@ApiProperty({
		description: "ID do jogador",
		type: String,
		example: "p1"
	})
	id: string

	@IsString()
	@ApiProperty({
		description: "Nome do jogador",
		type: String,
		example: "Jogador1"
	})
	name: string
}
