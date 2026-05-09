import { v4 as uuidv4 } from "uuid";
import { DrizzleDb } from "../db";
import { QuestsDAL } from "../data-access-layer/QuestsDAL";
import {
  CreateQuestRepoRequest,
  UpdateQuestRepoRequest,
  GetQuestsDashboardRepoRequest,
  CreateMilestoneRepoRequest,
  UpdateMilestoneRepoRequest,
  CreateTaskRepoRequest,
  UpdateTaskStatusRepoRequest,
  QuestStatusEnum,
  MilestoneStatusEnum,
  TaskStatusEnum,
  XpSourceTypeEnum,
  ACHIEVEMENT_KEYS,
  ACHIEVEMENT_LABELS,
  xpToLevel,
  xpForNextLevel,
  LEVEL_TITLES,
  GetQuestsDashboardResponse,
  GetQuestDetailResponse,
  GetQuestsKanbanResponse,
  CreateQuestResponse,
  CreateMilestoneResponse,
  CreateTaskResponse,
  UpdateTaskStatusResponse,
  QuestSummary,
} from "../schemas";

export class QuestsRepo {
  static async getDashboard(
    req: GetQuestsDashboardRepoRequest,
    db: DrizzleDb,
  ): Promise<GetQuestsDashboardResponse> {
    const [allQuests, totalXp, streakRow, achievements, growthDistraction] =
      await Promise.all([
        QuestsDAL.findAll(req.userId, db),
        QuestsDAL.getTotalXp(req.userId, db),
        QuestsDAL.findStreak(req.userId, db),
        QuestsDAL.findAchievements(req.userId, db),
        QuestsDAL.getGrowthVsDistractionMinutes(
          req.userId,
          req.from,
          req.to,
          db,
        ),
      ]);

    const levelInfo = (() => {
      const level = xpToLevel(totalXp);
      const { current, needed } = xpForNextLevel(totalXp);
      return {
        total_xp: totalXp,
        level,
        title: LEVEL_TITLES[level] ?? "Initiate",
        xp_in_level: current,
        xp_for_next: needed,
        next_level_at: totalXp - current + needed,
      };
    })();

    const streak = streakRow ?? { current_streak: 0, longest_streak: 0 };

    const questSummaries: QuestSummary[] = await Promise.all(
      allQuests.map(async (q) => {
        const [milestones, tasks, timeThisWeek] = await Promise.all([
          QuestsDAL.findMilestonesByQuest(q.id, db),
          QuestsDAL.findTasksByQuest(q.id, db),
          QuestsDAL.getTimeThisWeekForQuest(q.id, req.userId, db),
        ]);
        const tasksDone = tasks.filter(
          (t) => t.status === TaskStatusEnum.Done,
        ).length;
        const milestonesDone = milestones.filter(
          (m) => m.status === MilestoneStatusEnum.Done,
        ).length;
        const totalXpForQuest = tasks
          .filter((t) => t.status === TaskStatusEnum.Done)
          .reduce((s, t) => s + t.xp_reward, 0);
        const totalPossibleXp = tasks.reduce((s, t) => s + t.xp_reward, 0);
        const activeMilestone = milestones.find(
          (m) => m.status === MilestoneStatusEnum.Active,
        );
        const nextPending = milestones.find(
          (m) => m.status === MilestoneStatusEnum.Pending,
        );
        const nextMilestone = activeMilestone ?? nextPending ?? null;

        return {
          id: q.id,
          name: q.name,
          description: q.description,
          category: q.category,
          color: q.color,
          status: q.status,
          deadline: q.deadline,
          task_done: tasksDone,
          task_total: tasks.length,
          milestone_done: milestonesDone,
          milestone_total: milestones.length,
          total_xp: totalXpForQuest,
          xp_max: totalPossibleXp || 1000,
          streak: streak.current_streak,
          next_milestone: nextMilestone?.name ?? null,
          next_milestone_due: nextMilestone?.due_date ?? null,
          time_this_week_minutes: timeThisWeek,
          created_at: q.created_at,
        };
      }),
    );

    const totalGrowthDistraction =
      growthDistraction.growth_minutes +
        growthDistraction.distraction_minutes || 1;
    const focusScore = Math.round(
      (growthDistraction.growth_minutes / totalGrowthDistraction) * 100,
    );

    return {
      isSuccess: true,
      message: "Dashboard retrieved",
      level_info: levelInfo,
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      active_quests_count: allQuests.filter(
        (q) => q.status === QuestStatusEnum.Active,
      ).length,
      focus_score: focusScore,
      growth_vs_distraction: growthDistraction,
      quests: questSummaries,
      achievements: achievements.map((a) => {
        const meta = ACHIEVEMENT_LABELS[a.achievement_key] ?? {
          title: a.achievement_key,
          description: "",
          icon: "🏅",
        };
        return {
          key: a.achievement_key,
          title: meta.title,
          description: meta.description,
          icon: meta.icon,
          unlocked_at: a.unlocked_at,
        };
      }),
    };
  }

  static async getQuestDetail(
    req: { questId: string; userId: string },
    db: DrizzleDb,
  ): Promise<GetQuestDetailResponse> {
    const [
      quest,
      milestones,
      tasks,
      timeByDay,
      recentXpEvents,
      growthDistraction,
    ] = await Promise.all([
      QuestsDAL.findById(req.questId, req.userId, db),
      QuestsDAL.findMilestonesByQuest(req.questId, db),
      QuestsDAL.findTasksByQuest(req.questId, db),
      QuestsDAL.getTimeByDayForQuest(req.questId, req.userId, 14, db),
      QuestsDAL.getRecentXpEvents(req.questId, db),
      QuestsDAL.getGrowthVsDistractionMinutes(
        req.userId,
        "2020-01-01",
        new Date().toISOString().split("T")[0],
        db,
      ),
    ]);

    if (!quest) {
      throw new Error("Quest not found");
    }

    const tasksDone = tasks.filter(
      (t) => t.status === TaskStatusEnum.Done,
    ).length;
    const milestonesDone = milestones.filter(
      (m) => m.status === MilestoneStatusEnum.Done,
    ).length;
    const totalXpForQuest = tasks
      .filter((t) => t.status === TaskStatusEnum.Done)
      .reduce((s, t) => s + t.xp_reward, 0);
    const totalPossibleXp = tasks.reduce((s, t) => s + t.xp_reward, 0);

    const milestoneSummaries = milestones.map((m) => {
      const mTasks = tasks.filter((t) => t.milestone_id === m.id);
      return {
        id: m.id,
        name: m.name,
        xp_reward: m.xp_reward,
        order: m.order,
        status: m.status,
        due_date: m.due_date,
        task_done: mTasks.filter((t) => t.status === TaskStatusEnum.Done)
          .length,
        task_total: mTasks.length,
      };
    });

    return {
      isSuccess: true,
      message: "Quest detail retrieved",
      quest: {
        id: quest.id,
        name: quest.name,
        description: quest.description,
        category: quest.category,
        color: quest.color,
        status: quest.status,
        deadline: quest.deadline,
        task_done: tasksDone,
        task_total: tasks.length,
        milestone_done: milestonesDone,
        milestone_total: milestones.length,
        total_xp: totalXpForQuest,
        xp_max: totalPossibleXp || 1000,
        streak: 0,
        next_milestone: null,
        next_milestone_due: null,
        time_this_week_minutes: 0,
        created_at: quest.created_at,
      },
      milestones: milestoneSummaries,
      tasks: tasks.map((t) => ({
        id: t.id,
        quest_id: t.quest_id,
        milestone_id: t.milestone_id,
        name: t.name,
        status: t.status,
        xp_reward: t.xp_reward,
        due_date: t.due_date,
        created_at: t.created_at,
      })),
      time_by_day: timeByDay.map((r) => ({
        date: r.date,
        minutes: r.minutes ?? 0,
      })),
      recent_xp_events: recentXpEvents.map((e) => ({
        id: e.id,
        quest_id: e.quest_id,
        source_type: e.source_type,
        source_id: e.source_id,
        xp: e.xp,
        occurred_at: e.occurred_at,
      })),
      growth_vs_distraction: growthDistraction,
    };
  }

  static async getKanbanBoard(
    req: { userId: string },
    db: DrizzleDb,
  ): Promise<GetQuestsKanbanResponse> {
    const allTasks = await QuestsDAL.findAllTasksByUser(req.userId, db);

    const toKanban = (tasks: typeof allTasks) =>
      tasks.map((t) => ({
        id: t.id,
        quest_id: t.quest_id,
        quest_name: t.quest_name,
        quest_color: t.quest_color,
        quest_category: t.quest_category,
        name: t.name,
        status: t.status,
        xp_reward: t.xp_reward,
        due_date: t.due_date,
      }));

    return {
      isSuccess: true,
      message: "Kanban retrieved",
      todo: toKanban(allTasks.filter((t) => t.status === TaskStatusEnum.Todo)),
      doing: toKanban(
        allTasks.filter((t) => t.status === TaskStatusEnum.Doing),
      ),
      done: toKanban(allTasks.filter((t) => t.status === TaskStatusEnum.Done)),
    };
  }

  static async createQuest(
    req: CreateQuestRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateQuestResponse> {
    const id = uuidv4();
    await QuestsDAL.insert(
      {
        id,
        user_id: req.userId,
        name: req.name,
        description: req.description ?? null,
        category: req.category,
        color: req.color,
        status: QuestStatusEnum.Active,
        deadline: req.deadline ?? null,
      },
      db,
    );
    await QuestsRepo._awardXP(
      {
        userId: req.userId,
        questId: id,
        sourceType: XpSourceTypeEnum.TaskCompleted,
        sourceId: null,
        xp: 0,
      },
      db,
    );
    await QuestsRepo._checkAndGrantAchievement(
      req.userId,
      ACHIEVEMENT_KEYS.FIRST_QUEST,
      db,
    );
    return { isSuccess: true, message: "Quest created", quest_id: id };
  }

  static async updateQuest(
    req: UpdateQuestRepoRequest,
    db: DrizzleDb,
  ): Promise<{ isSuccess: boolean; message: string }> {
    await QuestsDAL.update(req, db);
    return { isSuccess: true, message: "Quest updated" };
  }

  static async deleteQuest(
    req: { questId: string; userId: string },
    db: DrizzleDb,
  ): Promise<{ isSuccess: boolean; message: string }> {
    await QuestsDAL.softDelete(req.questId, req.userId, db);
    return { isSuccess: true, message: "Quest deleted" };
  }

  static async createMilestone(
    req: CreateMilestoneRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateMilestoneResponse> {
    const milestones = await QuestsDAL.findMilestonesByQuest(req.questId, db);
    const order = req.order ?? milestones.length;
    const id = await QuestsDAL.insertMilestone(
      {
        quest_id: req.questId,
        name: req.name,
        xp_reward: req.xp_reward ?? 100,
        order,
        due_date: req.due_date ?? null,
      },
      db,
    );
    if (milestones.length === 0) {
      await QuestsDAL.updateMilestone(
        { milestoneId: id, status: MilestoneStatusEnum.Active },
        db,
      );
    }
    return { isSuccess: true, message: "Milestone created", milestone_id: id };
  }

  static async updateMilestone(
    req: UpdateMilestoneRepoRequest,
    db: DrizzleDb,
  ): Promise<{ isSuccess: boolean; message: string }> {
    const wasDone = req.status === MilestoneStatusEnum.Done;
    await QuestsDAL.updateMilestone(req, db);
    if (wasDone) {
      await QuestsRepo._checkAndGrantAchievement(
        req.userId,
        ACHIEVEMENT_KEYS.MILESTONE_5,
        db,
      );
    }
    return { isSuccess: true, message: "Milestone updated" };
  }

  static async createTask(
    req: CreateTaskRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateTaskResponse> {
    const id = await QuestsDAL.insertTask(
      {
        quest_id: req.questId,
        milestone_id: req.milestone_id ?? null,
        name: req.name,
        xp_reward: req.xp_reward ?? 20,
        due_date: req.due_date ?? null,
      },
      db,
    );
    return {
      isSuccess: true,
      message: "Task created",
      task_id: id,
      xp_awarded: 0,
    };
  }

  static async updateTaskStatus(
    req: UpdateTaskStatusRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateTaskStatusResponse> {
    const task = await QuestsDAL.findTaskById(req.taskId, db);
    if (!task) throw new Error("Task not found");

    const prevStatus = task.status;
    await QuestsDAL.updateTaskStatus(
      { taskId: req.taskId, status: req.status },
      db,
    );

    let xpAwarded = 0;
    let levelUp = false;
    let newLevel: number | null = null;
    let achievementUnlocked: string | null = null;

    if (
      req.status === TaskStatusEnum.Done &&
      prevStatus !== TaskStatusEnum.Done
    ) {
      const xpBefore = await QuestsDAL.getTotalXp(req.userId, db);
      const levelBefore = xpToLevel(xpBefore);

      await QuestsRepo._awardXP(
        {
          userId: req.userId,
          questId: task.quest_id,
          sourceType: XpSourceTypeEnum.TaskCompleted,
          sourceId: req.taskId,
          xp: task.xp_reward,
        },
        db,
      );
      xpAwarded = task.xp_reward;

      const xpAfter = await QuestsDAL.getTotalXp(req.userId, db);
      const levelAfter = xpToLevel(xpAfter);
      if (levelAfter > levelBefore) {
        levelUp = true;
        newLevel = levelAfter;
      }

      await QuestsRepo._updateStreak(req.userId, db);

      const unlockedKey = await QuestsRepo._checkAllAchievements(
        req.userId,
        db,
      );
      achievementUnlocked = unlockedKey;
    }

    return {
      isSuccess: true,
      message: "Task updated",
      xp_awarded: xpAwarded,
      level_up: levelUp,
      new_level: newLevel,
      achievement_unlocked: achievementUnlocked,
    };
  }

  static async deleteTask(
    req: { taskId: number; userId: string },
    db: DrizzleDb,
  ): Promise<{ isSuccess: boolean; message: string }> {
    await QuestsDAL.deleteTask(req.taskId, db);
    return { isSuccess: true, message: "Task deleted" };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private static async _awardXP(
    data: {
      userId: string;
      questId: string | null;
      sourceType: XpSourceTypeEnum;
      sourceId: number | null;
      xp: number;
    },
    db: DrizzleDb,
  ) {
    if (data.xp <= 0) return;
    await QuestsDAL.insertXpEvent(
      {
        user_id: data.userId,
        quest_id: data.questId,
        source_type: data.sourceType,
        source_id: data.sourceId,
        xp: data.xp,
      },
      db,
    );
  }

  private static async _updateStreak(userId: string, db: DrizzleDb) {
    const today = new Date().toISOString().split("T")[0];
    const existing = await QuestsDAL.findStreak(userId, db);

    if (!existing) {
      await QuestsDAL.upsertStreak(
        { userId, today, current: 1, longest: 1 },
        db,
      );
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let current = existing.current_streak;
    if (existing.last_active_date === today) return;
    if (existing.last_active_date === yesterdayStr) {
      current += 1;
    } else {
      current = 1;
    }
    const longest = Math.max(current, existing.longest_streak);
    await QuestsDAL.upsertStreak({ userId, today, current, longest }, db);

    if (current >= 7)
      await QuestsRepo._checkAndGrantAchievement(
        userId,
        ACHIEVEMENT_KEYS.STREAK_7,
        db,
      );
    if (current >= 14)
      await QuestsRepo._checkAndGrantAchievement(
        userId,
        ACHIEVEMENT_KEYS.STREAK_14,
        db,
      );
    if (current >= 30)
      await QuestsRepo._checkAndGrantAchievement(
        userId,
        ACHIEVEMENT_KEYS.STREAK_30,
        db,
      );
  }

  private static async _checkAndGrantAchievement(
    userId: string,
    key: string,
    db: DrizzleDb,
  ): Promise<string | null> {
    const has = await QuestsDAL.hasAchievement(userId, key, db);
    if (!has) {
      await QuestsDAL.insertAchievement(
        { user_id: userId, achievement_key: key },
        db,
      );
      return key;
    }
    return null;
  }

  private static async _checkAllAchievements(
    userId: string,
    db: DrizzleDb,
  ): Promise<string | null> {
    const [taskCount, milestoneCount] = await Promise.all([
      QuestsDAL.countCompletedTasks(userId, db),
      QuestsDAL.countCompletedMilestones(userId, db),
    ]);

    if (taskCount === 1) {
      return QuestsRepo._checkAndGrantAchievement(
        userId,
        ACHIEVEMENT_KEYS.FIRST_TASK,
        db,
      );
    }
    if (milestoneCount >= 5) {
      return QuestsRepo._checkAndGrantAchievement(
        userId,
        ACHIEVEMENT_KEYS.MILESTONE_5,
        db,
      );
    }
    return null;
  }
}
