import { type File, FileInterceptor } from "@nest-lab/fastify-multer"
import {
	Controller,
	Get,
	HttpCode,
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
import { EventsService } from "./events.service"

@Controller("events")
export class EventsController {
	constructor(private readonly eventsService: EventsService) {}

	@Post("/")
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

	@Get("/")
	@ApiOperation({ summary: "Retorna os ultimos eventos" })
	@ApiOkResponse({
		description: "Lista de eventos retornada com sucesso",
		type: [EventDto]
	})
	getLastEvents(@Query() query: GetLastEventsDto): Promise<EventDto[]> {
		return this.eventsService.getLastEvents(query)
	}
}
