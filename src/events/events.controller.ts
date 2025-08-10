import { type File, FileInterceptor } from "@nest-lab/fastify-multer"
import {
	Controller,
	HttpCode,
	Post,
	UploadedFile,
	UseInterceptors
} from "@nestjs/common"
import { ApiBody, ApiConsumes, ApiOperation } from "@nestjs/swagger"
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
	@UseInterceptors(FileInterceptor("file", { dest: "uploads/" }))
	uploadEvents(@UploadedFile() file: File) {
		if (!file.path) {
			throw new Error("File path is not available")
		}

		this.eventsService.enqueueLogFile(file.path)
	}
}
