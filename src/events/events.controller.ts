import { type File, FileInterceptor } from "@nest-lab/fastify-multer"
import {
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	Query,
	UploadedFile,
	UseInterceptors
} from "@nestjs/common"
import {
	ApiAcceptedResponse,
	ApiBody,
	ApiConsumes,
	ApiOkResponse,
	ApiOperation
} from "@nestjs/swagger"
import { EventDto } from "./dto/event.dto"
import { GetLastEventsDto } from "./dto/get-last-events.dto"
import { LeaderboardDto } from "./dto/leaderboard.dto"
import { PlayerDto } from "./dto/player.dto"
import { PlayerStatsDto } from "./dto/player-stats.dto"
import { TopItemDto } from "./dto/top-item.dto"
import { EventsService } from "./events.service"

@Controller()
export class EventsController {
	constructor(private readonly eventsService: EventsService) {}

	@Post("/events")
	@ApiOperation({ summary: "Faz upload do arquivo de logs" })
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				file: {
					type: "string",
					format: "binary",
					description: "Arquivo de logs a ser enviado"
				}
			},
			required: ["file"]
		}
	})
	@HttpCode(202)
	@ApiAcceptedResponse({
		description: "Arquivo de logs enviado com sucesso"
	})
	@UseInterceptors(FileInterceptor("file", { dest: "uploads/" }))
	uploadEvents(@UploadedFile() file: File) {
		if (!file.path) {
			throw new Error("File path is not available")
		}

		this.eventsService.enqueueLogFile(file.path)
	}

	@Get("/events")
	@ApiOperation({ summary: "Retorna os ultimos eventos" })
	@ApiOkResponse({
		description: "Lista de eventos retornada com sucesso",
		type: [EventDto]
	})
	getLastEvents(@Query() query: GetLastEventsDto): Promise<EventDto[]> {
		return this.eventsService.getLastEvents(query)
	}

	@Get("/leaderboard")
	@ApiOperation({ summary: "Retorna o leaderboard" })
	@ApiOkResponse({
		description: "Leaderboard retornado com sucesso",
		type: [LeaderboardDto]
	})
	getLeaderboard(): Promise<LeaderboardDto[]> {
		return this.eventsService.getLeaderboard()
	}

	@Get("/players")
	@ApiOperation({ summary: "Retorna a lista de jogadores" })
	@ApiOkResponse({
		description: "Lista de jogadores retornada com sucesso",
		type: [PlayerDto]
	})
	getPlayers(): Promise<PlayerDto[]> {
		return this.eventsService.getAllPlayers()
	}

	@Get("/players/:playerId/stats")
	@ApiOperation({ summary: "Retorna as estatísticas de um jogador" })
	@ApiOkResponse({
		description: "Estatísticas do jogador retornadas com sucesso",
		type: PlayerStatsDto
	})
	getPlayerStats(@Param("playerId") playerId: string): Promise<PlayerStatsDto> {
		return this.eventsService.getPlayerStats(playerId)
	}

	@Get("/items/top")
	@ApiOperation({ summary: "Retorna os itens mais coletados" })
	@ApiOkResponse({
		description: "Lista dos itens mais coletados retornada com sucesso",
		type: [TopItemDto]
	})
	getTopItems(): Promise<TopItemDto[]> {
		return this.eventsService.getTopItems()
	}
}
