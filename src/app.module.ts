import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import * as Joi from "joi"

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.valid("development", "production", "test", "provision")
					.default("development"),
				PORT: Joi.number().port().default(3000)
			})
		})
	],
	controllers: [],
	providers: []
})
export class AppModule {}
