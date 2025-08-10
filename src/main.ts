import helmet from "@fastify/helmet"
import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import {
	FastifyAdapter,
	NestFastifyApplication
} from "@nestjs/platform-fastify"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({ logger: true })
	)
	await app.register(helmet, {
		contentSecurityPolicy: {
			directives: {
				defaultSrc: [`'self'`],
				styleSrc: [`'self'`, `'unsafe-inline'`],
				imgSrc: [`'self'`, "data:", "validator.swagger.io"],
				scriptSrc: [`'self'`, `https: 'unsafe-inline'`]
			}
		}
	})

	const config = new DocumentBuilder().setVersion("1.0").build()

	const documentFactory = () => SwaggerModule.createDocument(app, config)
	SwaggerModule.setup("api", app, documentFactory)

	const configService = app.get(ConfigService)

	app.useGlobalPipes(new ValidationPipe({ transform: true }))

	await app.listen(configService.get("PORT"))
}

bootstrap()
