import { createReadStream } from "node:fs"
import { unlink } from "node:fs/promises"
import readline from "node:readline/promises"
import { pipeline } from "node:stream/promises"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { CACHE_MANAGER } from "@nestjs/cache-manager"
import { Inject, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Job } from "bullmq"
import type { Cache } from "cache-manager"
import { Pool } from "pg"
import { from as copyFrom } from "pg-copy-streams"

@Processor("file-ingestion")
@Injectable()
export class IngestionProcessor extends WorkerHost {
	constructor(
		private readonly configService: ConfigService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache
	) {
		super()
	}

	async process(job: Job<{ filePath: string }>): Promise<void> {
		const { filePath } = job.data
		const pgPool = new Pool({
			host: this.configService.get("DB_HOST"),
			port: this.configService.get("DB_PORT"),
			user: this.configService.get("DB_USERNAME"),
			password: this.configService.get("DB_PASSWORD"),
			database: this.configService.get("DB_NAME")
		})

		const client = await pgPool.connect()
		const copyStream = client.query(
			copyFrom("COPY events (time, category, type, data) FROM STDIN")
		)
		const fileStream = this.formatLogFile(filePath)

		await pipeline(fileStream, copyStream)
		client.release()
		await pgPool.end()
		await this.cacheManager.clear()
    await unlink(filePath)
	}

	async *formatLogFile(filePath: string): AsyncGenerator<string> {
		const fileStream = createReadStream(filePath)

		const lineReader = readline.createInterface({
			input: fileStream,
			crlfDelay: Infinity
		})

		for await (const line of lineReader) {
			const [date, time, unformmatedCategory, event, ...unformmatedData] =
				line.split(" ")
			const timestamp = `${date}T${time}Z`
			const category = unformmatedCategory.slice(1, -1)

			const data: Record<string, string | number | [number, number]> = {}

			const dataString = unformmatedData.join(" ")

			const dataRegex = /(\w+)=(".*?"|\S+)/g

			for (const match of dataString.matchAll(dataRegex)) {
				const key = match[1]
				const value = match[2]

				if (value.startsWith('"')) {
					data[key] = value.slice(1, -1)
				} else if (!Number.isNaN(value) && Number.isFinite(Number(value))) {
					data[key] = Number(value)
				} else if (value.startsWith("(")) {
					const coords = value.slice(1, -1).split(",").map(Number)
					data[key] = coords as [number, number]
				} else {
					data[key] = value
				}
			}

			const formattedFile = `${timestamp}\t${category}\t${event}\t${JSON.stringify(data)}\n`

			yield formattedFile
		}
	}
}
