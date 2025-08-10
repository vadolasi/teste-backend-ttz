import { InjectQueue } from "@nestjs/bullmq"
import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Queue } from "bullmq"
import { Repository } from "typeorm"
import { EventDto } from "./dto/event.dto"
import { GetLastEventsDto } from "./dto/get-last-events.dto"
import { LeaderboardDto } from "./dto/leaderboard.dto"
import { PlayerDto } from "./dto/player.dto"
import { PlayerStatsDto } from "./dto/player-stats.dto"
import { TopItemDto } from "./dto/top-item.dto"
import { EventEntity } from "./entities/event.entity"

@Injectable()
export class EventsService {
	constructor(
		@InjectQueue("file-ingestion") private queue: Queue,
		@InjectRepository(EventEntity)
		private readonly eventsRepository: Repository<EventEntity>
	) {}

	enqueueLogFile(filePath: string): void {
		this.queue.add("process-log-file", { filePath })
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

	async getAllPlayers(): Promise<PlayerDto[]> {
		const players = await this.eventsRepository
			.createQueryBuilder("event")
			.select("DISTINCT ON (event.data ->> 'id') event.data ->> 'id'", "id")
			.addSelect("event.data ->> 'name'", "name")
			.where("event.type = 'PLAYER_JOIN'")
			.orderBy("event.data ->> 'id'")
			.addOrderBy("event.time", "DESC")
			.getRawMany()

		return players
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

	async getTopItems(): Promise<TopItemDto[]> {
		const rawTopItems = await this.eventsRepository
			.createQueryBuilder("event")
			.select("event.data ->> 'item'", "itemName")
			.addSelect("SUM((event.data ->> 'qty')::BIGINT)", "totalCollected")
			.where("event.type = 'ITEM_PICKUP'")
			.groupBy('"itemName"')
			.orderBy('"totalCollected"', "DESC")
			.limit(20)
			.getRawMany()

		const topItems = rawTopItems.map((item) => ({
			itemName: item.itemName,
			totalCollected: parseInt(item.totalCollected, 10)
		}))

		return topItems
	}
}
