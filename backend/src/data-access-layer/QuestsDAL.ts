import { and, eq, isNull, desc, gte, lte, sql } from "drizzle-orm";
import { DrizzleDb } from "../db";
import {
  quests,
  questMilestones,
  questTasks,
  questXpEvents,
  userAchievements,
  userStreaks,
  timeLogs,
  timeBuckets,
} from "../db/tables";
import {
  CreateQuestDbRequest,
  UpdateQuestDbRequest,
  CreateMilestoneDbRequest,
  UpdateMilestoneDbRequest,
  CreateTaskDbRequest,
  UpdateTaskStatusDbRequest,
  InsertXpEventDbRequest,
  InsertAchievementDbRequest,
  UpdateStreakDbRequest,
  TaskStatusEnum,
  MilestoneStatusEnum,
} from "../schemas";

export class QuestsDAL {
  // ── Quests ────────────────────────────────────────────────────────────────

  static async findAll(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(quests)
      .where(and(eq(quests.user_id, userId), isNull(quests.deleted_at)))
      .orderBy(desc(quests.created_at));
  }

  static async findById(questId: string, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.user_id, userId), isNull(quests.deleted_at)))
      .limit(1);
    return rows[0] ?? null;
  }

  static async insert(data: CreateQuestDbRequest, db: DrizzleDb) {
    await db.insert(quests).values({
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      description: data.description,
      category: data.category,
      color: data.color,
      status: data.status,
      deadline: data.deadline,
    });
  }

  static async update(data: UpdateQuestDbRequest, db: DrizzleDb) {
    const { questId, userId, ...fields } = data;
    await db
      .update(quests)
      .set({ ...fields, updated_at: new Date().toISOString() })
      .where(and(eq(quests.id, questId), eq(quests.user_id, userId)));
  }

  static async softDelete(questId: string, userId: string, db: DrizzleDb) {
    await db
      .update(quests)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(quests.id, questId), eq(quests.user_id, userId)));
  }

  // ── Milestones ───────────────────────────────────────────────────────────

  static async findMilestonesByQuest(questId: string, db: DrizzleDb) {
    return db
      .select()
      .from(questMilestones)
      .where(eq(questMilestones.quest_id, questId))
      .orderBy(questMilestones.order, questMilestones.id);
  }

  static async insertMilestone(data: CreateMilestoneDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(questMilestones)
      .values({
        quest_id: data.quest_id,
        name: data.name,
        xp_reward: data.xp_reward,
        order: data.order,
        due_date: data.due_date,
      })
      .returning({ id: questMilestones.id });
    return rows[0].id;
  }

  static async updateMilestone(data: UpdateMilestoneDbRequest, db: DrizzleDb) {
    const { milestoneId, ...fields } = data;
    await db
      .update(questMilestones)
      .set({ ...fields, updated_at: new Date().toISOString() })
      .where(eq(questMilestones.id, milestoneId));
  }

  // ── Tasks ────────────────────────────────────────────────────────────────

  static async findTasksByQuest(questId: string, db: DrizzleDb) {
    return db
      .select()
      .from(questTasks)
      .where(eq(questTasks.quest_id, questId))
      .orderBy(questTasks.id);
  }

  static async findAllTasksByUser(userId: string, db: DrizzleDb) {
    return db
      .select({
        id: questTasks.id,
        quest_id: questTasks.quest_id,
        quest_name: quests.name,
        quest_color: quests.color,
        quest_category: quests.category,
        milestone_id: questTasks.milestone_id,
        name: questTasks.name,
        status: questTasks.status,
        xp_reward: questTasks.xp_reward,
        due_date: questTasks.due_date,
      })
      .from(questTasks)
      .innerJoin(quests, eq(questTasks.quest_id, quests.id))
      .where(and(eq(quests.user_id, userId), isNull(quests.deleted_at)))
      .orderBy(questTasks.id);
  }

  static async insertTask(data: CreateTaskDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(questTasks)
      .values({
        quest_id: data.quest_id,
        milestone_id: data.milestone_id,
        name: data.name,
        xp_reward: data.xp_reward,
        due_date: data.due_date,
      })
      .returning({ id: questTasks.id });
    return rows[0].id;
  }

  static async updateTaskStatus(data: UpdateTaskStatusDbRequest, db: DrizzleDb) {
    await db
      .update(questTasks)
      .set({ status: data.status, updated_at: new Date().toISOString() })
      .where(eq(questTasks.id, data.taskId));
  }

  static async deleteTask(taskId: number, db: DrizzleDb) {
    await db.delete(questTasks).where(eq(questTasks.id, taskId));
  }

  static async findTaskById(taskId: number, db: DrizzleDb) {
    const rows = await db.select().from(questTasks).where(eq(questTasks.id, taskId)).limit(1);
    return rows[0] ?? null;
  }

  // ── XP Events ────────────────────────────────────────────────────────────

  static async insertXpEvent(data: InsertXpEventDbRequest, db: DrizzleDb) {
    await db.insert(questXpEvents).values({
      user_id: data.user_id,
      quest_id: data.quest_id,
      source_type: data.source_type,
      source_id: data.source_id,
      xp: data.xp,
    });
  }

  static async getTotalXp(userId: string, db: DrizzleDb): Promise<number> {
    const rows = await db
      .select({ total: sql<number>`sum(${questXpEvents.xp})` })
      .from(questXpEvents)
      .where(eq(questXpEvents.user_id, userId));
    return rows[0]?.total ?? 0;
  }

  static async getRecentXpEvents(questId: string, db: DrizzleDb) {
    return db
      .select()
      .from(questXpEvents)
      .where(eq(questXpEvents.quest_id, questId))
      .orderBy(desc(questXpEvents.occurred_at))
      .limit(20);
  }

  // ── Achievements ─────────────────────────────────────────────────────────

  static async findAchievements(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.user_id, userId))
      .orderBy(userAchievements.unlocked_at);
  }

  static async hasAchievement(userId: string, key: string, db: DrizzleDb): Promise<boolean> {
    const rows = await db
      .select()
      .from(userAchievements)
      .where(and(eq(userAchievements.user_id, userId), eq(userAchievements.achievement_key, key)))
      .limit(1);
    return rows.length > 0;
  }

  static async insertAchievement(data: InsertAchievementDbRequest, db: DrizzleDb) {
    await db.insert(userAchievements).values({
      user_id: data.user_id,
      achievement_key: data.achievement_key,
    });
  }

  static async countCompletedMilestones(userId: string, db: DrizzleDb): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(questMilestones)
      .innerJoin(quests, eq(questMilestones.quest_id, quests.id))
      .where(
        and(
          eq(quests.user_id, userId),
          eq(questMilestones.status, MilestoneStatusEnum.Done),
        ),
      );
    return rows[0]?.count ?? 0;
  }

  static async countCompletedTasks(userId: string, db: DrizzleDb): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(questTasks)
      .innerJoin(quests, eq(questTasks.quest_id, quests.id))
      .where(
        and(eq(quests.user_id, userId), eq(questTasks.status, TaskStatusEnum.Done)),
      );
    return rows[0]?.count ?? 0;
  }

  // ── Streaks ──────────────────────────────────────────────────────────────

  static async findStreak(userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.user_id, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  static async upsertStreak(data: UpdateStreakDbRequest & { current: number; longest: number }, db: DrizzleDb) {
    const existing = await QuestsDAL.findStreak(data.userId, db);
    if (!existing) {
      await db.insert(userStreaks).values({
        user_id: data.userId,
        current_streak: data.current,
        longest_streak: data.longest,
        last_active_date: data.today,
      });
    } else {
      await db
        .update(userStreaks)
        .set({
          current_streak: data.current,
          longest_streak: data.longest,
          last_active_date: data.today,
          updated_at: new Date().toISOString(),
        })
        .where(eq(userStreaks.user_id, data.userId));
    }
  }

  // ── Time data for quest ──────────────────────────────────────────────────

  static async getTimeByDayForQuest(
    questId: string,
    userId: string,
    days: number,
    db: DrizzleDb,
  ) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days + 1);
    const from = fromDate.toISOString().split("T")[0];
    const to = new Date().toISOString().split("T")[0];

    return db
      .select({
        date: timeLogs.date,
        minutes: sql<number>`sum(round((julianday(${timeLogs.end_time}) - julianday(${timeLogs.start_time})) * 1440))`,
      })
      .from(timeLogs)
      .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
      .where(
        and(
          eq(timeLogs.user_id, userId),
          eq(timeBuckets.quest_id, questId),
          gte(timeLogs.date, from),
          lte(timeLogs.date, to),
        ),
      )
      .groupBy(timeLogs.date)
      .orderBy(timeLogs.date);
  }

  static async getGrowthVsDistractionMinutes(
    userId: string,
    from: string,
    to: string,
    db: DrizzleDb,
  ) {
    const rows = await db
      .select({
        is_distraction: timeBuckets.is_distraction,
        minutes: sql<number>`sum(round((julianday(${timeLogs.end_time}) - julianday(${timeLogs.start_time})) * 1440))`,
      })
      .from(timeLogs)
      .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
      .where(
        and(
          eq(timeLogs.user_id, userId),
          gte(timeLogs.date, from),
          lte(timeLogs.date, to),
          isNull(timeBuckets.deleted_at),
        ),
      )
      .groupBy(timeBuckets.is_distraction);

    let growth = 0;
    let distraction = 0;
    for (const row of rows) {
      if (row.is_distraction === 1) {
        distraction += row.minutes ?? 0;
      } else {
        growth += row.minutes ?? 0;
      }
    }
    const total = growth + distraction || 1;
    return {
      growth_minutes: growth,
      distraction_minutes: distraction,
      growth_pct: Math.round((growth / total) * 100),
      distraction_pct: Math.round((distraction / total) * 100),
    };
  }

  static async getTimeThisWeekForQuest(questId: string, userId: string, db: DrizzleDb) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const from = monday.toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];

    const rows = await db
      .select({
        minutes: sql<number>`sum(round((julianday(${timeLogs.end_time}) - julianday(${timeLogs.start_time})) * 1440))`,
      })
      .from(timeLogs)
      .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
      .where(
        and(
          eq(timeLogs.user_id, userId),
          eq(timeBuckets.quest_id, questId),
          gte(timeLogs.date, from),
          lte(timeLogs.date, to),
        ),
      );
    return rows[0]?.minutes ?? 0;
  }
}
