import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { EventEntity } from "./entities/event.entity"
import { EventsController } from "./events.controller"
import { EventsService } from "./events.service"
import { IngestionProcessor } from "./ingestion.processor"

@Module({
	imports: [
		TypeOrmModule.forFeature([EventEntity]),
		BullModule.registerQueue({
			name: "file-ingestion",
			defaultJobOptions: {
				removeOnComplete: true,
				removeOnFail: true,
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 5000
				}
			}
		})
	],
	controllers: [EventsController],
	providers: [EventsService, IngestionProcessor]
})
export class EventsModule {}
