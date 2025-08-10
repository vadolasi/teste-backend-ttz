import { createKeyv } from "@keyv/redis"
import { FastifyMulterModule } from "@nest-lab/fastify-multer"
import { BullModule } from "@nestjs/bullmq"
import { CacheModule } from "@nestjs/cache-manager"
import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CacheableMemory } from "cacheable"
import * as Joi from "joi"
import { Keyv } from "keyv"
import { EventsModule } from "./events/events.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
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
				entities: [`${__dirname}/**/*.entity.ts`],
				synchronize: configService.get("NODE_ENV") !== "production",
				logging: configService.get("NODE_ENV") === "development",
				migrationsRun: configService.get("NODE_ENV") === "production"
			}),
			inject: [ConfigService]
		}),
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
