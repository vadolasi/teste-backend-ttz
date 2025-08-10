import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsString } from "class-validator"

export class PlayerStatsDto {
	@IsString()
	@ApiProperty({
		description: "Nome do jogador",
		type: String,
		example: "Vitor"
	})
	name: string

	@IsInt()
	@ApiProperty({
		description: "Número de missões completadas pelo jogador",
		type: Number,
		example: 5
	})
	questsCompleted: number

	@IsInt()
	@ApiProperty({
		description: "Número de chefes derrotados pelo jogador",
		type: Number,
		example: 3
	})
	bossesDefeated: number

	@IsInt()
	@ApiProperty({
		description: "Quantidade total de itens coletados pelo jogador",
		type: Number,
		example: 10
	})
	totalItemsCollected: number

	@IsInt()
	@ApiProperty({
		description: "Pontuação total do jogador",
		type: Number,
		example: 1500
	})
	score: number
}
