import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import * as Joi from "joi"

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
				DB_NAME: Joi.string().default("timescaledb")
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
				entities: [`${__dirname}/**/*.entity{.ts,.js}`],
				synchronize: configService.get("NODE_ENV") !== "production",
				logging: configService.get("NODE_ENV") === "development"
			}),
			inject: [ConfigService]
		})
	],
	controllers: [],
	providers: []
})
export class AppModule {}
