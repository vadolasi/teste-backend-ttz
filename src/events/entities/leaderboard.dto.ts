import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class LeaderboardDto {
  @IsString()
  @ApiProperty({
    description: "Identificador do jogador",
    type: String,
    example: "p1"
  })
  player: string

  @IsInt()
  @ApiProperty({
    description: "Pontuação do jogador",
    type: Number,
    example: 1500
  })
  score: number
}
