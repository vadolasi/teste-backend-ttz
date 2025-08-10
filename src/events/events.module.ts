import { createKeyv } from "@keyv/redis"
import { BullModule } from "@nestjs/bullmq"
import { CacheModule } from "@nestjs/cache-manager"
import { Module } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CacheableMemory } from "cacheable"
import { Keyv } from "keyv"
import { EventEntity } from "./entities/event.entity"
import { EventsController } from "./events.controller"
import { EventsService } from "./events.service"
import { IngestionProcessor } from "./ingestion.processor"

@Module({
	imports: [
		TypeOrmModule.forFeature([EventEntity]),
		CacheModule.registerAsync({
			useFactory: async (configService: ConfigService) => ({
				stores: [
					new Keyv({
						store: new CacheableMemory({ ttl: 60000, lruSize: 5000 })
					}),
					createKeyv(
						`redis://${configService.get("REDIS_HOST")}:${configService.get("REDIS_PORT")}`
					)
				]
			}),
			inject: [ConfigService]
		}),
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
