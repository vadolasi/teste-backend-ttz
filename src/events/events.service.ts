import { createReadStream } from "node:fs"
import readline from "node:readline/promises"
import { pipeline } from "node:stream/promises"
import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { Queue } from "bullmq"
import { Pool } from "pg"
import { from as copyFrom } from "pg-copy-streams"
import { Repository } from "typeorm"
import { EventDto } from "./dto/event.dto"
import { GetLastEventsDto } from "./dto/get-last-events.dto"
import { EventEntity } from "./entities/event.entity"
import { LeaderboardDto } from "./entities/leaderboard.dto"
import { PlayerStatsDto } from "./entities/player-stats.dto"

@Injectable()
export class EventsService {
	constructor(
		@InjectQueue("file-ingestion") private queue: Queue,
		private readonly configService: ConfigService,
		@InjectRepository(EventEntity)
		private readonly eventsRepository: Repository<EventEntity>
	) {}

	enqueueLogFile(filePath: string): void {
		this.queue.add("process-log-file", { filePath })
	}

	async processLogFile(filePath: string): Promise<void> {
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

	async getLastEvents(data: GetLastEventsDto): Promise<EventDto[]> {
		const limit = data.limit || 100

		const query = this.eventsRepository
			.createQueryBuilder("event")
			.orderBy("event.time", "DESC")
			.limit(limit)

		if (data.category) {
			console.log(data.category)
			query.andWhere("event.category = :category", {
				category: data.category
			})
		}

		if (data.type) {
			query.andWhere("event.type = :type", {
				type: data.type
			})
		}

		const result = await query.getMany()

		return result
	}

	async getLeaderboard(): Promise<LeaderboardDto[]> {
		const result = await this.eventsRepository
			.createQueryBuilder("event")
			.select("event.data ->> 'player_id'", "player")
			.addSelect("SUM((event.data ->> 'points')::BIGINT)", "score")
			.where("event.type = 'SCORE'")
			.groupBy('"player"')
			.orderBy('"score"', "DESC")
			.limit(100)
			.getRawMany()

		return result.map((row) => ({
			player: row.player,
			score: parseInt(row.score, 10)
		}))
	}

	async getPlayerStats(playerId: string): Promise<PlayerStatsDto> {
		const [
			playserNameResult,
			questsCompleted,
			bossesDefeated,
			totalItensCollectedResult,
			scoreResult
		] = await Promise.all([
			await this.eventsRepository
				.createQueryBuilder("event")
				.select("event.data ->> 'name'", "playerName")
				.where("event.type = 'PLAYER_JOIN'")
				.andWhere("event.data ->> 'id' = :playerId", { playerId })
				.orderBy("event.time", "DESC")
				.limit(1)
				.getRawOne(),
			this.eventsRepository
				.createQueryBuilder("event")
				.where("event.type = 'QUEST_COMPLETE'")
				.andWhere("event.data ->> 'player_id' = :playerId", { playerId })
				.getCount(),
			this.eventsRepository
				.createQueryBuilder("event")
				.where("event.type = 'BOSS_DEFEAT'")
				.andWhere("event.data ->> 'defeated_by' = :playerId", { playerId })
				.getCount(),
			await this.eventsRepository
				.createQueryBuilder("event")
				.select("SUM((event.data ->> 'qty')::INT)", "total")
				.where("event.type = 'ITEM_PICKUP'")
				.andWhere("event.data ->> 'player_id' = :playerId", { playerId })
				.getRawOne(),
			this.eventsRepository
				.createQueryBuilder("event")
				.select("SUM((event.data ->> 'points')::BIGINT)", "score")
				.where("event.type = 'SCORE'")
				.andWhere("event.data ->> 'player_id' = :playerId", { playerId })
				.getRawOne()
		])

		return {
			name: playserNameResult.playerName,
			questsCompleted,
			bossesDefeated,
			totalItemsCollected: parseInt(totalItensCollectedResult.total, 10) || 0,
			score: parseInt(scoreResult.score, 10)
		}
	}
}
