import { FastifyMulterModule } from "@nest-lab/fastify-multer"
import { BullModule } from "@nestjs/bullmq"
import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import * as Joi from "joi"
import { EventEntity } from "./events/entities/event.entity"
import { EventsModule } from "./events/events.module"
import { CreateEvents1754881729972 } from "./migrations/1754881729972-create-events"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
      ignoreEnvFile: true,
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.valid("development", "production", "test", "provision")
					.default("development"),
				PORT: Joi.number().port().default(3000),
				DB_HOST: Joi.string().default("localhost"),
				DB_PORT: Joi.number().port().default(5432),
				DB_USERNAME: Joi.string().default("timescaledb"),
				DB_PASSWORD: Joi.string().default("timescaledb"),
				DB_NAME: Joi.string().default("timescaledb"),
				REDIS_HOST: Joi.string().default("localhost"),
				REDIS_PORT: Joi.number().port().default(6379)
			})
		}),
		TypeOrmModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				type: "postgres",
				host: configService.get("DB_HOST"),
				port: configService.get("DB_PORT"),
				username: configService.get("DB_USERNAME"),
				password: configService.get("DB_PASSWORD"),
				database: configService.get("DB_NAME"),
				entities: [EventEntity],
				synchronize: configService.get("NODE_ENV") !== "production",
				logging: configService.get("NODE_ENV") === "development",
        migrations: [CreateEvents1754881729972],
        migrationsRun: configService.get("NODE_ENV") === "production"
			}),
			inject: [ConfigService]
		}),
		BullModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				connection: {
					host: configService.get("REDIS_HOST"),
					port: configService.get("REDIS_PORT")
				}
			}),
			inject: [ConfigService]
		}),
		FastifyMulterModule,
		EventsModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
