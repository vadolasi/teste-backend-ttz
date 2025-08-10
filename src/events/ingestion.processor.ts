import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { Job } from "bullmq"
import { EventsService } from "./events.service"

@Processor("file-ingestion")
@Injectable()
export class IngestionProcessor extends WorkerHost {
	constructor(private readonly eventsService: EventsService) {
		super()
	}

	async process(job: Job<{ filePath: string }>): Promise<void> {
		const { filePath } = job.data
		this.eventsService.processLogFile(filePath)
	}
}
